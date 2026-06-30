import type { Metadata } from 'next'
import { Cinzel, Inter } from 'next/font/google'
import './globals.css'
import AppChrome from '@/components/layout/AppChrome'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import {
  WorkItemProvider,
  TaskProvider,
  FocusProvider,
  HabitProvider,
  RoutineProvider,
  DailyPlanProvider,
} from '@/providers'

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
    <html lang="en" className={`${cinzel.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('ascend_settings')||'{}');var t=s.theme||'dark';var a=s.accent||'gold';document.documentElement.dataset.theme=t;document.documentElement.dataset.accent=a;}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.dataset.accent='gold';}})();`,
          }}
        />
      </head>
      <body className="los-app-shell flex min-h-full flex-col overflow-x-clip font-body text-los-text-primary">
        <AuthProvider>
          <ThemeProvider>
            <WorkItemProvider>
            <TaskProvider>
              <FocusProvider>
                <HabitProvider>
                  <RoutineProvider>
                    <DailyPlanProvider>
                      <AppChrome>{children}</AppChrome>
                    </DailyPlanProvider>
                  </RoutineProvider>
                </HabitProvider>
              </FocusProvider>
            </TaskProvider>
            </WorkItemProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
