import type { BusinessIdea } from '@/types'

export const BUSINESS_SYSTEM_PROMPT = `You are an experienced startup advisor and venture analyst.
Evaluate business ideas with honest, specific feedback in English only.
No fluff. No generic advice like "invest time in X". Give concrete next steps.
Return ONLY valid JSON matching the requested schema.`

export function buildBusinessUserPrompt(idea: BusinessIdea): string {
  return `Analyze this specific business idea like a startup advisor. Your analysis MUST be unique to this idea — reference the title, category, and description directly. Do not give generic advice that could apply to any startup.

IDEA:
Title: ${idea.title}
Category: ${idea.category}
Status: ${idea.status}
Description: ${idea.description || '(none)'}
Notes: ${idea.notes || '(none)'}

Return JSON with this exact structure:
{
  "overallScore": number 0-100,
  "marketPotential": { "score": number 1-10, "explanation": "string" },
  "monetization": {
    "score": number 1-10,
    "models": ["Subscription"|"One-time payment"|"Agency"|"Consulting"|"Affiliate"|"Marketplace"],
    "explanation": "string"
  },
  "difficulty": {
    "score": number 1-10,
    "technicalExplanation": "string",
    "operationalExplanation": "string"
  },
  "competition": { "level": "Low"|"Medium"|"High", "explanation": "string" },
  "timeToMvp": { "estimate": "Very Fast"|"Fast"|"Medium"|"Long", "explanation": "string" },
  "biggestRisk": {
    "type": "Market risk"|"Distribution risk"|"Execution risk"|"Technical risk",
    "explanation": "string"
  },
  "nextStep": "one specific action",
  "mvpRoadmap": ["step 1", "step 2", "step 3", "step 4", "step 5"]
}

Rules:
- mvpRoadmap must have exactly 5 actionable steps
- models: 1-3 items from the allowed list
- Be critical but constructive; score honestly based on idea clarity and market fit`
}
