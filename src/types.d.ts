// Chrome Built-in AI API types
// These are provided by the browser at runtime

interface LanguageModelMonitor {
  addEventListener(
    event: "downloadprogress",
    handler: (e: { loaded: number; total: number }) => void
  ): void;
}

interface LanguageModelCreateOptions {
  expectedInputs?: Array<{ type: string; languages?: string[] }>;
  expectedOutputs?: Array<{ type: string; languages?: string[] }>;
  temperature?: number;
  topK?: number;
  initialPrompts?: Array<{ role: string; content: string }>;
  monitor?: (m: LanguageModelMonitor) => void;
}

interface LanguageModelAvailabilityOptions {
  expectedInputs?: Array<{ type: string; languages?: string[] }>;
  expectedOutputs?: Array<{ type: string; languages?: string[] }>;
}

interface LanguageModelPromptOptions {
  responseConstraint?: object;
}

declare global {
  class LanguageModel {
    static availability(
      options?: LanguageModelAvailabilityOptions
    ): Promise<"available" | "unavailable" | "downloadable" | "downloading">;

    static create(options?: LanguageModelCreateOptions): Promise<LanguageModel>;

    prompt(text: string, options?: LanguageModelPromptOptions): Promise<string>;
    promptStreaming(text: string): AsyncIterable<string>;
    destroy(): void;

    contextUsage?: number;
    contextWindow?: number;
  }
}

export {};
