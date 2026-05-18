import { decrypt } from "./encryption";

export function formatMXN(amount: number | string | { toNumber(): number }): string {
  const n = typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function safeDecrypt(data: Buffer | Uint8Array | null | undefined): string {
  if (data == null) return "—";
  try {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    return decrypt(buf);
  } catch {
    return "⟨cifrado⟩";
  }
}
