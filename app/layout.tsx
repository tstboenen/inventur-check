export const metadata = { title: "Inventur‑Check" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="de">
<body style={{
margin: 0,
background: "radial-gradient(1200px 800px at 20% -10%,#173057 0%,transparent 60%),radial-gradient(1000px 700px at 120% 10%,#10213d 0%,transparent 50%),#0b1220",
color: "#e6eeff",
fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif",
}}>
<div style={{maxWidth: 980, margin: "0 auto", padding: 24}}>
{children}
</div>
</body>
</html>
);
}
