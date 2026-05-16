import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5serving FarmMarket",
  description: "Farm Fresh. Community First. Direct from farmers to your table.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Nunito:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#1B4332" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body style={{ background: "var(--cream)", fontFamily: "'Nunito', sans-serif", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
