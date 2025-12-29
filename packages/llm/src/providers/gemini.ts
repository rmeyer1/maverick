import type {
  GenerateJsonArgs,
  GenerateJsonResult,
  LLMProvider,
} from "../types.js";
import { LLMConfigError, LLMProviderError, LLMRateLimitError, LLMTransientError } from "../errors.js";
import { buildJsonSchema } from "../jsonSchema.js";
import { parseJsonResponse } from "../parseJson.js";

export function createGeminiProvider(
  env: Record<string, string | undefined> = process.env
): LLMProvider {
  const apiKey = env.GEMINI_API_KEY;
  const baseUrl =
    env.GEMINI_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta";

  return {
    name: "gemini",
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (!apiKey) {
        throw new LLMConfigError("Missing GEMINI_API_KEY for Gemini provider.");
      }

      const model = args.model ?? env.LLM_MODEL_DEFAULT ?? "gemini-2.0-flash";
      const response = await fetch(
        `${baseUrl}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: args.prompt }],
              },
            ],
            systemInstruction: args.system
              ? { parts: [{ text: args.system }] }
              : undefined,
            generationConfig: {
              temperature: args.temperature ?? 0.2,
              maxOutputTokens: args.maxTokens,
              responseMimeType: "application/json",
              responseJsonSchema: buildJsonSchema(args.schema),
            },
          }),
        }
      );

      if (response.status === 429) {
        throw new LLMRateLimitError("Gemini rate limit exceeded.");
      }

      if (!response.ok) {
        const text = await response.text();
        throw new LLMTransientError(`Gemini error ${response.status}: ${text}`);
      }

      const payload = (await response.json()) as any;
      const content =
        payload?.candidates?.[0]?.content?.parts?.[0]?.text ??
        payload?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!content) {
        throw new LLMProviderError("Gemini response missing content.");
      }

      const data = parseJsonResponse(content, "Gemini");
      const parsed = args.schema.safeParse(data);
      if (!parsed.success) {
        throw new LLMProviderError(`Gemini JSON failed validation: ${parsed.error.message}`);
      }

      return {
        data: parsed.data,
        provider: "gemini",
        model,
        raw: payload,
      };
    },
  };
}
