import { z } from "zod";

export const extractionSchemaVersion = "v1" as const;
export const extractionPromptVersion = "v1" as const;

export const extractionSchemaV1 = z.object({
  summary: z.string(),
  pain_points: z.array(
    z.object({
      problem: z.string(),
      evidence: z.array(z.string()),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  buying_intent: z.object({
    level: z.enum(["none", "low", "medium", "high"]),
    signals: z.array(z.string()),
    budget: z.string().nullable().optional(),
    timeline: z.string().nullable().optional(),
  }),
  requested_solutions: z.array(z.string()),
  entities: z.object({
    companies: z.array(z.string()),
    products: z.array(z.string()),
    competitors: z.array(z.string()),
  }),
  market_tags: z.array(z.string()),
});

export type ExtractionV1 = z.infer<typeof extractionSchemaV1>;

export function validateExtractionV1(payload: unknown): ExtractionV1 {
  const parsed = extractionSchemaV1.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Extraction output invalid: ${parsed.error.message}`);
  }
  return parsed.data;
}
