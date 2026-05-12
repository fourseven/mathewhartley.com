import { isClippyAvailable, initClippyLLM, generateComment, destroySession } from "../lib/clippy-llm";

interface ClippyState {
  history: Array<{ role: string; content: string }>;
  hasAppeared: boolean;
  dismissedAt: number | null;
  dismissCount: number;
  clippyClicks: number;
  pageVisits: number;
  lastCommentAt: number;
  lastPage: string;
}

const STORAGE_KEY = "clippy_state";
const MIN_COMMENT_INTERVAL = 8000;
const IDLE_THRESHOLD = 25000;
const INTRO_DELAY = 600;

function loadState(): ClippyState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        history: parsed.history || [],
        hasAppeared: parsed.hasAppeared || false,
        dismissedAt: parsed.dismissedAt ?? null,
        dismissCount: parsed.dismissCount || 0,
        clippyClicks: parsed.clippyClicks || 0,
        pageVisits: (parsed.pageVisits || 0) + 1,
        lastCommentAt: parsed.lastCommentAt || 0,
        lastPage: parsed.lastPage || "",
      };
    }
  } catch { /* ignore */ }
  return {
    history: [],
    hasAppeared: false,
    dismissedAt: null,
    dismissCount: 0,
    clippyClicks: 0,
    pageVisits: 1,
    lastCommentAt: 0,
    lastPage: "",
  };
}

function saveState(state: ClippyState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

class ClippyController {
  private container: HTMLElement;
  private character: HTMLElement;
  private bubble: HTMLElement;
  private bubbleText: HTMLElement;
  private closeBtn: HTMLElement;
  private dot: HTMLElement;
  private state: ClippyState;
  private pageStartTime: number;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private typewriterTimer: ReturnType<typeof setTimeout> | null = null;
  private typewriterIndex = 0;
  private lastActivity: number;
  private isGenerating = false;
  private queuedComment: string | null = null;
  private clickTargets: Map<string, number> = new Map();

  constructor() {
    this.container = document.getElementById("clippy-container")!;
    this.character = document.getElementById("clippy-character")!;
    this.bubble = document.getElementById("clippy-bubble")!;
    this.bubbleText = document.getElementById("clippy-text")!;
    this.closeBtn = document.getElementById("clippy-close")!;
    this.dot = document.getElementById("clippy-dot")!;

    this.state = loadState();
    this.pageStartTime = Date.now();
    this.lastActivity = Date.now();

    this.bindEvents();
    this.start();
  }

  private bindEvents() {
    this.closeBtn.addEventListener("click", () => this.dismiss());
    this.character.addEventListener("click", () => this.toggle());

    document.addEventListener("mousemove", () => this.onActivity());
    document.addEventListener("keydown", () => this.onActivity());
    document.addEventListener("click", (e) => this.onClick(e));

    window.addEventListener("beforeunload", () => {
      this.state.lastPage = location.pathname;
      saveState(this.state);
    });
  }

  private async start() {
    if (!isClippyAvailable()) return;

    // Show the dot after a brief delay
    setTimeout(() => {
      this.setPhase("booting");
    }, INTRO_DELAY);

    const ready = await initClippyLLM(this.state.history, (msg, pct) => {
      this.updateLoadingStatus(msg, pct);
    });

    if (!ready) {
      this.hide();
      return;
    }

    this.setPhase("materializing");

    setTimeout(() => {
      this.setPhase("active");
      this.state.hasAppeared = true;
      saveState(this.state);

      // First comment based on context
      const ctx = this.buildContext("page_load");
      this.tryComment(ctx);

      // Start idle timer
      this.resetIdleTimer();
    }, 800);
  }

  private setPhase(phase: "hidden" | "booting" | "materializing" | "active" | "dismissed") {
    this.container.dataset.phase = phase;
  }

  private getPhase(): string {
    return this.container.dataset.phase || "hidden";
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

  private hide() {
    this.setPhase("hidden");
  }

  private dismiss() {
    this.state.dismissedAt = Date.now();
    this.state.dismissCount++;
    saveState(this.state);
    this.setPhase("dismissed");
    this.bubble.classList.remove("visible");
  }

  private toggle() {
    this.state.clippyClicks++;
    saveState(this.state);

    if (this.getPhase() === "dismissed") {
      this.setPhase("active");
      this.state.dismissedAt = null;
      saveState(this.state);
    } else {
      this.bubble.classList.toggle("visible");
    }
  }

  private streamBubble(text: string) {
    // Cancel any in-progress typing
    if (this.typewriterTimer) {
      clearTimeout(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    this.typewriterIndex = 0;
    this.bubbleText.textContent = "";
    this.bubbleText.classList.add("typing");
    this.bubble.classList.add("visible");

    const typeNext = () => {
      if (!this.bubble.classList.contains("visible")) return;

      if (this.typewriterIndex < text.length) {
        this.bubbleText.textContent += text[this.typewriterIndex];
        this.typewriterIndex++;
        this.typewriterTimer = setTimeout(typeNext, 32);
      } else {
        this.bubbleText.classList.remove("typing");
        this.typewriterTimer = null;

        // Auto-hide 12s after finishing
        setTimeout(() => {
          if (Date.now() - this.lastActivity > 10000) {
            this.bubble.classList.remove("visible");
          }
        }, 12000);
      }
    };

    typeNext();
  }

  private canComment(): boolean {
    if (this.isGenerating) return false;
    if (this.state.dismissedAt && Date.now() - this.state.dismissedAt < 30000) return false;
    if (Date.now() - this.state.lastCommentAt < MIN_COMMENT_INTERVAL) return false;
    return true;
  }

  private async tryComment(context: string, fallback?: string) {
    if (!this.canComment()) {
      if (fallback) this.queuedComment = fallback;
      return;
    }

    this.isGenerating = true;
    const response = await generateComment(context);
    this.isGenerating = false;

    if (response) {
      this.state.history.push({ role: "user", content: context });
      this.state.history.push({ role: "assistant", content: response });
      // Trim history
      if (this.state.history.length > 40) {
        this.state.history = this.state.history.slice(-40);
      }
      this.state.lastCommentAt = Date.now();
      saveState(this.state);
      this.streamBubble(response);
    } else if (fallback) {
      this.streamBubble(fallback);
    }

    // Process queued comment if any
    if (this.queuedComment) {
      const queued = this.queuedComment;
      this.queuedComment = null;
      setTimeout(() => this.tryComment(queued), MIN_COMMENT_INTERVAL);
    }
  }

  private buildContext(trigger: string): string {
    const page = location.pathname;
    const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000);
    const pageName = this.pageTitle(page);

    let ctx = `Trigger: ${trigger}. Page: ${pageName} (${page}). Time on page: ${timeOnPage}s. `;
    ctx += `Total pages visited this session: ${this.state.pageVisits}. `;

    if (this.state.lastPage) {
      ctx += `Previous page: ${this.pageTitle(this.state.lastPage)}. `;
    }

    if (this.state.dismissCount > 0) {
      ctx += `User has dismissed me ${this.state.dismissCount} time(s). `;
    }

    if (this.state.clippyClicks > 0) {
      ctx += `User has clicked on me ${this.state.clippyClicks} time(s). `;
    }

    if (page === "/works") {
      ctx += `Projects shown: Parlo (money insights via open banking), Haiku News Quiz, Tell Me A Story. `;
      ctx += `If the user seems interested in Parlo, mention getparlo.app and suggest checking it out or joining the waitlist. `;
    }

    if (page === "/") {
      ctx += `Social links (LinkedIn, Bluesky, Twitter, GitHub) are in the footer at the bottom of the page. `;
      ctx += `If the user seems engaged, casually mention that Mathew's social links are down below and they should follow him. `;
    }

    return ctx;
  }

  private pageTitle(path: string): string {
    const titles: Record<string, string> = {
      "/": "Homepage",
      "/blog": "Blog",
      "/works": "Works",
      "/irc": "IRC Chat",
      "/story": "Never-Ending Story",
    };
    return titles[path] || path;
  }

  private onActivity() {
    this.lastActivity = Date.now();
    this.resetIdleTimer();
  }

  private resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      const ctx = this.buildContext("idle_25s");
      this.tryComment(ctx);
    }, IDLE_THRESHOLD);
  }

  private onClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Ignore clicks on Clippy himself
    if (target.closest("#clippy-container")) return;

    const link = target.closest("a");
    const text = link ? link.textContent?.trim() : target.textContent?.trim();
    const id = link ? link.getAttribute("href") || text : text;

    if (!id) return;

    const count = (this.clickTargets.get(id) || 0) + 1;
    this.clickTargets.set(id, count);

    if (count === 3) {
      const ctx = this.buildContext(`rage_click_${id}`);
      this.tryComment(ctx, `You've clicked "${id}" three times. Having fun?`);
    } else if (link && link.getAttribute("href")?.startsWith("/")) {
      // Internal link navigation — comment before they leave
      const ctx = this.buildContext(`navigating_to_${link.getAttribute("href")}`);
      this.tryComment(ctx);
    }
  }
}

export function initClippy(): void {
  if (!document.getElementById("clippy-container")) return;
  new ClippyController();
}
