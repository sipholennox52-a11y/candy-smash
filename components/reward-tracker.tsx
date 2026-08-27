'use client'

import { Gift, Lock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { REWARD_TIERS, currentTier, nextTier } from '@/lib/rewards'

interface RewardTrackerProps {
  score: number
}

export function RewardTracker({ score }: RewardTrackerProps) {
  const tier = currentTier(score)
  const upcoming = nextTier(score)

  const progress = upcoming
    ? Math.min(
        100,
        ((score - tier.threshold) / (upcoming.threshold - tier.threshold)) *
          100,
      )
    : 100

  return (
    <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
          Your Reward
        </h2>
      </div>

      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-extrabold text-primary text-balance">
          {tier.discount}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
          {tier.code}
        </span>
      </div>

      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to next reward"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {upcoming
          ? `${(upcoming.threshold - score).toLocaleString()} pts to unlock ${upcoming.discount}`
          : 'Max reward unlocked — you are a Candy Legend!'}
      </p>

      <ul className="mt-4 space-y-1.5">
        {REWARD_TIERS.map((t) => {
          const unlocked = score >= t.threshold
          const active = t.code === tier.code
          return (
            <li
              key={t.code}
              className={cn(
                'flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm',
                active && 'bg-primary/5',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  unlocked
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {unlocked ? (
                  <Check className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <Lock className="h-3 w-3" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  'flex-1',
                  unlocked ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {t.label}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  unlocked ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {t.discount}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
