export type NormalizedThread = {
  reddit_id: string;
  subreddit: string | null;
  title: string | null;
  author: string | null;
  created_utc: number | null;
  url: string | null;
  permalink: string | null;
  score: number | null;
  num_comments: number | null;
  raw_json: unknown;
};

export type NormalizedComment = {
  reddit_id: string;
  parent_reddit_id: string | null;
  depth: number;
  score: number | null;
  author: string | null;
  created_utc: number | null;
  body: string | null;
  raw_json: unknown;
};

export type NormalizedThreadResult = {
  thread: NormalizedThread;
  comments: NormalizedComment[];
};

export function normalizeRedditThread(raw: unknown): NormalizedThreadResult {
  if (!Array.isArray(raw) || raw.length < 2) {
    throw new Error("Invalid Reddit JSON: expected listing array");
  }

  const postListing = raw[0] as any;
  const post = postListing?.data?.children?.[0]?.data;
  if (!post) {
    throw new Error("Invalid Reddit JSON: missing post data");
  }

  const thread: NormalizedThread = {
    reddit_id: post.name ?? post.id ?? "",
    subreddit: post.subreddit ?? null,
    title: post.title ?? null,
    author: post.author ?? null,
    created_utc: typeof post.created_utc === "number" ? post.created_utc : null,
    url: post.url ?? null,
    permalink: post.permalink ?? null,
    score: typeof post.score === "number" ? post.score : null,
    num_comments: typeof post.num_comments === "number" ? post.num_comments : null,
    raw_json: post,
  };

  const commentListing = raw[1] as any;
  const children = commentListing?.data?.children ?? [];
  const comments: NormalizedComment[] = [];

  for (const child of children) {
    collectComments(child, comments);
  }

  return { thread, comments };
}

function collectComments(node: any, output: NormalizedComment[]) {
  if (!node || node.kind !== "t1") {
    return;
  }

  const data = node.data ?? {};
  const body = typeof data.body === "string" ? data.body : null;
  const isRemoved = body === "[deleted]" || body === "[removed]";

  output.push({
    reddit_id: data.name ?? data.id ?? "",
    parent_reddit_id: data.parent_id ?? null,
    depth: typeof data.depth === "number" ? data.depth : 0,
    score: typeof data.score === "number" ? data.score : null,
    author: data.author ?? null,
    created_utc: typeof data.created_utc === "number" ? data.created_utc : null,
    body: isRemoved ? null : body,
    raw_json: data,
  });

  const replies = data.replies;
  const replyChildren = replies?.data?.children ?? [];
  for (const reply of replyChildren) {
    collectComments(reply, output);
  }
}
