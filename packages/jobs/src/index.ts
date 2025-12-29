export const queueNames = {
  ingest: "ingest",
  extract: "extract",
  aggregate: "aggregate"
};

export { getBullmqPrefix, getRedisConnectionOptions } from "./redis";
