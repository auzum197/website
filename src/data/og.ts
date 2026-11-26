/** Size of the image, in pixels. */
export const SIZE = { width: 1200, height: 630 } as const

/** The black sun: center and radius of the disc, in image pixels. */
export const SUN = { x: 860, y: 300, r: 190 } as const

/** The dither of the corona. */
export const LOOK = {
  /** Dither cell, in image pixels. */
  cell: 3,
  /** Side of the Bayer matrix. */
  matrix: 4,
  /** Number of tones above black. */
  shades: 8,
  /** Multiplier of the pattern density. */
  gain: 0.7,
} as const
