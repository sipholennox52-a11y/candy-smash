'use client'

import { cn } from '@/lib/utils'

interface StatProps {
  label: string
  value: string | number
  highlight?: boolean
}

function Stat({ label, value, highlight }: StatProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-3 py-2 text-center',
        highlight && 'border-primary/40 bg-primary/5',
      )}
    >
      <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-xl font-bold tabular-nums sm:text-2xl',
          highlight ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  )
}

interface GameStatsProps {
  score: number
  moves: number
  bestCombo: number
}

export function GameStats({ score, moves, bestCombo }: GameStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <Stat label="Score" value={score.toLocaleString()} highlight />
      <Stat label="Moves Left" value={moves} />
      <Stat label="Best Combo" value={`${bestCombo}x`} />
    </div>
  )
}
