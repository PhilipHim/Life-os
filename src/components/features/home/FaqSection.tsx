'use client'

import { useState } from 'react'

const faqs = [
  {
    id: 'what-is-ascend',
    question: 'What is ASCEND?',
    answer:
      'ASCEND is a Personal Growth Operating System — a single platform for planning your day, building habits, tracking health and finances, and leveling up over time. It combines execution tools with analytics and AI coaching so you can improve every area of your life with intention.',
  },
  {
    id: 'free',
    question: 'Is ASCEND free?',
    answer:
      'ASCEND is currently free to use during early development. Core features — tasks, planner, habits, routines, analytics, and profile progression — are available without a subscription.',
  },
  {
    id: 'privacy',
    question: 'Is my data private?',
    answer:
      'Your data is stored locally in your browser by default. ASCEND does not sell your personal information. AI features only send the context needed for a specific request when you choose to use them.',
  },
  {
    id: 'account',
    question: 'Why do I need an account?',
    answer:
      'Accounts secure access to your ASCEND workspace. Your tasks and life data still live in your browser for now — authentication prepares the app for cloud sync in a future update.',
  },
  {
    id: 'api-key',
    question: 'Do I need an AI API key?',
    answer:
      'AI Coach and review features require a Google Gemini API key in your environment. All other features work without any API key.',
  },
  {
    id: 'mobile',
    question: 'Will there be a mobile app?',
    answer:
      'A native mobile experience is on the roadmap. The web app is fully responsive today.',
  },
] as const

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="divide-y divide-los-border-subtle rounded-xl border border-los-border bg-los-bg-card shadow-los-card">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div key={faq.question} id={faq.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-los-bg-secondary sm:px-5"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-los-text-primary">{faq.question}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                  isOpen
                    ? 'rotate-180 border-los-gold bg-los-gold text-los-text-inverse'
                    : 'border-los-border text-los-text-muted'
                }`}
                aria-hidden
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 sm:px-5">
                <p className="text-sm leading-relaxed text-los-text-secondary">{faq.answer}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
