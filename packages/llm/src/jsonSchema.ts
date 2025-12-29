import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export function buildJsonSchema(schema: ZodTypeAny, name = "response") {
  const jsonSchema = zodToJsonSchema(schema, {
    name,
    $refStrategy: "none",
    target: "openApi3",
  });

  if (jsonSchema && typeof jsonSchema === "object") {
    const { $schema, ...rest } = jsonSchema as Record<string, unknown>;
    const resolved = "type" in rest ? rest : null;
    const definitions = rest.definitions as Record<string, any> | undefined;
    let schemaObject = resolved;
    if (!schemaObject && definitions && definitions[name]) {
      schemaObject = definitions[name];
    }
    if (!schemaObject && definitions) {
      const first = Object.values(definitions)[0];
      if (first) schemaObject = first as Record<string, unknown>;
    }
    if (!schemaObject) {
      schemaObject = rest;
    }

    if (schemaObject && typeof schemaObject === "object") {
      const root = schemaObject as Record<string, unknown>;
      if (root.type === "object" && root.additionalProperties === undefined) {
        root.additionalProperties = false;
      }
      return root;
    }
    return schemaObject;
  }

  return jsonSchema;
}
