'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  getFirstExperienceState,
  isFirstExperienceComplete,
} from '@/database/first-experience'
import type { FirstExperienceState } from '@/types/first-experience'
import { isFirstMissionComplete } from '@/database/user-profile'
import {
  checkFirstMissionCompletion,
  maybeAutoCompleteForVeteran,
} from '@/lib/first-experience/mission'

export function useFirstExperience() {
  const { user } = useAuth()
  const [state, setState] = useState<FirstExperienceState>(
    typeof window === 'undefined'
      ? ({ ...getFirstExperienceState() } as FirstExperienceState)
      : getFirstExperienceState()
  )
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setState(getFirstExperienceState())
    setActive(!isFirstExperienceComplete())
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (user?.id) {
        const remoteComplete = await isFirstMissionComplete(user.id)
        if (remoteComplete) {
          const { markFirstExperienceComplete } = await import('@/database/first-experience')
          markFirstExperienceComplete()
        }
      }

      maybeAutoCompleteForVeteran(user?.id)
      checkFirstMissionCompletion(user?.id)

      if (!cancelled) {
        refresh()
        setReady(true)
      }
    }

    void init()

    const onUpdate = () => {
      refresh()
      checkFirstMissionCompletion(user?.id)
    }

    window.addEventListener('first-experience-updated', onUpdate)
    window.addEventListener('first-mission-completed', onUpdate)
    window.addEventListener('xp-updated', onUpdate)

    return () => {
      cancelled = true
      window.removeEventListener('first-experience-updated', onUpdate)
      window.removeEventListener('first-mission-completed', onUpdate)
      window.removeEventListener('xp-updated', onUpdate)
    }
  }, [user?.id, refresh])

  return {
    ready,
    active,
    state,
    refresh,
  }
}
