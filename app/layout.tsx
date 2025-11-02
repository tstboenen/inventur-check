// app/layout.tsx
import localFont from "next/font/local";

const tstFont = localFont({
  src: "/fonts/tst.woff2", // <— deine Datei im /public/fonts/
  display: "swap",
  weight: "400",
});

export const metadata = {
  title: "Inventur-Check",
  description: "Inventur-Status & Admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body
        className={tstFont.className}
        style={{ background: "#ffffff", color: "#111827", minHeight: "100vh", margin: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
