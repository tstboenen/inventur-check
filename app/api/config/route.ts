import { NextResponse } from "next/server";
import kv from "@/lib/kv";

const KEY = "inventur:config";

export async function GET() {
  try {
    const cfg = (await kv.get(KEY)) || {};
    return NextResponse.json(cfg);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Fehler" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Hier kein Server-Auth – Frontend ist via Login geschützt.
    // Optional können wir später ein Header-Secret hinzufügen.
    const data = await req.json().catch(() => ({}));

    const cleaned = {
      start: data.start || null, // ISO-String oder null
      end: data.end || null,
      preText: typeof data.preText === "string" ? data.preText : "",
      liveText: typeof data.liveText === "string" ? data.liveText : "",
      info: typeof data.info === "string" ? data.info : "",
    };

    await kv.set(KEY, cleaned);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Bad Request" },
      { status: 400 }
    );
  }
}
