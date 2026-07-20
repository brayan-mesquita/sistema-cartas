"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  User,
  FileText,
  ExternalLink,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { formatPhoneNumber } from "@/lib/utils";

interface CartaItem {
  id: string;
  filename: string;
  driveUrl: string;
  remitterName: string;
  createdAt: string;
}

interface ParticipantItem {
  id: string;
  name: string;
  phone: string;
  isUnlocked: boolean;
  createdAt: string;
  cartasCount: number;
  cartas: CartaItem[];
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard state
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [actionErrorMsg, setActionErrorMsg] = useState("");

  // Action states
  const [unlockingPhone, setUnlockingPhone] = useState<string | null>(null);
  const [deletingParticipant, setDeletingParticipant] = useState<ParticipantItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar lista de participantes
  const fetchParticipants = async () => {
    setIsLoading(true);
    setActionSuccessMsg("");
    setActionErrorMsg("");

    try {
      const res = await fetch("/api/admin/cartas");
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error(error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  // Fazer Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchParticipants();
      } else {
        setLoginError(data.error || "Usuário ou senha incorretos.");
      }
    } catch (error) {
      setLoginError("Erro de conexão ao realizar login.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fazer Logout
  const handleLogout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setIsAuthenticated(false);
  };

  // Habilitar Novo Envio no SQLite
  const handleEnableNewSubmission = async (phone: string, participantName: string) => {
    setUnlockingPhone(phone);
    setActionSuccessMsg("");
    setActionErrorMsg("");

    try {
      const res = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setActionSuccessMsg(`Novo envio liberado para ${participantName}! O familiar poderá reenviar.`);
        fetchParticipants();
      } else {
        setActionErrorMsg(data.error || "Não foi possível habilitar o reenvio.");
      }
    } catch (error) {
      setActionErrorMsg("Erro de conexão ao atualizar status.");
    } finally {
      setUnlockingPhone(null);
    }
  };

  // Excluir Registro do Participante e suas Cartas
  const handleConfirmDelete = async () => {
    if (!deletingParticipant) return;

    setIsDeleting(true);
    setActionSuccessMsg("");
    setActionErrorMsg("");

    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: deletingParticipant.id }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setActionSuccessMsg(`Registro de ${deletingParticipant.name} e suas cartas foram excluídos!`);
        setDeletingParticipant(null);
        fetchParticipants();
      } else {
        setActionErrorMsg(data.error || "Não foi possível excluir o registro.");
      }
    } catch (error) {
      setActionErrorMsg("Erro de conexão ao excluir registro.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtro de busca
  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm.replace(/\D/g, ""))
  );

  // 1. TELA DE LOGIN ADMIN (Caso não autenticado)
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] text-[#111827] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#ffffff] border border-[#e5e7eb] rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20 mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#111827]">Painel de Administração</h1>
            <p className="text-xs text-[#6b7280]">Acesso restrito para gestão de cartas Legendários</p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#d1d5db] rounded-xl text-sm font-medium focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#d1d5db] rounded-xl text-sm font-medium focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Entrar no Painel</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-[#6b7280] text-center">
            Credenciais Padrão: Usuário <strong>admin</strong> | Senha <strong>legendarios123</strong>
          </p>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD DE ADMINISTRAÇÃO (Autenticado)
  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] flex flex-col font-sans">
      {/* Cabeçalho Admin */}
      <header className="w-full py-4 px-6 bg-[#ffffff] border-b border-[#e5e7eb] shadow-xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold shadow-md shadow-amber-600/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
                ADMINISTRAÇÃO <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">Cartas Legendários</span>
              </h1>
              <p className="text-xs text-[#6b7280]">Acompanhamento de envios, exclusão e liberação de reenvios</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchParticipants}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#4b5563] border border-[#e5e7eb] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Notificações de Ação */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {actionErrorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        {/* Barra de Filtro e Estatísticas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#ffffff] p-4 rounded-2xl border border-[#e5e7eb] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6b7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por participante ou telefone..."
              className="w-full pl-10 pr-4 py-2 bg-[#f3f4f6] border border-[#e5e7eb] rounded-xl text-xs font-medium focus:outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[#4b5563]">
            <div className="px-3 py-1.5 bg-[#f3f4f6] rounded-xl border border-[#e5e7eb]">
              Total de Participantes: <strong className="text-[#111827]">{participants.length}</strong>
            </div>
            <div className="px-3 py-1.5 bg-[#f3f4f6] rounded-xl border border-[#e5e7eb]">
              Total de Cartas:{" "}
              <strong className="text-amber-700">
                {participants.reduce((acc, p) => acc + p.cartasCount, 0)}
              </strong>
            </div>
          </div>
        </div>

        {/* Tabela de Participantes e Cartas */}
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
                  <th className="py-4 px-6">Participante</th>
                  <th className="py-4 px-6">Enviado Por</th>
                  <th className="py-4 px-6">Cartas no Google Drive</th>
                  <th className="py-4 px-6">Data de Envio</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb] text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#6b7280]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
                      <span>Carregando dados...</span>
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#6b7280] font-medium">
                      Nenhum envio de carta localizado no sistema.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => (
                    <tr key={p.id} className="hover:bg-[#f9fafb] transition-colors">
                      {/* Participante */}
                      <td className="py-4 px-6 font-bold text-[#111827]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <p className="font-extrabold text-[#111827]">{p.name}</p>
                            <p className="text-[11px] text-[#6b7280] font-normal">
                              {formatPhoneNumber(p.phone)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Enviado Por */}
                      <td className="py-4 px-6 text-[#4b5563]">
                        {p.cartas.length > 0 ? (
                          <span className="font-semibold text-[#111827]">
                            {p.cartas[0].remitterName}
                          </span>
                        ) : (
                          <span className="text-[#9ca3af] italic">Nenhum envio</span>
                        )}
                      </td>

                      {/* Cartas no Google Drive */}
                      <td className="py-4 px-6">
                        {p.cartas.length > 0 ? (
                          <div className="space-y-1.5">
                            {p.cartas.map((c) => (
                              <a
                                key={c.id}
                                href={c.driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold transition-colors mr-1 mb-1"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                <span className="max-w-[140px] truncate">{c.filename}</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#9ca3af] italic">Sem arquivos</span>
                        )}
                      </td>

                      {/* Data de Envio */}
                      <td className="py-4 px-6 text-[#6b7280] font-medium">
                        {p.cartas.length > 0
                          ? new Date(p.cartas[0].createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        {p.isUnlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <Unlock className="w-3 h-3 text-emerald-600" /> Liberado p/ Reenvio
                          </span>
                        ) : p.cartasCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200">
                            <Lock className="w-3 h-3 text-gray-500" /> Envio Concluído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                            Aguardando
                          </span>
                        )}
                      </td>

                      {/* Ações: Habilitar Novo Envio & Excluir Registro */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEnableNewSubmission(p.phone, p.name)}
                            disabled={unlockingPhone === p.phone || p.isUnlocked}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              p.isUnlocked
                                ? "bg-emerald-100 text-emerald-800 cursor-not-allowed opacity-70"
                                : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                            }`}
                            title="Liberar novo envio para este telefone"
                          >
                            {unlockingPhone === p.phone ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : p.isUnlocked ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Liberado!</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Habilitar Reenvio</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setDeletingParticipant(p)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-colors cursor-pointer"
                            title="Excluir participante e cartas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 bg-[#ffffff] border border-[#e5e7eb] rounded-3xl shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#111827]">
                Excluir Registro de Cartas?
              </h3>
              <p className="text-[#4b5563] text-xs mt-2 leading-relaxed font-medium">
                Você está prestes a excluir o registro do participante <strong className="text-red-600">{deletingParticipant.name}</strong> ({deletingParticipant.phone}).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left text-xs text-red-900 leading-relaxed font-medium">
              <strong>⚠️ Atenção:</strong> Esta ação removerá o participante e todas as suas <strong>{deletingParticipant.cartasCount} carta(s)</strong> do banco de dados SQLite e tentará apagar os arquivos da pasta do Google Drive.
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo do Google Drive e Banco...</span>
                  </>
                ) : (
                  <span>Sim, Excluir Registro Definitivamente</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDeletingParticipant(null)}
                disabled={isDeleting}
                className="w-full py-3 px-4 rounded-xl bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#4b5563] font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
