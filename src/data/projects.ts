export interface Project {
  name: string
  note: string
  href: string
  /** Hover color, oklch. */
  color: string
  /** Special hover effect. Default: the dither fill. */
  hover?: "sky" | "zips" | "cipher"
  /** Marks work that can change or break. */
  experimental?: boolean
}

export const GITHUB = "https://github.com/auzum197"

export const projects: readonly Project[] = [
  {
    name: "Pendrake",
    note: "Watch-only wallet",
    href: `${GITHUB}/pendrake-watch`,
    color: "oklch(0.7101 0.1558 252.03)",
    hover: "sky",
  },
  {
    name: "zipreader.org",
    note: "A friendlier way to read ZIPs",
    href: "https://zipreader.org",
    color: "oklch(0.8373 0.0975 232.84)",
    hover: "zips",
  },
  {
    name: "ZIP-311 (Sapling)",
    note: "Reveal chosen transaction outputs",
    href: "https://zip311.auzum197.com",
    color: "oklch(0.82 0.15 85)",
    hover: "cipher",
    experimental: true,
  },
]
