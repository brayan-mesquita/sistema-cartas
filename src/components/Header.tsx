import React from "react";
import { Mail, Shield } from "lucide-react";

export function Header() {
  return (
    <header className="w-full py-3.5 sm:py-4 px-3 sm:px-6 border-b border-[#e5e7eb] bg-[#ffffff] shadow-xs sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Mail className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-[#111827] leading-tight">
                LEGENDÁRIOS
              </h1>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                Portal de Cartas
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#6b7280] font-medium leading-none mt-0.5 truncate hidden sm:block">
              Sistema Tático de Envio e Gestão de Cartas
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-[11px] sm:text-xs text-[#4b5563] bg-[#f3f4f6] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#e5e7eb] font-semibold whitespace-nowrap">
          <Shield className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-600 shrink-0" />
          <span>Legendários</span>
        </div>
      </div>
    </header>
  );
}
