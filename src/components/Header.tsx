import React from "react";
import { Mail, Shield } from "lucide-react";

export function Header() {
  return (
    <header className="w-full py-5 px-4 border-b border-[#e5e7eb] bg-[#ffffff] shadow-xs sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Mail className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#111827] flex items-center gap-2">
              LEGENDÁRIOS <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold uppercase tracking-wider">Portal de Cartas</span>
            </h1>
            <p className="text-xs text-[#6b7280] font-medium">Sistema Tático de Envio e Gestão de Cartas</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#4b5563] bg-[#f3f4f6] px-3.5 py-1.5 rounded-full border border-[#e5e7eb] font-medium">
          <Shield className="h-3.5 w-3.5 text-amber-600" />
          <span>Legendários</span>
        </div>
      </div>
    </header>
  );
}
