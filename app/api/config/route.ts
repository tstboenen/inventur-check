import { NextResponse } from "next/server";
import kv from "@/lib/kv";
import { z } from "zod";

// wichtig für Vercel: Route darf NICHT statisch generiert werden
export const dynamic = "force-dynamic";

const schema = z.object({
  start: z.string().datetime().nullable(),
  end: z.string().datetime().nullable().optional(),
  preText: z.string().default(""),
  liveText: z.string().default(""),
  info: z.string().default(""),
  tz: z.string().default("Europe/Berlin"),
  v: z.number().default(2),
});

const KEY = "inventur:config";

// 📥 GET – holt aktuelle Config aus Vercel KV
export async function GET() {
  const cfg = (await kv.get(KEY)) as unknown;
  if (!cfg) {
    return NextResponse.json({
      start: null,
      end: null,
      preText: "",
      liveText: "Die Inventur ist gestartet.",
      info: "",
      tz: "Europe/Berlin",
      v: 2,
    });
  }
  return NextResponse.json(cfg);
}

// 📤 POST – speichert Config (nur mit PIN erlaubt)
export async function POST(req: Request) {
  const pin = process.env.ADMIN_PIN;
  const sent =
    new URL(req.url).searchParams.get("pin") ||
    (await req
      .clone()
      .formData()
      .then((f) => f.get("pin")?.toString())
      .catch(() => null));

  if (!pin || sent !== pin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  let data: unknown;

  if (contentType.includes("application/json")) {
    data = await req.json();
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const fd = await req.formData();
    data = Object.fromEntries(fd.entries());
  } else {
    data = await req.json().catch(() => ({}));
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  await kv.set(KEY, parsed.data);
  return NextResponse.json({ ok: true });
}
