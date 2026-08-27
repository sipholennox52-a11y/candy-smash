'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import {
  type Board,
  type Pos,
  areAdjacent,
  collapseAndRefill,
  clearMatches,
  createBoard,
  findMatches,
  hasMatches,
  swap,
} from '@/lib/game-logic'
import { GameBoard } from '@/components/game-board'
import { GameStats } from '@/components/game-stats'
import { RewardTracker } from '@/components/reward-tracker'
import { GameOverModal } from '@/components/game-over-modal'

const ROWS = 8
const COLS = 8
const START_MOVES = 25

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

// Render a stable empty grid on the server, then fill it on the client.
// This avoids a hydration mismatch from the randomly generated board.
function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null),
  )
}

export function SweetMatchGame() {
  const [board, setBoard] = useState<Board>(emptyBoard)
  const [selected, setSelected] = useState<Pos | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(START_MOVES)
  const [bestCombo, setBestCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [comboFlash, setComboFlash] = useState<number | null>(null)

  // Keep a ref of the latest board so async cascade logic never goes stale.
  const boardRef = useRef(board)
  boardRef.current = board

  // Generate the real board only on the client to keep SSR deterministic.
  useEffect(() => {
    setBoard(createBoard(ROWS, COLS))
  }, [])

  const resolveCascades = useCallback(async (start: Board) => {
    let working = start
    let chain = 0

    while (hasMatches(working)) {
      chain += 1
      const matches = findMatches(working)

      setMatched(matches)
      await sleep(200)

      const points = matches.size * 20 * chain
      setScore((s) => s + points)
      if (chain > 1) setComboFlash(chain)

      working = collapseAndRefill(clearMatches(working, matches))
      setBoard(working)
      setMatched(new Set())
      await sleep(170)
    }

    setBestCombo((b) => Math.max(b, chain))
    if (chain > 1) {
      await sleep(400)
      setComboFlash(null)
    }
  }, [])

  const handleTileClick = useCallback(
    async (pos: Pos) => {
      if (busy || gameOver) return

      if (!selected) {
        setSelected(pos)
        return
      }

      if (selected.row === pos.row && selected.col === pos.col) {
        setSelected(null)
        return
      }

      if (!areAdjacent(selected, pos)) {
        setSelected(pos)
        return
      }

      const from = selected
      setSelected(null)
      setBusy(true)

      const original = boardRef.current
      const swapped = swap(original, from, pos)
      setBoard(swapped)
      await sleep(160)

      if (!hasMatches(swapped)) {
        // Illegal move — swap back.
        setBoard(original)
        setBusy(false)
        return
      }

      setMoves((m) => m - 1)
      await resolveCascades(swapped)
      setBusy(false)
    },
    [busy, gameOver, selected, resolveCascades],
  )

  // End the game when the player runs out of moves.
  useEffect(() => {
    if (moves <= 0 && !busy) {
      const t = setTimeout(() => setGameOver(true), 300)
      return () => clearTimeout(t)
    }
  }, [moves, busy])

  const restart = useCallback(() => {
    setBoard(createBoard(ROWS, COLS))
    setSelected(null)
    setMatched(new Set())
    setBusy(false)
    setScore(0)
    setMoves(START_MOVES)
    setBestCombo(0)
    setGameOver(false)
    setComboFlash(null)
  }, [])

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex flex-col gap-4">
        <GameStats score={score} moves={moves} bestCombo={bestCombo} />

        <div className="relative">
          <GameBoard
            board={board}
            selected={selected}
            matched={matched}
            busy={busy}
            onTileClick={handleTileClick}
          />

          {comboFlash && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="animate-float-up rounded-full bg-primary px-5 py-2 text-2xl font-extrabold text-primary-foreground shadow-xl">
                {comboFlash}x Combo!
              </span>
            </div>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Tap a candy, then tap an adjacent one to swap and match 3+.
        </p>
      </div>

      <div className="lg:sticky lg:top-4">
        <RewardTracker score={score} />
      </div>

      {gameOver && (
        <GameOverModal
          score={score}
          bestCombo={bestCombo}
          onRestart={restart}
        />
      )}
    </div>
  )
}
