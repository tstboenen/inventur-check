import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user, pass } = await req.json();
    const validUser = process.env.ADMIN_USER;
    const validPass = process.env.ADMIN_PASS;

    if (user === validUser && pass === validPass) {
      // einfache Session-Bestätigung
      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ ok: false, error: "Falsche Zugangsdaten" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültige Anfrage" }, { status: 400 });
  }
}
