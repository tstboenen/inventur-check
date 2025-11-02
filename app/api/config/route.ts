import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

type Cfg = {
  start: string | null;
  end: string | null;
  preText: string;
  liveText: string;
  info: string;
};

const KEY = "inventur:config";

// -------- Helpers --------
function toCfgFromHash(h: Record<string, string> | null): Cfg {
  const norm = (v?: string | null) => (v === undefined || v === null || v === "" ? null : v);
  return {
    start: norm(h?.start ?? null),
    end: norm(h?.end ?? null),
    preText: h?.preText ?? "",
    liveText: h?.liveText ?? "",
    info: h?.info ?? "",
  };
}

function maybeParseJson<T = any>(val: unknown): T | null {
  if (typeof val !== "string") return null;
  try {
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

function sanitizeInput(body: Partial<Cfg>): Cfg {
  const isIso = (s: unknown) => {
    if (typeof s !== "string" || !s) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
  };

  const start =
    body.start === null || body.start === "" || body.start === undefined
      ? null
      : isIso(body.start)
      ? String(body.start)
      : (() => {
          throw new Error("Ungültige Startzeit (ISO erwartet).");
        })();

  const end =
    body.end === null || body.end === "" || body.end === undefined
      ? null
      : isIso(body.end)
      ? String(body.end)
      : (() => {
          throw new Error("Ungültige Endzeit (ISO erwartet).");
        })();

  return {
    start,
    end,
    preText: typeof body.preText === "string" ? body.preText : "",
    liveText: typeof body.liveText === "string" ? body.liveText : "",
    info: typeof body.info === "string" ? body.info : "",
  };
}

function toHashPayload(cfg: Cfg): Record<string, string> {
  // Redis Hash speichert Strings – null -> ""
  return {
    start: cfg.start ?? "",
    end: cfg.end ?? "",
    preText: cfg.preText ?? "",
    liveText: cfg.liveText ?? "",
    info: cfg.info ?? "",
  };
}

// -------- GET --------
export async function GET() {
  // 1) Versuche Hash
  const hash = await kv.hgetall<Record<string, string>>(KEY);
  if (hash && Object.keys(hash).length > 0) {
    return NextResponse.json(toCfgFromHash(hash), {
      headers: { "Cache-Control": "no-store" },
    });
  }

  // 2) Legacy: evtl. liegt ein JSON-String unter KEY
  const legacy = await kv.get(KEY);
  const parsed = maybeParseJson<Record<string, any>>(legacy);
  if (parsed && typeof parsed === "object") {
    const cfg: Cfg = {
      start: parsed.start ?? null,
      end: parsed.end ?? null,
      preText: parsed.preText ?? "",
      liveText: parsed.liveText ?? "",
      info: parsed.info ?? "",
    };
    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  }

  // 3) Default
  const empty: Cfg = { start: null, end: null, preText: "", liveText: "", info: "" };
  return NextResponse.json(empty, { headers: { "Cache-Control": "no-store" } });
}

// -------- POST --------
export async function POST(req: Request) {
  // Session prüfen (Cookie wurde von /api/login gesetzt)
  const cookie = req.headers.get("cookie") || "";
  const ok = /(^|;\s*)admin_session=ok(;|$)/.test(cookie);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<Cfg>;
    const cfg = sanitizeInput(body);
    const payload = toHashPayload(cfg);

    try {
      // Normalfall: als Hash speichern
      await kv.hset(KEY, payload);
    } catch (err: any) {
      // WRONGTYPE -> Key existiert als String/anderer Typ -> migrieren
      const msg = String(err?.message || "");
      if (msg.includes("WRONGTYPE")) {
        // alten Wert sichern (optional)
        // const legacy = await kv.get(KEY);
        // Key löschen und als Hash neu anlegen
        await kv.del(KEY);
        await kv.hset(KEY, payload);
      } else {
        throw err;
      }
    }

    return NextResponse.json(cfg, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Ungültiger Request" },
      { status: 400 }
    );
  }
}
