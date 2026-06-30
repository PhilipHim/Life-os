'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CompassIcon, SettingsIcon } from '@/design-system/icons'
import { useAuth } from '@/hooks/useAuth'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/work', label: 'Tasks' },
  { href: '/routines', label: 'Routines' },
  { href: '/plan', label: 'Planner' },
  { href: '/habits', label: 'Habits' },
  { href: '/life-os', label: 'Life' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/profile', label: 'Profile' },
]

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navbar() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  return (
    <header className="los-navbar sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-8">
        <Link href="/" className="los-brand group shrink-0">
          <span className="los-brand-mark" aria-hidden>
            <CompassIcon size={20} className="text-los-gold" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-heading text-lg font-semibold tracking-[0.14em] text-los-text-primary transition-colors group-hover:text-los-gold">
              ASCEND
            </span>
            <span className="los-brand-subtitle">Build Your Character</span>
          </span>
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto snap-x snap-mandatory pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          {links.map((link) => {
            const isActive = isNavActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`${isActive ? 'los-nav-link los-nav-link--active' : 'los-nav-link'} shrink-0 snap-center`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {!loading && user && (
          <Link
            href="/settings"
            className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-colors sm:min-h-[36px] sm:min-w-[36px] ${
              pathname.startsWith('/settings')
                ? 'bg-los-gold/15 text-los-gold'
                : 'text-los-text-secondary hover:bg-los-bg-secondary hover:text-los-text-primary'
            }`}
            aria-label="Settings"
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
          >
            <SettingsIcon size={20} />
          </Link>
        )}
      </div>
    </header>
  )
}
