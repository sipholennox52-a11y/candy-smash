// Pure match-3 game logic. No React here — easy to reason about and test.

export const NUM_TYPES = 6
export type Cell = number | null
export type Board = Cell[][]
export interface Pos {
  row: number
  col: number
}

function randomType(): number {
  return Math.floor(Math.random() * NUM_TYPES)
}

/**
 * Create a board with no pre-existing matches so the player starts
 * from a neutral position.
 */
export function createBoard(rows: number, cols: number): Board {
  const board: Board = []
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = []
    for (let c = 0; c < cols; c++) {
      let type = randomType()
      // Avoid creating an initial horizontal or vertical run of 3.
      while (
        (c >= 2 && row[c - 1] === type && row[c - 2] === type) ||
        (r >= 2 && board[r - 1][c] === type && board[r - 2][c] === type)
      ) {
        type = randomType()
      }
      row.push(type)
    }
    board.push(row)
  }
  return board
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row])
}

export function areAdjacent(a: Pos, b: Pos): boolean {
  const dr = Math.abs(a.row - b.row)
  const dc = Math.abs(a.col - b.col)
  return dr + dc === 1
}

export function swap(board: Board, a: Pos, b: Pos): Board {
  const next = cloneBoard(board)
  const tmp = next[a.row][a.col]
  next[a.row][a.col] = next[b.row][b.col]
  next[b.row][b.col] = tmp
  return next
}

/**
 * Return the set of positions (encoded as "row-col") that belong to a
 * horizontal or vertical run of 3 or more identical candies.
 */
export function findMatches(board: Board): Set<string> {
  const matches = new Set<string>()
  const rows = board.length
  const cols = board[0].length

  // Horizontal runs
  for (let r = 0; r < rows; r++) {
    let runStart = 0
    for (let c = 1; c <= cols; c++) {
      const same =
        c < cols && board[r][c] !== null && board[r][c] === board[r][runStart]
      if (!same) {
        if (c - runStart >= 3) {
          for (let k = runStart; k < c; k++) matches.add(`${r}-${k}`)
        }
        runStart = c
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < cols; c++) {
    let runStart = 0
    for (let r = 1; r <= rows; r++) {
      const same =
        r < rows && board[r][c] !== null && board[r][c] === board[runStart][c]
      if (!same) {
        if (r - runStart >= 3) {
          for (let k = runStart; k < r; k++) matches.add(`${k}-${c}`)
        }
        runStart = r
      }
    }
  }

  return matches
}

/** Remove matched cells (set to null) and return the new board. */
export function clearMatches(board: Board, matches: Set<string>): Board {
  const next = cloneBoard(board)
  for (const key of matches) {
    const [r, c] = key.split('-').map(Number)
    next[r][c] = null
  }
  return next
}

/**
 * Apply gravity: existing candies fall to fill empty cells, then new
 * random candies drop in from the top.
 */
export function collapseAndRefill(board: Board): Board {
  const rows = board.length
  const cols = board[0].length
  const next = cloneBoard(board)

  for (let c = 0; c < cols; c++) {
    const column: number[] = []
    for (let r = rows - 1; r >= 0; r--) {
      if (next[r][c] !== null) column.push(next[r][c] as number)
    }
    for (let r = rows - 1; r >= 0; r--) {
      const idx = rows - 1 - r
      next[r][c] = idx < column.length ? column[idx] : randomType()
    }
  }

  return next
}

/** Does the board currently have at least one match? */
export function hasMatches(board: Board): boolean {
  return findMatches(board).size > 0
}
