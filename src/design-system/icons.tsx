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

export const losIcons = {
  shield: ShieldIcon,
  star: StarIcon,
  crown: CrownIcon,
  scroll: ScrollIcon,
  compass: CompassIcon,
  mountain: MountainIcon,
  trophy: TrophyIcon,
} as const

export type LosIconName = keyof typeof losIcons
