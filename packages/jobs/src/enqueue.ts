import { Queue, type JobsOptions } from "bullmq";
import { getBullmqPrefix, getRedisConnectionOptions } from "./redis";
import { queueNames } from "./queueNames";
import {
  jobNames,
  parseAggregateTrendsPayload,
  parseExtractThreadPayload,
  parseIngestThreadPayload,
  type AggregateTrendsPayload,
  type ExtractThreadPayload,
  type IngestThreadPayload,
} from "./types";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

async function addJob<TPayload>(
  queueName: string,
  jobName: string,
  payload: TPayload,
  options?: JobsOptions
) {
  const queue = new Queue(queueName, {
    connection: getRedisConnectionOptions(),
    prefix: getBullmqPrefix(),
    defaultJobOptions,
  });

  try {
    return await queue.add(jobName, payload, options ?? defaultJobOptions);
  } finally {
    await queue.close();
  }
}

export async function enqueueIngestThread(payload: IngestThreadPayload) {
  const validated = parseIngestThreadPayload(payload);
  return addJob(queueNames.ingest, jobNames.ingestThread, validated);
}

export async function enqueueExtractThread(payload: ExtractThreadPayload) {
  const validated = parseExtractThreadPayload(payload);
  return addJob(queueNames.extract, jobNames.extractThread, validated);
}

export async function enqueueAggregateTrends(payload: AggregateTrendsPayload) {
  const validated = parseAggregateTrendsPayload(payload);
  return addJob(queueNames.aggregate, jobNames.aggregateTrends, validated);
}
