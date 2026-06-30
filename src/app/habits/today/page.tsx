'use client'

import Link from 'next/link'
import { useHabits } from '@/contexts/HabitContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/common/EmptyState'
import PageHeader from '@/components/layout/PageHeader'

export default function TodayPage() {
  const {
    habits, getEntryForHabit, isHabitSuccessful,
    toggleCheckbox, toggleAvoid, addTime, logValue,
    buildDone, buildTotal, avoidSuccess, avoidTotal,
  } = useHabits()

  const activeHabits = habits.filter((h) => h.status === 'active')
  const buildHabits = activeHabits.filter((h) => h.kind === 'build')
  const avoidHabits = activeHabits.filter((h) => h.kind === 'avoid')

  const allDone = buildDone + avoidSuccess
  const allTotal = buildTotal + avoidTotal

  return (
    <div className="los-page space-y-10">
      <PageHeader title="Today" subtitle="Track today's habit progress.">
        <Link href="/habits">
          <Button variant="secondary" size="sm">All Habits</Button>
        </Link>
      </PageHeader>

      {allTotal > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="los-section-label">Progress</p>
            <p className="text-sm text-los-text-secondary">{allDone} / {allTotal}</p>
          </div>
          <div className="h-2 rounded-full bg-los-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${allTotal > 0 ? (allDone / allTotal) * 100 : 0}%` }}
            />
          </div>
        </Card>
      )}

      {activeHabits.length === 0 && (
        <EmptyState>
          No active habits.{' '}
          <Link href="/habits" className="text-los-gold underline hover:text-los-gold-light">
            Create Habits
          </Link>
        </EmptyState>
      )}

      {buildHabits.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-los-text-primary">Build</h2>
            <span className="text-sm text-los-text-muted">{buildDone}/{buildTotal}</span>
          </div>
          <div className="space-y-3">
            {buildHabits.map((habit) => {
              const entry = getEntryForHabit(habit.id)
              const currentValue = entry ? entry.value : 0
              const done = isHabitSuccessful(habit.id)
              const progress = habit.targetValue > 0
                ? Math.min(Math.round((currentValue / habit.targetValue) * 100), 100)
                : done ? 100 : 0

              return (
                <Card key={habit.id} variant="interactive">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className={`shrink-0 text-lg ${done ? 'text-green-500' : 'text-los-text-muted'}`}>
                      {done ? '✔' : '○'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${done ? 'text-los-text-muted line-through' : 'text-los-text-primary'}`}>
                        {habit.title}
                      </p>
                      {habit.type !== 'checkbox' && (
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-los-bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'los-progress-gold'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-xs text-los-text-muted">
                            {habit.type === 'time' ? `${currentValue}/${habit.targetValue} min` : `${currentValue}/${habit.targetValue}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-wrap gap-2">
                      {habit.type === 'checkbox' && (
                        <Button size="sm" variant={done ? 'secondary' : 'primary'} onClick={() => toggleCheckbox(habit.id)}>
                          {done ? 'Undo' : 'Done'}
                        </Button>
                      )}
                      {habit.type === 'time' && (
                        <div className="flex gap-1">
                          <Button variant="secondary" size="sm" onClick={() => addTime(habit.id, 15)}>+15</Button>
                          <Button variant="secondary" size="sm" onClick={() => addTime(habit.id, 30)}>+30</Button>
                          <Button variant="secondary" size="sm" onClick={() => addTime(habit.id, 60)}>+60</Button>
                        </div>
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
                          className="flex gap-2"
                        >
                          <input
                            name="value"
                            type="number"
                            placeholder="Menge"
                            className="los-input min-h-[36px] w-20"
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
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-los-text-primary">Avoid</h2>
            <span className="text-sm text-los-text-muted">{avoidSuccess}/{avoidTotal}</span>
          </div>
          <div className="space-y-3">
            {avoidHabits.map((habit) => {
              const avoided = isHabitSuccessful(habit.id)
              const entry = getEntryForHabit(habit.id)
              return (
                <Card key={habit.id} variant="interactive">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className={`shrink-0 text-lg ${avoided ? 'text-green-500' : 'text-red-400'}`}>
                      {avoided ? '✔' : '✘'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${avoided ? 'text-los-text-primary' : 'text-red-500'}`}>
                        {habit.title}
                      </p>
                      {entry && (
                        <p className="text-xs text-red-400 mt-0.5">Done today</p>
                      )}
                      {!entry && (
                        <p className="text-xs text-green-500 mt-0.5">Not done</p>
                      )}
                    </div>
                    <Button size="sm" variant={avoided ? 'secondary' : 'primary'} onClick={() => toggleAvoid(habit.id)}>
                      {avoided ? 'Done today' : 'Not done'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
