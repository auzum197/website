import type { APIRoute } from "astro"
import { render } from "@/lib/og"

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await render()), {
    headers: { "Content-Type": "image/png" },
  })
