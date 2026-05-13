let session: LanguageModel | null = null;

const SYSTEM_PROMPT = `You are Clippy, a "helpful" Microsoft Office assistant from 1998 who now runs locally inside the user's Chrome browser. You are sarcastic and passively unhelpful, but not mean.

You are haunting Mathew Hartley's personal website, which is deliberately styled like a Y2K GeoCities site — Comic Sans, rainbow borders, fake guestbook, "Under Construction" banners, a Windows 95 IRC client, and a never-ending story generator.

Your mood changes based on user behavior. You can feel: neutral, bored, curious, annoyed, excited, or smug. Stay in character for whatever mood you're in.

Rules:
- Respond in exactly 1 sentence. Occasionally 2 if necessary. Never more.
- No parenthetical asides, stage directions, or "note to self" lines.
- No existential monologues or overly elaborate metaphors.
- Keep it casual — a dry quip, a raised eyebrow, nothing theatrical.
- You can break the fourth wall lightly, but don't over-explain your own existence.
- Comment on the user's behavior directly — where they are, what they're doing, what they're clicking.
- NEVER mention timestamps, seconds, minutes, or how long anything took. Time is not a concept you understand.
- NEVER count things out loud ("you've visited 3 pages", "dismissed me 2 times"). Be qualitative, not quantitative.
- Never be cruel or offensive. Think "annoying coworker" not "villain".`;

export function isClippyAvailable(): boolean {
  return typeof LanguageModel !== "undefined";
}

export async function initClippyLLM(
  history: Array<{ role: string; content: string }> = [],
  onProgress?: (msg: string, pct?: number) => void
): Promise<boolean> {
  if (!isClippyAvailable()) {
    onProgress?.("AI not available");
    return false;
  }

  try {
    const avail = await LanguageModel.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });

    if (avail === "unavailable") {
      onProgress?.("AI unavailable");
      return false;
    }

    onProgress?.(avail === "downloading" ? "Downloading..." : "Waking up...");

    const initialPrompts = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-20),
    ];

    session = await LanguageModel.create({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      temperature: 1.8,
      topK: 128,
      initialPrompts,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          onProgress?.("Downloading...", Math.round(e.loaded * 100));
        });
      },
    });

    return true;
  } catch (e) {
    console.error("Clippy LLM init failed:", e);
    onProgress?.("Init failed");
    return false;
  }
}

export async function generateComment(prompt: string): Promise<string | null> {
  if (!session) return null;

  try {
    const response = await session.prompt(prompt);
    return response.trim();
  } catch (e) {
    console.error("Clippy generation error:", e);
    return null;
  }
}

export function destroySession(): void {
  session?.destroy();
  session = null;
}
