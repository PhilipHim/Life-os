'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import { StatCard } from '@/components/analytics/AnalyticsSection'
import { buildProfileData, type ProfileData, type Achievement } from '@/lib/profile'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import type { UserTitle } from '@/lib/titles/definitions'
import { ACHIEVEMENT_CATEGORY_LABELS } from '@/lib/achievements'
import { getProfileSettings, saveProfileSettings, saveActiveTitle } from '@/lib/db/profile'

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function ProfileHeader({
  displayName,
  onNameChange,
  progress,
}: {
  displayName: string
  onNameChange: (name: string) => void
  progress: ProfileData['progress']
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(displayName)

  useEffect(() => {
    setDraft(displayName)
  }, [displayName])

  const commitName = () => {
    const trimmed = draft.trim() || 'Explorer'
    onNameChange(trimmed)
    setDraft(trimmed)
    setEditing(false)
  }

  return (
    <Card className="relative overflow-hidden border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 p-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-400" />

      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
                if (e.key === 'Escape') {
                  setDraft(displayName)
                  setEditing(false)
                }
              }}
              className="w-full max-w-xs border-b-2 border-gray-900 bg-transparent text-3xl font-bold tracking-tight text-gray-900 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-left text-3xl font-bold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
              title="Click to edit name"
            >
              {displayName}
            </button>
          )}

          <p className="text-lg font-medium text-gray-600">{progress.title}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span>
              Level <span className="font-semibold text-gray-900">{progress.level}</span>
            </span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span className="tabular-nums">
              <span className="font-semibold text-gray-900">{progress.xpRemaining.toLocaleString()}</span>
              {' XP needed for Level '}
              {progress.level + 1}
            </span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span className="tabular-nums">
              {progress.currentXp.toLocaleString()} / {progress.xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
        </div>

        <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
          <span className="text-3xl font-bold tabular-nums text-gray-900">{progress.level}</span>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-gray-400">
          <span>Level {progress.level} → {progress.level + 1}</span>
          <span className="tabular-nums">{progress.progressPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-700"
            style={{ width: `${progress.progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 tabular-nums">
          {progress.totalXp.toLocaleString()} total XP earned
        </p>
      </div>
    </Card>
  )
}

function formatUnlockDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function TitleCard({
  title,
  onSelect,
}: {
  title: UserTitle
  onSelect: (id: string) => void
}) {
  return (
    <div
      className={
        title.unlocked
          ? title.isActive
            ? 'rounded-xl border-2 border-gray-900 bg-white p-5 shadow-sm'
            : 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
          : 'rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-5'
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
          Title
        </span>
        <span
          className={
            title.unlocked
              ? title.isActive
                ? 'text-[10px] font-semibold uppercase tracking-wider text-gray-900'
                : 'text-[10px] font-semibold uppercase tracking-wider text-green-600'
              : 'text-[10px] font-semibold uppercase tracking-wider text-gray-400'
          }
        >
          {title.isActive ? 'Active' : title.unlocked ? 'Unlocked' : 'Locked'}
        </span>
      </div>

      <h3 className={`text-lg font-semibold ${title.unlocked ? 'text-gray-900' : 'text-gray-600'}`}>
        {title.name}
      </h3>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{title.description}</p>

      {title.unlocked ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {title.unlockedAt ? `Unlocked ${formatUnlockDate(title.unlockedAt)}` : 'Unlocked'}
          </p>
          {!title.isActive && (
            <button
              type="button"
              onClick={() => onSelect(title.id)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Select
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-2">
            Unlock via
          </p>
          <ul className="space-y-1">
            {title.conditions.map((condition) => (
              <li key={condition.label} className="text-xs text-gray-500 flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">·</span>
                <span>{condition.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={
        achievement.unlocked
          ? 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
          : 'rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-5'
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
          {ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}
        </span>
        <span
          className={
            achievement.unlocked
              ? 'text-[10px] font-semibold uppercase tracking-wider text-green-600'
              : 'text-[10px] font-semibold uppercase tracking-wider text-gray-400'
          }
        >
          {achievement.unlocked ? 'Unlocked' : 'Locked'}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div
          className={
            achievement.unlocked
              ? 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white text-sm font-bold'
              : 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-400 text-sm font-bold'
          }
        >
          {achievement.unlocked ? '✓' : '○'}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-600'}`}>
            {achievement.title}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{achievement.description}</p>
        </div>
      </div>

      {achievement.unlocked ? (
        <p className="mt-4 text-xs text-gray-400">
          Unlocked {achievement.unlockedAt ? formatUnlockDate(achievement.unlockedAt) : 'recently'}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span className="tabular-nums font-medium text-gray-700">
              {achievement.progressLabel}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-500"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 tabular-nums">{achievement.progress}% complete</p>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('Explorer')
  const [profile, setProfile] = useState<ProfileData | null>(null)

  const refresh = useCallback(() => {
    setProfile(buildProfileData())
  }, [])

  useEffect(() => {
    setDisplayName(getProfileSettings().displayName)
    refresh()

    const onXpUpdated = () => refresh()
    const onFocus = () => refresh()
    window.addEventListener('xp-updated', onXpUpdated)
    window.addEventListener('challenges-updated', onXpUpdated)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('xp-updated', onXpUpdated)
      window.removeEventListener('challenges-updated', onXpUpdated)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  const handleNameChange = (name: string) => {
    const current = getProfileSettings()
    saveProfileSettings({ ...current, displayName: name, updatedAt: Date.now() })
    setDisplayName(name)
  }

  const handleTitleSelect = (titleId: string) => {
    saveActiveTitle(titleId)
    refresh()
  }

  if (!profile) {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
        <Card>
          <p className="text-center text-sm text-gray-400 py-8">Loading profile…</p>
        </Card>
      </div>
    )
  }

  const { stats, progress, achievements, titles, challenges, xpHistory } = profile
  const unlockedTitles = titles.titles.filter((t) => t.unlocked)
  const lockedTitles = titles.titles.filter((t) => !t.unlocked)
  const unlockedAchievements = achievements.filter((a) => a.unlocked)
  const lockedAchievements = achievements.filter((a) => !a.unlocked)
  const unlockedCount = unlockedAchievements.length
  const bestCurrentStreak = Math.max(
    stats.currentStreaks.habit,
    stats.currentStreaks.journal,
    stats.currentStreaks.focus
  )

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 text-gray-500">Your identity, progress, and growth inside Life OS.</p>
      </div>

      <ProfileHeader displayName={displayName} onNameChange={handleNameChange} progress={progress} />

      <section>
        <SectionHeading title="XP Progress" subtitle="Earned from tasks, habits, journal, sleep, and health" />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Today" value={`+${xpHistory.daily} XP`} sublabel="Daily XP" />
          <StatCard label="This Week" value={`+${xpHistory.weekly} XP`} sublabel="Mon – Sun" />
          <StatCard label="This Month" value={`+${xpHistory.monthly} XP`} sublabel="Calendar month" />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Challenges"
          subtitle={`Daily ${challenges.dailyCompleted}/${challenges.daily.length} · Weekly ${challenges.weeklyCompleted}/${challenges.weekly.length} · Short-term goals with bonus XP`}
        />

        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <StatCard
            label="Daily Progress"
            value={`${challenges.dailyCompleted} / ${challenges.daily.length}`}
            sublabel={`+${challenges.dailyXpEarned} of ${challenges.dailyXpAvailable} XP earned`}
          />
          <StatCard
            label="Weekly Progress"
            value={`${challenges.weeklyCompleted} / ${challenges.weekly.length}`}
            sublabel={`+${challenges.weeklyXpEarned} of ${challenges.weeklyXpAvailable} XP earned`}
          />
          <StatCard
            label="Today's Rewards"
            value={`+${challenges.dailyXpEarned} XP`}
            sublabel={
              challenges.dailyCompleted === challenges.daily.length && challenges.daily.length > 0
                ? 'All daily challenges complete'
                : `${challenges.daily.length - challenges.dailyCompleted} remaining today`
            }
          />
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Daily Challenges
          </h3>
          {challenges.daily.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.daily.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-center text-sm text-gray-400 py-6">Daily challenges refresh each morning.</p>
            </Card>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Weekly Challenges
          </h3>
          {challenges.weekly.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.weekly.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-center text-sm text-gray-400 py-6">Weekly challenges refresh each Monday.</p>
            </Card>
          )}
        </div>
      </section>

      <section>
        <SectionHeading title="Profile Stats" subtitle="Lifetime activity and performance averages" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tasks Completed" value={String(stats.tasksCompleted)} />
          <StatCard label="Habits Completed" value={String(stats.habitsCompleted)} sublabel="Successful habit days" />
          <StatCard label="Journal Entries" value={String(stats.journalEntries)} />
          <StatCard
            label="Days Without Sickness"
            value={String(stats.daysWithoutSickness)}
            sublabel="Current wellness streak"
            valueClassName={stats.daysWithoutSickness > 0 ? 'text-green-600' : 'text-gray-900'}
          />
          <StatCard
            label="Current Streaks"
            value={`${bestCurrentStreak} days`}
            sublabel={`Habit ${stats.currentStreaks.habit} · Journal ${stats.currentStreaks.journal} · Focus ${stats.currentStreaks.focus}`}
          />
          <StatCard
            label="Longest Habit Streak"
            value={`${stats.longestHabitStreak} days`}
            sublabel={stats.longestHabitName ? `"${stats.longestHabitName}"` : 'No active habits yet'}
          />
          <StatCard
            label="Life Score Average"
            value={stats.lifeScoreAverage != null ? `${stats.lifeScoreAverage}/100` : '—'}
            sublabel="Last 30 days"
          />
          <StatCard
            label="Productivity Score Average"
            value={stats.productivityScoreAverage != null ? `${stats.productivityScoreAverage}/100` : '—'}
            sublabel="Last 30 days"
          />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Titles"
          subtitle={`${titles.unlockedCount} of ${titles.titles.length} unlocked · ${titles.activeTitle.name} is active`}
        />

        {unlockedTitles.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-3">
              Unlocked ({unlockedTitles.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unlockedTitles.map((title) => (
                <TitleCard key={title.id} title={title} onSelect={handleTitleSelect} />
              ))}
            </div>
          </div>
        )}

        {lockedTitles.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Locked ({lockedTitles.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lockedTitles.map((title) => (
                <TitleCard key={title.id} title={title} onSelect={handleTitleSelect} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Achievements"
          subtitle={`${unlockedCount} of ${achievements.length} unlocked · Rewards for meaningful long-term behavior`}
        />

        {unlockedAchievements.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-green-600 mb-3">
              Unlocked ({unlockedAchievements.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {lockedAchievements.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Locked ({lockedAchievements.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {achievements.length === 0 && (
          <Card>
            <p className="text-center text-sm text-gray-400 py-8">
              Complete tasks, journal, habits, and health tracking to earn achievements.
            </p>
          </Card>
        )}
      </section>
    </div>
  )
}
