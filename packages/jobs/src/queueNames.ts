export const queueNames = {
  ingest: "ingest",
  extract: "extract",
  aggregate: "aggregate",
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];
