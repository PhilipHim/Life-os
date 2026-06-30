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
      className={`inline-flex shrink-0 items-center justify-center rounded-md p-2 -m-2 sm:m-0 sm:p-0 focus:outline-none focus:ring-2 focus:ring-los-gold/40 focus:ring-offset-2 focus:ring-offset-los-bg-card ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        className={`relative flex size-6 items-center justify-center rounded-md border-2 transition-all duration-200 ${
          checked
            ? 'border-los-gold bg-los-gold'
            : 'border-los-border hover:border-los-border-gold'
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={`h-3.5 w-3.5 transition-all duration-200 ${
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
      </span>
    </button>
  )
}
