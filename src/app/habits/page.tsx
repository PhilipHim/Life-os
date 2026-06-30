'use client'

import { useState } from 'react'
import { useHabits } from '@/contexts/HabitContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/common/EmptyState'
import PageHeader from '@/components/layout/PageHeader'

function PlusIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function HabitsPage() {
  const {
    habits, getEntryForHabit, addHabit, deleteHabit, restoreHabit, permanentDeleteHabit, clearTrash,
    logValue, toggleCheckbox, toggleAvoid, addTime, isHabitSuccessful,
  } = useHabits()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<'build' | 'avoid'>('build')
  const [type, setType] = useState<'checkbox' | 'time' | 'quantity'>('checkbox')
  const [targetValue, setTargetValue] = useState('')
  const [showTrash, setShowTrash] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const finalType = kind === 'avoid' ? 'checkbox' : type
    const finalTarget = finalType === 'checkbox' ? 0 : Number(targetValue)

    if (finalType !== 'checkbox' && !targetValue) return

    addHabit({
      title: title.trim(),
      description: description.trim(),
      kind,
      type: finalType,
      targetValue: finalTarget,
      status: 'active',
    })
    setTitle('')
    setDescription('')
    setKind('build')
    setType('checkbox')
    setTargetValue('')
    setShowForm(false)
  }

  const activeHabits = habits.filter((h) => h.status === 'active')
  const buildHabits = activeHabits.filter((h) => h.kind === 'build')
  const avoidHabits = activeHabits.filter((h) => h.kind === 'avoid')
  const deletedHabits = habits.filter((h) => h.status === 'deleted')

  return (
    <div className="los-page space-y-10">
      <PageHeader title="Habits" subtitle="Build positive routines and break bad ones.">
        <Button onClick={() => setShowForm((p) => !p)}>{showForm ? 'Close' : 'New Habit'}</Button>
      </PageHeader>

      {showForm && (
        <Card>
          <h2 className="text-lg font-semibold text-los-text-primary mb-4">New Habit</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title..."
              className="los-input min-h-[44px] w-full"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="los-textarea w-full"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="los-section-label mb-2">Category</p>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as 'build' | 'avoid')}
                  className="los-select min-h-[44px] w-full"
                >
                  <option value="build">Build</option>
                  <option value="avoid">Avoid</option>
                </select>
              </div>
              {kind === 'build' && (
                <div>
                  <p className="los-section-label mb-2">Type</p>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'checkbox' | 'time' | 'quantity')}
                    className="los-select min-h-[44px] w-full"
                  >
                    <option value="checkbox">Checkbox</option>
                    <option value="time">Time (min)</option>
                    <option value="quantity">Quantity</option>
                  </select>
                </div>
              )}
            </div>
            {kind === 'build' && type !== 'checkbox' && (
              <div>
                <p className="los-section-label mb-2">
                  {type === 'time' ? 'Target (minutes)' : 'Target (quantity)'}
                </p>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 60"
                  min={1}
                  className="los-input min-h-[44px] w-full"
                />
              </div>
            )}
            <Button type="submit" disabled={!title.trim() || (kind === 'build' && type !== 'checkbox' && !targetValue)}>
              Create Habit
            </Button>
          </form>
        </Card>
      )}

      {activeHabits.length === 0 && !showForm && (
        <EmptyState
          title="Start a habit streak"
          action={{ label: 'Create your first habit', onClick: () => setShowForm(true) }}
        >
          You haven&apos;t created any habits yet. Small daily habits compound into big wins.
        </EmptyState>
      )}

      {buildHabits.length > 0 && (
        <div>
          <p className="los-section-label mb-4">Build Habits</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {buildHabits.map((habit) => {
              const entry = getEntryForHabit(habit.id)
              const currentValue = entry ? entry.value : 0
              const done = isHabitSuccessful(habit.id)
              const progress = habit.targetValue > 0
                ? Math.min(Math.round((currentValue / habit.targetValue) * 100), 100)
                : done ? 100 : 0

              return (
                <Card key={habit.id} className="relative transition-all hover:border-los-border hover:shadow-los-card-hover">
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="absolute top-3 right-3 rounded p-1 text-los-text-muted/70 hover:text-los-text-secondary hover:bg-los-bg-secondary transition-colors"
                    title="Move to trash"
                    aria-label={`Move ${habit.title} to trash`}
                  >
                    <XIcon />
                  </button>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <p className="font-semibold text-los-text-primary">{habit.title}</p>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-600">Build</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-los-bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'los-progress-gold'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-los-text-muted">
                        {habit.type === 'time' ? `${currentValue}/${habit.targetValue} min` :
                         habit.type === 'quantity' ? `${currentValue}/${habit.targetValue}` :
                         done ? '✔' : '—'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {habit.type === 'checkbox' && (
                        <Button variant={done ? 'secondary' : 'primary'} size="sm" onClick={() => toggleCheckbox(habit.id)}>
                          {done ? 'Undo' : 'Done'}
                        </Button>
                      )}
                      {habit.type === 'time' && (
                        <>
                          <Button variant="secondary" size="sm" onClick={() => addTime(habit.id, 15)}>+15 min</Button>
                          <Button variant="secondary" size="sm" onClick={() => addTime(habit.id, 30)}>+30 min</Button>
                          <Button variant="secondary" size="sm" onClick={() => addTime(habit.id, 60)}>+60 min</Button>
                        </>
                      )}
                      {habit.type === 'quantity' && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const data = new FormData(e.currentTarget)
                            const val = Number(data.get('value'))
                            if (val > 0) logValue(habit.id, val)
                            e.currentTarget.reset()
                          }}
                          className="flex gap-2 w-full"
                        >
                          <input
                            name="value"
                            type="number"
                            placeholder="Quantity"
                            className="los-input min-h-[36px] min-w-0 flex-1"
                          />
                          <Button type="submit" variant="secondary" size="sm">OK</Button>
                        </form>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {avoidHabits.length > 0 && (
        <div>
          <p className="los-section-label mb-4">Avoid Habits</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {avoidHabits.map((habit) => {
              const entry = getEntryForHabit(habit.id)
              const avoided = isHabitSuccessful(habit.id)

              return (
                <Card key={habit.id} className="relative transition-all hover:border-los-border hover:shadow-los-card-hover">
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="absolute top-3 right-3 rounded p-1 text-los-text-muted/70 hover:text-los-text-secondary hover:bg-los-bg-secondary transition-colors"
                    title="Move to trash"
                    aria-label={`Move ${habit.title} to trash`}
                  >
                    <XIcon />
                  </button>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <p className="font-semibold text-los-text-primary">{habit.title}</p>
                      <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-600">Avoid</span>
                    </div>
                    {entry && (
                      <p className="text-sm font-medium text-red-500 flex items-center gap-1">
                        <span>✘</span> Done today
                      </p>
                    )}
                    {!entry && (
                      <p className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                        <span>✔</span> Not done
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant={avoided ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => toggleAvoid(habit.id)}
                      >
                        {avoided ? 'Done today' : 'Not done'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {deletedHabits.length > 0 && (
        <div>
          <button
            onClick={() => setShowTrash((p) => !p)}
            className="flex items-center justify-between w-full text-sm text-los-text-muted hover:text-los-text-primary transition-colors mb-4"
          >
            <span className="font-medium">Deleted Habits ({deletedHabits.length})</span>
            <svg
              className={`size-4 transition-transform ${showTrash ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTrash && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {deletedHabits.map((habit) => (
                  <Card key={habit.id} className="opacity-60">
                    <div className="space-y-2">
                      <p className="font-semibold text-los-text-primary">{habit.title}</p>
                      {habit.description && (
                        <p className="text-sm text-los-text-secondary">{habit.description}</p>
                      )}
                      <p className="text-xs text-los-text-muted">
                        {habit.kind === 'build' ? 'Build' : 'Avoid'} · {habit.type}
                        {habit.type !== 'checkbox' && ` · Target: ${habit.targetValue}`}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button variant="secondary" size="sm" onClick={() => restoreHabit(habit.id)}>
                          Restore
                        </Button>
                        <Button
                          variant="dangerGhost"
                          size="sm"
                          onClick={() => permanentDeleteHabit(habit.id)}
                        >
                          Permanently Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
