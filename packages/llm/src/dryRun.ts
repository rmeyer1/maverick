import type { ZodTypeAny } from "zod";

export function createStubFromSchema(schema: ZodTypeAny): unknown {
  const def = schema._def as { typeName?: string; [key: string]: any };
  switch (def.typeName) {
    case "ZodString":
      return "example";
    case "ZodNumber":
      return 0;
    case "ZodBoolean":
      return false;
    case "ZodDate":
      return new Date().toISOString();
    case "ZodEnum":
      return def.values?.[0];
    case "ZodLiteral":
      return def.value;
    case "ZodArray":
      return [createStubFromSchema(def.type)];
    case "ZodObject": {
      const shape = def.shape();
      const output: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(shape)) {
        output[key] = createStubFromSchema(value as ZodTypeAny);
      }
      return output;
    }
    case "ZodOptional":
      return createStubFromSchema(def.innerType);
    case "ZodNullable":
      return null;
    case "ZodDefault":
      return def.defaultValue();
    case "ZodUnion":
      return createStubFromSchema(def.options?.[0]);
    case "ZodRecord":
      return {};
    case "ZodTuple":
      return (def.items ?? []).map((item: ZodTypeAny) =>
        createStubFromSchema(item)
      );
    default:
      return null;
  }
}
