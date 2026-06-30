#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const files = process.argv.slice(2)

const REPLACEMENTS = [
  ['text-gray-900', 'text-los-text-primary'],
  ['text-gray-700', 'text-los-text-primary'],
  ['text-gray-600', 'text-los-text-secondary'],
  ['text-gray-500', 'text-los-text-secondary'],
  ['text-gray-400', 'text-los-text-muted'],
  ['text-gray-300', 'text-los-text-muted/70'],
  ['placeholder-gray-400', 'placeholder:text-los-text-muted'],
  ['border-gray-300', 'border-los-border'],
  ['border-gray-200', 'border-los-border'],
  ['border-gray-100', 'border-los-border-subtle'],
  ['hover:border-gray-300', 'hover:border-los-border-gold'],
  ['hover:text-gray-900', 'hover:text-los-text-primary'],
  ['hover:bg-gray-100', 'hover:bg-los-bg-secondary'],
  ['hover:bg-gray-50', 'hover:bg-los-bg-secondary'],
  ['hover:shadow-md', 'hover:shadow-los-card-hover'],
  ['text-xs font-medium uppercase tracking-widest text-los-text-muted', 'los-section-label'],
  ['text-[10px] font-medium uppercase tracking-widest text-los-text-muted', 'los-section-label'],
  ['text-sm font-semibold uppercase tracking-widest text-los-text-muted', 'los-section-label'],
]

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  let next = content
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to)
  }
  if (next !== content) {
    fs.writeFileSync(file, next)
    console.log('polished:', file)
  }
}
