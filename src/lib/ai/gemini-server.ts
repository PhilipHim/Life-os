import { GoogleGenerativeAI } from '@google/generative-ai'

const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
]

export function getGeminiApiKey(): string | null {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GEMINI_API_KEY ??
    null
  )
}

export function getGeminiModelCandidates(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim()
  const models = preferred ? [preferred, ...DEFAULT_MODELS] : DEFAULT_MODELS
  return [...new Set(models.filter(Boolean))]
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() != null
}

export interface GeminiResult<T> {
  data: T
  model: string
}

export async function generateGeminiJSON<T>(
  systemInstruction: string,
  userPrompt: string
): Promise<GeminiResult<T>> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const models = getGeminiModelCandidates()
  let lastError = 'All Gemini models failed'

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      })

      const result = await model.generateContent(userPrompt)
      const text = result.response.text()
      if (!text) throw new Error('Empty response from Gemini')

      try {
        return { data: JSON.parse(text) as T, model: modelName }
      } catch {
        throw new Error('Gemini returned invalid JSON')
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      const isRetryable =
        lastError.includes('429') ||
        lastError.includes('404') ||
        lastError.includes('not found') ||
        lastError.includes('quota')
      if (!isRetryable && models.indexOf(modelName) === 0) {
        throw new Error(lastError)
      }
    }
  }

  throw new Error(lastError)
}
