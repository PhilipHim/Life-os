import type { Metadata } from 'next'
import { Cinzel, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import FocusOverlay from '@/components/FocusOverlay'
import LevelUpListener from '@/components/profile/LevelUpListener'
import { WorkItemProvider } from '@/lib/WorkItemContext'
import { RoutineProvider } from '@/lib/RoutineContext'
import { TaskProvider } from '@/lib/TaskContext'
import { FocusProvider } from '@/lib/FocusContext'
import { HabitProvider } from '@/lib/HabitContext'
import { DailyPlanProvider } from '@/lib/DailyPlanContext'

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ASCEND',
  description: 'Build your character — personal growth, productivity, health, and mastery in one system.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} h-full antialiased`}>
      <body className="los-app-shell flex min-h-full flex-col font-body text-los-text-primary">
        <WorkItemProvider>
          <TaskProvider>
            <FocusProvider>
              <HabitProvider>
                <RoutineProvider>
                  <DailyPlanProvider>
                    <Navbar />
                    <main className="los-main mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8 sm:py-14">
                      {children}
                    </main>
                    <FocusOverlay />
                    <LevelUpListener />
                  </DailyPlanProvider>
                </RoutineProvider>
              </HabitProvider>
            </FocusProvider>
          </TaskProvider>
        </WorkItemProvider>
      </body>
    </html>
  )
}
