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
  title: "Portal de Cartas — Servos Legendários",
  description: "Portal Oficial de Envio de Cartas de Apoio do Movimento Legendários.",
  openGraph: {
    title: "Portal de Cartas — Servos Legendários",
    description: "Envie cartas em PDF para os participantes do evento Legendários.",
    type: "website",
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
