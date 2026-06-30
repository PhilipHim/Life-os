import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackCategory, FeedbackPayload } from '@/types/feedback'

const VALID_CATEGORIES: FeedbackCategory[] = [
  'bug',
  'feature',
  'improvement',
  'ai',
  'planner',
  'routine',
  'other',
]

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Feedback storage is not configured.' }, { status: 503 })
  }

  let body: FeedbackPayload
  try {
    body = (await request.json()) as FeedbackPayload
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  const category = VALID_CATEGORIES.includes(body.category) ? body.category : 'other'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userAgent = request.headers.get('user-agent') ?? ''

  try {
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      category,
      message,
      page: body.page?.trim() || '/',
      status: 'new',
      name: body.name?.trim() || null,
      email: body.email?.trim() || null,
      browser: body.browser?.trim() || parseBrowser(userAgent),
      os: body.os?.trim() || parseOs(userAgent),
      app_version: body.appVersion?.trim() || '0.1.0',
    })

    if (error) {
      const missingTable =
        error.message.includes('feedback') &&
        (error.message.includes('schema cache') || error.message.includes('does not exist'))
      return NextResponse.json(
        {
          error: missingTable
            ? 'Feedback table not found. Run supabase/migrations/004_feedback.sql in Supabase.'
            : error.message,
        },
        { status: 500 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const network = message.toLowerCase().includes('fetch failed')
    return NextResponse.json(
      {
        error: network
          ? 'Could not reach Supabase. Check your internet connection and NEXT_PUBLIC_SUPABASE_URL in .env.'
          : message,
      },
      { status: network ? 503 : 500 }
    )
  }

  return NextResponse.json({ success: true })
}

function parseBrowser(ua: string): string {
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return 'Unknown'
}

function parseOs(ua: string): string {
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Unknown'
}
