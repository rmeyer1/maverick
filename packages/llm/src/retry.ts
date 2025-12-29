import { isRetryableError } from "./errors.js";
import type { RetryOptions } from "./types.js";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= options.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === options.maxRetries) {
        throw error;
      }

      const baseDelay = Math.min(
        options.baseDelayMs * Math.pow(2, attempt),
        options.maxDelayMs
      );
      const jitter = Math.floor(Math.random() * options.baseDelayMs);
      await sleep(baseDelay + jitter);
    }

    attempt += 1;
  }

  throw lastError ?? new Error("LLM retry failed");
}
