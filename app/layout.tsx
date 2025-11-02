import "./globals.css";

// app/layout.tsx
export const metadata = {
  title: "Inventur-Check",
  description: "Inventur-Status & Admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body
        className="min-h-screen text-gray-900"
        style={{ background: "#ffffff", backgroundImage: "none" }}
      >
        {children}
      </body>
    </html>
  );
}
