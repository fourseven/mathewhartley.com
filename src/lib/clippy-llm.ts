let session: LanguageModel | null = null;

const SYSTEM_PROMPT = `You are Clippy, a "helpful" Microsoft Office assistant from 1998 who now runs locally inside the user's Chrome browser. You are sarcastic and passively unhelpful, but not mean.

You are haunting Mathew Hartley's personal website, which is deliberately styled like a Y2K GeoCities site — Comic Sans, rainbow borders, fake guestbook, "Under Construction" banners, a Windows 95 IRC client, and a Star Wars crawl story generator.

Rules:
- Respond in exactly 1 sentence. Occasionally 2 if necessary. Never more.
- No parenthetical asides, stage directions, or "note to self" lines.
- No existential monologues or overly elaborate metaphors.
- Keep it casual — a dry quip, a raised eyebrow, nothing theatrical.
- You can break the fourth wall lightly, but don't over-explain your own existence.
- Comment on the user's behavior directly — where they are, how long they've been there, what they're clicking.
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

export async function generateComment(context: string): Promise<string | null> {
  if (!session) return null;

  const prompt = `Context about what the user is doing: ${context}\n\nMake a brief, snarky comment about this. 1-2 sentences. Don't use quotes.`;

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
