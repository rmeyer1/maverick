import { LLMProviderError } from "./errors.js";

export function parseJsonResponse(raw: string, provider: string) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new LLMProviderError(
      `Failed to parse JSON from ${provider} response: ${message}`
    );
  }
}
