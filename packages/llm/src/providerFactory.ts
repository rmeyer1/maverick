import type { GenerateJsonArgs, GenerateJsonResult, LLMProvider, ProviderFactoryOptions, RetryOptions } from "./types";
import { providerRegistry } from "./providerRegistry";
import { LLMConfigError } from "./errors";
import { withRetries } from "./retry";
import { redactSensitive, redactText } from "./redaction";
import { createStubFromSchema } from "./dryRun";

const DEFAULT_PROVIDER = "openai";

function resolveRetryOptions(env: Record<string, string | undefined>): RetryOptions {
  return {
    maxRetries: Number(env.LLM_MAX_RETRIES ?? 2),
    baseDelayMs: Number(env.LLM_RETRY_BASE_MS ?? 500),
    maxDelayMs: Number(env.LLM_RETRY_MAX_MS ?? 4000),
  };
}

function shouldRedact(args: GenerateJsonArgs<unknown>, env: Record<string, string | undefined>) {
  if (typeof args.redact === "boolean") return args.redact;
  return env.LLM_REDACT === "1" || env.LLM_REDACT === "true";
}

function isDryRun(args: GenerateJsonArgs<unknown>, env: Record<string, string | undefined>) {
  if (typeof args.dryRun === "boolean") return args.dryRun;
  return env.LLM_DRY_RUN === "1" || env.LLM_DRY_RUN === "true";
}

function createDryRunProvider(name: string): LLMProvider {
  return {
    name: `${name}-dry-run`,
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      const stub = createStubFromSchema(args.schema);
      const parsed = args.schema.safeParse(stub);
      if (!parsed.success) {
        throw new LLMConfigError("Dry-run stub did not satisfy schema.");
      }

      return {
        data: parsed.data,
        provider: `${name}-dry-run`,
        model: args.model,
        raw: { stub: true },
      };
    },
  };
}

function applyRedaction<T>(args: GenerateJsonArgs<T>) {
  const system = args.system ? redactText(args.system) : undefined;
  const prompt = redactText(args.prompt);

  return {
    ...args,
    system,
    prompt,
    schema: args.schema,
    redact: args.redact,
  } as GenerateJsonArgs<T>;
}

export function providerFactory(
  providerName?: string,
  options: ProviderFactoryOptions = {}
): LLMProvider {
  const env = options.env ?? process.env;
  const resolvedName = providerName ?? env.LLM_PROVIDER_DEFAULT ?? DEFAULT_PROVIDER;
  const createProvider = providerRegistry[resolvedName];

  if (!createProvider) {
    throw new LLMConfigError(
      `Unknown LLM provider \"${resolvedName}\". Configure LLM_PROVIDER_DEFAULT or pass provider explicitly.`
    );
  }

  const baseProvider = createProvider(env);
  const retryOptions = resolveRetryOptions(env);

  return {
    name: baseProvider.name,
    async generateJson<T>(args: GenerateJsonArgs<T>): Promise<GenerateJsonResult<T>> {
      if (isDryRun(args, env)) {
        return createDryRunProvider(baseProvider.name).generateJson(args);
      }

      const nextArgs = shouldRedact(args, env) ? applyRedaction(args) : args;

      return withRetries(() => baseProvider.generateJson(nextArgs), retryOptions);
    },
  };
}

export async function generateJson<T>(args: GenerateJsonArgs<T>, options: ProviderFactoryOptions = {}) {
  const provider = providerFactory(args.provider, options);
  const sanitized = shouldRedact(args, options.env ?? process.env)
    ? applyRedaction(args)
    : args;

  const response = await provider.generateJson(sanitized);
  return {
    ...response,
    data: response.data,
    provider: response.provider ?? provider.name,
    raw: response.raw ?? redactSensitive(response.raw ?? null),
  } as GenerateJsonResult<T>;
}
