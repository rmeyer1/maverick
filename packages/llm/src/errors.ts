export class LLMError extends Error {
  code: string;

  constructor(message: string, code = "llm_error") {
    super(message);
    this.name = "LLMError";
    this.code = code;
  }
}

export class LLMConfigError extends LLMError {
  constructor(message: string) {
    super(message, "llm_config_error");
    this.name = "LLMConfigError";
  }
}

export class LLMProviderError extends LLMError {
  constructor(message: string) {
    super(message, "llm_provider_error");
    this.name = "LLMProviderError";
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(message: string) {
    super(message, "llm_rate_limited");
    this.name = "LLMRateLimitError";
  }
}

export class LLMTransientError extends LLMError {
  constructor(message: string) {
    super(message, "llm_transient_error");
    this.name = "LLMTransientError";
  }
}

export function isRetryableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  if (error instanceof LLMRateLimitError) return true;
  if (error instanceof LLMTransientError) return true;
  return false;
}
