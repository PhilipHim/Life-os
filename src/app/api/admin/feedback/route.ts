import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, isAdminEmail } from '@/lib/supabase/admin'
import type { FeedbackRecord, FeedbackStatus } from '@/types/feedback'

interface FeedbackRow {
  id: string
  user_id: string | null
  category: string
  message: string
  page: string | null
  status: FeedbackStatus
  name: string | null
  email: string | null
  browser: string | null
  os: string | null
  app_version: string | null
  created_at: string
}

function mapRow(row: FeedbackRow): FeedbackRecord {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    message: row.message,
    page: row.page,
    status: row.status,
    name: row.name,
    email: row.email,
    browser: row.browser,
    os: row.os,
    appVersion: row.app_version,
    createdAt: row.created_at,
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json(
      {
        error:
          'Admin view requires SUPABASE_SERVICE_ROLE_KEY in your server environment.',
      },
      { status: 503 }
    )
  }

  const { data, error } = await service
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    items: (data as FeedbackRow[]).map(mapRow),
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json({ error: 'Service role not configured.' }, { status: 503 })
  }

  const body = (await request.json()) as { id?: string; status?: FeedbackStatus }
  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'id and status required.' }, { status: 400 })
  }

  const { error } = await service
    .from('feedback')
    .update({ status: body.status })
    .eq('id', body.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
