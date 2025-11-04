// app/api/config/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

// OPTIONAL: Vercel KV (Upstash). Wenn nicht vorhanden, wird fallback genutzt.
let kv: { get: (k: string) => Promise<any>; set: (k: string, v: any) => Promise<void> } | null = null;
try {
  // @ts-ignore
  const mod = await import("@vercel/kv");
  // @ts-ignore
  kv = mod.kv;
} catch {
  kv = null;
}

// Fallback in-memory (nur dev, nicht persistent):
const MEM_KEY = "__CFG_MEM__";
if (!(globalThis as any)[MEM_KEY]) {
  (globalThis as any)[MEM_KEY] = null;
}

type Shift = {
  type: "Früh" | "Spät" | "Nacht";
  date: string; // ISO
  status: "Muss arbeiten" | "Hat frei";
};

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null; // ISO oder null
  info: string;
  shifts: Shift[];
};

const ShiftSchema = z.object({
  type: z.enum(["Früh", "Spät", "Nacht"]),
  // akzeptiere "YYYY-MM-DD" oder ISO; normalisiere auf ISO
  date: z.string().transform((v) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T00:00:00Z").toISOString();
    const d = new Date(v);
    return d.toISOString();
  }),
  status: z.enum(["Muss arbeiten", "Hat frei"]),
});

const CfgSchema = z.object({
  live: z.boolean().default(false),
  ended: z.boolean().default(false),
  start: z.string().nullable().optional(),
  info: z.string().default("").optional(),
  shifts: z.array(ShiftSchema).default([]).optional(),
});

const KEY = "config";

async function readCfg(): Promise<Partial<Cfg> | null> {
  if (kv) {
    return (await kv.get(KEY)) as Partial<Cfg> | null;
  }
  return (globalThis as any)[MEM_KEY];
}

async function writeCfg(data: Cfg) {
  if (kv) {
    await kv.set(KEY, data);
    return;
  }
  (globalThis as any)[MEM_KEY] = data;
}

export async function GET() {
  const raw = (await readCfg()) ?? {};
  const parsed = CfgSchema.partial().parse(raw);

  return NextResponse.json({
    live: !!parsed.live,
    ended: !!parsed.ended,
    start: parsed.start ?? null,
    info: parsed.info ?? "",
    shifts: parsed.shifts ?? [],
  } satisfies Cfg);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const parsed = CfgSchema.parse({
    live: body.live,
    ended: body.ended,
    start: body.start ?? null,
    info: body.info ?? "",
    // Regel aus dem Admin-UI: shifts nur, wenn live
    shifts: body.live ? body.shifts ?? [] : [],
  });

  // Wenn live oder ended aktiv → start immer null
  const startFinal = parsed.live || parsed.ended ? null : parsed.start ?? null;

  const toSave: Cfg = {
    live: parsed.live,
    ended: parsed.ended,
    start: startFinal,
    info: parsed.info ?? "",
    shifts: parsed.shifts ?? [],
  };

  await writeCfg(toSave);
  return NextResponse.json(toSave);
}
