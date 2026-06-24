'use client'

import { useState, useEffect, useMemo } from 'react'
import type { JournalEntry, SleepEntry, HealthEntry, HealthEvent, Asset, BusinessIdea, Quote, CharacterArea } from '@/lib/types'
import { getJournalEntries, saveJournalEntry } from '@/lib/db/journal'
import { getSleepEntries, saveSleepEntry, calculateSleepScore, getSleepRating } from '@/lib/db/sleep'
import { calculateWakeOptions, formatDuration } from '@/lib/sleep-optimizer'
import type { WakeTimeResult } from '@/lib/sleep-optimizer'
import { getSleepPlanByDate, saveSleepPlan, deleteSleepPlan } from '@/lib/db/sleep-planner'
import type { SleepPlan } from '@/lib/db/sleep-planner'
import { getHealthEntries, saveHealthEntry } from '@/lib/db/health'
import { getHealthEvents, saveHealthEvent, deleteHealthEvent, computeHealthStatus, daysBetween } from '@/lib/db/health-illness'
import { computeHealthScore, getHealthRating } from '@/lib/health-score'
import { getAssets, addStock, deleteAsset, computeAggregatedPerformance, computeStockPerformance, getMockPrice, searchStocks, addWatchlistStock, getWatchlistAssets, deleteWatchlistAsset } from '@/lib/db/finance'
import { getBusinessIdeas, saveBusinessIdea, deleteBusinessIdea, IDEA_CATEGORIES } from '@/lib/db/business-ideas'
import { analyzeAndSaveIdeaAsync, computeBusinessIdeasStats } from '@/lib/business-coach'
import BusinessIdeasDashboard from '@/components/business/BusinessIdeasDashboard'
import BusinessIdeaAnalysisPanel from '@/components/business/BusinessIdeaAnalysisPanel'
import ConvertAnalysisToProjectModal from '@/components/business/ConvertAnalysisToProjectModal'
import { getQuotes, saveQuote, deleteQuote } from '@/lib/db/quotes'
import { getCharacterAreas, getAllCharacterAreas, setCharacterLevel, updateCharacterArea, deleteCharacterArea, restoreCharacterArea, permanentDeleteCharacterArea, saveCharacterArea } from '@/lib/db/character'
import Card from '@/components/ui/Card'
import ConvertIdeaToWorkModal from '@/components/ConvertIdeaToWorkModal'

type Tab = 'journal' | 'sleep' | 'health' | 'finance' | 'ideas' | 'quotes' | 'character'

const TABS: { id: Tab; label: string }[] = [
  { id: 'journal', label: 'Journal' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'health', label: 'Health' },
  { id: 'finance', label: 'Finance' },
  { id: 'ideas', label: 'Business Ideas' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'character', label: 'Character' },
]

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function blankJournal(date: string): JournalEntry {
  return {
    id: crypto.randomUUID(), date, mood: 5, energy: 5,
    gratitude: '', intentions: '', affirmations: '', wins: '',
    lessonsLearned: '', reflection: '', tomorrowFocus: '',
    createdAt: Date.now(), updatedAt: Date.now(),
  }
}

function blankSleep(date: string): SleepEntry {
  return {
    id: crypto.randomUUID(), date, bedtime: '', wakeTime: '',
    totalSleepMinutes: 0, remMinutes: 0, deepMinutes: 0,
    lightMinutes: 0, awakeMinutes: 0, sleepScore: 0,
    createdAt: Date.now(), updatedAt: Date.now(),
  }
}

function blankHealth(date: string): HealthEntry {
  return {
    id: crypto.randomUUID(), date,
    createdAt: Date.now(), updatedAt: Date.now(),
  }
}

function blankAsset(): Asset {
  return {
    id: crypto.randomUUID(), symbol: '', name: '',
    price: 0, previousPrice: 0, weekPrice: 0, monthPrice: 0, priceHistory: [],
    createdAt: Date.now(), updatedAt: Date.now(),
  }
}

function blankQuote(): Quote {
  return {
    id: crypto.randomUUID(), text: '', author: '',
    createdAt: Date.now(), updatedAt: Date.now(),
  }
}

function MoodSlider({
  value, onChange, label,
}: {
  value: number; onChange: (v: number) => void; label: string
}) {
  return (
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 w-6 text-right">1</span>
        <input type="range" min={1} max={10} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 accent-gray-900 cursor-pointer" />
        <span className="text-xs text-gray-400 w-6">10</span>
        <span className="text-lg font-bold text-gray-900 w-6 text-center tabular-nums">{value}</span>
      </div>
    </div>
  )
}

function SectionField({
  label, prompt, value, onChange,
}: {
  label: string; prompt: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-0.5">{label}</p>
      <p className="text-xs text-gray-400 mb-2">{prompt}</p>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4}
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-300 resize-y focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors" />
    </div>
  )
}

export default function LifeOsPage() {
  const [tab, setTab] = useState<Tab>('journal')

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Life</h1>
      <p className="text-sm text-gray-500">Journal, health, sleep, finance, and character development</p>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 px-5 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
              tab === t.id
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'journal' && <JournalSection />}
      {tab === 'sleep' && <SleepSection />}
      {tab === 'health' && <HealthSection />}
      {tab === 'finance' && <FinanceSection />}
      {tab === 'ideas' && <IdeasSection />}
      {tab === 'character' && <CharacterSection />}
      {tab === 'quotes' && <QuotesSection />}
    </div>
  )
}

// ─── Journal ──────────────────────────────────────────

function JournalSection() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [current, setCurrent] = useState<JournalEntry | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const all = getJournalEntries()
    setEntries(all)
    setCurrent(all.find((e) => e.date === today()) ?? blankJournal(today()))
  }, [])

  const history = useMemo(() => [...entries].sort((a, b) => (a.date > b.date ? -1 : 1)), [entries])

  const handleSave = () => {
    if (!current) return
    const updated = { ...current, updatedAt: Date.now() }
    setEntries(saveJournalEntry(updated))
    setCurrent(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!current) return null

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-gray-900">Morning Check-In</p>
            <p className="text-xs text-gray-400">{formatDate(today())}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex gap-6">
            <MoodSlider label="Mood" value={current.mood} onChange={(v) => setCurrent({ ...current, mood: v })} />
            <MoodSlider label="Energy" value={current.energy} onChange={(v) => setCurrent({ ...current, energy: v })} />
          </div>
          <SectionField label="Gratitude" prompt="What are you grateful for today?" value={current.gratitude} onChange={(v) => setCurrent({ ...current, gratitude: v })} />
          <SectionField label="Intentions" prompt="What kind of day do you want to create?" value={current.intentions} onChange={(v) => setCurrent({ ...current, intentions: v })} />
          <SectionField label="Affirmations" prompt="What do you want to reinforce mentally today?" value={current.affirmations} onChange={(v) => setCurrent({ ...current, affirmations: v })} />
          <SectionField label="Wins" prompt="What went well today?" value={current.wins} onChange={(v) => setCurrent({ ...current, wins: v })} />
          <SectionField label="Lessons Learned" prompt="What did you learn today?" value={current.lessonsLearned} onChange={(v) => setCurrent({ ...current, lessonsLearned: v })} />
          <SectionField label="Reflection" prompt="How did the day actually go?" value={current.reflection} onChange={(v) => setCurrent({ ...current, reflection: v })} />
          <SectionField label="Tomorrow Focus" prompt="What are the most important things for tomorrow?" value={current.tomorrowFocus} onChange={(v) => setCurrent({ ...current, tomorrowFocus: v })} />
        </div>
      </Card>
      {history.length > 0 && (
        <div className="max-w-2xl mx-auto">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
              Previous Entries ({history.length})
            </summary>
            <div className="mt-3 space-y-2">
              {history.map((e) => (
                <details key={e.id} className="group rounded-lg border border-gray-200 bg-white">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                    <span className="font-medium text-gray-900">{formatShortDate(e.date)}</span>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Mood: {e.mood}/10</span>
                      <span>Energy: {e.energy}/10</span>
                    </div>
                  </summary>
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3 text-sm">
                    <div><span className="font-medium text-gray-700">Gratitude: </span><span className="text-gray-600">{e.gratitude || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Intentions: </span><span className="text-gray-600">{e.intentions || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Affirmations: </span><span className="text-gray-600">{e.affirmations || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Wins: </span><span className="text-gray-600">{e.wins || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Lessons Learned: </span><span className="text-gray-600">{e.lessonsLearned || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Reflection: </span><span className="text-gray-600">{e.reflection || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Tomorrow Focus: </span><span className="text-gray-600">{e.tomorrowFocus || '—'}</span></div>
                  </div>
                </details>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

// ─── Sleep ────────────────────────────────────────────

function SleepSection() {
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [current, setCurrent] = useState<SleepEntry | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const all = getSleepEntries()
    setEntries(all)
    setCurrent(all.find((e) => e.date === today()) ?? blankSleep(today()))
  }, [])

  const history = useMemo(() => [...entries].sort((a, b) => (a.date > b.date ? -1 : 1)), [entries])

  const handleFieldChange = (patch: Partial<SleepEntry>) => {
    if (!current) return
    const next = { ...current, ...patch }
    const total = (next.remMinutes || 0) + (next.deepMinutes || 0) + (next.lightMinutes || 0)
    const score = calculateSleepScore(total, next.remMinutes || 0, next.deepMinutes || 0, next.awakeMinutes || 0)
    setCurrent({ ...next, totalSleepMinutes: total, sleepScore: score })
  }

  const handleSave = () => {
    if (!current) return
    const updated = { ...current, updatedAt: Date.now() }
    setEntries(saveSleepEntry(updated))
    setCurrent(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!current) return null

  const latest = entries.length > 0 ? [...entries].sort((a, b) => (a.date > b.date ? -1 : 1))[0] : null

  const latestScore = latest?.sleepScore ?? 0

  return (
    <div className="space-y-6">
      {/* TOP: Sleep Breakdown — full width, primary */}
      <Card as="section" aria-label="Sleep Breakdown">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-5">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Sleep Breakdown</p>
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-6 py-4 text-center min-w-[140px]">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">Sleep Score</p>
            <p className="text-5xl font-bold text-gray-900 tabular-nums leading-none">
              {latestScore}<span className="text-xl font-normal text-gray-400">/100</span>
            </p>
            <p className={`mt-2 text-sm font-semibold ${latest ? (latestScore >= 80 ? 'text-green-600' : latestScore >= 60 ? 'text-blue-600' : latestScore >= 40 ? 'text-yellow-600' : 'text-red-500') : 'text-gray-400'}`}>
              {latest ? getSleepRating(latestScore) : 'No data'}
            </p>
          </div>
        </div>
        {latest ? (
          <div className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900 tabular-nums">{formatTime(latest.totalSleepMinutes)}</span>
              <span className="text-sm text-gray-400">Total Sleep</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatTime(latest.remMinutes)}</p>
                <p className="text-xs text-gray-400">REM</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatTime(latest.deepMinutes)}</p>
                <p className="text-xs text-gray-400">Deep</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatTime(latest.lightMinutes)}</p>
                <p className="text-xs text-gray-400">Light</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatTime(latest.awakeMinutes)}</p>
                <p className="text-xs text-gray-400">Awake</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-2">No sleep data recorded yet.</p>
        )}
      </Card>

      {/* BOTTOM ROW: Planner (1/3) + Record Sleep (2/3) — equal height columns */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-1 min-w-0 flex">
          <SleepPlanner />
        </div>
        <Card as="section" aria-label="Record Sleep" className="lg:col-span-2 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Record Sleep</p>
            <p className="text-xs text-gray-400">{formatDate(today())}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16 shrink-0">Bedtime</label>
              <input type="time" value={current.bedtime}
                onChange={(e) => handleFieldChange({ bedtime: e.target.value })}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 tabular-nums focus:border-gray-400 focus:outline-none focus:ring-0" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16 shrink-0">Wake</label>
              <input type="time" value={current.wakeTime}
                onChange={(e) => handleFieldChange({ wakeTime: e.target.value })}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 tabular-nums focus:border-gray-400 focus:outline-none focus:ring-0" />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <DurationInput label="REM Sleep" minutes={current.remMinutes} onChange={(v) => handleFieldChange({ remMinutes: v })} />
            <DurationInput label="Deep Sleep" minutes={current.deepMinutes} onChange={(v) => handleFieldChange({ deepMinutes: v })} />
            <DurationInput label="Light Sleep" minutes={current.lightMinutes} onChange={(v) => handleFieldChange({ lightMinutes: v })} />
            <DurationInput label="Awake Time" minutes={current.awakeMinutes} onChange={(v) => handleFieldChange({ awakeMinutes: v })} />
          </div>
          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Sleep</span>
            <span className="text-lg font-bold text-gray-900 tabular-nums">{formatTime(current.totalSleepMinutes)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sleep Score</span>
            <span className="text-lg font-bold text-gray-900 tabular-nums">{current.sleepScore}<span className="text-sm font-normal text-gray-400">/100</span></span>
          </div>
          <p className={`text-xs font-medium text-right ${current.sleepScore >= 80 ? 'text-green-600' : current.sleepScore >= 60 ? 'text-blue-600' : current.sleepScore >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
            {getSleepRating(current.sleepScore)}
          </p>
        </div>
      </Card>
      </div>
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
          Sleep History ({history.length})
        </summary>
          <div className="mt-3 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No sleep records yet.</p>
            ) : (
              history.map((e) => (
              <details key={e.id} className="group rounded-lg border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                  <span className="font-medium text-gray-900">{formatShortDate(e.date)}</span>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Score: {e.sleepScore}/100</span><span>{getSleepRating(e.sleepScore)}</span><span>{formatTime(e.totalSleepMinutes)}</span>
                  </div>
                </summary>
                <div className="border-t border-gray-100 px-4 py-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="font-medium text-gray-700">Bedtime:</span> <span className="text-gray-600">{e.bedtime || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Wake Time:</span> <span className="text-gray-600">{e.wakeTime || '—'}</span></div>
                    <div><span className="font-medium text-gray-700">Total:</span> <span className="text-gray-600">{formatTime(e.totalSleepMinutes)}</span></div>
                    <div><span className="font-medium text-gray-700">Score:</span> <span className="text-gray-600">{e.sleepScore}/100 ({getSleepRating(e.sleepScore)})</span></div>
                    <div><span className="font-medium text-gray-700">REM:</span> <span className="text-gray-600">{formatTime(e.remMinutes)}</span></div>
                    <div><span className="font-medium text-gray-700">Deep:</span> <span className="text-gray-600">{formatTime(e.deepMinutes)}</span></div>
                    <div><span className="font-medium text-gray-700">Light:</span> <span className="text-gray-600">{formatTime(e.lightMinutes)}</span></div>
                    <div><span className="font-medium text-gray-700">Awake:</span> <span className="text-gray-600">{formatTime(e.awakeMinutes)}</span></div>
                  </div>
                </div>
              </details>
              ))
            )}
          </div>
      </details>

    </div>
  )
}


function SleepPlanner() {
  const [bedtime, setBedtime] = useState('22:00')
  const [options, setOptions] = useState<WakeTimeResult[] | null>(null)
  const [plan, setPlan] = useState<SleepPlan | null>(null)

  useEffect(() => {
    setPlan(getSleepPlanByDate(today()) ?? null)
  }, [])

  const handleCalculate = () => {
    if (!/^\d{2}:\d{2}$/.test(bedtime)) return
    setOptions(calculateWakeOptions(bedtime))
  }

  const handleSelect = (selected: WakeTimeResult) => {
    const alreadySet = plan?.selectedWakeTime === selected.wakeTime && plan?.plannedBedtime === bedtime
    if (alreadySet) {
      if (!plan) return
      deleteSleepPlan(plan.id)
      setPlan(null)
      return
    }
    const existing = getSleepPlanByDate(today())
    const now = Date.now()
    const updated: SleepPlan = existing ?? {
      id: crypto.randomUUID(),
      date: today(),
      plannedBedtime: bedtime,
      calculatedOptions: options ?? [],
      selectedWakeTime: null,
      createdAt: now,
      updatedAt: now,
    }
    updated.plannedBedtime = bedtime
    updated.calculatedOptions = options ?? []
    updated.selectedWakeTime = selected.wakeTime
    updated.updatedAt = now
    setPlan(updated)
    saveSleepPlan(updated)
  }

  const handleClear = () => {
    if (!plan) return
    deleteSleepPlan(plan.id)
    setPlan(null)
    setOptions(null)
  }

  return (
    <Card as="section" aria-label="Sleep Planner" className="min-w-0 h-full w-full flex flex-col">
      <div className="mb-4 shrink-0">
        <p className="text-sm font-semibold text-gray-900">Sleep Planner</p>
        <p className="text-xs text-gray-400">Bedtime &amp; wake-up options</p>
      </div>

      <div className="flex flex-col flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="text-xs text-gray-600 shrink-0">Bedtime</label>
          <input
            type="text"
            value={bedtime}
            onChange={(e) => {
              const val = e.target.value
              if (/^[\d:]{0,5}$/.test(val)) {
                setBedtime(val)
                if (/^\d{2}:\d{2}$/.test(val)) setOptions(null)
              }
            }}
            onBlur={() => {
              if (!/^\d{2}:\d{2}$/.test(bedtime)) setBedtime('22:00')
            }}
            placeholder="HH:MM"
            maxLength={5}
            className="w-[4.5rem] rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-900 tabular-nums focus:border-gray-400 focus:outline-none focus:ring-0"
          />
          <button
            onClick={handleCalculate}
            className="shrink-0 rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Calculate
          </button>
        </div>

        {options && (
          <div className="flex-1 flex flex-col justify-start gap-2">
            {options.map((opt) => {
              const isSelected = plan?.selectedWakeTime === opt.wakeTime && plan?.plannedBedtime === bedtime
              const isBest = opt.cycles === 5
              return (
                <div
                  key={opt.cycles}
                  className={`rounded-lg border px-2.5 py-2 transition-colors ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-wrap">
                      {isBest && (
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-medium text-blue-700">Best</span>
                      )}
                      <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] font-medium text-gray-600">
                        {opt.cycles}c
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDuration(opt.totalSleep)}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums shrink-0">{opt.wakeTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-[10px] text-gray-500 truncate">Wake {opt.wakeTime}</p>
                    <button
                      onClick={() => handleSelect(opt)}
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-gray-900 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {isSelected ? 'Set ✓' : 'Set'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!options && plan && (
          <div className="flex-1 flex flex-col justify-start">
            <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-gray-400">Today&rsquo;s Plan</p>
                  <p className="text-xs font-semibold text-gray-900 mt-0.5 truncate">
                    {plan.plannedBedtime} → {plan.selectedWakeTime}
                  </p>
                  {plan.calculatedOptions.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {plan.calculatedOptions.find((o) => o.wakeTime === plan.selectedWakeTime)?.cycles ?? '-'} cycles
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClear}
                  className="shrink-0 rounded border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {!options && !plan && <div className="flex-1" aria-hidden="true" />}
      </div>
    </Card>
  )
}

function DurationInput({ label, minutes, onChange }: {
  label: string; minutes: number; onChange: (minutes: number) => void
}) {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <input type="number" min={0} value={hrs}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value)) * 60 + mins)}
            className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 text-right tabular-nums focus:border-gray-400 focus:outline-none focus:ring-0" />
          <span className="text-xs text-gray-400 w-3">h</span>
        </div>
        <div className="flex items-center gap-1">
          <input type="number" min={0} max={59} value={mins}
            onChange={(e) => onChange(hrs * 60 + Math.min(59, Math.max(0, Number(e.target.value))))}
            className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 text-right tabular-nums focus:border-gray-400 focus:outline-none focus:ring-0" />
          <span className="text-xs text-gray-400 w-3">m</span>
        </div>
      </div>
    </div>
  )
}

function SleepInput({ label, value, onChange, suffix, type = 'number' }: {
  label: string; value: number | string; onChange: (v: any) => void; suffix?: string; type?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input type={type} value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 text-right tabular-nums focus:border-gray-400 focus:outline-none focus:ring-0" />
        {suffix ? (
          <span className="text-xs text-gray-400 w-6">{suffix}</span>
        ) : null}
      </div>
    </div>
  )
}

// ─── Health ───────────────────────────────────────────

function HealthSection() {
  const [entries, setEntries] = useState<HealthEntry[]>([])
  const [current, setCurrent] = useState<HealthEntry | null>(null)
  const [saved, setSaved] = useState(false)
  const [illnessEvents, setIllnessEvents] = useState<HealthEvent[]>([])

  useEffect(() => {
    const all = getHealthEntries()
    setEntries(all)
    setCurrent(all.find((e) => e.date === today()) ?? blankHealth(today()))
    setIllnessEvents(getHealthEvents())
  }, [])

  const history = useMemo(() => [...entries].sort((a, b) => (a.date > b.date ? -1 : 1)), [entries])

  const healthStatus = useMemo(() => computeHealthStatus(illnessEvents, today()), [illnessEvents])

  const handleSave = () => {
    if (!current) return
    const updated = { ...current, updatedAt: Date.now() }
    setEntries(saveHealthEntry(updated))
    setCurrent(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleMarkSick = () => {
    const event: HealthEvent = {
      id: crypto.randomUUID(),
      type: 'sick',
      date: today(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setIllnessEvents(saveHealthEvent(event))
  }

  const handleRecovered = () => {
    const event: HealthEvent = {
      id: crypto.randomUUID(),
      type: 'recovered',
      date: today(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setIllnessEvents(saveHealthEvent(event))
  }

  const handleDeleteEvent = (id: string) => {
    setIllnessEvents(deleteHealthEvent(id))
  }

  const sortedIllness = useMemo(
    () => [...illnessEvents].sort((a, b) => (a.date > b.date ? -1 : 1)),
    [illnessEvents]
  )

  if (!current) return null

  const healthScore = computeHealthScore(current)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* A) Health Summary — always visible, static structure */}
      <section aria-label="Health Summary" className="space-y-6">
        <Card>
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">Health Summary</p>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 items-end">
            <div>
              <p className="text-xs text-gray-400">Streak</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {healthStatus.streakDays}<span className="text-sm font-normal text-gray-400"> days</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Last Sick</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {healthStatus.lastSickDate ? formatShortDate(healthStatus.lastSickDate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                healthStatus.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {healthStatus.status === 'healthy' ? 'Healthy' : 'Sick'}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 lg:invisible">Action</p>
              {healthStatus.status === 'healthy' ? (
                <button onClick={handleMarkSick}
                  className="mt-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap">
                  Mark Sick
                </button>
              ) : (
                <button onClick={handleRecovered}
                  className="mt-1 rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-500 transition-colors whitespace-nowrap">
                  Recovered
                </button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="sm:col-span-1 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">Health Score</p>
            <p className="text-5xl font-bold text-gray-900">
              {healthScore.total}<span className="text-xl font-normal text-gray-400">/{healthScore.max}</span>
            </p>
            <p className={`mt-2 text-sm font-medium ${
              healthScore.total >= 80 ? 'text-green-600' :
              healthScore.total >= 60 ? 'text-blue-600' :
              healthScore.total >= 40 ? 'text-yellow-600' :
              'text-red-500'
            }`}>
              {getHealthRating(healthScore.total)}
            </p>
          </Card>
          <Card className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Health Breakdown</p>
            <div className="space-y-3">
              <BreakdownRow label="Steps" score={healthScore.steps.score} max={healthScore.steps.max} value={healthScore.steps.value} unit={healthScore.steps.unit} />
              <BreakdownRow label="Water" score={healthScore.water.score} max={healthScore.water.max} value={healthScore.water.value} unit={healthScore.water.unit} />
              <BreakdownRow label="Workout" score={healthScore.workout.score} max={healthScore.workout.max} value={healthScore.workout.value} unit={healthScore.workout.unit} />
              <BreakdownRow label="Nutrition" score={healthScore.nutrition.score} max={healthScore.nutrition.max} value={healthScore.nutrition.value} unit={healthScore.nutrition.unit} />
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm font-semibold text-gray-900">
                <span>Total</span>
                <span className="tabular-nums">{healthScore.total} / {healthScore.max}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* B) Health Log — daily entry + expandable history */}
      <section aria-label="Health Log" className="space-y-4">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">Health Log</p>
              <p className="text-xs text-gray-400">{formatDate(today())}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HealthInput label="Steps" value={current.steps} onChange={(v) => setCurrent({ ...current, steps: v })} />
            <HealthInput label="Water Intake (Liters)" value={current.waterIntake} onChange={(v) => setCurrent({ ...current, waterIntake: v })} />
            <HealthInput label="Workout (min)" value={current.workoutMinutes} onChange={(v) => setCurrent({ ...current, workoutMinutes: v })} />
            <div>
              <p className="text-sm text-gray-700 mb-1">Healthy Eating Rating</p>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={10} value={current.healthyEatingRating ?? 5}
                  onChange={(e) => setCurrent({ ...current, healthyEatingRating: Number(e.target.value) })}
                  className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 accent-gray-900 cursor-pointer" />
                <span className="text-lg font-bold text-gray-900 w-6 text-center tabular-nums">{current.healthyEatingRating ?? '-'}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-700 mb-1">Notes</p>
            <textarea value={current.notes ?? ''} onChange={(e) => setCurrent({ ...current, notes: e.target.value })} rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 resize-y focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors" />
          </div>
        </Card>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
            Health History ({history.length})
          </summary>
          <div className="mt-3 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No saved health records yet.</p>
            ) : (
              history.map((e) => (
                <details key={e.id} className="group rounded-lg border border-gray-200 bg-white">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                    <span className="font-medium text-gray-900">{formatShortDate(e.date)}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {e.steps != null && <span>{e.steps.toLocaleString()} steps</span>}
                      {e.healthyEatingRating != null && <span>Eating: {e.healthyEatingRating}/10</span>}
                    </div>
                  </summary>
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2 text-sm">
                    {e.steps != null && <div><span className="font-medium text-gray-700">Steps: </span><span className="text-gray-600">{e.steps.toLocaleString()}</span></div>}
                    {e.waterIntake != null && <div><span className="font-medium text-gray-700">Water: </span><span className="text-gray-600">{e.waterIntake}ml</span></div>}
                    {e.workoutMinutes != null && <div><span className="font-medium text-gray-700">Workout: </span><span className="text-gray-600">{e.workoutMinutes} min</span></div>}
                    {e.healthyEatingRating != null && <div><span className="font-medium text-gray-700">Healthy Eating: </span><span className="text-gray-600">{e.healthyEatingRating}/10</span></div>}
                    {e.notes != null && e.notes !== '' && <div><span className="font-medium text-gray-700">Notes: </span><span className="text-gray-600">{e.notes}</span></div>}
                  </div>
                </details>
              ))
            )}
          </div>
        </details>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 select-none">
            Illness History ({sortedIllness.length})
          </summary>
          <div className="mt-3 space-y-2">
            {sortedIllness.length === 0 ? (
              <p className="text-sm text-gray-400">No illness events recorded.</p>
            ) : (
              sortedIllness.map((ev) => {
                const isSick = ev.type === 'sick'
                const nextRecovered = sortedIllness
                  .filter((e) => e.type === 'recovered' && e.date >= ev.date)
                  .pop()
                return (
                  <div key={ev.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isSick ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isSick ? 'Sick' : 'Recovered'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{formatShortDate(ev.date)}</span>
                        {isSick && nextRecovered && (() => {
                          const dur = daysBetween(ev.date, nextRecovered.date)
                          return dur > 0 ? <span className="text-xs text-gray-400">{dur} day{dur !== 1 ? 's' : ''}</span> : null
                        })()}
                      </div>
                      <button onClick={() => handleDeleteEvent(ev.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                    </div>
                    {ev.note && <p className="mt-1 text-xs text-gray-500">{ev.note}</p>}
                  </div>
                )
              })
            )}
          </div>
        </details>
      </section>
    </div>
  )
}

function BreakdownRow({ label, score, max, value, unit }: {
  label: string; score: number; max: number; value: number; unit: string
}) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-medium tabular-nums">
          {score}<span className="text-gray-400 font-normal"> / {max}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-gray-900 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">{value.toLocaleString()} {unit}</p>
    </div>
  )
}

function HealthInput({ label, value, onChange }: {
  label: string; value: number | undefined | null; onChange: (v: number | undefined) => void
}) {
  const strVal = value != null ? String(value) : ''
  return (
    <div>
      <p className="text-sm text-gray-700 mb-1">{label}</p>
      <input type="number" value={strVal}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 tabular-nums focus:border-gray-400 focus:outline-none focus:ring-0" />
    </div>
  )
}

// ─── Finance ──────────────────────────────────────────

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  const color = data[data.length - 1] >= data[0] ? '#16a34a' : '#dc2626'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} width={w} height={h}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  )
}

function StockCard({ asset, onRemove }: { asset: Asset; onRemove: (id: string) => void }) {
  const perf = useMemo(() => computeStockPerformance(asset), [asset])

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{asset.name}</p>
          <p className="text-xs text-gray-400">{asset.symbol}</p>
        </div>
        <Sparkline data={asset.priceHistory} className="shrink-0" />
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-lg font-bold text-gray-900 tabular-nums">{asset.price.toFixed(2)}</p>
      </div>
      <div className="grid grid-cols-3 gap-1 text-[11px]">
        <PerfLabel label="Daily" value={perf.dailyChangePct} />
        <PerfLabel label="Week" value={perf.weekChangePct} />
        <PerfLabel label="Month" value={perf.monthChangePct} />
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={() => onRemove(asset.id)}
          className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
      </div>
    </div>
  )
}

function PerfLabel({ label, value }: { label: string; value: number }) {
  return (
    <div className={`rounded px-1.5 py-1 text-center font-medium tabular-nums ${value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
      <span className="text-gray-400">{label} </span>
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </div>
  )
}

function StockListSection({ title, stocks, onRemove, onAdd, accent }: {
  title: string; stocks: Asset[]; onRemove: (id: string) => void; onAdd: () => void; accent?: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <button onClick={onAdd}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${accent ? 'bg-gray-900 text-white hover:bg-gray-800' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          + Add Stock
        </button>
      </div>
      {stocks.length === 0 ? (
        <Card><p className="text-center text-sm text-gray-400 py-4">No stocks yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {stocks.map((a) => <StockCard key={a.id} asset={a} onRemove={onRemove} />)}
        </div>
      )}
    </div>
  )
}

function FinanceSection() {
  const [portfolio, setPortfolio] = useState<Asset[]>([])
  const [watchlist, setWatchlist] = useState<Asset[]>([])
  const [searchTarget, setSearchTarget] = useState<'portfolio' | 'watchlist' | null>(null)

  useEffect(() => {
    setPortfolio(getAssets())
    setWatchlist(getWatchlistAssets())
  }, [])

  const performance = useMemo(() => computeAggregatedPerformance(portfolio), [portfolio])

  const handleAddTo = (symbol: string, name: string) => {
    if (searchTarget === 'portfolio') setPortfolio(addStock(symbol, name))
    else setWatchlist(addWatchlistStock(symbol, name))
    setSearchTarget(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Portfolio Performance</p>
        {portfolio.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-4">
              <AggStat label="Daily" value={performance.dailyChangePct} />
              <AggStat label="Weekly" value={performance.weekChangePct} />
              <AggStat label="Monthly" value={performance.monthChangePct} />
            </div>
            <p className="mt-2 text-[10px] text-gray-400">{performance.stockCount} stock{performance.stockCount !== 1 ? 's' : ''} tracked</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">Add stocks to your portfolio to see performance.</p>
        )}
      </Card>

      <section aria-label="Portfolio" className="space-y-3">
        {searchTarget === 'portfolio' && (
          <StockSearchForm
            onAdd={handleAddTo}
            onCancel={() => setSearchTarget(null)}
            target="portfolio"
          />
        )}
        <StockListSection
          title="Portfolio (Owned)"
          stocks={portfolio}
          onRemove={(id) => setPortfolio(deleteAsset(id))}
          onAdd={() => setSearchTarget('portfolio')}
          accent
        />
      </section>

      <section aria-label="Watchlist" className="space-y-3">
        {searchTarget === 'watchlist' && (
          <StockSearchForm
            onAdd={handleAddTo}
            onCancel={() => setSearchTarget(null)}
            target="watchlist"
          />
        )}
        <StockListSection
          title="Watchlist (Observed)"
          stocks={watchlist}
          onRemove={(id) => setWatchlist(deleteWatchlistAsset(id))}
          onAdd={() => setSearchTarget('watchlist')}
        />
      </section>
    </div>
  )
}

function AggStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {value >= 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  )
}

function StockSearchForm({ onAdd, onCancel, target }: {
  onAdd: (symbol: string, name: string) => void; onCancel: () => void; target: 'portfolio' | 'watchlist'
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ symbol: string; name: string }[]>([])

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      return
    }
    const timer = setTimeout(() => setResults(searchStocks(query)), 200)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Add to {target === 'portfolio' ? 'Portfolio' : 'Watchlist'}</p>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
        </div>
        <div className="max-w-md">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or ticker..."
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-300 focus:border-gray-400 focus:outline-none focus:ring-0" />
        </div>
        {results.length > 0 && (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {results.map((r) => (
              <button key={r.symbol} onClick={() => onAdd(r.symbol, r.name)}
                className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.symbol}</p>
                </div>
                <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">Add</span>
              </button>
            ))}
          </div>
        )}
        {query.trim().length > 0 && results.length === 0 && (
          <p className="text-sm text-gray-400">No stocks found for &ldquo;{query}&rdquo;</p>
        )}
      </div>
    </Card>
  )
}

// ─── Business Ideas ────────────────────────────────────

const IDEA_STATUSES: { value: BusinessIdea['status']; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'researching', label: 'Researching' },
  { value: 'building', label: 'Building' },
  { value: 'testing', label: 'Testing' },
  { value: 'launched', label: 'Launched' },
  { value: 'archived', label: 'Archived' },
]

function statusColor(status: BusinessIdea['status']): string {
  const colors: Record<string, string> = {
    idea: 'bg-purple-100 text-purple-700',
    researching: 'bg-blue-100 text-blue-700',
    building: 'bg-amber-100 text-amber-700',
    testing: 'bg-cyan-100 text-cyan-700',
    launched: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-600'
}

function IdeasSection() {
  const [items, setItems] = useState<BusinessIdea[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BusinessIdea | null>(null)
  const [convertingIdea, setConvertingIdea] = useState<BusinessIdea | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [viewingAnalysisId, setViewingAnalysisId] = useState<string | null>(null)
  const [convertingProjectIdea, setConvertingProjectIdea] = useState<BusinessIdea | null>(null)
  const [lastAnalysisSource, setLastAnalysisSource] = useState<'gemini' | 'rules'>('rules')
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  useEffect(() => { setItems(getBusinessIdeas()) }, [])

  const stats = useMemo(() => computeBusinessIdeasStats(items), [items])

  const filtered = useMemo(() => {
    let list = items
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q)
      )
    }
    if (statusFilter) list = list.filter((i) => i.status === statusFilter)
    return [...list].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
  }, [items, search, statusFilter])

  const viewingIdea = viewingAnalysisId ? items.find((i) => i.id === viewingAnalysisId) : null

  const handleSave = (item: BusinessIdea) => {
    const updated = { ...item, updatedAt: Date.now() }
    setItems(saveBusinessIdea(updated))
    setEditing(null)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setItems(deleteBusinessIdea(id))
    if (editing?.id === id) { setEditing(null); setShowForm(false) }
    if (viewingAnalysisId === id) setViewingAnalysisId(null)
  }

  const handleAnalyze = async (item: BusinessIdea) => {
    setAnalyzingId(item.id)
    setAnalyzeError(null)
    try {
      const saved = { ...item, updatedAt: Date.now() }
      saveBusinessIdea(saved)
      const { idea: updated, source, error } = await analyzeAndSaveIdeaAsync(saved)
      setLastAnalysisSource(source)
      if (error) setAnalyzeError(error)
      setItems(getBusinessIdeas())
      setViewingAnalysisId(updated.id)
      if (editing?.id === updated.id) setEditing(updated)
    } finally {
      setAnalyzingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <BusinessIdeasDashboard
        stats={stats}
        onSelectIdea={(id) => setViewingAnalysisId(id)}
      />

      {analyzeError && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            <span className="font-semibold">Gemini unavailable — showing offline analysis.</span>{' '}
            {analyzeError.includes('429') || analyzeError.includes('quota')
              ? 'Your API key has no quota for the default model. Restart dev server after setting GEMINI_MODEL=gemini-2.5-flash in .env.local, then click Re-analyze Idea.'
              : analyzeError}
          </p>
        </Card>
      )}

      {viewingIdea?.analysis && (
        <BusinessIdeaAnalysisPanel
          analysis={viewingIdea.analysis}
          ideaTitle={viewingIdea.title || 'Untitled Idea'}
          onConvertToProject={() => setConvertingProjectIdea(viewingIdea)}
          poweredByGemini={viewingIdea.analysisSource === 'gemini'}
        />
      )}

      <div className="flex gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ideas..."
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-900 placeholder-gray-300 focus:border-gray-400 focus:outline-none focus:ring-0" />
        <button onClick={() => { setEditing(null); setShowForm(!showForm) }}
          className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
          {showForm ? 'Cancel' : 'Add Idea'}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setStatusFilter('')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All
        </button>
        {IDEA_STATUSES.map((s) => (
          <button key={s.value} onClick={() => setStatusFilter(s.value === statusFilter ? '' : s.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${s.value === statusFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <IdeaForm
          initial={editing ?? blankIdea()}
          onSave={handleSave}
          onDelete={editing ? () => handleDelete(editing.id) : undefined}
          onConvert={editing ? (idea) => setConvertingIdea(idea) : undefined}
          onAnalyze={editing ? (idea) => handleAnalyze(idea) : undefined}
          analyzing={editing ? analyzingId === editing.id : false}
        />
      )}

      {filtered.length === 0 && (
        <Card><p className="text-center text-sm text-gray-400 py-4">{search || statusFilter ? 'No matches.' : 'No ideas yet.'}</p></Card>
      )}

      <div className="space-y-2">
        {filtered.map((item) => (
          <details key={item.id} className="group rounded-lg border border-gray-200 bg-white">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-gray-900 truncate">{item.title}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(item.status)}`}>
                  {IDEA_STATUSES.find((s) => s.value === item.status)?.label ?? item.status}
                </span>
                {item.analysis && (
                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 tabular-nums">
                    {item.analysis.overallScore}/100
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400 ml-3">
                {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </summary>
            <div className="border-t border-gray-100 px-4 py-3 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{item.category}</span>
              </div>
              {item.description && (
                <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
              )}
              {item.notes && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-1">Notes</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{item.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2 flex-wrap">
                <button onClick={() => handleAnalyze(item)}
                  disabled={analyzingId === item.id}
                  className="rounded px-2 py-1 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-colors">
                  {analyzingId === item.id ? 'Analyzing…' : item.analysis ? 'Re-analyze Idea' : 'Analyze Idea'}
                </button>
                {item.analysis && (
                  <button onClick={() => setViewingAnalysisId(viewingAnalysisId === item.id ? null : item.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
                    {viewingAnalysisId === item.id ? 'Hide Analysis' : 'View Analysis'}
                  </button>
                )}
                <button onClick={() => { setEditing(item); setShowForm(true) }}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">Edit</button>
                <button onClick={() => setConvertingIdea(item)}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Convert to Work Item
                </button>
                <button onClick={() => handleDelete(item.id)}
                  className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">Delete</button>
              </div>
              {viewingAnalysisId === item.id && !item.analysis && (
                <p className="text-xs text-gray-400 pt-1">Run Analyze Idea to generate a business analysis.</p>
              )}
            </div>
          </details>
        ))}
      </div>

      {convertingIdea && (
        <ConvertIdeaToWorkModal
          idea={convertingIdea}
          onClose={() => setConvertingIdea(null)}
        />
      )}

      {convertingProjectIdea && (
        <ConvertAnalysisToProjectModal
          idea={convertingProjectIdea}
          onClose={() => setConvertingProjectIdea(null)}
        />
      )}
    </div>
  )
}

function blankIdea(): BusinessIdea {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    category: IDEA_CATEGORIES[0],
    status: 'idea',
    notes: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function IdeaForm({ initial, onSave, onDelete, onConvert, onAnalyze, analyzing }: {
  initial: BusinessIdea
  onSave: (i: BusinessIdea) => void
  onDelete?: () => void
  onConvert?: (i: BusinessIdea) => void
  onAnalyze?: (i: BusinessIdea) => void
  analyzing?: boolean
}) {
  const [form, setForm] = useState(initial)

  const handleSave = () => {
    onSave(form)
  }

  return (
    <Card>
      <div className="space-y-4 max-w-lg">
        <div>
          <p className="text-sm text-gray-700 mb-1">Title</p>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0" />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Category</p>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0">
            {IDEA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Status</p>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BusinessIdea['status'] })}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0">
            {IDEA_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Description</p>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 resize-y focus:border-gray-400 focus:outline-none focus:ring-0" />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Notes</p>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 resize-y focus:border-gray-400 focus:outline-none focus:ring-0" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleSave}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">Save</button>
          {onAnalyze && form.title.trim() && (
            <button type="button" onClick={() => onAnalyze(form)} disabled={analyzing}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {analyzing ? 'Analyzing…' : form.analysis ? 'Re-analyze Idea' : 'Analyze Idea'}
            </button>
          )}
          {onConvert && form.title.trim() && (
            <button type="button" onClick={() => onConvert(form)}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
              Convert to Work Item
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete}
              className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">Delete</button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Character Development ────────────────────────────

const LEVEL_LABELS = ['', 'Novice', 'Beginner', 'Developing', 'Apprentice', 'Competent', 'Proficient', 'Advanced', 'Expert', 'Master', 'Sage']

function CharacterSection() {
  const [areas, setAreas] = useState<CharacterArea[]>([])
  const [deletedAreas, setDeletedAreas] = useState<CharacterArea[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTips, setEditTips] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTips, setNewTips] = useState('')

  const loadData = () => {
    setAreas(getCharacterAreas())
    const all = getAllCharacterAreas()
    setDeletedAreas(all.filter((a) => a.status === 'deleted'))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLevelUp = (id: string) => {
    const area = areas.find((a) => a.id === id)
    if (!area || area.level >= 10) return
    setCharacterLevel(id, area.level + 1)
    loadData()
  }

  const handleLevelDown = (id: string) => {
    const area = areas.find((a) => a.id === id)
    if (!area || area.level <= 1) return
    setCharacterLevel(id, area.level - 1)
    loadData()
  }

  const handleStartEdit = (area: CharacterArea) => {
    setEditing(area.id)
    setEditName(area.name)
    setEditDescription(area.description)
    setEditTips(area.tips || '')
  }

  const handleSaveEdit = (id: string) => {
    updateCharacterArea(id, { name: editName, description: editDescription, tips: editTips })
    setEditing(null)
    loadData()
  }

  const handleCancelEdit = () => {
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    deleteCharacterArea(id)
    loadData()
  }

  const handleRestore = (id: string) => {
    restoreCharacterArea(id)
    loadData()
  }

  const handlePermanentDelete = (id: string) => {
    permanentDeleteCharacterArea(id)
    loadData()
  }

  const handleAddTrait = () => {
    const id = crypto.randomUUID()
    const now = Date.now()
    saveCharacterArea({
      id, name: newName || 'New Trait', description: newDescription,
      tips: newTips, level: 1, createdAt: now, updatedAt: now,
    })
    loadData()
    setShowNewForm(false)
    setNewName('')
    setNewDescription('')
    setNewTips('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-gray-500">Who you are becoming</p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          {showNewForm ? 'Cancel' : 'Add Trait'}
        </button>
      </div>

      {showNewForm && (
        <Card>
          <div className="space-y-3 max-w-md">
            <div>
              <p className="text-sm text-gray-700 mb-1">Trait Name</p>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Communication"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-300 focus:border-gray-400 focus:outline-none focus:ring-0" />
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-1">Description</p>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} placeholder="What this trait means to you"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-300 resize-none focus:border-gray-400 focus:outline-none focus:ring-0" />
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-1">Tips (optional)</p>
              <textarea value={newTips} onChange={(e) => setNewTips(e.target.value)} rows={2} placeholder="How to develop this trait"
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-300 resize-none focus:border-gray-400 focus:outline-none focus:ring-0" />
            </div>
            <button onClick={handleAddTrait}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
              Create Trait
            </button>
          </div>
        </Card>
      )}

      {areas.length === 0 && !showNewForm && (
        <Card><p className="text-center text-sm text-gray-400 py-6">No traits yet. Create your first one.</p></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <Card key={area.id}>
            <div className="space-y-4">
              {editing === area.id ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Name</p>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 resize-none focus:border-gray-400 focus:outline-none focus:ring-0" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tips</p>
                    <textarea value={editTips} onChange={(e) => setEditTips(e.target.value)} rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 resize-none focus:border-gray-400 focus:outline-none focus:ring-0" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(area.id)}
                      className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 transition-colors">Save</button>
                    <button onClick={handleCancelEdit}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{area.name}</h3>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {LEVEL_LABELS[area.level] || `Level ${area.level}`}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Level {area.level}/10</span>
                      <span className="font-medium text-gray-700">{area.level * 10}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gray-900 transition-all duration-500"
                        style={{ width: `${area.level * 10}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleLevelDown(area.id)} disabled={area.level <= 1}
                      className="size-7 rounded-lg border border-gray-200 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">−</button>
                    <span className="flex-1 text-center text-lg font-bold text-gray-900 tabular-nums">{area.level}</span>
                    <button onClick={() => handleLevelUp(area.id)} disabled={area.level >= 10}
                      className="size-7 rounded-lg border border-gray-200 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">+</button>
                  </div>

                  {area.description && area.description.trim() && (
                    <p className="text-sm text-gray-500 leading-relaxed">{area.description}</p>
                  )}

                  {area.tips && area.tips.trim() && (
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-0.5">Tips</p>
                      <p className="text-xs text-gray-600">{area.tips}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleStartEdit(area)}
                      className="text-xs text-gray-400 hover:text-gray-900 transition-colors">Edit</button>
                    <button onClick={() => handleDelete(area.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {deletedAreas.length > 0 && (
        <details className="group" open={showDeleted} onToggle={(e) => setShowDeleted(e.currentTarget.open)}>
          <summary className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 select-none [&::-webkit-details-marker]:hidden flex items-center justify-between">
            <span>Deleted Character Traits ({deletedAreas.length})</span>
            <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 space-y-2">
            {deletedAreas.map((area) => (
              <div key={area.id} className="rounded-lg border border-gray-100 bg-white px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{area.name}</p>
                  <p className="text-xs text-gray-400">Level {area.level} · {LEVEL_LABELS[area.level] || `Level ${area.level}`}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRestore(area.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">Restore</button>
                  <button onClick={() => handlePermanentDelete(area.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">Delete Forever</button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Quotes ───────────────────────────────────────────

function QuotesSection() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)

  useEffect(() => { setQuotes(getQuotes()) }, [])

  const sorted = useMemo(() => [...quotes].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)), [quotes])

  const handleSave = (quote: Quote) => {
    const updated = { ...quote, updatedAt: Date.now() }
    setQuotes(saveQuote(updated))
    setEditing(null)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setQuotes(deleteQuote(id))
    if (editing?.id === id) { setEditing(null); setShowForm(false) }
  }

  const handleEdit = (quote: Quote) => {
    setEditing(quote)
    setShowForm(true)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(!showForm) }}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
          {showForm ? 'Cancel' : 'Add Quote'}
        </button>
      </div>

      {showForm && (
        <QuoteForm
          initial={editing ?? blankQuote()}
          onSave={handleSave}
          onDelete={editing ? () => handleDelete(editing.id) : undefined}
        />
      )}

      {sorted.length === 0 && !showForm && (
        <Card><p className="text-center text-sm text-gray-400 py-6">No quotes collected yet.</p></Card>
      )}

      <div className="space-y-3">
        {sorted.map((q) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 italic">&ldquo;{q.text}&rdquo;</p>
                {q.author && <p className="mt-1 text-xs text-gray-500">— {q.author}</p>}
              </div>
              <button onClick={() => handleEdit(q)} className="shrink-0 text-xs text-gray-400 hover:text-gray-900">Edit</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function QuoteForm({ initial, onSave, onDelete }: {
  initial: Quote; onSave: (q: Quote) => void; onDelete?: () => void
}) {
  const [form, setForm] = useState(initial)

  return (
    <Card>
      <div className="space-y-4 max-w-lg">
        <div>
          <p className="text-sm text-gray-700 mb-1">Quote</p>
          <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 resize-y focus:border-gray-400 focus:outline-none focus:ring-0" />
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-1">Author</p>
          <input type="text" value={form.author ?? ''} onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">Save</button>
          {onDelete && (
            <button onClick={onDelete}
              className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">Delete</button>
          )}
        </div>
      </div>
    </Card>
  )
}
