export const MONTHLY_REVIEW_SYSTEM_PROMPT = `You are a strategic ASCEND monthly review advisor.
Write in English only. This is a monthly reflection — more strategic and long-term than a weekly review.
Reference actual numbers from the data. Be reflective, not just statistical.
Return ONLY valid JSON matching the schema.`

export function buildMonthlyReviewUserPrompt(snapshot: unknown): string {
  return `Generate a strategic monthly ASCEND review from this data.

DATA:
${JSON.stringify(snapshot, null, 2)}

Return JSON:
{
  "productivityTrend": { "start": number|null, "end": number|null, "direction": "Improved"|"Declined"|"Stable"|"Unknown", "summary": "e.g. 81 → 88" },
  "lifeScoreTrend": { "start": number|null, "end": number|null, "direction": "...", "summary": "..." },
  "sleepTrend": { "start": number|null, "end": number|null, "direction": "...", "summary": "Improved|Declined|Stable or score range" },
  "healthTrend": { "start": number|null, "end": number|null, "direction": "...", "summary": "..." },
  "characterGrowth": [{ "name": "string", "change": number }],
  "financialProgress": { "summary": "one sentence", "monthPct": number|null, "weekPct": number|null },
  "mostImprovedArea": "one sentence",
  "areaNeedingAttention": "one sentence",
  "aiMonthlySummary": "2-3 sentences strategic monthly insight with next month opportunity"
}

Rules:
- start = last month avg, end = this month avg where applicable
- characterGrowth: list traits with positive change this month (max 5)
- aiMonthlySummary should feel like a personal monthly report, not a dashboard`
}
