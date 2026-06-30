import { Suspense } from 'react'
import LoginPageClient from './LoginPageClient'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-los-text-muted">Loading…</div>
      }
    >
      <LoginPageClient />
    </Suspense>
  )
}
