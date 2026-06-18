'use client'

interface CheckboxProps {
  checked: boolean
  onChange: () => void
  className?: string
}

export default function Checkbox({ checked, onChange, className = '' }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`relative size-6 shrink-0 rounded-md border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
        checked
          ? 'border-gray-900 bg-gray-900'
          : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
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
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
