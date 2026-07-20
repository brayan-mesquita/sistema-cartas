import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata número de telefone para exibição visual (Ex: (69) 99999-0959)
 */
export function formatPhoneNumber(value: string) {
  if (!value) return "";
  const digitsOnly = value.replace(/\D/g, "");
  
  if (digitsOnly.length <= 2) {
    return `(${digitsOnly}`;
  }
  if (digitsOnly.length <= 7) {
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
  }
  if (digitsOnly.length <= 11) {
    return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
  }
  return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
}

/**
 * Normaliza o telefone para comparação exata no banco de dados SQLite.
 * Remove DDI 55, zero inicial de DDD e caracteres especiais.
 */
export function sanitizePhone(value: string): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");

  // Se o usuário digitou com DDI +55 (ex: 5569999990959), remove o 55
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.substring(2);
  }

  // Se o usuário digitou DDD com zero inicial (ex: 069999990959), remove o 0
  if (digits.startsWith("0") && (digits.length === 11 || digits.length === 12)) {
    digits = digits.substring(1);
  }

  return digits;
}
