import type {
  GenerateJsonArgs,
  GenerateJsonResult,
  LLMProvider,
} from "../types.js";
import { LLMConfigError, LLMProviderError } from "../errors.js";

export function createDeepseekProvider(
  env: Record<string, string | undefined> = process.env
): LLMProvider {
  const apiKey = env.DEEPSEEK_API_KEY;

  return {
    name: "deepseek",
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (!apiKey) {
        throw new LLMConfigError("Missing DEEPSEEK_API_KEY for DeepSeek provider.");
      }

      throw new LLMProviderError(
        `DeepSeek provider not configured in this build. Set LLM_DRY_RUN=1 to stub responses. Requested model=${args.model ?? "default"}.`
      );
    },
  };
}
