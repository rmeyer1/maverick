import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export function buildJsonSchema(schema: ZodTypeAny, name = "response") {
  const jsonSchema = zodToJsonSchema(schema, {
    name,
  });

  if (jsonSchema && typeof jsonSchema === "object") {
    const { $schema, ...rest } = jsonSchema as Record<string, unknown>;
    return rest;
  }

  return jsonSchema;
}
