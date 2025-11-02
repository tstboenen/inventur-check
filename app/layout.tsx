// app/layout.tsx
import type { ReactNode } from 'react';

export const metadata = {
  title: 'TST Bönen Inventur 2025',
  description: 'Inventur-Status und Admin-Verwaltung',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
