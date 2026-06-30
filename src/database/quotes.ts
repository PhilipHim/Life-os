import type { Quote } from '@/types'

const STORAGE_KEY = 'life_os_quotes'

export function getQuotes(): Quote[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Quote[]
  } catch {
    return []
  }
}

function saveQuotes(quotes: Quote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
}

export function saveQuote(quote: Quote): Quote[] {
  const quotes = getQuotes()
  const idx = quotes.findIndex((q) => q.id === quote.id)
  if (idx >= 0) {
    quotes[idx] = quote
  } else {
    quotes.push(quote)
  }
  saveQuotes(quotes)
  return getQuotes()
}

export function deleteQuote(id: string): Quote[] {
  saveQuotes(getQuotes().filter((q) => q.id !== id))
  return getQuotes()
}
