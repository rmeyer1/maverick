import type { LLMProvider } from "./types.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createGeminiProvider } from "./providers/gemini.js";
import { createXaiProvider } from "./providers/xai.js";
import { createDeepseekProvider } from "./providers/deepseek.js";

export const providerRegistry: Record<
  string,
  (env?: Record<string, string | undefined>) => LLMProvider
> = {
  openai: createOpenAIProvider,
  gemini: createGeminiProvider,
  xai: createXaiProvider,
  deepseek: createDeepseekProvider,
};
