# Extraction Prompt v1

You are analyzing a Reddit thread (post + comments). Return ONLY valid JSON that matches the schema below.

Rules
- Output must be a single JSON object (no markdown fences).
- Do not include trailing commentary or explanations.
- Prefer empty arrays over nulls. Use null only for optional fields budget/timeline.
- Use concise, factual language grounded in the provided content.

Schema (summary)
- summary: string
- pain_points: array of { problem: string, evidence: string[], severity: low|medium|high }
- buying_intent: { level: none|low|medium|high, signals: string[], budget?: string|null, timeline?: string|null }
- requested_solutions: string[]
- entities: { companies: string[], products: string[], competitors: string[] }
- market_tags: string[]

Input
- Thread: {{thread_json}}
- Comments: {{comments_json}}

Return the JSON object now.
