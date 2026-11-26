import { readFile } from "node:fs/promises"
import { crc32, deflateSync } from "node:zlib"
import { Resvg } from "@resvg/resvg-js"
import { createElement as h } from "react"
import satori from "satori"
import { LOOK, SIZE, SUN } from "@/data/og"
import { DESCRIPTION } from "@/data/site"
import css from "@/styles/global.css?raw"

interface Color {
  r: number
  g: number
  b: number
  a: number
}

/** The Z of the logo, in units of the logo size. Same as `logo.astro`. */
const Z = { size: 1.42, shift: -0.02, lift: -0.2 } as const

const clamp = (value: number): number => Math.min(1, Math.max(0, value))
const smooth = (from: number, to: number, value: number): number => {
  const t = clamp((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

/** The value of a token in `:root`. */
function token(name: string): string {
  const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1]
  if (!value) throw new Error(`Unknown token: --${name}`)
  return value.trim()
}

const size = (name: string): number => parseFloat(token(name))

/** A color token, from oklch to sRGB. */
function color(name: string): Color {
  const value = token(name)
  const from = /oklch\(from var\(--([\w-]+)\) l c h \/ ([\d.]+)%\)/.exec(value)
  if (from?.[1] && from[2]) {
    return { ...color(from[1]), a: parseFloat(from[2]) / 100 }
  }
  const parts = /oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/.exec(value)
  if (!parts) throw new Error(`Not an oklch color: --${name}`)
  const [l, c, h] = parts.slice(1).map(Number) as [number, number, number]
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mid = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const gamma = (x: number): number =>
    Math.round(
      255 * clamp(x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)
    )
  return {
    r: gamma(4.0767416621 * long - 3.3077115913 * mid + 0.2309699292 * short),
    g: gamma(-1.2684380046 * long + 2.6097574011 * mid - 0.3413193965 * short),
    b: gamma(-0.0041960863 * long - 0.7034186147 * mid + 1.707614701 * short),
    a: 1,
  }
}

const paint = ({ r, g, b, a }: Color): string => `rgba(${r}, ${g}, ${b}, ${a})`

/** Bayer threshold matrix of the given side, values from 0 to 1. */
function bayer(side: number): number[] {
  let matrix = [0]
  for (let width = 1; width < side; width *= 2) {
    const next = new Array<number>(width * width * 4).fill(0)
    matrix.forEach((value, i) => {
      const x = i % width
      const y = Math.floor(i / width)
      const put = (dx: number, dy: number, add: number): void => {
        next[(y + dy * width) * width * 2 + x + dx * width] = value * 4 + add
      }
      put(0, 0, 0)
      put(1, 0, 2)
      put(0, 1, 3)
      put(1, 1, 1)
    })
    matrix = next
  }
  return matrix.map((value) => (value + 0.5) / matrix.length)
}

/** Sol niger, the black sun of the nigredo. Density from 0 to 1. */
function sun(x: number, y: number): number {
  const d = Math.hypot(x, y)
  if (d < SUN.r) return 0
  const rays = 0.72 + 0.28 * Math.cos(Math.atan2(y, x) * 36)
  const rim = clamp(2 - Math.abs(d - SUN.r - 3))
  return Math.max(0.95 * rays * (SUN.r / d) ** 2.6, rim)
}

/** The dithered corona as RGBA pixels. It stays clear behind the text. */
function corona(): Buffer {
  const { width, height } = SIZE
  const { cell, matrix, shades, gain } = LOOK
  const ink = color("white")
  const opacity = size("og-art")
  const thresholds = bayer(matrix)
  const pixels = Buffer.alloc(width * height * 4)
  const SUB = 3
  for (let row = 0; row * cell < height; row++) {
    for (let col = 0; col * cell < width; col++) {
      let sum = 0
      for (let i = 0; i < SUB * SUB; i++) {
        const px = (col + ((i % SUB) + 0.5) / SUB) * cell
        const py = (row + (Math.floor(i / SUB) + 0.5) / SUB) * cell
        sum += sun(px - SUN.x, py - SUN.y)
      }
      const cx = (col + 0.5) * cell
      const cy = (row + 0.5) * cell
      const clear = smooth(
        0,
        0.45,
        1.15 * (cx / width) + 0.8 * (1 - cy / height) - 0.75
      )
      const scaled = clamp((sum / (SUB * SUB)) * clear * gain) * shades
      const threshold =
        thresholds[(row % matrix) * matrix + (col % matrix)] ?? 1
      const level = Math.floor(scaled) + (scaled % 1 > threshold ? 1 : 0)
      if (level === 0) continue
      const alpha = Math.round((255 * opacity * level) / shades)
      for (let y = row * cell; y < Math.min(height, (row + 1) * cell); y++) {
        for (let x = col * cell; x < Math.min(width, (col + 1) * cell); x++) {
          pixels.set([ink.r, ink.g, ink.b, alpha], (y * width + x) * 4)
        }
      }
    }
  }
  return pixels
}

/** RGBA pixels to a PNG file. */
function png(pixels: Buffer, width: number, height: number): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const body = Buffer.concat([Buffer.from(type), data])
    const head = Buffer.alloc(4)
    head.writeUInt32BE(data.length)
    const tail = Buffer.alloc(4)
    tail.writeUInt32BE(crc32(body))
    return Buffer.concat([head, body, tail])
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 6, 0, 0, 0], 8)
  const rows = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    pixels.copy(
      rows,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4
    )
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

const font = (path: string): Promise<Buffer> =>
  readFile(
    `node_modules/${path}-latin-${path.includes("variable") ? "wght" : "400"}-normal.woff2`
  )

/** The Open Graph image of the site, as a PNG file. */
export async function render(): Promise<Buffer> {
  const { width, height } = SIZE
  const pad = size("og-pad")
  const logo = size("og-logo")
  const art = png(corona(), width, height).toString("base64")
  const black = paint(color("black"))

  const card = h(
    "div",
    {
      style: {
        position: "absolute",
        display: "flex",
        left: 0,
        top: 0,
        width,
        height,
        backgroundImage: `radial-gradient(circle at ${SUN.x}px ${SUN.y}px, ${paint(color("raised"))}, ${black} ${size("og-glow")}px)`,
      },
    },
    h("img", { src: `data:image/png;base64,${art}`, width, height })
  )
  const mark = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "baseline",
        height: logo,
        fontSize: logo,
        lineHeight: 1,
      },
    },
    h("span", { style: { fontFamily: "Jacques Francois" } }, "Au"),
    h(
      "span",
      {
        style: {
          fontFamily: "Jacquard 12",
          fontSize: logo * Z.size,
          marginLeft: logo * Z.shift,
          marginTop: logo * Z.lift,
        },
      },
      "Z"
    )
  )
  const note = h(
    "div",
    {
      style: {
        fontFamily: "Geist Mono",
        fontSize: size("og-note"),
        lineHeight: 1,
        color: paint(color("dim")),
      },
    },
    DESCRIPTION
  )
  const sign = h(
    "div",
    {
      style: {
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        left: pad,
        bottom: pad,
        gap: size("og-gap"),
        color: paint(color("white")),
      },
    },
    mark,
    note
  )

  const svg = await satori(
    h(
      "div",
      { style: { display: "flex", width, height, background: black } },
      card,
      sign
    ),
    {
      width,
      height,
      fonts: [
        {
          name: "Jacques Francois",
          data: await font(
            "@fontsource/jacques-francois/files/jacques-francois"
          ),
        },
        {
          name: "Jacquard 12",
          data: await font("@fontsource/jacquard-12/files/jacquard-12"),
        },
        {
          name: "Geist Mono",
          data: await font("@fontsource-variable/geist-mono/files/geist-mono"),
        },
      ],
    }
  )
  return new Resvg(svg).render().asPng()
}
