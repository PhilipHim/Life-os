import type { ReactNode } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import FaqSection from '@/components/home/FaqSection'
import FeedbackSection from '@/components/home/FeedbackSection'

const VERSION = '0.1.0'
const GITHUB_URL = 'https://github.com/PhilipHim/Life-os'

const features = [
  {
    title: 'AI Coach',
    description: 'Structured guidance on productivity, habits, and weekly priorities — powered by your own data.',
    href: '/dashboard',
    accent: 'from-violet-500/10 to-violet-500/5',
  },
  {
    title: 'Smart Planner',
    description: 'Build today\'s execution queue with priorities, breaks, routines, and drag-and-drop flexibility.',
    href: '/plan',
    accent: 'from-blue-500/10 to-blue-500/5',
  },
  {
    title: 'Analytics',
    description: 'Trends, patterns, and AI-powered weekly and monthly reviews across every area of life.',
    href: '/analytics',
    accent: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    title: 'RPG Progression',
    description: 'Earn XP, level up, and invest in character traits as you complete real-world actions.',
    href: '/profile',
    accent: 'from-amber-500/10 to-amber-500/5',
  },
  {
    title: 'Health',
    description: 'Track daily health signals, illness streaks, and how your body affects performance.',
    href: '/life-os',
    accent: 'from-rose-500/10 to-rose-500/5',
  },
  {
    title: 'Sleep',
    description: 'Log sleep quality, optimize wake times, and connect rest to your daily scores.',
    href: '/life-os',
    accent: 'from-indigo-500/10 to-indigo-500/5',
  },
  {
    title: 'Finance',
    description: 'Monitor assets, watchlists, and portfolio performance in one unified view.',
    href: '/life-os',
    accent: 'from-teal-500/10 to-teal-500/5',
  },
  {
    title: 'Routines',
    description: 'Reusable step-by-step checklists you can nest, repeat, and schedule into the Planner.',
    href: '/routines',
    accent: 'from-fuchsia-500/10 to-fuchsia-500/5',
  },
] as const

const howItWorks = [
  {
    step: '01',
    title: 'Track',
    description: 'Log tasks, habits, health, sleep, and finances — capture honest data about your life.',
  },
  {
    step: '02',
    title: 'Plan',
    description: 'Turn priorities into an execution queue. Schedule routines and focus on what matters today.',
  },
  {
    step: '03',
    title: 'Improve',
    description: 'Review analytics, reflect in your journal, and adjust with AI coaching insights.',
  },
  {
    step: '04',
    title: 'Level Up',
    description: 'Earn XP, grow your character, and compound small wins into long-term transformation.',
  },
] as const

const roadmapCompleted = [
  'Task management & work groups',
  'Smart Planner with routines integration',
  'Habits tracking & daily check-ins',
  'AI Coach & weekly reviews',
  'Analytics dashboard',
  'RPG profile, XP & leveling',
  'Life OS — health, sleep & finance',
  'Focus mode & execution tracking',
] as const

const roadmapPlanned = [
  'Native mobile app',
  'Cloud sync & backup',
  'Calendar integrations',
  'Deeper AI insights & coaching',
  'Shared goals & accountability',
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
  accent,
}: {
  title: string
  description: string
  href: string
  accent: string
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="relative h-full overflow-hidden border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 group-hover:border-gray-300 group-hover:shadow-md group-hover:-translate-y-0.5">
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
        />
        <div className="relative">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors group-hover:text-gray-900">
            Explore
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </Card>
    </Link>
  )
}

function FlowArrow() {
  return (
    <div className="hidden shrink-0 items-center justify-center text-gray-300 lg:flex" aria-hidden>
      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </div>
  )
}

export default function HomeLanding() {
  return (
    <div className="space-y-20 pb-4 md:space-y-28">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 px-6 py-12 shadow-sm md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gray-100/80 blur-3xl" />
        <div className="relative max-w-2xl">
          <SectionLabel>Personal Growth Operating System</SectionLabel>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            ASCEND
          </h1>
          <p className="mt-4 text-lg font-medium leading-relaxed text-gray-700 md:text-xl">
            Build your character through systems, data, and intentional growth.
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-500 md:text-base">
            One place to plan your day, track habits, monitor health, manage finances,
            and grow — backed by analytics and AI coaching.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gray-800 hover:shadow-md"
            >
              Open Dashboard
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features">
        <SectionLabel>Features</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Everything you need to grow
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
          Eight interconnected modules — from daily execution to long-term progression.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* Why ASCEND */}
      <section id="why">
        <SectionLabel>Why ASCEND</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Not just another productivity app
        </h2>
        <Card className="mt-8 border-gray-200 bg-white p-6 shadow-sm md:p-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-base leading-relaxed text-gray-700 md:text-lg">
              ASCEND is a{' '}
              <span className="font-semibold text-gray-900">Personal Growth Operating System</span>{' '}
              designed to help you continuously improve every area of your life.
            </p>
            <p className="text-sm leading-relaxed text-gray-500 md:text-base">
              Most tools optimize a single slice — tasks, habits, or fitness. ASCEND connects them
              all: your planner, health signals, finances, and character progression feed the same
              analytics engine and AI coach. You see the full picture, act with clarity, and compound
              progress over months and years.
            </p>
            <p className="text-sm leading-relaxed text-gray-500 md:text-base">
              Built for people who want measurable growth — not scattered apps and forgotten goals,
              but one system for living well and becoming who you want to be.
            </p>
          </div>
          <div className="mt-8 grid gap-4 border-t border-gray-100 pt-8 sm:grid-cols-3">
            {[
              { label: 'Unified', detail: 'One system for every life domain' },
              { label: 'Data-driven', detail: 'Scores and trends guide decisions' },
              { label: 'Long-term', detail: 'RPG progression rewards consistency' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* How It Works */}
      <section id="how-it-works">
        <SectionLabel>How It Works</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          A simple loop for continuous growth
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
          Track honestly, plan deliberately, improve with insight, and level up over time.
        </p>
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
          {howItWorks.map((item, index) => (
            <div key={item.title} className="flex flex-1 items-stretch gap-3">
              <Card className="flex-1 border-gray-200 bg-white p-5 text-center shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Step {item.step}
                </p>
                <p className="mt-2 text-xl font-bold text-gray-900">{item.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
              </Card>
              {index < howItWorks.length - 1 && <FlowArrow />}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs font-medium tracking-wide text-gray-400">
          Track → Plan → Improve → Level Up
        </p>
      </section>

      {/* Roadmap */}
      <section id="roadmap">
        <SectionLabel>Roadmap</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Built in public
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
          ASCEND is actively evolving. Here is what ships today and what is coming next.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-900">
                Completed
              </h3>
            </div>
            <ul className="mt-5 space-y-3">
              {roadmapCompleted.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-gray-300" />
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-900">
                Planned
              </h3>
            </div>
            <ul className="mt-5 space-y-3">
              {roadmapPlanned.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                    ○
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Common questions
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
          Everything you need to know before getting started.
        </p>
        <FaqSection />
      </section>

      {/* Feedback */}
      <section id="feedback">
        <SectionLabel>Community</SectionLabel>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Help Shape ASCEND
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
          ASCEND is actively evolving. Every suggestion, bug report, and idea helps improve the
          experience for everyone. We genuinely read all feedback.
        </p>
        <FeedbackSection />
      </section>

      {/* CTA */}
      <section className="text-center">
        <Card className="border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-8 shadow-md md:p-12">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Get started
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Ready to build your character?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-gray-400">
            Open your dashboard and start tracking, planning, and leveling up today.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-100"
          >
            Open Dashboard
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="-mx-4 border-t border-gray-200 bg-gray-50 px-4 py-10 sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-heading text-lg font-bold text-gray-900">ASCEND</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">
              Personal Growth Operating System — built for continuous improvement across every area of
              life.
            </p>
            <p className="mt-3 text-[10px] font-medium uppercase tracking-widest text-gray-400">
              Version {VERSION}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              GitHub
            </a>
            <a
              href="#privacy"
              className="font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Privacy
            </a>
            <a
              href="mailto:hello@ascend.app"
              className="font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Contact
            </a>
          </nav>
        </div>
        <p className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} ASCEND. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
