export interface RewardTier {
  threshold: number
  label: string
  discount: string
  code: string
}

// Score thresholds unlock progressively better discounts — the core of
// turning a casual player (viewer) into a buyer.
export const REWARD_TIERS: RewardTier[] = [
  { threshold: 0, label: 'Warm-up', discount: '5% off', code: 'SWEET5' },
  { threshold: 600, label: 'Sweet Tooth', discount: '10% off', code: 'SWEET10' },
  { threshold: 1500, label: 'Sugar Rush', discount: '15% off + free shipping', code: 'SWEET15' },
  { threshold: 3000, label: 'Candy Legend', discount: '25% off everything', code: 'SWEET25' },
]

export function currentTier(score: number): RewardTier {
  let tier = REWARD_TIERS[0]
  for (const t of REWARD_TIERS) {
    if (score >= t.threshold) tier = t
  }
  return tier
}

export function nextTier(score: number): RewardTier | null {
  return REWARD_TIERS.find((t) => score < t.threshold) ?? null
}

// Maps every reward code to the percentage discount it grants. Used by the
// cart/checkout to validate a code players earned in the game.
const CODE_PERCENT: Record<string, number> = {
  SWEET5: 5,
  SWEET10: 10,
  SWEET15: 15,
  SWEET25: 25,
}

// Returns the discount percentage for a code, or 0 if it is not valid.
export function discountForCode(code: string): number {
  return CODE_PERCENT[code.trim().toUpperCase()] ?? 0
}

// localStorage key used to carry an earned code from the game to the shop.
export const EARNED_CODE_KEY = 'sweetmatch:earned-code'

