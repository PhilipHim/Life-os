import type { Metadata } from 'next'
import HomeLanding from '@/components/home/HomeLanding'

export const metadata: Metadata = {
  title: 'Life OS — Build a better life through systems',
  description:
    'Life OS combines productivity, health, learning, finance and personal growth into one personal operating system.',
}

export default function Home() {
  return <HomeLanding />
}
