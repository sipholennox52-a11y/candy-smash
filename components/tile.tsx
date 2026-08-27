'use client'

import { cn } from '@/lib/utils'
import { CANDIES } from '@/lib/candies'

interface TileProps {
  type: number | null
  selected: boolean
  matched: boolean
  onClick: () => void
  ariaLabel: string
}

export function Tile({ type, selected, matched, onClick, ariaLabel }: TileProps) {
  if (type === null) {
    return <div className="aspect-square rounded-xl" aria-hidden="true" />
  }

  const candy = CANDIES[type]
  const Icon = candy.icon

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={cn(
        'group relative flex aspect-square items-center justify-center rounded-xl transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        candy.bg,
        selected
          ? 'scale-95 ring-4 ring-foreground/80 z-10'
          : 'hover:scale-105 hover:-translate-y-0.5',
        matched && 'animate-ping-once opacity-0 scale-50',
      )}
    >
      <span className="absolute inset-1 rounded-lg bg-card/25" aria-hidden="true" />
      <Icon
        className="relative h-1/2 w-1/2 text-card drop-shadow-sm"
        strokeWidth={2.5}
        aria-hidden="true"
      />
    </button>
  )
}
