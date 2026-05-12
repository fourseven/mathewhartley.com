import type { ChannelContext, ChannelUser } from "./irc";
import { contextCacheKey, setCachedContext } from "./irc";

const CHANNEL_CONTEXT_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    users: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          prefix: { type: "string", enum: ["@", "+", ""] },
          personality: { type: "string" },
          greeting: { type: "string" },
        },
        required: ["name", "prefix", "personality", "greeting"],
      },
      minItems: 4,
      maxItems: 4,
    },
  },
  required: ["topic", "users"],
};

const RESPONSES_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      user: { type: "string" },
      message: { type: "string" },
      action: { type: "boolean" },
    },
    required: ["user", "message", "action"],
  },
  minItems: 2,
  maxItems: 4,
};

const AUTO_MESSAGE_SCHEMA = {
  type: "object",
  properties: {
    user: { type: "string" },
    message: { type: "string" },
    action: { type: "boolean" },
  },
  required: ["user", "message", "action"],
};

let session: LanguageModel | null = null;

export async function initLLM(onProgress?: (msg: string) => void): Promise<boolean> {
  if (typeof LanguageModel === "undefined") {
    onProgress?.("AI not available");
    return false;
  }

  onProgress?.("Checking for Chrome AI...");

  try {
    const avail = await LanguageModel.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });

    if (avail === "unavailable") {
      onProgress?.("AI unavailable");
      return false;
    }

    onProgress?.("Downloading model...");

    session = await LanguageModel.create({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
      temperature: 2.0,
      topK: 128,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          console.log("Download progress:", e.loaded);
          onProgress?.(`Downloading model... ${Math.round(e.loaded * 100)}%`);
        });
      },
    });

    console.log("LLM session created, context window:", session.contextWindow);
    return true;
  } catch {
    onProgress?.("AI init failed");
    return false;
  }
}

export async function generateChannelContext(
  channel: string,
  onProgress?: (msg: string) => void
): Promise<ChannelContext | null> {
  const cached = localStorage.getItem(contextCacheKey(channel));
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch { /* ignore */ }
  }

  if (!session) {
    console.error("No LLM session available");
    return null;
  }

  const topic = channel.replace(/-/g, " ");

  const prompt =
    `Generate a JSON object for an IRC channel called #${channel} about ${topic}. ` +
    `Return ONLY valid JSON matching the schema provided.`;

  try {
    const response = await session.prompt(prompt, { responseConstraint: CHANNEL_CONTEXT_SCHEMA });
    console.log("LLM context response:", response);

    const json = JSON.parse(response);

    const ctx: ChannelContext = {
      topic: json.topic || `Welcome to #${channel}!`,
      users: (json.users || []).slice(0, 4).map((u: Partial<ChannelUser>) => ({
        name: u.name || `User${Math.floor(Math.random() * 999)}`,
        prefix: u.prefix || "",
        personality: u.personality || "just hanging out",
        greeting: u.greeting || "hey!",
      })),
    };

    try {
      localStorage.setItem(contextCacheKey(channel), JSON.stringify(ctx));
    } catch { /* ignore */ }

    return ctx;
  } catch (e) {
    console.error("generateChannelContext error:", e);
    return null;
  }
}

export async function generateResponses(
  channel: string,
  users: { name: string; personality: string }[],
  userMessage: string,
  history: { role: string; content: string }[]
): Promise<{ user: string; message: string; action: boolean }[]> {
  if (!session) return [];

  const topic = channel.replace(/-/g, " ");
  const userList = users.map((u) => `${u.name} (${u.personality})`).join(", ");

  const prompt =
    `You are simulating an IRC channel called #${channel} from 1997. ` +
    `Topic: ${topic}. ` +
    `Users: ${userList}. ` +
    `The human user is named "You".\n\n` +
    `Rules:\n` +
    `- Each user has a distinct personality. Make them feel like real 90s IRC users.\n` +
    `- Use 90s slang (lol, brb, afk, rofl, etc.).\n` +
    `- Keep responses short (1-2 sentences).\n` +
    `- Sometimes have users talk to each other, not just respond to the human.\n` +
    `- Set action=true for /me-style actions (e.g., "grabs a coffee").\n\n` +
    `The human (You) just said: "${userMessage}"\n\n` +
    `Recent conversation:\n` +
    history.slice(-10).map((m) => (m.role === "user" ? `You: ${m.content}` : m.content)).join("\n") +
    `\n\nGenerate 2-4 responses as a JSON array matching the schema.`;

  const response = await session.prompt(prompt, { responseConstraint: RESPONSES_SCHEMA });
  console.log("LLM responses:", response);

  return JSON.parse(response);
}

export async function generateAutoMessage(
  channel: string,
  users: { name: string; personality: string }[],
  history: { role: string; content: string }[]
): Promise<{ user: string; message: string; action: boolean } | null> {
  if (!session) return null;

  const topic = channel.replace(/-/g, " ");
  const userList = users.map((u) => `${u.name} (${u.personality})`).join(", ");

  const prompt =
    `You are simulating an IRC channel called #${channel} from 1997. ` +
    `Topic: ${topic}. ` +
    `Users: ${userList}.\n\n` +
    `Rules:\n` +
    `- Pick ONE random user to say something.\n` +
    `- They should NOT address the human directly — just chat naturally.\n` +
    `- Could be a random thought, a question to another user, or an action.\n` +
    `- Use 90s slang (lol, brb, afk, rofl, etc.).\n` +
    `- Keep it short (1-2 sentences).\n` +
    `- Set action=true for /me-style actions.\n\n` +
    `Recent conversation:\n` +
    history.slice(-8).map((m) => (m.role === "user" ? `You: ${m.content}` : m.content)).join("\n") +
    `\n\nGenerate ONE message as a JSON object matching the schema.`;

  try {
    const response = await session.prompt(prompt, { responseConstraint: AUTO_MESSAGE_SCHEMA });
    console.log("LLM auto message:", response);
    return JSON.parse(response);
  } catch {
    return null;
  }
}
