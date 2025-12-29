const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SECRET_REGEX = /(api[_-]?key|token|secret|password)\s*[:=]\s*([^\s,;]+)/gi;

const SENSITIVE_KEYS = [
  "email",
  "phone",
  "ssn",
  "password",
  "secret",
  "token",
  "api_key",
  "apikey",
  "key",
];

export function redactText(text: string) {
  return text
    .replace(EMAIL_REGEX, "[REDACTED]")
    .replace(PHONE_REGEX, "[REDACTED]")
    .replace(SECRET_REGEX, (match, key) => `${key}: [REDACTED]`);
}

export function redactSensitive(value: unknown): unknown {
  if (typeof value === "string") {
    return redactText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const redacted: Record<string, unknown> = {};

    for (const [key, entryValue] of entries) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        redacted[key] = "[REDACTED]";
        continue;
      }
      redacted[key] = redactSensitive(entryValue);
    }

    return redacted;
  }

  return value;
}
