import type { GenerateJsonArgs, GenerateJsonResult, LLMProvider } from "../types";
import { LLMConfigError, LLMProviderError } from "../errors";

export function createGeminiProvider(
  env: Record<string, string | undefined> = process.env
): LLMProvider {
  const apiKey = env.GEMINI_API_KEY;

  return {
    name: "gemini",
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (!apiKey) {
        throw new LLMConfigError("Missing GEMINI_API_KEY for Gemini provider.");
      }

      throw new LLMProviderError(
        `Gemini provider not configured in this build. Set LLM_DRY_RUN=1 to stub responses. Requested model=${args.model ?? "default"}.`
      );
    },
  };
}
