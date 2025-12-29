import type { NormalizedComment, NormalizedThread } from "@maverick/shared";
import { createSupabaseAdminClient } from "./index";

type SaveThreadOptions = {
  ingestedByUserId?: string | null;
  fetchedAt?: Date | string | number | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toTimestamp(value: Date | string | number | null | undefined) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function toUtcTimestamp(seconds: number | null) {
  if (seconds == null) return null;
  return new Date(seconds * 1000).toISOString();
}

function normalizeIngestedBy(userId?: string | null) {
  if (!userId) return null;
  return UUID_REGEX.test(userId) ? userId : null;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function saveThreadWithComments(
  thread: NormalizedThread,
  comments: NormalizedComment[],
  options: SaveThreadOptions = {}
) {
  if (!thread.subreddit) {
    throw new Error("Missing subreddit on normalized thread");
  }

  const supabase = createSupabaseAdminClient();
  const fetchedAt = toTimestamp(options.fetchedAt ?? new Date());
  const ingestedBy = normalizeIngestedBy(options.ingestedByUserId);

  const { data: subreddit, error: subredditError } = await supabase
    .from("subreddit")
    .upsert({ name: thread.subreddit }, { onConflict: "name" })
    .select("id")
    .single();

  if (subredditError) {
    throw subredditError;
  }

  const { data: savedThread, error: threadError } = await supabase
    .from("thread")
    .upsert(
      {
        subreddit_id: subreddit.id,
        reddit_id: thread.reddit_id,
        title: thread.title,
        author: thread.author,
        url: thread.url,
        score: thread.score,
        num_comments: thread.num_comments,
        created_utc: toUtcTimestamp(thread.created_utc),
        raw_json: thread.raw_json,
        fetched_at: fetchedAt,
        ingested_by_user_id: ingestedBy,
      },
      { onConflict: "reddit_id" }
    )
    .select("id")
    .single();

  if (threadError) {
    throw threadError;
  }

  const rows = comments.map((comment) => ({
    thread_id: savedThread.id,
    reddit_id: comment.reddit_id,
    parent_reddit_id: comment.parent_reddit_id,
    author: comment.author,
    body: comment.body,
    score: comment.score,
    created_utc: toUtcTimestamp(comment.created_utc),
    raw_json: comment.raw_json,
    depth: comment.depth ?? 0,
    fetched_at: fetchedAt,
    ingested_by_user_id: ingestedBy,
  }));

  const chunks = chunkArray(rows, 500);
  for (const chunk of chunks) {
    const { error } = await supabase
      .from("comment")
      .upsert(chunk, { onConflict: "reddit_id" });

    if (error) {
      throw error;
    }
  }

  return {
    threadId: savedThread.id,
    commentCount: rows.length,
  };
}
