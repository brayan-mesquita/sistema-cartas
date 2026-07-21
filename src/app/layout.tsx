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

// Este metadata é avaliado em tempo de BUILD (a home é estática), então
// NEXT_PUBLIC_APP_URL precisa chegar como build arg no Docker. O fallback é o
// domínio de produção — nunca localhost, que quebraria o preview do WhatsApp.
const PRODUCTION_URL = "https://cartas.legendariosportovelho.com.br";

function resolveBaseUrl(): string {
  // env_file do Docker não remove aspas, então o valor pode chegar com elas.
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/^["']|["']$/g, "");
  if (!raw) return PRODUCTION_URL;
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

const baseUrl = resolveBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Cartas aos Senderistas — Movimento Legendários",
  description: "Portal Oficial de Envio de Cartas de Apoio para os Senderistas do Movimento Legendários.",
  openGraph: {
    title: "Cartas aos Senderistas — Movimento Legendários",
    description: "Portal Oficial de Envio de Cartas de Apoio em PDF.",
    url: "/",
    siteName: "Movimento Legendários",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
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
