import { Suspense } from 'react'
import SettingsPageClient from '@/components/features/settings/SettingsPageClient'

export const metadata = {
  title: 'Settings — ASCEND',
  description: 'Manage your ASCEND account and preferences',
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="los-page py-20 text-center text-sm text-los-text-muted">Loading settings…</div>
      }
    >
      <SettingsPageClient />
    </Suspense>
  )
}
