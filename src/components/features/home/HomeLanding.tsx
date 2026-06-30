'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import FaqSection from '@/components/features/home/FaqSection'
import FeedbackSection from '@/components/features/home/FeedbackSection'
import { CompassIcon } from '@/design-system/icons'
import { losClasses } from '@/design-system/tokens'

const VERSION = '0.1.0'
const GITHUB_URL = 'https://github.com/PhilipHim/Life-os'

const features = [
  {
    title: 'AI Coach',
    description: 'Guidance on productivity, habits, and priorities — powered by your data.',
    href: '/dashboard',
  },
  {
    title: 'Smart Planner',
    description: 'Build today\'s queue with priorities, breaks, and routines.',
    href: '/plan',
  },
  {
    title: 'Analytics',
    description: 'Trends, patterns, and AI weekly and monthly reviews.',
    href: '/analytics',
  },
  {
    title: 'RPG Progression',
    description: 'Earn XP, level up, and grow your character over time.',
    href: '/profile',
  },
  {
    title: 'Health & Sleep',
    description: 'Track wellness signals and connect rest to performance.',
    href: '/life-os',
  },
  {
    title: 'Routines',
    description: 'Reusable checklists you can schedule into the Planner.',
    href: '/routines',
  },
] as const

const howItWorks = [
  {
    step: '01',
    title: 'Track',
    description: 'Log tasks, habits, health, and finances honestly.',
  },
  {
    step: '02',
    title: 'Plan',
    description: 'Turn priorities into today\'s execution queue.',
  },
  {
    step: '03',
    title: 'Improve',
    description: 'Review analytics and adjust with AI coaching.',
  },
  {
    step: '04',
    title: 'Level Up',
    description: 'Earn XP and compound small wins over time.',
  },
] as const

const roadmapCompleted = [
  'Task management & work groups',
  'Smart Planner with routines',
  'Habits & daily check-ins',
  'AI Coach & weekly reviews',
  'Analytics dashboard',
  'RPG profile, XP & leveling',
  'Life OS — health, sleep & finance',
  'Focus mode & execution tracking',
] as const

const roadmapPlanned = [
  'Calendar integration',
  'Deeper AI insights',
  'Friend system',
  'RPG system improvements',
  'Teams',
] as const

function SectionBlock({
  id,
  label,
  title,
  description,
  children,
}: {
  id?: string
  label: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <section id={id} className="space-y-4">
      <div>
        <p className={losClasses.sectionLabel}>{label}</p>
        <h2 className={`mt-2 ${losClasses.sectionHeading} text-xl sm:text-2xl`}>{title}</h2>
        {description && (
          <p className={`mt-2 max-w-2xl ${losClasses.body}`}>{description}</p>
        )}
      </div>
      {children}
    </section>
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
      <Card variant="interactive" className="h-full">
        <h3 className="text-sm font-semibold text-los-text-primary">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-los-text-secondary">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-los-gold transition-colors group-hover:text-los-gold-light">
          Explore
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </Card>
    </Link>
  )
}

export default function HomeLanding() {
  return (
    <div className="los-page pb-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-los-border-subtle pb-5">
        <Link href="/" className="los-brand group flex shrink-0 items-center gap-3">
          <span className="los-brand-mark" aria-hidden>
            <CompassIcon size={22} className="text-los-gold" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-heading text-base font-semibold tracking-[0.14em] text-los-text-primary transition-colors group-hover:text-los-gold sm:text-lg">
              ASCEND
            </span>
            <span className="los-brand-subtitle">Build Your Character</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <Card variant="gold" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-los-gold/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className={losClasses.sectionLabel}>Personal Growth Operating System</p>
          <h1 className={`mt-3 ${losClasses.pageTitle}`}>Build your character.</h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-los-text-primary sm:text-lg">
            One system for planning your day, tracking habits, monitoring health, and leveling up —
            backed by analytics and AI coaching.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-los-text-secondary">
            Sign in to open your dashboard. Your data stays in your browser for now — authentication
            is the first step toward cloud sync later.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:min-w-[140px]">Create Account</Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:min-w-[140px]">
                Sign In
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full sm:min-w-[140px]">
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Features */}
      <SectionBlock
        id="features"
        label="Features"
        title="Everything you need to grow"
        description="Six core modules — from daily execution to long-term progression."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </SectionBlock>

      {/* Why */}
      <SectionBlock
        id="why"
        label="Why ASCEND"
        title="Not just another productivity app"
      >
        <Card>
          <div className="space-y-4 text-sm leading-relaxed text-los-text-secondary sm:text-base">
            <p>
              ASCEND is a{' '}
              <span className="font-semibold text-los-text-primary">
                Personal Growth Operating System
              </span>{' '}
              — planner, health, habits, and character progression in one place.
            </p>
            <p>
              Most tools optimize one slice of life. ASCEND connects them so your analytics and AI
              coach see the full picture.
            </p>
          </div>
          <div className="mt-6 grid gap-4 border-t border-los-border-subtle pt-6 sm:grid-cols-3">
            {[
              { label: 'Unified', detail: 'One system for every life domain' },
              { label: 'Data-driven', detail: 'Scores and trends guide decisions' },
              { label: 'Long-term', detail: 'RPG progression rewards consistency' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-sm font-semibold text-los-text-primary">{item.label}</p>
                <p className="mt-1 text-xs text-los-text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </SectionBlock>

      {/* How it works */}
      <SectionBlock
        id="how-it-works"
        label="How It Works"
        title="A simple loop for growth"
        description="Track → Plan → Improve → Level Up"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {howItWorks.map((item) => (
            <Card key={item.title}>
              <p className="los-section-label">Step {item.step}</p>
              <p className="mt-2 text-lg font-semibold text-los-text-primary">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-los-text-secondary">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </SectionBlock>

      {/* Roadmap */}
      <SectionBlock
        id="roadmap"
        label="Roadmap"
        title="Built in public"
        description="What ships today and what is coming next."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-los-success" />
              <h3 className="los-section-label">Completed</h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              {roadmapCompleted.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-los-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-los-success/15 text-[10px] font-bold text-los-success">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-los-text-muted" />
              <h3 className="los-section-label">Planned</h3>
            </div>
            <ul className="mt-4 space-y-2.5">
              {roadmapPlanned.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-los-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-los-bg-secondary text-[10px] font-bold text-los-text-muted">
                    ○
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </SectionBlock>

      {/* FAQ */}
      <SectionBlock
        id="faq"
        label="FAQ"
        title="Common questions"
        description="Everything you need to know before getting started."
      >
        <FaqSection />
      </SectionBlock>

      {/* Feedback */}
      <SectionBlock
        id="feedback"
        label="Community"
        title="Help shape ASCEND"
        description="Suggestions and bug reports directly influence what we build next."
      >
        <FeedbackSection />
      </SectionBlock>

      {/* CTA */}
      <Card variant="gold" className="text-center">
        <p className={losClasses.sectionLabel}>Get started</p>
        <h2 className="mt-2 font-heading text-xl font-bold text-los-text-primary sm:text-2xl">
          Ready to build your character?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-los-text-secondary">
          Create your account, sign in, and open your command center.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register">
            <Button className="w-full sm:w-auto">Create Account</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </Card>

      {/* Footer */}
      <footer className="border-t border-los-border-subtle pt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-heading text-base font-semibold tracking-[0.1em] text-los-text-primary">
              ASCEND
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-los-text-muted">
              Personal Growth Operating System — continuous improvement across every area of life.
            </p>
            <p className="mt-2 los-section-label">Version {VERSION}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-los-text-secondary transition-colors hover:text-los-gold"
            >
              GitHub
            </a>
            <a href="#privacy" className="text-los-text-secondary transition-colors hover:text-los-gold">
              Privacy
            </a>
            <a
              href="mailto:hello@ascend.app"
              className="text-los-text-secondary transition-colors hover:text-los-gold"
            >
              Contact
            </a>
          </nav>
        </div>
        <p className="mt-6 border-t border-los-border-subtle pt-6 text-center text-xs text-los-text-muted">
          © {new Date().getFullYear()} ASCEND. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
