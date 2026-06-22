'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import { StatCard } from '@/components/analytics/AnalyticsSection'
import { buildProfileData, type ProfileData } from '@/lib/profile'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import {
  LevelHero,
  XpStatCard,
  AchievementCard,
  TitleCard,
  ProgressionSection,
  ProgressionSubheading,
} from '@/components/progression'
import { getProfileSettings, saveProfileSettings, saveActiveTitle } from '@/lib/db/profile'
import { StarIcon, MountainIcon, CrownIcon, TrophyIcon } from '@/design-system/icons'

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
      <div className="los-page space-y-8">
        <header className="los-page-header">
          <h1 className="los-page-title">Profile</h1>
        </header>
        <Card>
          <p className="text-center text-sm text-los-text-muted py-8">Loading profile…</p>
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
    <div className="los-page space-y-12">
      <header className="los-page-header">
        <h1 className="los-page-title">Profile</h1>
        <p className="text-los-text-secondary">Your identity, progress, and growth inside Life OS.</p>
      </header>

      <LevelHero displayName={displayName} onNameChange={handleNameChange} progress={progress} />

      <ProgressionSection
        title="XP Progress"
        subtitle="Earned from tasks, habits, journal, sleep, and health"
        icon={<StarIcon size={20} />}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <XpStatCard label="Today" value={`+${xpHistory.daily}`} sublabel="Daily XP earned" highlight />
          <XpStatCard label="This Week" value={`+${xpHistory.weekly}`} sublabel="Mon – Sun" />
          <XpStatCard label="This Month" value={`+${xpHistory.monthly}`} sublabel="Calendar month" />
        </div>
      </ProgressionSection>

      <ProgressionSection
        title="Challenges"
        subtitle={`Daily ${challenges.dailyCompleted}/${challenges.daily.length} · Weekly ${challenges.weeklyCompleted}/${challenges.weekly.length} · Short-term goals with bonus XP`}
        icon={<MountainIcon size={20} />}
      >
        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <XpStatCard
            label="Daily Progress"
            value={`${challenges.dailyCompleted} / ${challenges.daily.length}`}
            sublabel={`+${challenges.dailyXpEarned} of ${challenges.dailyXpAvailable} XP earned`}
            highlight
          />
          <XpStatCard
            label="Weekly Progress"
            value={`${challenges.weeklyCompleted} / ${challenges.weekly.length}`}
            sublabel={`+${challenges.weeklyXpEarned} of ${challenges.weeklyXpAvailable} XP earned`}
          />
          <XpStatCard
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
          <ProgressionSubheading>Daily Challenges</ProgressionSubheading>
          {challenges.daily.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.daily.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-center text-sm text-los-text-muted py-6">
                Daily challenges refresh each morning.
              </p>
            </Card>
          )}
        </div>

        <div>
          <ProgressionSubheading>Weekly Challenges</ProgressionSubheading>
          {challenges.weekly.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.weekly.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-center text-sm text-los-text-muted py-6">
                Weekly challenges refresh each Monday.
              </p>
            </Card>
          )}
        </div>
      </ProgressionSection>

      <section>
        <div className="mb-4">
          <h2 className="los-section-heading">Profile Stats</h2>
          <p className="text-sm text-los-text-secondary mt-0.5">Lifetime activity and performance averages</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Tasks Completed" value={String(stats.tasksCompleted)} />
          <StatCard label="Habits Completed" value={String(stats.habitsCompleted)} sublabel="Successful habit days" />
          <StatCard label="Journal Entries" value={String(stats.journalEntries)} />
          <StatCard
            label="Days Without Sickness"
            value={String(stats.daysWithoutSickness)}
            sublabel="Current wellness streak"
            valueClassName={stats.daysWithoutSickness > 0 ? 'text-los-success' : 'text-los-text-primary'}
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

      <ProgressionSection
        title="Titles"
        subtitle={`${titles.unlockedCount} of ${titles.titles.length} unlocked · ${titles.activeTitle.name} is active`}
        icon={<CrownIcon size={20} />}
      >
        {unlockedTitles.length > 0 && (
          <div className="mb-8">
            <ProgressionSubheading variant="unlocked">Unlocked ({unlockedTitles.length})</ProgressionSubheading>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unlockedTitles.map((title) => (
                <TitleCard key={title.id} title={title} onSelect={handleTitleSelect} />
              ))}
            </div>
          </div>
        )}

        {lockedTitles.length > 0 && (
          <div>
            <ProgressionSubheading variant="locked">Locked ({lockedTitles.length})</ProgressionSubheading>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lockedTitles.map((title) => (
                <TitleCard key={title.id} title={title} onSelect={handleTitleSelect} />
              ))}
            </div>
          </div>
        )}
      </ProgressionSection>

      <ProgressionSection
        title="Achievements"
        subtitle={`${unlockedCount} of ${achievements.length} unlocked · Rewards for meaningful long-term behavior`}
        icon={<TrophyIcon size={20} />}
      >
        {unlockedAchievements.length > 0 && (
          <div className="mb-8">
            <ProgressionSubheading variant="unlocked">
              Unlocked ({unlockedAchievements.length})
            </ProgressionSubheading>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {lockedAchievements.length > 0 && (
          <div>
            <ProgressionSubheading variant="locked">Locked ({lockedAchievements.length})</ProgressionSubheading>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lockedAchievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        )}

        {achievements.length === 0 && (
          <Card>
            <p className="text-center text-sm text-los-text-muted py-8">
              Complete tasks, journal, habits, and health tracking to earn achievements.
            </p>
          </Card>
        )}
      </ProgressionSection>
    </div>
  )
}
