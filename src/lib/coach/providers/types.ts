import type { CoachContext } from '@/lib/coach/context'
import type { CoachReport } from '@/lib/coach/types'

export interface CoachProvider {
  readonly name: string
  generate(context: CoachContext): CoachReport
}
