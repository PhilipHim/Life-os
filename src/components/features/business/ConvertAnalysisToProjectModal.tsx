'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Modal from '@/components/common/Modal'
import { useWorkItems } from '@/contexts/WorkItemContext'
import type { BusinessIdea } from '@/types'

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
    ]
      .filter(Boolean)
      .join('\n')

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
      <Modal title="Project Created" onClose={onClose} maxWidth="sm">
        <p className="text-sm text-los-text-secondary">
          &ldquo;{idea.title.trim() || 'Untitled Project'}&rdquo; is now a work project with{' '}
          {analysis.mvpRoadmap.length} roadmap tasks.
        </p>
        <div className="mt-5 flex gap-2">
          <Link href="/work" className="flex-1">
            <Button className="w-full">Open Work</Button>
          </Link>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Convert to Work Project"
      description={idea.title || 'Untitled Idea'}
      onClose={onClose}
      maxWidth="md"
    >
      <div className="mb-5 space-y-2 rounded-lg bg-los-bg-secondary px-3 py-3 text-sm text-los-text-secondary">
        <p>Creates a project group with {analysis.mvpRoadmap.length} tasks from your MVP roadmap:</p>
        <ol className="list-inside list-decimal space-y-1 text-xs text-los-text-muted">
          {analysis.mvpRoadmap.map((step) => (
            <li key={step} className="truncate">
              {step}
            </li>
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
    </Modal>
  )
}
