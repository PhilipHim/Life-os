import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase.rpc('delete_own_account')

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes('function') || error.code === 'PGRST202'
            ? 'Account deletion is not configured. Run supabase/migrations/002_delete_own_account.sql in Supabase.'
            : error.message,
      },
      { status: 500 }
    )
  }

  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
