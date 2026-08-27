import { Candy, Cherry, Citrus, Cookie, Donut, Grape } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface CandyDef {
  name: string
  icon: LucideIcon
  /** Tailwind background class backed by a themed candy color token. */
  bg: string
  /** Soft tint used for the tile face. */
  face: string
}

export const CANDIES: CandyDef[] = [
  { name: 'Cherry Drop', icon: Cherry, bg: 'bg-candy-red', face: 'text-candy-red' },
  { name: 'Citrus Twist', icon: Citrus, bg: 'bg-candy-orange', face: 'text-candy-orange' },
  { name: 'Lemon Pop', icon: Candy, bg: 'bg-candy-yellow', face: 'text-candy-yellow' },
  { name: 'Mint Chew', icon: Cookie, bg: 'bg-candy-green', face: 'text-candy-green' },
  { name: 'Blue Raspberry', icon: Donut, bg: 'bg-candy-blue', face: 'text-candy-blue' },
  { name: 'Grape Gummy', icon: Grape, bg: 'bg-candy-grape', face: 'text-candy-grape' },
]
