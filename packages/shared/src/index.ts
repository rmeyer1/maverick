export function logWorkerReady() {
  console.log("Worker ready. Waiting for jobs...");
}

export {
  normalizeRedditThread,
  type NormalizedThread,
  type NormalizedComment,
  type NormalizedThreadResult,
} from "./reddit";
