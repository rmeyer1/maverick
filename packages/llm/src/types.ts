import type { ZodType } from "zod";

export type GenerateJsonArgs<T> = {
  model?: string;
  system?: string;
  prompt: string;
  schema: ZodType<T>;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  redact?: boolean;
  dryRun?: boolean;
};

export type GenerateJsonResult<T> = {
  data: T;
  provider: string;
  model?: string;
  raw?: unknown;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export type LLMProvider = {
  name: string;
  generateJson: <T>(args: GenerateJsonArgs<T>) => Promise<GenerateJsonResult<T>>;
};

export type ProviderFactoryOptions = {
  env?: Record<string, string | undefined>;
};

export type RetryOptions = {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
};
