'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — tasks are managed on /work. */
export default function TasksPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/work')
  }, [router])
  return (
    <div className="py-20 text-center text-sm text-gray-400">Redirecting to tasks…</div>
  )
}
