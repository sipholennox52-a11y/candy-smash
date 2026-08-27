'use client'

import type { Board, Pos } from '@/lib/game-logic'
import { CANDIES } from '@/lib/candies'
import { Tile } from '@/components/tile'

interface GameBoardProps {
  board: Board
  selected: Pos | null
  matched: Set<string>
  busy: boolean
  onTileClick: (pos: Pos) => void
}

export function GameBoard({
  board,
  selected,
  matched,
  busy,
  onTileClick,
}: GameBoardProps) {
  const cols = board[0]?.length ?? 8

  return (
    <div
      className="rounded-3xl border border-border bg-card p-2 shadow-xl shadow-primary/10 sm:p-3"
      role="grid"
      aria-label="Candy match board"
      aria-busy={busy}
    >
      <div
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {board.map((row, r) =>
          row.map((type, c) => {
            const isSelected =
              selected?.row === r && selected?.col === c
            const isMatched = matched.has(`${r}-${c}`)
            const label =
              type === null
                ? 'empty'
                : `${CANDIES[type].name} at row ${r + 1}, column ${c + 1}`
            return (
              <Tile
                key={`${r}-${c}`}
                type={type}
                selected={isSelected}
                matched={isMatched}
                ariaLabel={label}
                onClick={() => !busy && onTileClick({ row: r, col: c })}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
