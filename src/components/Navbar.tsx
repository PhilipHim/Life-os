'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/work', label: 'Work' },
  { href: '/plan', label: 'Plan' },
  { href: '/habits', label: 'Habits' },
  { href: '/life-os', label: 'Life OS' },
  { href: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className={`text-sm font-bold transition-colors ${pathname === '/' ? 'text-gray-900' : 'text-gray-900 hover:text-gray-600'}`}>
          Productivity OS
        </Link>
        <div className="flex gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm'
                    : 'rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
