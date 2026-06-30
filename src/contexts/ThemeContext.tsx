'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getAppSettings, patchAppSettings } from '@/database/settings'
import type { AccentColor, ThemeMode } from '@/types/settings'

interface ThemeContextValue {
  theme: ThemeMode
  accent: AccentColor
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyThemeToDocument(theme: ThemeMode, accent: AccentColor) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.accent = accent
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark')
  const [accent, setAccentState] = useState<AccentColor>('gold')

  useEffect(() => {
    const settings = getAppSettings()
    setThemeState(settings.theme)
    setAccentState(settings.accent)
    applyThemeToDocument(settings.theme, settings.accent)
  }, [])

  useEffect(() => {
    if (theme !== 'system') return undefined
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyThemeToDocument('system', accent)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, accent])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
    const settings = patchAppSettings({ theme: next })
    applyThemeToDocument(settings.theme, settings.accent)
  }, [])

  const setAccent = useCallback((next: AccentColor) => {
    setAccentState(next)
    const settings = patchAppSettings({ accent: next })
    applyThemeToDocument(settings.theme, settings.accent)
  }, [])

  const value = useMemo(
    () => ({ theme, accent, setTheme, setAccent }),
    [theme, accent, setTheme, setAccent]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}

export { resolveSystemTheme }
