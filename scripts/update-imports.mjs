#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ROOT = path.join(__dirname, '..', 'src')

const REPLACEMENTS = [
  ["from '@/lib/db/", "from '@/database/"],
  ["from \"@/lib/db/", "from \"@/database/"],
  ["from '@/lib/WorkItemContext'", "from '@/contexts/WorkItemContext'"],
  ["from '@/lib/TaskContext'", "from '@/contexts/TaskContext'"],
  ["from '@/lib/FocusContext'", "from '@/contexts/FocusContext'"],
  ["from '@/lib/HabitContext'", "from '@/contexts/HabitContext'"],
  ["from '@/lib/RoutineContext'", "from '@/contexts/RoutineContext'"],
  ["from '@/lib/DailyPlanContext'", "from '@/contexts/DailyPlanContext'"],
  ["from '@/lib/types'", "from '@/types'"],
  ["from '@/lib/date-utils'", "from '@/utils/date'"],
  ["from '@/lib/ai/", "from '@/ai/"],
  ["from '@/lib/planner-defaults'", "from '@/features/planner/lib/planner-defaults'"],
  ["from '@/lib/planner'", "from '@/features/planner/lib/planner'"],
  ["from '@/lib/routines/", "from '@/features/routines/lib/"],
  ["from '@/lib/recurring'", "from '@/features/tasks/lib/recurring'"],
  ["from '@/lib/feedback/submit-feedback'", "from '@/features/feedback/lib/submit-feedback'"],
  ["from '@/components/Navbar'", "from '@/components/layout/Navbar'"],
  ["from '@/components/FocusOverlay'", "from '@/components/layout/FocusOverlay'"],
  ["from '@/components/DetailsPanel'", "from '@/components/common/DetailsPanel'"],
  ["from '@/components/TaskItem'", "from '@/components/common/TaskItem'"],
  ["from '@/components/AddToPlanFlow'", "from '@/components/common/AddToPlanFlow'"],
  ["from '@/components/EditPlanItemModal'", "from '@/components/common/EditPlanItemModal'"],
  ["from '@/components/ConvertIdeaToWorkModal'", "from '@/components/common/ConvertIdeaToWorkModal'"],
  ["from '@/components/analytics/", "from '@/components/features/analytics/"],
  ["from '@/components/business/", "from '@/components/features/business/"],
  ["from '@/components/challenges/", "from '@/components/features/challenges/"],
  ["from '@/components/coach/", "from '@/components/features/coach/"],
  ["from '@/components/home/", "from '@/components/features/home/"],
  ["from '@/components/profile/", "from '@/components/features/profile/"],
  ["from '@/components/progression/", "from '@/components/features/progression/"],
  ["from '@/components/routines/", "from '@/components/features/routines/"],
  ["from '@/components/progression'", "from '@/components/features/progression'"],
  ["from '@/components/strategic'", "from '@/components/features/strategic'"],
  ["from '@/components/strategic/", "from '@/components/features/strategic/"],
]

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
  }
  return files
}

let changed = 0
for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, 'utf8')
  let next = content
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to)
  }
  if (next !== content) {
    fs.writeFileSync(file, next)
    changed++
  }
}
console.log(`Updated imports in ${changed} files`)
