import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import FocusOverlay from '@/components/FocusOverlay'
import { WorkItemProvider } from '@/lib/WorkItemContext'
import { FocusProvider } from '@/lib/FocusContext'
import { HabitProvider } from '@/lib/HabitContext'
import { DailyPlanProvider } from '@/lib/DailyPlanContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Productivity OS',
  description: 'Your personal productivity dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">
        <WorkItemProvider>
          <FocusProvider>
            <HabitProvider>
              <DailyPlanProvider>
                <Navbar />
                <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
                  {children}
                </main>
                <FocusOverlay />
              </DailyPlanProvider>
            </HabitProvider>
          </FocusProvider>
        </WorkItemProvider>
      </body>
    </html>
  )
}
