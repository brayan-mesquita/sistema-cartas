import React from "react";
import { CheckCircle2, FileText, ArrowRight, ShieldCheck, Heart } from "lucide-react";

interface LetterItem {
  filename: string;
  url: string;
  provider: string;
}

interface SuccessViewProps {
  participantName: string;
  remitterName: string;
  relationship: string;
  letters: LetterItem[];
  onReset: () => void;
}

export function SuccessView({
  participantName,
  remitterName,
  relationship,
  letters,
  onReset,
}: SuccessViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 bg-[#ffffff] border border-[#e5e7eb] rounded-3xl shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 mb-5 shadow-inner">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 mb-3">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Enviado e Registrado na Nuvem
      </span>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mb-2">
        Cartas Recebidas com Sucesso!
      </h2>

      <p className="text-[#4b5563] text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Sua mensagem para <strong className="text-[#111827] font-bold">{participantName}</strong> foi salva no Google Drive e no sistema dos Servos Legendários.
      </p>

      <div className="bg-[#f9fafb] rounded-2xl p-5 text-left border border-[#e5e7eb] mb-8 space-y-4 shadow-xs">
        <div className="grid grid-cols-2 gap-4 text-xs pb-4 border-b border-[#e5e7eb]">
          <div>
            <span className="text-[#6b7280] block mb-0.5 font-medium">Participante:</span>
            <span className="font-bold text-[#111827]">{participantName}</span>
          </div>
          <div>
            <span className="text-[#6b7280] block mb-0.5 font-medium">Enviado por:</span>
            <span className="font-bold text-[#111827]">
              {remitterName} ({relationship})
            </span>
          </div>
        </div>

        <div>
          <span className="text-xs text-[#6b7280] block mb-2 font-semibold uppercase tracking-wider">
            Arquivos Anexados ({letters.length} de 5):
          </span>
          <div className="space-y-2">
            {letters.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#ffffff] border border-[#e5e7eb] text-xs shadow-2xs"
              >
                <div className="flex items-center gap-2.5 text-[#111827] truncate font-medium">
                  <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">{file.filename}</span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Google Drive
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all duration-200 cursor-pointer"
        >
          <span>Concluir</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-8 pt-4 border-t border-[#e5e7eb] text-xs text-[#6b7280] flex items-center justify-center gap-1.5">
        <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-600/20" />
        <span>Movimento Legendários — Momento Especial da Jornada</span>
      </div>
    </div>
  );
}
