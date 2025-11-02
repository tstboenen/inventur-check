import { NextResponse } from "next/server";

const deny = (msg = "Unauthorized") =>
  NextResponse.json({ error: msg }, { status: 401 });

export async function POST(req: Request) {
  try {
    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };

    const ENV_USER = process.env.ADMIN_USER || "";
    const ENV_PASS = process.env.ADMIN_PASS || "";

    if (!ENV_USER || !ENV_PASS) return deny("Login nicht konfiguriert (ENV fehlt)");
    if (!username || !password) return deny("Benutzername/Passwort fehlt");
    if (username !== ENV_USER || password !== ENV_PASS) return deny("Falsche Zugangsdaten");

    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_session", "ok", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,        // Vercel = HTTPS
      maxAge: 60 * 60 * 6, // 6 Stunden
    });
    return res;
  } catch {
    return deny();
  }
}
