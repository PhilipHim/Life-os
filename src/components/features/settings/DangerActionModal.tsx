'use client'

import Modal from '@/components/common/Modal'
import SlideToConfirm from '@/components/features/settings/SlideToConfirm'

interface DangerActionModalProps {
  open: boolean
  title: string
  description: string
  items: readonly string[]
  warning: string
  slideLabel: string
  onClose: () => void
  onConfirm: () => void
  confirming?: boolean
}

export default function DangerActionModal({
  open,
  title,
  description,
  items,
  warning,
  slideLabel,
  onClose,
  onConfirm,
  confirming = false,
}: DangerActionModalProps) {
  if (!open) return null

  return (
    <Modal title={title} description={description} onClose={onClose} maxWidth="md">
      <div className="space-y-5">
        <div className="rounded-lg border border-los-danger/30 bg-los-danger/5 p-4">
          <p className="text-sm font-medium text-red-300">{warning}</p>
        </div>
        <ul className="space-y-2 text-sm text-los-text-secondary">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-los-danger/70" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm text-los-text-muted">This action cannot be undone.</p>
        <SlideToConfirm
          key={`${title}-${open}`}
          label={slideLabel}
          confirmedLabel={confirming ? 'Processing…' : 'Confirmed'}
          onConfirm={onConfirm}
          disabled={confirming}
        />
      </div>
    </Modal>
  )
}
