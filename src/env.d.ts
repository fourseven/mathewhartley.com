/// <reference types="astro/client" />

export {};

declare global {
  interface Window {
    plausible?: ((...args: unknown[]) => void) & { q?: unknown[]; init?: (options?: unknown) => void; o?: unknown };
    turnstile?: { reset: () => void };
  }
}

declare interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T>(): Promise<{ results?: T[] }>;
      run(): Promise<unknown>;
    };
    all<T>(): Promise<{ results?: T[] }>;
    run(): Promise<unknown>;
  };
}

declare interface PagesFunction<Environment = Record<string, unknown>> {
  (context: { request: Request; env: Environment }): Promise<Response>;
}

declare module "node:assert" { export const strict: any; }
declare module "node:fs" { export const existsSync: (...args: any[]) => boolean; }
declare module "node:path" { export const resolve: (...args: string[]) => string; }
declare module "node:url" { export const fileURLToPath: (url: URL) => string; }
declare module "node:crypto" { export const randomUUID: () => string; }
declare module "node:fs/promises" { export const readFile: (...args: any[]) => Promise<any>; }
declare module "node:os" { export const tmpdir: () => string; }
declare module "node:child_process" { export const execFile: (...args: any[]) => any; }
declare module "vitest" {
  export const afterEach: (...args: any[]) => void;
  export const describe: (...args: any[]) => void;
  export const expect: any;
  export const it: (...args: any[]) => void;
  export const vi: any;
}
