import { Suspense } from 'react'
import AdminFeedbackPageClient from '@/components/features/admin/AdminFeedbackPageClient'

export const metadata = {
  title: 'Admin — Feedback',
}

export default function AdminFeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="los-page py-20 text-center text-sm text-los-text-muted">Loading…</div>
      }
    >
      <AdminFeedbackPageClient />
    </Suspense>
  )
}
