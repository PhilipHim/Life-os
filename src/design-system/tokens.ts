/**
 * ASCEND design tokens — Modern Fantasy RPG progression aesthetic.
 * Use CSS variables / Tailwind theme classes in UI; use this object in charts & runtime logic.
 */
export const losColors = {
  bg: {
    primary: '#0B1020',
    secondary: '#12182D',
    card: '#1A223D',
  },
  accent: {
    gold: '#D4AF37',
    goldLight: '#E5C76B',
    goldDark: '#9A7B28',
    ai: '#8B5CF6',
    aiLight: '#A78BFA',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  text: {
    primary: '#E8ECF4',
    secondary: '#9AA8C7',
    muted: '#6B7A99',
    inverse: '#0B1020',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.12)',
    gold: 'rgba(212, 175, 55, 0.35)',
    ai: 'rgba(139, 92, 246, 0.35)',
  },
} as const

export const losShadows = {
  card: '0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 4px 24px -4px rgba(0, 0, 0, 0.45)',
  cardHover: '0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 8px 32px -4px rgba(0, 0, 0, 0.55)',
  elevated: '0 12px 40px -8px rgba(0, 0, 0, 0.6)',
} as const

export const losRadii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
} as const

export const losGradients = {
  goldProgress: `linear-gradient(90deg, ${losColors.accent.goldDark} 0%, ${losColors.accent.gold} 50%, ${losColors.accent.goldLight} 100%)`,
  goldSubtle: `linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.04) 100%)`,
  aiSubtle: `linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(139, 92, 246, 0.04) 100%)`,
} as const

export const losTypography = {
  heading: 'var(--font-cinzel), ui-serif, Georgia, serif',
  body: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
} as const

/** Tailwind class bundles for gradual page migration without per-page redesign. */
export const losClasses = {
  pageTitle: 'font-heading text-3xl font-bold tracking-tight text-los-text-primary sm:text-4xl',
  pageSubtitle: 'text-sm text-los-text-secondary',
  sectionHeading: 'font-heading text-lg font-semibold tracking-wide text-los-text-primary',
  sectionLabel:
    'text-[10px] font-semibold uppercase tracking-[0.2em] text-los-text-muted',
  body: 'text-sm text-los-text-secondary leading-relaxed',
  card: 'rounded-xl border border-los-border bg-los-bg-card p-4 shadow-los-card sm:p-6',
  cardInteractive:
    'rounded-xl border border-los-border bg-los-bg-card p-4 shadow-los-card transition-all duration-200 hover:border-los-border-gold hover:shadow-los-card-hover sm:p-6',
  page: 'los-page',
  pageHeader: 'los-page-header',
  main: 'los-main',
} as const
