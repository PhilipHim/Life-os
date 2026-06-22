'use client'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
  disabled?: boolean
}

export default function Checkbox({ checked, onChange, className = '', disabled = false }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={disabled ? undefined : onChange}
      className={`relative size-6 shrink-0 rounded-md border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-los-gold/40 focus:ring-offset-2 focus:ring-offset-los-bg-card ${
        checked
          ? 'border-los-gold bg-los-gold'
          : 'border-los-border hover:border-los-border-gold'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className={`absolute inset-0 m-auto h-3.5 w-3.5 transition-all duration-200 ${
          checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
      >
        <path
          d="M3 8.5L6.5 12L13 4"
          stroke="#0B1020"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
