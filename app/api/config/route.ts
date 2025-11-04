import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

/* ---------- Typen ---------- */
type Shift = {
  type: "Früh" | "Spät" | "Nacht";
  date: string; // "YYYY-MM-DD"
  status: "Muss arbeiten" | "Hat frei";
};

type Cfg = {
  live: boolean;
  ended: boolean;
  start: string | null; // ISO
  info: string;
  shifts: Shift[];
};

/* ---------- Keys ---------- */
const KEY_V2 = "inventur:config:v2";   // JSON-Blob (neues, robustes Format)
const KEY_V1 = "inventur:config";      // Alt: Hash (legacy)

/* ---------- Helpers ---------- */
const boolFromHash = (v?: string | null) => v === "1";
const boolToHash = (v?: boolean) => (v ? "1" : "0");
const normNull = (v?: string | null) =>
  v === undefined || v === null || v === "" ? null : v;
const isIso = (s: unknown) =>
  typeof s === "string" && s.length > 0 && !Number.isNaN(new Date(s).getTime());

function maybeParseJson<T = any>(val: unknown): T | null {
  if (typeof val !== "string") return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

function toCfgFromHash(h: Record<string, string> | null): Cfg | null {
  if (!h || Object.keys(h).length === 0) return null;
  const live = boolFromHash(h?.live);
  const ended = boolFromHash(h?.ended);
  const start = normNull(h?.start);
  const info = h?.info ?? "";
  const shifts = h?.shifts ? (maybeParseJson<Shift[]>(h.shifts) ?? []) : [];
  return { live, ended, start, info, shifts };
}

function sanitizeShifts(input: unknown): Shift[] {
  if (Array.isArray(input)) {
    return input.filter(
      (s: any) =>
        s &&
        (s.type === "Früh" || s.type === "Spät" || s.type === "Nacht") &&
        typeof s.date === "string" &&
        (s.status === "Muss arbeiten" || s.status === "Hat frei")
    );
  }
  if (typeof input === "string") {
    const parsed = maybeParseJson<Shift[]>(input);
    if (Array.isArray(parsed)) return sanitizeShifts(parsed);
  }
  return [];
}

function sanitizeInput(body: any): Cfg {
  const _live = typeof body?.live === "boolean" ? body.live : false;
  const _ended = typeof body?.ended === "boolean" ? body.ended : false;

  // Geschäftslogik: ended ⇒ live
  const live = _ended ? true : _live;
  const ended = _ended && live;

  // start nur, wenn weder live noch ended
  let start: string | null = null;
  const allowStart = !live && !ended;
  if (allowStart && isIso(body?.start)) start = String(body.start);

  const info = typeof body?.info === "string" ? body.info : "";

  // Shifts robust akzeptieren (Array oder JSON-String). Nicht an live koppeln,
  // aber im Admin schicken wir ohnehin nur bei live > 0.
  const shifts = sanitizeShifts(body?.shifts);

  return { live, ended, start, info, shifts };
}

/* ---------- Migration: V1 (Hash) -> V2 (JSON) ---------- */
async function loadCfg(): Promise<Cfg> {
  // 1) Bevorzugt V2 (JSON)
  const raw = await kv.get<string>(KEY_V2);
  const parsed = maybeParseJson<Cfg>(raw);
  if (parsed && typeof parsed === "object") {
    // Ensure defaults
    return {
      live: !!parsed.live,
      ended: !!parsed.ended,
      start: parsed.start ?? null,
      info: parsed.info ?? "",
      shifts: Array.isArray(parsed.shifts) ? parsed.shifts : [],
    };
  }

  // 2) Fallback: V1 (Hash) → migrieren
  try {
    const h = await kv.hgetall<Record<string, string>>(KEY_V1);
    const migrated = toCfgFromHash(h);
    if (migrated) {
      await kv.set(KEY_V2, JSON.stringify(migrated));
      return migrated;
    }
  } catch (e: any) {
    // falls WRONGTYPE (z.B. V1 war nie Hash), ignorieren wir
  }

  // 3) Default
  return { live: false, ended: false, start: null, info: "", shifts: [] };
}

/* ---------- GET ---------- */
export async function GET() {
  const cfg = await loadCfg();
  return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
}

/* ---------- POST ---------- */
export async function POST(req: Request) {
  // Session prüfen
  const cookie = req.headers.get("cookie") || "";
  const ok = /(^|;\s*)admin_session=ok(;|$)/.test(cookie);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const cfg = sanitizeInput(body);

    // JSON-Blob speichern (V2)
    await kv.set(KEY_V2, JSON.stringify(cfg));

    // Optional: V1 Hash für Kompatibilität mit alter Startseite mitschreiben
    try {
      await kv.hset(KEY_V1, {
        live: boolToHash(cfg.live),
        ended: boolToHash(cfg.ended),
        start: cfg.start ?? "",
        info: cfg.info ?? "",
        shifts: JSON.stringify(cfg.shifts ?? []),
      });
    } catch (err: any) {
      // Falls KEY_V1 zuvor falschen Typ hat, neu anlegen
      if (String(err?.message || "").includes("WRONGTYPE")) {
        await kv.del(KEY_V1);
        await kv.hset(KEY_V1, {
          live: boolToHash(cfg.live),
          ended: boolToHash(cfg.ended),
          start: cfg.start ?? "",
          info: cfg.info ?? "",
          shifts: JSON.stringify(cfg.shifts ?? []),
        });
      }
    }

    // direkt den gespeicherten Zustand zurückgeben
    const savedRaw = await kv.get<string>(KEY_V2);
    const saved = maybeParseJson<Cfg>(savedRaw) ?? cfg;

    return NextResponse.json(saved, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Ungültiger Request" }, { status: 400 });
  }
}
