import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { hasCompletedOnboarding } from '@/lib/supabase/profile-guard'

const AUTH_PAGES = new Set(['/login', '/register', '/forgot-password', '/reset-password'])
const ONBOARDING_PATH = '/onboarding'

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/auth/')) return true
  if (AUTH_PAGES.has(pathname)) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Supabase environment variables are not configured.')
    }
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)

  const isPublic = isPublicPath(pathname)
  const isAuthPage = AUTH_PAGES.has(pathname)
  const isOnboardingPage = pathname === ONBOARDING_PATH

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    let onboardingDone = false
    try {
      onboardingDone = await hasCompletedOnboarding(supabase, user.id, request)
    } catch {
      onboardingDone = false
    }

    if (isAuthPage) {
      const dest = request.nextUrl.clone()
      dest.pathname = onboardingDone ? '/dashboard' : ONBOARDING_PATH
      dest.search = ''
      return NextResponse.redirect(dest)
    }

    if (isOnboardingPage && onboardingDone) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }

    if (!onboardingDone && !isPublic && !isOnboardingPage) {
      const onboardingUrl = request.nextUrl.clone()
      onboardingUrl.pathname = ONBOARDING_PATH
      if (pathname !== '/dashboard') {
        onboardingUrl.searchParams.set('next', pathname)
      }
      return NextResponse.redirect(onboardingUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
