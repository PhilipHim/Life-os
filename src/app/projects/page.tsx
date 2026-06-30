'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Project, Task } from '@/types'
import { getProjects, addProject, updateProject, deleteProject } from '@/database/projects'
import { getTasks } from '@/database/tasks'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import DetailsPanel from '@/components/common/DetailsPanel'

type StatusFilter = 'all' | 'active' | 'completed'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const [directTitle, setDirectTitle] = useState('')
  const [directDescription, setDirectDescription] = useState('')
  const [directNotes, setDirectNotes] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [panelProject, setPanelProject] = useState<Project | null>(null)

  useEffect(() => {
    setProjects(getProjects())
    setTasks(getTasks())
  }, [])

  const refresh = () => {
    setProjects(getProjects())
    setTasks(getTasks())
  }

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    )
  }

  const handleTaskCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim() || selectedTaskIds.length === 0) return
    addProject({
      id: crypto.randomUUID(),
      taskIds: selectedTaskIds,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      notes: '',
      completed: false,
      createdAt: Date.now(),
    })
    setTaskTitle('')
    setTaskDescription('')
    setSelectedTaskIds([])
    refresh()
  }

  const handleDirectCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!directTitle.trim()) return
    addProject({
      id: crypto.randomUUID(),
      taskIds: [],
      title: directTitle.trim(),
      description: directDescription.trim(),
      notes: directNotes.trim(),
      completed: false,
      createdAt: Date.now(),
    })
    setDirectTitle('')
    setDirectDescription('')
    setDirectNotes('')
    refresh()
  }

  const handleToggle = (project: Project) => {
    updateProject({ ...project, completed: !project.completed })
    refresh()
  }

  const handleUpdate = (updated: Project | Task) => {
    updateProject(updated as Project)
    setPanelProject(null)
    refresh()
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !p.completed) ||
        (statusFilter === 'completed' && p.completed)
      return matchesSearch && matchesStatus
    })
  }, [projects, searchQuery, statusFilter])

  return (
    <div className="space-y-12">
      <h1 className="text-4xl font-bold tracking-tight">Projects</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projekt aus Tasks erstellen</h2>
          <form onSubmit={handleTaskCreate} className="space-y-4">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Projekt Titel..."
              className="los-input min-h-[44px] w-full"
            />
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Beschreibung (optional)..."
              rows={2}
              className="los-textarea w-full"
            />
            {tasks.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-2">
                  Tasks auswählen ({selectedTaskIds.length} ausgewählt)
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                  {tasks.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                      />
                      <span className={task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}>
                        {task.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                Keine Tasks vorhanden. Erstelle zuerst Tasks auf der Tasks Seite.
              </p>
            )}
            <Button type="submit" disabled={!taskTitle.trim() || selectedTaskIds.length === 0}>
              Projekt aus {selectedTaskIds.length} Task{selectedTaskIds.length !== 1 ? 's' : ''} erstellen
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Neues Projekt erstellen</h2>
          <form onSubmit={handleDirectCreate} className="space-y-4">
            <input
              type="text"
              value={directTitle}
              onChange={(e) => setDirectTitle(e.target.value)}
              placeholder="Projekt Titel..."
              className="los-input min-h-[44px] w-full"
            />
            <textarea
              value={directDescription}
              onChange={(e) => setDirectDescription(e.target.value)}
              placeholder="Beschreibung (optional)..."
              rows={2}
              className="los-textarea w-full"
            />
            <textarea
              value={directNotes}
              onChange={(e) => setDirectNotes(e.target.value)}
              placeholder="Notizen (optional)..."
              rows={3}
              className="los-textarea w-full"
            />
            <Button type="submit" disabled={!directTitle.trim()}>Projekt erstellen</Button>
          </form>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex gap-1">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={
                  statusFilter === f
                    ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm'
                    : 'rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }
              >
                {f === 'all' ? 'Alle' : f === 'active' ? 'Aktiv' : 'Erledigt'}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Projekte durchsuchen..."
            className="los-input min-h-[40px] max-w-xs"
          />
        </div>

        <h2 className="text-xl font-semibold tracking-tight mb-4">Aktive Projekte</h2>

        {projects.length === 0 && (
          <Card>
            <p className="text-center text-sm text-gray-400 py-6">Noch keine Projekte.</p>
          </Card>
        )}

        {projects.length > 0 && filteredProjects.length === 0 && (
          <Card>
            <p className="text-center text-sm text-gray-400 py-6">Keine Projekte gefunden.</p>
          </Card>
        )}

        {filteredProjects.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const linkedTasks = tasks.filter((t) => project.taskIds.includes(t.id))
              const done = linkedTasks.filter((t) => t.completed).length
              const progress = linkedTasks.length > 0 ? Math.round((done / linkedTasks.length) * 100) : 0

              return (
                <Card
                  key={project.id}
                  className="transition-all hover:border-gray-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <Checkbox checked={project.completed} onChange={() => handleToggle(project)} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className={project.completed ? 'font-semibold text-gray-400 line-through' : 'font-semibold text-gray-900'}>
                        {project.title}
                      </p>
                      {project.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {linkedTasks.length} Task{linkedTasks.length !== 1 ? 's' : ''}
                        {linkedTasks.length > 0 && ` · ${done} erledigt`}
                      </p>
                      {linkedTasks.length > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gray-900 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{progress}%</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-300 pt-1">
                        Erstellt am {new Date(project.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setPanelProject(project)}>Details</Button>
                        <Button variant="ghost" size="sm" onClick={() => { deleteProject(project.id); refresh() }} className="text-red-400 hover:text-red-600 hover:bg-red-50">Löschen</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {panelProject && (
        <DetailsPanel
          isOpen
          onClose={() => setPanelProject(null)}
          type="project"
          entity={panelProject}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
