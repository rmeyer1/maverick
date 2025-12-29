import type {
  GenerateJsonArgs,
  GenerateJsonResult,
  LLMProvider,
} from "../types.js";
import { LLMConfigError, LLMProviderError, LLMRateLimitError, LLMTransientError } from "../errors.js";
import { parseJsonResponse } from "../parseJson.js";

export function createDeepseekProvider(
  env: Record<string, string | undefined> = process.env
): LLMProvider {
  const apiKey = env.DEEPSEEK_API_KEY;
  const baseUrl = env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";

  return {
    name: "deepseek",
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (!apiKey) {
        throw new LLMConfigError("Missing DEEPSEEK_API_KEY for DeepSeek provider.");
      }

      const model = args.model ?? env.LLM_MODEL_DEFAULT ?? "deepseek-chat";
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: args.temperature ?? 0.2,
          max_tokens: args.maxTokens,
          response_format: { type: "json_object" },
          messages: [
            ...(args.system ? [{ role: "system", content: args.system }] : []),
            { role: "user", content: args.prompt },
          ],
        }),
      });

      if (response.status === 429) {
        throw new LLMRateLimitError("DeepSeek rate limit exceeded.");
      }

      if (!response.ok) {
        const text = await response.text();
        throw new LLMTransientError(`DeepSeek error ${response.status}: ${text}`);
      }

      const payload = (await response.json()) as any;
      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        throw new LLMProviderError("DeepSeek response missing content.");
      }

      const data = parseJsonResponse(content, "DeepSeek");
      const parsed = args.schema.safeParse(data);
      if (!parsed.success) {
        throw new LLMProviderError(`DeepSeek JSON failed validation: ${parsed.error.message}`);
      }

      return {
        data: parsed.data,
        provider: "deepseek",
        model,
        raw: payload,
        usage: payload?.usage
          ? { inputTokens: payload.usage.prompt_tokens, outputTokens: payload.usage.completion_tokens }
          : undefined,
      };
    },
  };
}
