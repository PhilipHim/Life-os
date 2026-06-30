import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function baseProps({ size = 20, className = '', ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    ...props,
  }
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m12 3 2.2 5.8L20 10l-4.5 3.5L17 20l-5-3.2L7 20l1.5-6.5L4 10l5.8-1.2L12 3Z" />
    </svg>
  )
}

export function CrownIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 18h16M6 18V9l3 3 3-5 3 5 3-3v9" />
      <path d="M4 9h16" />
    </svg>
  )
}

export function ScrollIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
      <path d="M8 19a3 3 0 0 0 3 3h8" />
      <path d="M9 9h6M9 13h4" />
    </svg>
  )
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  )
}

export function MountainIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="m4 18 4-7 4 5 4-9 4 11" />
      <path d="M4 18h16" />
    </svg>
  )
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M8 5h8v3a4 4 0 0 1-8 0V5Z" />
      <path d="M6 5H4a2 2 0 0 0 2 4M18 5h2a2 2 0 0 1-2 4" />
      <path d="M12 12v3M9 21h6M10 15h4v3" />
    </svg>
  )
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.05 1.4 1.16H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return <GearIcon {...props} />
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2a10 10 0 1 0 8 16h-1.5a2.5 2.5 0 0 1 0-5H17a6 6 0 0 0 2-6 6 6 0 0 0-6-5Z" />
    </svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10 21h4M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
    </svg>
  )
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

export const losIcons = {
  shield: ShieldIcon,
  star: StarIcon,
  crown: CrownIcon,
  scroll: ScrollIcon,
  compass: CompassIcon,
  mountain: MountainIcon,
  trophy: TrophyIcon,
  gear: GearIcon,
  settings: SettingsIcon,
  user: UserIcon,
  palette: PaletteIcon,
  bell: BellIcon,
  alertTriangle: AlertTriangleIcon,
} as const

export type LosIconName = keyof typeof losIcons
