import { z } from "zod";

export const jobNames = {
  ingestThread: "INGEST_THREAD",
  extractThread: "EXTRACT_THREAD",
  aggregateTrends: "AGGREGATE_DAILY",
} as const;

export type JobName = (typeof jobNames)[keyof typeof jobNames];

export const ingestThreadSchema = z.object({
  threadUrl: z.string().url(),
  requestedBy: z.string().optional(),
});

export type IngestThreadPayload = z.infer<typeof ingestThreadSchema>;

export const extractThreadSchema = z.object({
  threadId: z.string().uuid(),
  provider: z.string().optional(),
  model: z.string().optional(),
  promptVersion: z.string().optional(),
});

export type ExtractThreadPayload = z.infer<typeof extractThreadSchema>;

export const aggregateTrendsSchema = z.object({
  windowDays: z.number().int().positive().optional(),
  triggeredBy: z.string().optional(),
});

export type AggregateTrendsPayload = z.infer<typeof aggregateTrendsSchema>;

export function parseIngestThreadPayload(payload: unknown) {
  return ingestThreadSchema.parse(payload);
}

export function parseExtractThreadPayload(payload: unknown) {
  return extractThreadSchema.parse(payload);
}

export function parseAggregateTrendsPayload(payload: unknown) {
  return aggregateTrendsSchema.parse(payload);
}
