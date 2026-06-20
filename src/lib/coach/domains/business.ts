import type { CoachContext } from '@/lib/coach/context'
import type { CoachMessage } from '@/lib/coach/types'

/**
 * Reserved domain module for future Business Ideas coaching.
 * Connect here when idea validation, prioritization, or next-step
 * recommendations should flow through the same CoachProvider pipeline.
 */
export function generateBusinessCoaching(_ctx: CoachContext): CoachMessage[] {
  return []
}
