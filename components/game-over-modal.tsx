'use client'

import { useState } from 'react'
import { Trophy, Copy, Check, RotateCcw, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { currentTier } from '@/lib/rewards'

interface GameOverModalProps {
  score: number
  bestCombo: number
  onRestart: () => void
}

export function GameOverModal({
  score,
  bestCombo,
  onRestart,
}: GameOverModalProps) {
  const tier = currentTier(score)
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard?.writeText(tier.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div className="w-full max-w-md animate-pop-in rounded-3xl border border-border bg-card p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Trophy
            className="h-8 w-8 text-accent-foreground"
            aria-hidden="true"
          />
        </div>

        <h2
          id="game-over-title"
          className="text-2xl font-extrabold text-foreground text-balance"
        >
          Sweet! You scored {score.toLocaleString()}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Best combo {bestCombo}x. You unlocked the{' '}
          <span className="font-semibold text-foreground">{tier.label}</span>{' '}
          reward.
        </p>

        <div className="my-6 rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your discount
          </p>
          <p className="text-3xl font-extrabold text-primary text-balance">
            {tier.discount}
          </p>
          <button
            type="button"
            onClick={copyCode}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 font-mono text-sm font-bold text-foreground shadow-sm ring-1 ring-border transition hover:ring-primary"
          >
            {copied ? (
              <Check className="h-4 w-4 text-candy-green" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Copied!' : tier.code}
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            className="flex-1 gap-2 text-base font-bold"
            onClick={() => {
              // Primary conversion action.
              window.alert(
                `Code ${tier.code} applied! Redirecting to the shop…`,
              )
            }}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            Shop &amp; Save Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={onRestart}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Replay
          </Button>
        </div>
      </div>
    </div>
  )
}
