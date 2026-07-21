import type { Metadata } from "next";

// A página do painel é um client component e não pode exportar metadata,
// então o noindex vive aqui. Sem isto, /admin herda o OpenGraph da home e
// fica indexável pelos buscadores.
export const metadata: Metadata = {
  title: "Painel Administrativo",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
