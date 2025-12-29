import type { GenerateJsonArgs, GenerateJsonResult, LLMProvider } from "../types";
import { LLMConfigError, LLMProviderError } from "../errors";

export function createOpenAIProvider(
  env: Record<string, string | undefined> = process.env
): LLMProvider {
  const apiKey = env.OPENAI_API_KEY;

  return {
    name: "openai",
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (!apiKey) {
        throw new LLMConfigError("Missing OPENAI_API_KEY for OpenAI provider.");
      }

      throw new LLMProviderError(
        `OpenAI provider not configured in this build. Set LLM_DRY_RUN=1 to stub responses. Requested model=${args.model ?? "default"}.`
      );
    },
  };
}
