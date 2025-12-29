export function logWorkerReady() {
  console.log("Worker ready. Waiting for jobs...");
}

export {
  normalizeRedditThread,
  type NormalizedThread,
  type NormalizedComment,
  type NormalizedThreadResult,
} from "./reddit";

export {
  extractionSchemaVersion,
  extractionPromptVersion,
  extractionSchemaV1,
  type ExtractionV1,
  validateExtractionV1,
} from "./extractionSchema";
