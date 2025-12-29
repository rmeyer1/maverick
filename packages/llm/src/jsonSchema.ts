import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export function buildJsonSchema(schema: ZodTypeAny, name = "response") {
  const jsonSchema = zodToJsonSchema(schema, {
    name,
    $refStrategy: "none",
  });

  if (jsonSchema && typeof jsonSchema === "object") {
    const { $schema, ...rest } = jsonSchema as Record<string, unknown>;
    if ("type" in rest) {
      return rest;
    }
    const definitions = rest.definitions as Record<string, any> | undefined;
    if (definitions && definitions[name]) {
      return definitions[name];
    }
    if (definitions) {
      const first = Object.values(definitions)[0];
      if (first) {
        return first;
      }
    }
    return rest;
  }

  return jsonSchema;
}
