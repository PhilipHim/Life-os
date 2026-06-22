'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CompassIcon } from '@/design-system/icons'

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/work', label: 'Work' },
  { href: '/plan', label: 'Plan' },
  { href: '/habits', label: 'Habits' },
  { href: '/life-os', label: 'Life OS' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/profile', label: 'Profile' },
]

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="los-navbar sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-8">
        <Link href="/" className="los-brand group shrink-0">
          <span className="los-brand-mark" aria-hidden>
            <CompassIcon size={20} className="text-los-gold" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-heading text-lg font-semibold tracking-[0.12em] text-los-text-primary transition-colors group-hover:text-los-gold">
              Life OS
            </span>
            <span className="los-brand-rule" aria-hidden />
          </span>
        </Link>

        <nav
          className="flex max-w-full items-center gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          {links.map((link) => {
            const isActive = isNavActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'los-nav-link los-nav-link--active' : 'los-nav-link'}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
