// app/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "TST Bönen Inventur 2025",
  description: "Status & Countdown zur Inventur",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        {/* Poppins global einbinden */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#ffffff",
        }}
      >
        {children}
      </body>
    </html>
  );
}
