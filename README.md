# Inventur‑Check (Vercel)


## Deployment (schnell)
1. Repo in GitHub erstellen und diesen Code pushen.
2. In **Vercel**: "Add New Project" → Repo auswählen.
3. Unter **Storage** → **KV** hinzufügen (Free Tier reicht). Vercel setzt die `KV_*` Umgebungsvariablen automatisch.
4. In **Vercel → Settings → Environment Variables** `ADMIN_PIN` setzen (z. B. `123456`).
5. Optional: `NEXT_PUBLIC_BASE_URL` auf deine Domain setzen (z. B. `https://inventur-check.vercel.app`).
6. Deploy.


## Nutzung
- **Öffentliche Seite:** `/` zeigt Countdown & Status.
- **Admin:** `/admin` (mit PIN speichern). Keine Daten im Browser, alles serverseitig.


## Hinweise
- Kein Token im Client. KV‑Zugang läuft nur **serverseitig**.
- Willst du später Rollen/Accounts → NextAuth + Passwordless oder SSO.
