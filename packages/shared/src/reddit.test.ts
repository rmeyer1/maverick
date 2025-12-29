import { describe, expect, it } from "vitest";
import { normalizeRedditThread } from "./reddit";
import fixture from "../tests/fixtures/reddit-thread.json";

describe("normalizeRedditThread", () => {
  it("normalizes thread and nested comments", () => {
    const result = normalizeRedditThread(fixture as unknown);

    expect(result.thread.reddit_id).toBe("t3_abc123");
    expect(result.thread.subreddit).toBe("test");
    expect(result.comments).toHaveLength(3);

    const [first, second, third] = result.comments;
    expect(first.reddit_id).toBe("t1_c1");
    expect(first.depth).toBe(0);
    expect(second.reddit_id).toBe("t1_c2");
    expect(second.depth).toBe(1);
    expect(third.reddit_id).toBe("t1_c3");
    expect(third.body).toBeNull();
  });
});
