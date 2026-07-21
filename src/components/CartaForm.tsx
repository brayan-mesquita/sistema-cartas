"use client";

import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from "react";
import {
  Upload,
  FileText,
  X,
  User,
  Phone,
  Heart,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";

interface CartaFormProps {
  onSuccess: (data: {
    participantName: string;
    remitterName: string;
    relationship: string;
    letters: any[];
  }) => void;
}

export function CartaForm({ onSuccess }: CartaFormProps) {
  // Wizard Step State (1: Identificação do Participante, 2: Upload das Cartas)
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields State
  const [participantPhone, setParticipantPhone] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [remitterName, setRemitterName] = useState("");

  // Anti-bot Verification State (Math Captcha & Honeypot)
  const [num1, setNum1] = useState(3);
  const [num2, setNum2] = useState(4);
  const [mathAnswer, setMathAnswer] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Campo armadilha invisível

  // Files State (Max 5 PDFs)
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Status & Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [alreadyRegisteredMessage, setAlreadyRegisteredMessage] = useState("");
  
  // Submission & Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gerar nova pergunta da verificação matemática
  const generateMathCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2 a 9
    const n2 = Math.floor(Math.random() * 8) + 1; // 1 a 8
    setNum1(n1);
    setNum2(n2);
    setMathAnswer("");
  };

  useEffect(() => {
    generateMathCaptcha();
  }, []);

  // Manipular alteração do telefone
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setParticipantPhone(formatted);
    setAlreadyRegistered(false);
    setAlreadyRegisteredMessage("");
    setErrorMessage("");
  };

  // Verificar se o telefone já está cadastrado no SQLite local antes de avançar
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Verificação Honeypot (Se robô preencheu o campo invisível)
    if (honeypot) {
      console.warn("Spam bot detectado via Honeypot.");
      return;
    }

    const digitsOnly = participantPhone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      setErrorMessage("Por favor, informe um número de telefone celular válido com DDD.");
      return;
    }

    if (!participantName.trim()) {
      setErrorMessage("Por favor, preencha o nome completo do participante.");
      return;
    }

    // Verificação Anti-robô
    if (parseInt(mathAnswer.trim(), 10) !== num1 + num2) {
      setErrorMessage(`Verificação de segurança incorreta. Quanto é ${num1} + ${num2}?`);
      generateMathCaptcha();
      return;
    }

    setIsVerifying(true);
    setAlreadyRegistered(false);
    setAlreadyRegisteredMessage("");

    try {
      const res = await fetch(`/api/participante/buscar?phone=${encodeURIComponent(digitsOnly)}`);
      const data = await res.json();

      if (data.alreadyRegistered) {
        setAlreadyRegistered(true);
        setAlreadyRegisteredMessage(
          data.message ||
            "As cartas já foram enviadas para o respectivo contato. Em caso de dúvida, procure a organização do evento."
        );
        return;
      }

      // Se não está cadastrado no SQLite, avança para a Etapa 2
      setStep(2);
    } catch (error) {
      console.error("Erro na verificação local:", error);
      setStep(2);
    } finally {
      setIsVerifying(false);
    }
  };

  // Adicionar arquivos PDF (Máx 5 arquivos)
  const handleAddFiles = (newFiles: FileList | File[]) => {
    setErrorMessage("");
    const pdfFiles = Array.from(newFiles).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length < newFiles.length) {
      setErrorMessage("Apenas arquivos no formato PDF são aceitos.");
    }

    const MAX_SIZE = 15 * 1024 * 1024;
    const validSizeFiles = pdfFiles.filter((f) => f.size <= MAX_SIZE);
    if (validSizeFiles.length < pdfFiles.length) {
      setErrorMessage("Arquivos maiores que 15MB foram descartados.");
    }

    setFiles((prev) => {
      const combined = [...prev, ...validSizeFiles];
      if (combined.length > 5) {
        setErrorMessage("Você pode anexar no máximo 5 cartas PDF por participante.");
        return combined.slice(0, 5);
      }
      return combined;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Abrir modal de confirmação antes de enviar
  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (honeypot) return;

    if (!remitterName.trim()) {
      setErrorMessage('Por favor, preencha o campo "Seu nome".');
      return;
    }

    if (files.length === 0) {
      setErrorMessage("Anexe pelo menos 1 arquivo PDF para enviar.");
      return;
    }

    setShowConfirmModal(true);
  };

  // Envio final para o backend (Google Drive + SQLite)
  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("participantPhone", participantPhone);
      formData.append("participantName", participantName);
      formData.append("remitterName", remitterName);

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/cartas/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.alreadyRegistered) {
          setAlreadyRegistered(true);
          setAlreadyRegisteredMessage(result.error);
          setStep(1);
        }
        throw new Error(result.error || "Falha ao processar o envio das cartas.");
      }

      onSuccess({
        participantName: result.participantName,
        remitterName: result.remitterName,
        relationship: result.relationship || "Familiar",
        letters: result.letters,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Ocorreu um erro ao enviar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto p-6 sm:p-8 bg-[#ffffff] border border-[#e5e7eb] rounded-3xl shadow-lg relative space-y-6">
        {/* Banner de Capa Institucional: Cartas aos Senderistas */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-[#e5e7eb] bg-[#1a0c04] flex items-center justify-center p-1 sm:p-2">
          <img
            src="/banner-whatsapp.jpg"
            alt="Cartas aos Senderistas — Movimento Legendários"
            className="w-full h-auto max-h-[360px] sm:max-h-[440px] object-contain rounded-xl"
          />
        </div>

        {/* Indicador de Etapas */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1 ? "bg-amber-600 text-white shadow-sm" : "bg-[#f3f4f6] text-[#6b7280]"
              }`}
            >
              1
            </div>
            <span className={`text-xs font-bold ${step === 1 ? "text-amber-700" : "text-[#6b7280]"}`}>
              Dados do Participante
            </span>
          </div>

          <div className="h-0.5 w-8 bg-[#e5e7eb] hidden sm:block" />

          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2 ? "bg-amber-600 text-white shadow-sm" : "bg-[#f3f4f6] text-[#6b7280]"
              }`}
            >
              2
            </div>
            <span className={`text-xs font-bold ${step === 2 ? "text-amber-700" : "text-[#6b7280]"}`}>
              Upload das Cartas (PDF)
            </span>
          </div>
        </div>

        {/* Alerta de Erro Global */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* CAMPO HONEYPOT SEGRETO (Anti-Spam Bot) */}
        <div style={{ display: "none" }} aria-hidden="true">
          <input
            type="text"
            name="website_url_honeypot"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* ======================================================== */}
        {/* ETAPA 1: Identificação Inicial do Participante */}
        {/* ======================================================== */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-6 animate-in fade-in duration-150">
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                <span>Etapa Inicial: Dados do Participante</span>
              </h2>
              <p className="text-[#4b5563] text-xs leading-relaxed">
                Preencha o número de telefone e o nome do participante para prosseguir.
              </p>
            </div>

            {/* Notificação de Bloqueio se o número já estiver registrado no SQLite */}
            {alreadyRegistered && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-amber-900 animate-in zoom-in-95">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Notificação de Envio Realizado</span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                  {alreadyRegisteredMessage ||
                    "As cartas já foram enviadas para o respectivo contato. Em caso de dúvida, procure a organização do evento."}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Telefone do Participante */}
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">
                  Telefone do Participante (WhatsApp) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6b7280]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={participantPhone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#ffffff] border border-[#d1d5db] rounded-xl text-[#111827] text-sm font-medium focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all placeholder:text-[#9ca3af]"
                  />
                </div>
              </div>

              {/* Nome do Participante */}
              <div>
                <label className="block text-xs font-bold text-[#111827] mb-1">
                  Nome Completo do Participante *
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Souza"
                  required
                  disabled={alreadyRegistered}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#d1d5db] rounded-xl text-[#111827] text-sm font-medium focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all placeholder:text-[#9ca3af] disabled:bg-[#f3f4f6]"
                />
              </div>

              {/* VERIFICAÇÃO ANTI-ROBÔ (Math Captcha Simples) */}
              <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Verificação de Segurança (Anti-robô) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateMathCaptcha}
                    className="text-[11px] text-[#6b7280] hover:text-amber-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Mudar pergunta"
                  >
                    <RefreshCw className="w-3 h-3" /> Nova soma
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-2 bg-[#ffffff] border border-[#d1d5db] rounded-xl text-sm font-extrabold text-[#111827] shadow-2xs">
                    Quanto é {num1} + {num2}?
                  </span>
                  <input
                    type="number"
                    value={mathAnswer}
                    onChange={(e) => setMathAnswer(e.target.value)}
                    placeholder="Resultado"
                    required
                    className="w-32 px-3 py-2 bg-[#ffffff] border border-[#d1d5db] rounded-xl text-sm font-bold text-[#111827] focus:outline-none focus:border-amber-600 text-center"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isVerifying || alreadyRegistered || !participantPhone || !participantName || !mathAnswer}
                className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando dados...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar para Envio de Cartas</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* ETAPA 2: Upload das Cartas & Nome de Quem Envia */}
        {/* ======================================================== */}
        {step === 2 && (
          <form onSubmit={handleOpenConfirmModal} className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e7eb]">
              <div>
                <h2 className="text-xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-600" />
                  <span>Etapa de Upload: Cartas para {participantName}</span>
                </h2>
                <p className="text-[#4b5563] text-xs mt-0.5">
                  Informe o seu nome e anexe até <strong>5 arquivos em PDF</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#4b5563] hover:text-[#111827] font-semibold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg bg-[#f3f4f6] border border-[#e5e7eb]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            </div>

            {/* Nome do Remetente: "Seu nome" */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">
                Seu nome *
              </label>
              <input
                type="text"
                value={remitterName}
                onChange={(e) => setRemitterName(e.target.value)}
                placeholder="Ex: Maria da Silva"
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#d1d5db] rounded-xl text-[#111827] text-sm font-medium focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all placeholder:text-[#9ca3af]"
              />
            </div>

            {/* Dropzone de Cartas PDF */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> Anexar Cartas em PDF (Até 5 arquivos)
                </label>
                <span className="text-xs text-[#4b5563] font-semibold">
                  <strong className="text-amber-700 font-bold">{files.length}</strong> de 5 anexadas
                </span>
              </div>

              {files.length < 5 && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-amber-600 bg-amber-50"
                      : "border-[#d1d5db] hover:border-amber-500 bg-[#f9fafb] hover:bg-[#ffffff]"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                    accept="application/pdf"
                    multiple
                    className="hidden"
                  />
                  <div className="mx-auto w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-[#111827] mb-1">
                    Arraste e solte seus PDFs aqui ou <span className="text-amber-700 underline">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    Formatos aceitos: <strong>.PDF</strong> (até 5 arquivos de no máximo 15MB cada)
                  </p>
                </div>
              )}

              {/* Lista de Arquivos Anexados */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#ffffff] border border-[#e5e7eb] text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 font-bold">
                          {index + 1}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-[#111827] truncate">{file.name}</p>
                          <p className="text-[10px] text-[#6b7280]">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#6b7280] hover:text-red-600 transition-colors"
                        title="Remover arquivo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão de Abrir Pop-up de Confirmação */}
            <div className="pt-3 border-t border-[#e5e7eb]">
              <button
                type="submit"
                disabled={files.length === 0 || !remitterName.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Finalizar e Enviar {files.length} Carta(s)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* POP-UP / MODAL DE CONFIRMAÇÃO DE ENVIO ÚNICO */}
      {/* ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 bg-[#ffffff] border border-[#e5e7eb] rounded-3xl shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#111827]">
                Atenção: Confirmação de Envio Único
              </h3>
              <p className="text-[#4b5563] text-xs mt-2 leading-relaxed font-medium">
                Você está prestes a enviar <strong>{files.length} arquivo(s) PDF</strong> para o participante <strong className="text-[#111827]">{participantName}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 leading-relaxed font-medium">
              <strong>⚠️ Lembre-se:</strong> É permitido <strong>UM ÚNICO ENVIO</strong> por participante. Após confirmar, o sistema salvará as cartas no Google Drive e <strong>não aceitará novas cartas</strong> para este contato.
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando para o Google Drive...</span>
                  </>
                ) : (
                  <span>Sim, Confirmar e Enviar Agora</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#4b5563] font-bold text-xs transition-colors cursor-pointer"
              >
                Revisar e Adicionar Mais Cartas (Até 5 PDFs)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
