'use client'

import { useCallback, useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/layout/PageHeader'
import type { FeedbackRecord, FeedbackStatus } from '@/types/feedback'

const STATUS_OPTIONS: FeedbackStatus[] = ['new', 'in_progress', 'resolved', 'closed']

const CATEGORY_EMOJI: Record<string, string> = {
  bug: '🐞',
  feature: '✨',
  improvement: '💡',
  ai: '🤖',
  planner: '📋',
  routine: '🔁',
  other: '💬',
}

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminFeedbackPageClient() {
  const [items, setItems] = useState<FeedbackRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/feedback')
      const data = (await res.json()) as { items?: FeedbackRecord[]; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Could not load feedback.')
        setItems([])
        return
      }
      setItems(data.items ?? [])
    } catch {
      setError('Network error while loading feedback.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) return
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="los-page space-y-8">
      <PageHeader
        eyebrow="ASCEND Admin"
        title="Feedback"
        subtitle="User reports land directly in your Supabase database."
      >
        <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </PageHeader>

      {loading && (
        <Card className="p-8 text-center text-sm text-los-text-muted">Loading feedback…</Card>
      )}

      {error && (
        <Card className="border-los-danger/40 bg-los-danger/10 p-5">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card className="p-8 text-center text-sm text-los-text-muted">No feedback yet.</Card>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-los-text-primary">
                  {CATEGORY_EMOJI[item.category] ?? '💬'} {formatCategory(item.category)}
                  {item.page && (
                    <span className="ml-2 font-normal text-los-text-muted">· {item.page}</span>
                  )}
                </p>
                <p className="text-xs text-los-text-muted">{formatDate(item.createdAt)}</p>
              </div>
              <select
                className="los-select w-full sm:w-40"
                value={item.status}
                disabled={updatingId === item.id}
                onChange={(e) => void updateStatus(item.id, e.target.value as FeedbackStatus)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm leading-relaxed text-los-text-primary whitespace-pre-wrap">
              {item.message}
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-los-text-muted">
              {item.browser && <span className="rounded-full border border-los-border px-2 py-1">{item.browser}</span>}
              {item.os && <span className="rounded-full border border-los-border px-2 py-1">{item.os}</span>}
              {item.appVersion && (
                <span className="rounded-full border border-los-border px-2 py-1">
                  v{item.appVersion}
                </span>
              )}
              {item.name && (
                <span className="rounded-full border border-los-border px-2 py-1">{item.name}</span>
              )}
              {item.email && (
                <span className="rounded-full border border-los-border px-2 py-1">{item.email}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
