"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { CartaForm } from "@/components/CartaForm";
import { SuccessView } from "@/components/SuccessView";

export default function Home() {
  const [submittedData, setSubmittedData] = useState<{
    participantName: string;
    remitterName: string;
    relationship: string;
    letters: any[];
  } | null>(null);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 relative overflow-hidden">
      {/* Elementos Decorativos Táticos de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Cabeçalho */}
      <Header />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {submittedData ? (
          <SuccessView
            participantName={submittedData.participantName}
            remitterName={submittedData.remitterName}
            relationship={submittedData.relationship}
            letters={submittedData.letters}
            onReset={() => setSubmittedData(null)}
          />
        ) : (
          <CartaForm onSuccess={(data) => setSubmittedData(data)} />
        )}
      </main>

      {/* Rodapé */}
      <footer className="w-full py-6 text-center text-xs text-[#6b7280] font-medium border-t border-[#e5e7eb] bg-[#ffffff]">
        <p>Movimento Legendários</p>
      </footer>
    </div>
  );
}
