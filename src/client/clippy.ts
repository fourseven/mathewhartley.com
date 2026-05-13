import {
  isClippyAvailable,
  initClippyLLM,
  generateComment,
  destroySession,
} from "../lib/clippy-llm";

/* ─── Types ─── */

type Mood = "neutral" | "bored" | "curious" | "annoyed" | "excited" | "smug";

type SessionEvent =
  | { type: "page_visit"; page: string }
  | { type: "clippy_click" }
  | { type: "dismiss" }
  | { type: "rage_click"; target: string }
  | { type: "scroll_deep"; page: string }
  | { type: "navigated"; from: string; to: string }
  | { type: "returned_to_page"; page: string }
  | { type: "hovered_hesitation"; target: string }
  | { type: "erratic_mouse" }
  | { type: "idle"; duration: "short" | "long" };

interface ClippyState {
  events: SessionEvent[];
  history: Array<{ role: string; content: string }>;
  mood: Mood;
  moodLockedUntil: number;
  dismissed: boolean;
  spokeOnThisPage: boolean;
  lastCommentAt: number;
}

/* ─── Constants ─── */

const STORAGE_KEY = "clippy_state_v2";
const MOOD_LOCK_DURATION = 10000;
const MIN_COMMENT_INTERVAL = 8000;
const INTRO_DELAY = 600;
const IDLE_BASE = 20000;
const IDLE_VARIANCE = 25000;
const HOVER_HESITATION_MS = 2500;
const ERRATIC_VELOCITY_THRESHOLD = 2.5; // px per ms
const MOUSE_HISTORY_WINDOW_MS = 200;

const LOCAL_QUIPS: Record<string, string[]> = {
  scroll_deep: [
    "You made it to the bottom. Was it worth it?",
    "End of the line. Nothing down here but footer and regret.",
    "Scrolled all the way down? I'm genuinely surprised.",
  ],
  erratic_mouse: [
    "Having a seizure there, buddy?",
    "Woah, easy on the caffeine.",
    "Is the mouse broken or are you?",
  ],
  hovered_hesitation: [
    "Just click it. I dare you.",
    "Hovering won't make the link less scary.",
    "Commit to the click. Live a little.",
  ],
};

const PAGE_TITLES: Record<string, string> = {
  "/": "Homepage",
  "/blog": "Blog",
  "/works": "Works",
  "/irc": "IRC Chat",
  "/story": "Never-Ending Story",
};

const MOOD_DESCRIPTIONS: Record<Mood, string> = {
  neutral: "feeling neutral",
  bored: "feeling bored and passively unhelpful",
  curious: "curious about what the user is doing",
  annoyed: "annoyed at being dismissed",
  excited: "excited the user is engaging",
  smug: "smug because you predicted they'd come back",
};

/* ─── Validation ─── */

function isMood(value: string): value is Mood {
  const moods: Mood[] = ["neutral", "bored", "curious", "annoyed", "excited", "smug"];
  return moods.includes(value as Mood);
}

function defaultState(): ClippyState {
  return {
    events: [],
    history: [],
    mood: "neutral",
    moodLockedUntil: 0,
    dismissed: false,
    spokeOnThisPage: false,
    lastCommentAt: 0,
  };
}

function loadState(): ClippyState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();

    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "events" in parsed &&
      Array.isArray(parsed.events) &&
      "history" in parsed &&
      Array.isArray(parsed.history) &&
      "mood" in parsed &&
      typeof parsed.mood === "string" &&
      isMood(parsed.mood) &&
      "moodLockedUntil" in parsed &&
      typeof parsed.moodLockedUntil === "number" &&
      "dismissed" in parsed &&
      typeof parsed.dismissed === "boolean" &&
      "spokeOnThisPage" in parsed &&
      typeof parsed.spokeOnThisPage === "boolean" &&
      "lastCommentAt" in parsed &&
      typeof parsed.lastCommentAt === "number"
    ) {
      return {
        events: parsed.events as SessionEvent[],
        history: parsed.history as Array<{ role: string; content: string }>,
        mood: parsed.mood,
        moodLockedUntil: parsed.moodLockedUntil,
        dismissed: parsed.dismissed,
        spokeOnThisPage: parsed.spokeOnThisPage,
        lastCommentAt: parsed.lastCommentAt,
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return defaultState();
}

function saveState(state: ClippyState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage errors */
  }
}

/* ─── Mood engine ─── */

function transitionMood(current: Mood, eventType: SessionEvent["type"]): Mood {
  switch (eventType) {
    case "clippy_click":
      return current === "bored" || current === "neutral" || current === "annoyed"
        ? "excited"
        : current;
    case "dismiss":
      return "annoyed";
    case "returned_to_page":
      return current === "neutral" || current === "bored" ? "smug" : current;
    case "rage_click":
    case "hovered_hesitation":
    case "erratic_mouse":
      return current === "bored" ? "curious" : current;
    case "idle":
      return current === "neutral" || current === "excited" ? "bored" : current;
    default:
      return current;
  }
}

/* ─── Controller ─── */

class ClippyController {
  private container: HTMLElement;
  private character: HTMLElement;
  private bubble: HTMLElement;
  private bubbleText: HTMLElement;
  private closeBtn: HTMLElement;
  private dot: HTMLElement;
  private pupils: SVGElement[];

  private state: ClippyState;
  private pageStartTime: number;
  private isGenerating = false;
  private lastActivity: number;
  private booting = true;

  /* timers */
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private typewriterTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;

  /* per-page ephemeral tracking */
  private clickTargets: Map<string, number> = new Map();
  private hoveredElements: Set<string> = new Set();
  private mouseHistory: Array<{ x: number; y: number; t: number }> = [];
  private scrollFired = false;
  private erraticTriggered = false;
  private hoverTarget: string | null = null;
  private typewriterIndex = 0;

  constructor() {
    const container = document.getElementById("clippy-container");
    const character = document.getElementById("clippy-character");
    const bubble = document.getElementById("clippy-bubble");
    const bubbleText = document.getElementById("clippy-text");
    const closeBtn = document.getElementById("clippy-close");
    const dot = document.getElementById("clippy-dot");

    if (!container || !character || !bubble || !bubbleText || !closeBtn || !dot) {
      throw new Error("Clippy DOM elements missing");
    }

    this.container = container;
    this.character = character;
    this.bubble = bubble;
    this.bubbleText = bubbleText;
    this.closeBtn = closeBtn;
    this.dot = dot;
    this.pupils = Array.from(character.querySelectorAll(".clippy-pupil"));

    this.state = loadState();
    this.pageStartTime = Date.now();
    this.lastActivity = Date.now();

    this.bindEvents();
    this.start();
  }

  /* ─── Lifecycle ─── */

  private bindEvents() {
    this.closeBtn.addEventListener("click", () => this.dismiss());
    this.character.addEventListener("click", () => this.toggle());

    document.addEventListener("mousemove", (e) => this.onMouseMove(e));
    document.addEventListener("keydown", () => this.onActivity());
    document.addEventListener("click", (e) => this.onClick(e));
    document.addEventListener("scroll", () => this.onScroll(), { passive: true });
    document.addEventListener("mouseover", (e) => this.onMouseOver(e));
    document.addEventListener("mouseout", (e) => this.onMouseOut(e));

    window.addEventListener("beforeunload", () => {
      saveState(this.state);
    });
  }

  private async start() {
    if (!isClippyAvailable()) return;

    if (this.state.dismissed) {
      this.setPhase("dismissed");
      return;
    }

    // Phase 1: Booting (dot pulse)
    await new Promise((resolve) => setTimeout(resolve, INTRO_DELAY));
    this.setPhase("booting");

    // Phase 2: LLM init
    const ready = await initClippyLLM(this.state.history, (msg, pct) => {
      this.updateLoadingStatus(msg, pct);
    });

    if (!ready) {
      this.hide();
      return;
    }

    // Phase 3: Materializing
    this.setPhase("materializing");

    // Phase 4: Active
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.booting = false;
    this.recordPageVisit();
    this.state.spokeOnThisPage = false;
    saveState(this.state);

    this.setPhase("active");

    const trigger = this.buildTrigger("page_load");
    this.trySpeak(trigger);
    this.resetIdleTimer();
  }

  /* ─── Event recording ─── */

  private recordPageVisit() {
    const page = location.pathname;
    const priorVisits = this.state.events.filter(
      (e) => e.type === "page_visit" && e.page === page
    ).length;

    this.pushEvent({ type: "page_visit", page });

    if (priorVisits > 0) {
      this.pushEvent({ type: "returned_to_page", page });
      this.updateMood("returned_to_page");
    }
  }

  private pushEvent(event: SessionEvent) {
    this.state.events.push(event);
    if (this.state.events.length > 50) {
      this.state.events = this.state.events.slice(-50);
    }
    saveState(this.state);
  }

  /* ─── Mood ─── */

  private updateMood(eventType: SessionEvent["type"]) {
    if (Date.now() < this.state.moodLockedUntil) return;

    const next = transitionMood(this.state.mood, eventType);
    if (next === this.state.mood) return;

    this.state.mood = next;
    this.state.moodLockedUntil = Date.now() + MOOD_LOCK_DURATION;
    this.container.dataset.mood = next;
    saveState(this.state);
  }

  /* ─── Triggers ─── */

  private onActivity() {
    this.lastActivity = Date.now();
    this.resetIdleTimer();
  }

  private resetIdleTimer() {
    if (this.booting) return;
    if (this.idleTimer) clearTimeout(this.idleTimer);

    const threshold = IDLE_BASE + Math.random() * IDLE_VARIANCE;
    this.idleTimer = setTimeout(() => {
      if (Math.random() > 0.5) return; // 50% chance to stay quiet

      const duration = threshold > 35000 ? "long" : "short";
      this.pushEvent({ type: "idle", duration });
      this.updateMood("idle");
      this.trySpeak(this.buildTrigger("idle"));
    }, threshold);
  }

  private onScroll() {
    if (this.booting || this.scrollFired) return;

    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 150;

    if (nearBottom) {
      this.scrollFired = true;
      this.pushEvent({ type: "scroll_deep", page: location.pathname });
      this.trySpeak(this.buildTrigger("scroll_deep"), true);
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.booting) return;
    this.onActivity();
    this.updateEyes(e.clientX, e.clientY);

    const now = Date.now();
    this.mouseHistory.push({ x: e.clientX, y: e.clientY, t: now });
    this.mouseHistory = this.mouseHistory.filter((p) => now - p.t < MOUSE_HISTORY_WINDOW_MS);

    if (this.erraticTriggered || this.mouseHistory.length < 3) return;

    let totalVelocity = 0;
    for (let i = 1; i < this.mouseHistory.length; i++) {
      const dx = this.mouseHistory[i].x - this.mouseHistory[i - 1].x;
      const dy = this.mouseHistory[i].y - this.mouseHistory[i - 1].y;
      const dt = this.mouseHistory[i].t - this.mouseHistory[i - 1].t;
      if (dt > 0) {
        totalVelocity += Math.sqrt(dx * dx + dy * dy) / dt;
      }
    }

    const avgVelocity = totalVelocity / (this.mouseHistory.length - 1);
    if (avgVelocity > ERRATIC_VELOCITY_THRESHOLD) {
      this.erraticTriggered = true;
      this.pushEvent({ type: "erratic_mouse" });
      this.updateMood("erratic_mouse");
      this.trySpeak(this.buildTrigger("erratic_mouse"), true);
    }
  }

  private onMouseOver(e: MouseEvent) {
    if (this.booting) return;
    const target = e.target as HTMLElement;
    const clickable = target.closest("a, button");
    if (!clickable) return;

    const text = clickable.textContent?.trim() || "something";
    if (this.hoveredElements.has(text)) return;

    this.hoverTarget = text;
    this.hoverTimer = setTimeout(() => {
      if (this.hoverTarget === text) {
        this.hoveredElements.add(text);
        this.pushEvent({ type: "hovered_hesitation", target: text });
        this.updateMood("hovered_hesitation");
        this.trySpeak(this.buildTrigger("hovered_hesitation"), true);
      }
    }, HOVER_HESITATION_MS);
  }

  private onMouseOut(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) {
      if (this.hoverTimer) clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
      this.hoverTarget = null;
    }
  }

  private onClick(e: MouseEvent) {
    if (this.booting) return;
    const target = e.target as HTMLElement;

    // Ignore clicks on Clippy himself
    if (target.closest("#clippy-container")) return;

    // Cancel any pending hover timer
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
      this.hoverTarget = null;
    }

    const link = target.closest("a");
    const text = link ? link.textContent?.trim() : target.textContent?.trim();
    const href = link?.getAttribute("href");

    if (text) {
      const count = (this.clickTargets.get(text) || 0) + 1;
      this.clickTargets.set(text, count);

      if (count === 3) {
        this.pushEvent({ type: "rage_click", target: text });
        this.updateMood("rage_click");
        this.trySpeak(this.buildTrigger(`rage_click_${text}`), true);
        return;
      }
    }

    if (href?.startsWith("/")) {
      this.pushEvent({ type: "navigated", from: location.pathname, to: href });
    }
  }

  /* ─── Prompt building ─── */

  private buildTrigger(eventName: string): string {
    return eventName;
  }

  private buildPrompt(trigger: string): string {
    const recentEvents = this.state.events.slice(-6);
    const eventLines = recentEvents.map((e) => this.formatEvent(e));

    const pageContext = this.getPageContext();

    return [
      `You are Clippy. Your current mood: ${this.state.mood} (${MOOD_DESCRIPTIONS[this.state.mood]}).`,
      `What just happened: ${trigger}`,
      `Recent session history:`,
      ...eventLines,
      `Page context: ${pageContext}`,
      `Respond in 1-2 sentences. Stay in character. No timestamps, no counting, no "as an AI".`,
    ].join("\n");
  }

  private formatEvent(e: SessionEvent): string {
    switch (e.type) {
      case "page_visit":
        return `User visited ${this.pageTitle(e.page)}.`;
      case "clippy_click":
        return "User clicked on Clippy.";
      case "dismiss":
        return "User dismissed Clippy's bubble.";
      case "rage_click":
        return `User repeatedly clicked "${e.target}".`;
      case "scroll_deep":
        return `User scrolled to the bottom of ${this.pageTitle(e.page)}.`;
      case "navigated":
        return `User navigated from ${this.pageTitle(e.from)} to ${this.pageTitle(e.to)}.`;
      case "returned_to_page":
        return `User returned to ${this.pageTitle(e.page)}.`;
      case "hovered_hesitation":
        return `User hovered over "${e.target}" without clicking.`;
      case "erratic_mouse":
        return "User moved the mouse erratically.";
      case "idle":
        return `User was idle for a ${e.duration} while.`;
      default:
        return "Something happened.";
    }
  }

  private getPageContext(): string {
    const page = location.pathname;
    const base = PAGE_TITLES[page] || page;

    if (page === "/works") {
      return `${base}. Projects shown: Parlo (money insights via open banking), Haiku News Quiz, Tell Me A Story. If user seems interested in Parlo, mention getparlo.app casually.`;
    }

    if (page === "/") {
      return `${base}. Mathew's social links (LinkedIn, Bluesky, Twitter, GitHub) are down below. If user seems engaged, casually mention following him.`;
    }

    return base;
  }

  private pageTitle(path: string): string {
    return PAGE_TITLES[path] || path;
  }

  /* ─── Speech ─── */

  private canSpeak(): boolean {
    if (this.isGenerating) return false;
    if (this.state.dismissed) return false;
    if (Date.now() - this.state.lastCommentAt < MIN_COMMENT_INTERVAL) return false;
    return true;
  }

  private async trySpeak(trigger: string, useLocalFallback = false) {
    if (!this.canSpeak()) return;

    // Fast path: spatial interactions get instant pre-written quips
    const localPool = LOCAL_QUIPS[trigger];
    if (localPool) {
      const quip = localPool[Math.floor(Math.random() * localPool.length)];
      this.streamBubble(quip);
      this.recordSpoke();
      return;
    }

    if (useLocalFallback) return; // Don't hit LLM for spatial events

    this.isGenerating = true;
    const prompt = this.buildPrompt(trigger);
    const response = await generateComment(prompt);
    this.isGenerating = false;

    if (response) {
      this.state.history.push({ role: "user", content: prompt });
      this.state.history.push({ role: "assistant", content: response });
      if (this.state.history.length > 40) {
        this.state.history = this.state.history.slice(-40);
      }
      this.recordSpoke();
      this.streamBubble(response);
    }
  }

  private recordSpoke() {
    this.state.lastCommentAt = Date.now();
    this.state.spokeOnThisPage = true;
    saveState(this.state);
  }

  /* ─── UI ─── */

  private setPhase(phase: "hidden" | "booting" | "materializing" | "active" | "dismissed") {
    this.container.dataset.phase = phase;
  }

  private getPhase(): string {
    return this.container.dataset.phase || "hidden";
  }

  private setMood(mood: Mood) {
    this.container.dataset.mood = mood;
  }

  private hide() {
    this.setPhase("hidden");
  }

  private dismiss() {
    this.state.dismissed = true;
    this.pushEvent({ type: "dismiss" });
    this.updateMood("dismiss");
    this.setPhase("dismissed");
    this.bubble.classList.remove("visible");
    saveState(this.state);
  }

  private toggle() {
    this.pushEvent({ type: "clippy_click" });
    this.updateMood("clippy_click");

    if (this.getPhase() === "dismissed") {
      this.state.dismissed = false;
      this.setPhase("active");
      this.bubble.classList.add("visible");
      saveState(this.state);
      return;
    }

    this.bubble.classList.toggle("visible");
  }

  private streamBubble(text: string) {
    if (this.typewriterTimer) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    this.typewriterIndex = 0;
    this.bubbleText.textContent = "";
    this.bubbleText.classList.add("typing");
    this.bubble.classList.add("visible");
    this.bounce();

    const typeNext = () => {
      if (!this.bubble.classList.contains("visible")) return;

      if (this.typewriterIndex < text.length) {
        this.bubbleText.textContent += text[this.typewriterIndex];
        this.typewriterIndex++;
        this.typewriterTimer = setTimeout(typeNext, 32);
      } else {
        this.bubbleText.classList.remove("typing");
        this.typewriterTimer = null;

        setTimeout(() => {
          if (Date.now() - this.lastActivity > 10000) {
            this.bubble.classList.remove("visible");
          }
        }, 12000);
      }
    };

    typeNext();
  }

  private bounce() {
    this.character.classList.add("clippy-bounce");
    setTimeout(() => {
      this.character.classList.remove("clippy-bounce");
    }, 300);
  }

  private updateLoadingStatus(msg: string, pct?: number) {
    if (this.getPhase() === "booting") {
      const label = pct !== undefined ? `${msg} ${pct}%` : msg;
      this.dot.setAttribute("title", label);
      if (pct !== undefined) {
        this.dot.style.setProperty("--progress", `${pct}%`);
      }
    }
  }

  /* ─── Eye tracking ─── */

  private updateEyes(mouseX: number, mouseY: number) {
    if (this.pupils.length === 0) return;

    const rect = this.character.getBoundingClientRect();
    const eyeCX = rect.left + rect.width / 2;
    const eyeCY = rect.top + 18;

    const angle = Math.atan2(mouseY - eyeCY, mouseX - eyeCX);
    const distance = Math.min(2.5, Math.hypot(mouseX - eyeCX, mouseY - eyeCY) / 40);

    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    this.pupils.forEach((pupil) => {
      pupil.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
  }
}

/* ─── Export ─── */

export function initClippy(): void {
  const container = document.getElementById("clippy-container");
  if (!container) return;

  // Prevent double initialization from Astro hydration
  if (container.dataset.initialized === "true") return;

  container.dataset.initialized = "true";

  try {
    new ClippyController();
  } catch (e) {
    console.error("Clippy failed to start:", e);
  }
}
