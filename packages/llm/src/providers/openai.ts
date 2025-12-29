import type {
  GenerateJsonArgs,
  GenerateJsonResult,
  LLMProvider,
} from "../types.js";
import { LLMConfigError, LLMProviderError, LLMRateLimitError, LLMTransientError } from "../errors.js";
import { buildJsonSchema } from "../jsonSchema.js";
import { parseJsonResponse } from "../parseJson.js";

export function createOpenAIProvider(
  env: Record<string, string | undefined> = process.env
): LLMProvider {
  const apiKey = env.OPENAI_API_KEY;
  const baseUrl = env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  return {
    name: "openai",
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (!apiKey) {
        throw new LLMConfigError("Missing OPENAI_API_KEY for OpenAI provider.");
      }

      const model = args.model ?? env.LLM_MODEL_DEFAULT ?? "gpt-4o-mini";
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
          response_format: {
            type: "json_object",
          },
          messages: [
            ...(args.system ? [{ role: "system", content: args.system }] : []),
            { role: "user", content: args.prompt },
          ],
        }),
      });

      if (response.status === 429) {
        throw new LLMRateLimitError("OpenAI rate limit exceeded.");
      }

      if (!response.ok) {
        const text = await response.text();
        throw new LLMTransientError(`OpenAI error ${response.status}: ${text}`);
      }

      const payload = (await response.json()) as any;
      const content = payload?.choices?.[0]?.message?.content;
      if (!content) {
        throw new LLMProviderError("OpenAI response missing content.");
      }

      const data = parseJsonResponse(content, "OpenAI");
      const parsed = args.schema.safeParse(data);
      if (!parsed.success) {
        throw new LLMProviderError(`OpenAI JSON failed validation: ${parsed.error.message}`);
      }

      return {
        data: parsed.data,
        provider: "openai",
        model,
        raw: payload,
        usage: payload?.usage
          ? { inputTokens: payload.usage.prompt_tokens, outputTokens: payload.usage.completion_tokens }
          : undefined,
      };
    },
  };
}
