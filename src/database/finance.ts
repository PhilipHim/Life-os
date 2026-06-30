import type { Asset } from '@/types'

const STORAGE_KEY = 'life_os_stocks'
const WATCHLIST_KEY = 'life_os_watchlist'

function hashSymbol(symbol: string): number {
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getMockPrice(symbol: string, date?: Date): number {
  const base = hashSymbol(symbol.toUpperCase())
  const normalized = (base % 1000) / 1000
  const basePrice = Math.round((5 + normalized * 495) * 100) / 100
  const d = date ?? new Date()
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
  const variation = Math.sin((base + dayOfYear) * 0.7) * 0.05
  return Math.round(basePrice * (1 + variation) * 100) / 100
}

export function generatePriceHistory(symbol: string, days: number = 7): number[] {
  const today = new Date()
  const history: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    history.push(getMockPrice(symbol, d))
  }
  return history
}

export function getPastPrice(symbol: string, daysAgo: number): number {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return getMockPrice(symbol, d)
}

export type AssetKind = 'stock' | 'etf' | 'index' | 'crypto'

export interface SearchEntry {
  symbol: string
  name: string
  kind: AssetKind
}

const POPULAR_STOCKS: SearchEntry[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', kind: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', kind: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', kind: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', kind: 'stock' },
  { symbol: 'META', name: 'Meta Platforms Inc.', kind: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', kind: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', kind: 'stock' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', kind: 'stock' },
  { symbol: 'V', name: 'Visa Inc.', kind: 'stock' },
  { symbol: 'WMT', name: 'Walmart Inc.', kind: 'stock' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', kind: 'stock' },
  { symbol: 'MA', name: 'Mastercard Inc.', kind: 'stock' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', kind: 'stock' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', kind: 'stock' },
  { symbol: 'HD', name: 'The Home Depot Inc.', kind: 'stock' },
  { symbol: 'BAC', name: 'Bank of America Corp.', kind: 'stock' },
  { symbol: 'DIS', name: 'The Walt Disney Co.', kind: 'stock' },
  { symbol: 'ADBE', name: 'Adobe Inc.', kind: 'stock' },
  { symbol: 'NFLX', name: 'Netflix Inc.', kind: 'stock' },
  { symbol: 'CRM', name: 'Salesforce Inc.', kind: 'stock' },
  { symbol: 'INTC', name: 'Intel Corp.', kind: 'stock' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', kind: 'stock' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', kind: 'stock' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', kind: 'stock' },
  { symbol: 'SQ', name: 'Block Inc.', kind: 'stock' },
  { symbol: 'SNAP', name: 'Snap Inc.', kind: 'stock' },
  { symbol: 'PINS', name: 'Pinterest Inc.', kind: 'stock' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.', kind: 'stock' },
  { symbol: 'SHOP', name: 'Shopify Inc.', kind: 'stock' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', kind: 'stock' },

  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', kind: 'etf' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', kind: 'etf' },
  { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', kind: 'etf' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (NASDAQ)', kind: 'etf' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial ETF', kind: 'etf' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', kind: 'etf' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', kind: 'etf' },
  { symbol: 'URTH', name: 'iShares MSCI World ETF', kind: 'etf' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', kind: 'etf' },
  { symbol: 'SLV', name: 'iShares Silver Trust', kind: 'etf' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', kind: 'etf' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', kind: 'etf' },
  { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ (3x NASDAQ)', kind: 'etf' },
  { symbol: 'SOXX', name: 'iShares Semiconductor ETF', kind: 'etf' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR', kind: 'etf' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR', kind: 'etf' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR', kind: 'etf' },
  { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', kind: 'etf' },
  { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', kind: 'etf' },
  { symbol: 'EWU', name: 'iShares MSCI United Kingdom ETF', kind: 'etf' },

  { symbol: 'BTC-USD', name: 'Bitcoin USD', kind: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', kind: 'crypto' },
  { symbol: 'SOL-USD', name: 'Solana USD', kind: 'crypto' },
  { symbol: 'XRP-USD', name: 'Ripple USD', kind: 'crypto' },
  { symbol: 'DOGE-USD', name: 'Dogecoin USD', kind: 'crypto' },
  { symbol: 'ADA-USD', name: 'Cardano USD', kind: 'crypto' },
  { symbol: 'DOT-USD', name: 'Polkadot USD', kind: 'crypto' },
  { symbol: 'LINK-USD', name: 'Chainlink USD', kind: 'crypto' },
  { symbol: 'AVAX-USD', name: 'Avalanche USD', kind: 'crypto' },
  { symbol: 'MATIC-USD', name: 'Polygon USD', kind: 'crypto' },
]

const COMMON_ALIASES: Record<string, Omit<SearchEntry, 'kind'>> = {
  'S&P 500': { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  'S&P': { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  'SP 500': { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  'STANDARD AND POORS': { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  'NASDAQ': { symbol: 'QQQ', name: 'Invesco QQQ Trust (NASDAQ)' },
  'DOW JONES': { symbol: 'DIA', name: 'SPDR Dow Jones Industrial ETF' },
  'DOW': { symbol: 'DIA', name: 'SPDR Dow Jones Industrial ETF' },
  'RUSSELL 2000': { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  'RUSSELL': { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  'MSCI WORLD': { symbol: 'URTH', name: 'iShares MSCI World ETF' },
  'WORLD INDEX': { symbol: 'URTH', name: 'iShares MSCI World ETF' },
  'GOLD': { symbol: 'GLD', name: 'SPDR Gold Shares' },
  'SILVER': { symbol: 'SLV', name: 'iShares Silver Trust' },
  'BITCOIN': { symbol: 'BTC-USD', name: 'Bitcoin USD' },
  'ETHEREUM': { symbol: 'ETH-USD', name: 'Ethereum USD' },
  'SOLANA': { symbol: 'SOL-USD', name: 'Solana USD' },
  'XRP': { symbol: 'XRP-USD', name: 'Ripple USD' },
  'DOGECOIN': { symbol: 'DOGE-USD', name: 'Dogecoin USD' },
  'CARDANO': { symbol: 'ADA-USD', name: 'Cardano USD' },
  'POLKADOT': { symbol: 'DOT-USD', name: 'Polkadot USD' },
  'CHAINLINK': { symbol: 'LINK-USD', name: 'Chainlink USD' },
  'AVALANCHE': { symbol: 'AVAX-USD', name: 'Avalanche USD' },
  'POLYGON': { symbol: 'MATIC-USD', name: 'Polygon USD' },
  'CRYPTO': { symbol: 'BTC-USD', name: 'Bitcoin USD' },
  'SEMICONDUCTOR': { symbol: 'SOXX', name: 'iShares Semiconductor ETF' },
  'BOND': { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
  'TREASURY': { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
}

export function resolveSymbol(input: string): { symbol: string; name: string } | null {
  const q = input.toUpperCase().trim()
  if (!q) return null
  const direct = POPULAR_STOCKS.find(
    (s) => s.symbol.toUpperCase() === q || s.name.toUpperCase() === q
  )
  if (direct) return { symbol: direct.symbol, name: direct.name }
  for (const [alias, entry] of Object.entries(COMMON_ALIASES)) {
    if (q.includes(alias) || alias.includes(q)) {
      return entry
    }
  }
  return null
}

export function searchStocks(query: string): { symbol: string; name: string; kind: AssetKind }[] {
  const q = query.toUpperCase().trim()
  if (!q) return []

  const seen = new Set<string>()
  const results: { symbol: string; name: string; kind: AssetKind }[] = []

  const add = (entry: { symbol: string; name: string; kind: AssetKind }) => {
    if (!seen.has(entry.symbol) && results.length < 8) {
      seen.add(entry.symbol)
      results.push(entry)
    }
  }

  for (const s of POPULAR_STOCKS) {
    if (s.symbol.includes(q) || s.name.toUpperCase().includes(q)) {
      add(s)
    }
  }

  for (const [alias, entry] of Object.entries(COMMON_ALIASES)) {
    if (q.includes(alias) || alias.includes(q)) {
      const match = POPULAR_STOCKS.find((s) => s.symbol === entry.symbol)
      if (match) add(match)
    }
  }

  return results.slice(0, 8)
}

export function getAssets(): Asset[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Asset[]
  } catch {
    return []
  }
}

function saveAssets(assets: Asset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets))
}

function buildStock(symbol: string, name: string): Asset {
  const price = getMockPrice(symbol)
  const history = generatePriceHistory(symbol)
  return {
    id: crypto.randomUUID(),
    symbol,
    name,
    price,
    previousPrice: history.length > 1 ? history[history.length - 2] : price,
    weekPrice: getPastPrice(symbol, 7),
    monthPrice: getPastPrice(symbol, 30),
    priceHistory: history,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function saveToKey(key: string, assets: Asset[]): void {
  localStorage.setItem(key, JSON.stringify(assets))
}

function getFromKey(key: string): Asset[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try { return JSON.parse(raw) as Asset[] } catch { return [] }
}

export function addStock(symbol: string, name: string): Asset[] {
  const assets = getAssets()
  if (assets.some((a) => a.symbol === symbol)) return assets
  assets.push(buildStock(symbol, name))
  saveAssets(assets)
  return getAssets()
}

export function addWatchlistStock(symbol: string, name: string): Asset[] {
  const assets = getFromKey(WATCHLIST_KEY)
  if (assets.some((a) => a.symbol === symbol)) return assets
  assets.push(buildStock(symbol, name))
  saveToKey(WATCHLIST_KEY, assets)
  return getFromKey(WATCHLIST_KEY)
}

export function getWatchlistAssets(): Asset[] {
  return getFromKey(WATCHLIST_KEY)
}

export function deleteWatchlistAsset(id: string): Asset[] {
  const assets = getFromKey(WATCHLIST_KEY).filter((a) => a.id !== id)
  saveToKey(WATCHLIST_KEY, assets)
  return getFromKey(WATCHLIST_KEY)
}

export function deleteAsset(id: string): Asset[] {
  saveAssets(getAssets().filter((a) => a.id !== id))
  return getAssets()
}

function refreshList(key: string): Asset[] {
  const assets = getFromKey(key).map((a) => {
    const prevPrice = a.price
    const history = [...a.priceHistory.slice(1), prevPrice]
    const newPrice = getMockPrice(a.symbol)
    return {
      ...a,
      previousPrice: prevPrice,
      price: newPrice,
      weekPrice: getPastPrice(a.symbol, 7),
      monthPrice: getPastPrice(a.symbol, 30),
      priceHistory: history,
      updatedAt: Date.now(),
    }
  })
  saveToKey(key, assets)
  return getFromKey(key)
}

export function refreshStockPrices(): Asset[] {
  return refreshList(STORAGE_KEY)
}

export function refreshWatchlistPrices(): Asset[] {
  return refreshList(WATCHLIST_KEY)
}

export interface StockPerformance {
  dailyChangePct: number
  weekChangePct: number
  monthChangePct: number
}

export function computeStockPerformance(asset: Asset): StockPerformance {
  const dailyChangePct = asset.previousPrice > 0
    ? Math.round(((asset.price - asset.previousPrice) / asset.previousPrice) * 10000) / 100
    : 0
  const weekChangePct = asset.weekPrice > 0
    ? Math.round(((asset.price - asset.weekPrice) / asset.weekPrice) * 10000) / 100
    : 0
  const monthChangePct = asset.monthPrice > 0
    ? Math.round(((asset.price - asset.monthPrice) / asset.monthPrice) * 10000) / 100
    : 0
  return { dailyChangePct, weekChangePct, monthChangePct }
}

export interface AggregatedPerformance {
  dailyChangePct: number
  weekChangePct: number
  monthChangePct: number
  stockCount: number
}

export function computeAggregatedPerformance(assets: Asset[]): AggregatedPerformance {
  if (assets.length === 0) {
    return { dailyChangePct: 0, weekChangePct: 0, monthChangePct: 0, stockCount: 0 }
  }

  const perf = assets.map(computeStockPerformance)
  const avg = (field: keyof StockPerformance) =>
    Math.round((perf.reduce((sum, p) => sum + p[field], 0) / perf.length) * 100) / 100

  return {
    dailyChangePct: avg('dailyChangePct'),
    weekChangePct: avg('weekChangePct'),
    monthChangePct: avg('monthChangePct'),
    stockCount: assets.length,
  }
}

export function computePortfolioChange(assets: Asset[]): {
  totalChangePercent: number
} {
  let totalPrice = 0
  let totalPrev = 0
  for (const a of assets) {
    totalPrice += a.price
    totalPrev += a.previousPrice
  }
  const totalChangePercent = totalPrev > 0
    ? Math.round(((totalPrice - totalPrev) / totalPrev) * 100 * 100) / 100
    : 0
  return { totalChangePercent }
}
