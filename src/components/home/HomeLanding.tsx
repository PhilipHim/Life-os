import type { ReactNode } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'

const features = [
  {
    title: 'Tasks',
    description: 'Capture work, set priorities, and track completion across your day.',
    href: '/work',
  },
  {
    title: 'Habits',
    description: 'Build positive routines and break bad ones with daily tracking and streaks.',
    href: '/habits',
  },
  {
    title: 'Journal',
    description: 'Reflect on mood, energy, wins, and lessons to stay intentional.',
    href: '/life-os',
  },
  {
    title: 'Sleep',
    description: 'Log sleep quality, optimize wake times, and connect rest to performance.',
    href: '/life-os',
  },
  {
    title: 'Health',
    description: 'Track daily health signals and illness streaks in one place.',
    href: '/life-os',
  },
  {
    title: 'Finance',
    description: 'Monitor assets, watchlists, and portfolio performance over time.',
    href: '/life-os',
  },
  {
    title: 'Character Development',
    description: 'Level up personal traits and invest in long-term self-improvement.',
    href: '/life-os',
  },
  {
    title: 'Business Ideas',
    description: 'Capture ideas, analyze opportunities, and turn insights into projects.',
    href: '/life-os',
  },
  {
    title: 'AI Coach',
    description: 'Get structured guidance on productivity, habits, and weekly priorities.',
    href: '/dashboard',
  },
  {
    title: 'Analytics',
    description: 'Review trends, patterns, and AI-powered weekly and monthly insights.',
    href: '/analytics',
  },
] as const

const philosophy = [
  {
    word: 'Measure',
    detail: 'Track what matters — tasks, habits, sleep, health, and growth.',
  },
  {
    word: 'Improve',
    detail: 'Use scores and trends to make small, deliberate adjustments.',
  },
  {
    word: 'Reflect',
    detail: 'Journal, review analytics, and learn from your own data.',
  },
  {
    word: 'Repeat',
    detail: 'Turn insights into systems you run every day.',
  },
] as const

const vision = [
  {
    title: 'AI Coaching',
    description: 'Personalized guidance that adapts to your habits, scores, and goals.',
  },
  {
    title: 'Personal Analytics',
    description: 'Deep trend analysis and pattern detection across every area of life.',
  },
  {
    title: 'Goal Tracking',
    description: 'Connect daily actions to long-term outcomes you care about.',
  },
  {
    title: 'Business Development',
    description: 'From idea capture to structured roadmaps and execution.',
  },
  {
    title: 'Continuous Self Improvement',
    description: 'A single system for becoming who you want to be.',
  },
] as const

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{children}</p>
  )
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full p-5 transition-all duration-200 group-hover:border-gray-300 group-hover:shadow-md group-hover:-translate-y-0.5">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        <span className="mt-4 inline-block text-xs font-medium text-gray-400 transition-colors group-hover:text-gray-900">
          Open →
        </span>
      </Card>
    </Link>
  )
}

export default function HomeLanding() {
  return (
    <div className="space-y-20 pb-8 md:space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 px-6 py-12 shadow-sm md:px-12 md:py-16">
        <div className="relative max-w-2xl">
          <SectionLabel>Personal Growth System</SectionLabel>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            ASCEND
          </h1>
          <p className="mt-4 text-lg font-medium leading-relaxed text-gray-700 md:text-xl">
            Build your character through systems, data, and intentional growth.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 md:text-base">
            One place to plan your day, track habits, monitor health, manage finances,
            and grow — backed by analytics and AI coaching.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* About */}
      <section>
        <SectionLabel>About</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">Built by Philip</h2>
        <Card className="mt-6 p-6 md:p-8">
          <p className="text-sm leading-relaxed text-gray-600 md:text-base">
            ASCEND was created to combine productivity, health,
            learning, finance, and personal growth into one place. Instead of juggling separate apps
            and scattered notes, it brings daily execution and long-term reflection together —
            so you can see the full picture and improve with intention.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Designed for people who want clarity, consistency, and measurable progress — not
            another to-do list, but a system for living well.
          </p>
        </Card>
      </section>

      {/* Features */}
      <section>
        <SectionLabel>Features</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Everything in one system
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
          From morning planning to evening reflection — each module connects to your scores,
          analytics, and coaching.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section>
        <SectionLabel>Philosophy</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Measure. Improve. Reflect. Repeat.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
          ASCEND is built on a simple loop: capture honest data, act on what it shows,
          reflect on the results, and refine your systems over time.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {philosophy.map((item) => (
            <Card key={item.word} className="p-5 text-center">
              <p className="text-lg font-bold text-gray-900">{item.word}</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{item.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Project Vision */}
      <section>
        <SectionLabel>Project Vision</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Where ASCEND is heading
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
          This is an evolving platform — focused on helping you make better decisions with
          better information.
        </p>
        <Card className="mt-8 p-6 md:p-8">
          <ul className="grid gap-6 sm:grid-cols-2">
            {vision.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                  →
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Footer CTA */}
      <section className="text-center">
        <p className="text-sm text-gray-500">Ready to start your day?</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
        >
          Open Dashboard
        </Link>
      </section>
    </div>
  )
}
