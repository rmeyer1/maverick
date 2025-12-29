import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

type JsonSchema = Record<string, any>;

function enforceAdditionalProperties(schema: JsonSchema): JsonSchema {
  if (!schema || typeof schema !== "object") return schema;

  if (schema.type === "object") {
    if (schema.additionalProperties === undefined) {
      schema.additionalProperties = false;
    }
    if (schema.properties) {
      for (const value of Object.values(schema.properties)) {
        enforceAdditionalProperties(value as JsonSchema);
      }
    }
    if (schema.patternProperties) {
      for (const value of Object.values(schema.patternProperties)) {
        enforceAdditionalProperties(value as JsonSchema);
      }
    }
  }

  if (schema.items) {
    enforceAdditionalProperties(schema.items as JsonSchema);
  }

  for (const key of ["oneOf", "anyOf", "allOf", "not"]) {
    const entry = schema[key];
    if (Array.isArray(entry)) {
      entry.forEach((item) => enforceAdditionalProperties(item as JsonSchema));
    } else if (entry && typeof entry === "object") {
      enforceAdditionalProperties(entry as JsonSchema);
    }
  }

  return schema;
}

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
      return enforceAdditionalProperties(schemaObject as JsonSchema);
    }
    return schemaObject;
  }

  return enforceAdditionalProperties(jsonSchema as JsonSchema);
}
