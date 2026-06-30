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
      'ASCEND is currently free to use during early development. Core features — tasks, planner, habits, routines, analytics, and profile progression — are available without a subscription. Pricing may evolve as the platform grows.',
  },
  {
    id: 'privacy',
    question: 'Is my data private?',
    answer:
      'Your data is stored locally in your browser by default. ASCEND does not sell your personal information. AI features only send the context needed for a specific request when you choose to use them.',
  },
  {
    id: 'api-key',
    question: 'Do I need an AI API key?',
    answer:
      'AI Coach and review features require a Google Gemini API key configured in your environment. All other features work without any API key. You stay in control of when AI is used.',
  },
  {
    id: 'mobile',
    question: 'Will there be a mobile app?',
    answer:
      'A native mobile experience is on the roadmap. The web app is fully responsive today, and a dedicated mobile app is planned to bring ASCEND with you everywhere.',
  },
  {
    id: 'routines-vs-tasks',
    question: 'How are routines different from tasks?',
    answer:
      'Tasks are one-time work items you complete and move on. Routines are reusable step-by-step checklists — like a morning or workout flow — that you can run repeatedly and schedule into the Planner as a single block without recreating them each day.',
  },
] as const

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div key={faq.question} id={faq.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 bg-gray-900 text-white border-gray-900' : ''
                }`}
                aria-hidden
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="text-sm leading-relaxed text-gray-500">{faq.answer}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
