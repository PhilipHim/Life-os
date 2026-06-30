'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import FocusOverlay from '@/components/layout/FocusOverlay'
import LevelUpListener from '@/components/features/profile/LevelUpListener'
import FirstMissionCelebration from '@/components/features/first-experience/FirstMissionCelebration'

const AUTH_ROUTE_PATTERN = /^\/(login|register|forgot-password|reset-password)(\/|$)/
const ONBOARDING_ROUTE = '/onboarding'

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTE_PATTERN.test(pathname)
  const isLanding = pathname === '/'
  const isOnboarding = pathname === ONBOARDING_ROUTE

  if (isAuthRoute || isLanding || isOnboarding) {
    return (
      <main className="los-main mx-auto w-full max-w-3xl flex-1 overflow-x-clip px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <main className="los-main mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 py-6 sm:px-8 sm:py-10 md:py-14">
        {children}
      </main>
      <FocusOverlay />
      <LevelUpListener />
      <FirstMissionCelebration />
    </>
  )
}
