import { NextResponse } from 'next/server'

export async function GET() {
  const configured = Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  )
  return NextResponse.json({ configured })
}
