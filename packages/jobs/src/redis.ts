export type RedisConnectionOptions = {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  tls?: Record<string, unknown> | null;
};

type Env = Record<string, string | undefined>;

export function getBullmqPrefix(env: Env = process.env) {
  return env.BULLMQ_PREFIX ?? "reddit-radar";
}

export function getRedisConnectionOptions(
  env: Env = process.env
): RedisConnectionOptions {
  const url = env.REDIS_URL;
  if (url) {
    return { url };
  }

  const host = env.REDIS_HOST;
  const port = env.REDIS_PORT ? Number(env.REDIS_PORT) : undefined;
  const password = env.REDIS_PASSWORD;
  const tls = env.REDIS_TLS === "true" ? {} : null;

  return { host, port, password, tls };
}
