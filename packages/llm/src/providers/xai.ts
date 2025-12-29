import type { GenerateJsonArgs, GenerateJsonResult, LLMProvider } from "../types";
import { LLMConfigError, LLMProviderError } from "../errors";

export function createXaiProvider(
  env: Record<string, string | undefined> = process.env
): LLMProvider {
  const apiKey = env.XAI_API_KEY;

  return {
    name: "xai",
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (!apiKey) {
        throw new LLMConfigError("Missing XAI_API_KEY for xAI provider.");
      }

      throw new LLMProviderError(
        `xAI provider not configured in this build. Set LLM_DRY_RUN=1 to stub responses. Requested model=${args.model ?? "default"}.`
      );
    },
  };
}
