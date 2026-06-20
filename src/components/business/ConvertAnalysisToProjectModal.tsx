'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useWorkItems } from '@/lib/WorkItemContext'
import type { BusinessIdea } from '@/lib/types'

interface Props {
  idea: BusinessIdea
  onClose: () => void
}

export default function ConvertAnalysisToProjectModal({ idea, onClose }: Props) {
  const { createGroupWithChildren } = useWorkItems()
  const [converted, setConverted] = useState(false)
  const analysis = idea.analysis

  const handleConvert = () => {
    if (!analysis) return
    const title = idea.title.trim() || 'Untitled Project'
    const description = [
      idea.description,
      '',
      `Business Analysis Score: ${analysis.overallScore}/100`,
      `Next Step: ${analysis.nextStep}`,
    ].filter(Boolean).join('\n')

    const children = analysis.mvpRoadmap.map((step) => ({
      title: step,
      description: `MVP roadmap step for ${title}`,
    }))

    createGroupWithChildren(title, description, children)
    setConverted(true)
  }

  if (!analysis) return null

  if (converted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Project Created</h2>
          <p className="text-sm text-gray-500 mb-5">
            &ldquo;{idea.title.trim() || 'Untitled Project'}&rdquo; is now a work project with{' '}
            {analysis.mvpRoadmap.length} roadmap tasks.
          </p>
          <div className="flex gap-2">
            <Link href="/work" className="flex-1">
              <Button className="w-full">Open Work</Button>
            </Link>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Convert to Work Project</h2>
        <p className="text-sm text-gray-500 mb-4 truncate">{idea.title || 'Untitled Idea'}</p>

        <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-600 mb-5 space-y-2">
          <p>Creates a project group with {analysis.mvpRoadmap.length} tasks from your MVP roadmap:</p>
          <ol className="list-decimal list-inside text-xs space-y-1 text-gray-500">
            {analysis.mvpRoadmap.map((step) => (
              <li key={step} className="truncate">{step}</li>
            ))}
          </ol>
        </div>

        <div className="flex gap-2">
          <Button type="button" className="flex-1" onClick={handleConvert}>
            Create Project
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
