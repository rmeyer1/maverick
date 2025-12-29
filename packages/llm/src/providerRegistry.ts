import type { LLMProvider } from "./types";
import { createOpenAIProvider } from "./providers/openai";
import { createGeminiProvider } from "./providers/gemini";
import { createXaiProvider } from "./providers/xai";
import { createDeepseekProvider } from "./providers/deepseek";

export const providerRegistry: Record<
  string,
  (env?: Record<string, string | undefined>) => LLMProvider
> = {
  openai: createOpenAIProvider,
  gemini: createGeminiProvider,
  xai: createXaiProvider,
  deepseek: createDeepseekProvider,
};
