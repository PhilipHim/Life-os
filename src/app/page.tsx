import type { Metadata } from 'next'
import HomeLanding from '@/components/features/home/HomeLanding'

export const metadata: Metadata = {
  title: 'ASCEND — Build Your Character',
  description:
    'ASCEND combines productivity, health, learning, finance, and personal growth into one personal growth system.',
}

export default function Home() {
  return <HomeLanding />
}
