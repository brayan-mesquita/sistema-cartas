import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Cartas aos Senderistas — Movimento Legendários",
  description: "Portal Oficial de Envio de Cartas de Apoio para os Senderistas do Movimento Legendários.",
  openGraph: {
    title: "Cartas aos Senderistas — Movimento Legendários",
    description: "Portal Oficial de Envio de Cartas de Apoio em PDF.",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 1200,
        alt: "Cartas aos Senderistas — Movimento Legendários",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cartas aos Senderistas — Movimento Legendários",
    description: "Portal Oficial de Envio de Cartas de Apoio em PDF.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} light`}>
      <body className="font-sans antialiased bg-[#f3f4f6] text-[#111827]">{children}</body>
    </html>
  );
}
