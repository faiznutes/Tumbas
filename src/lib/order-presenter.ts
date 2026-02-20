import type { PublicOrder } from "./api";

type PaymentStatus = PublicOrder["paymentStatus"];

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kadaluarsa",
  CANCELLED: "Dibatalkan",
};

export function createReceiptNo(orderCode: string) {
  return `RCPT-${orderCode}`;
}

export function formatPriceIdr(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatDateId(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeId(date: string) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createResi(orderCode: string) {
  const compact = orderCode.replace(/[^A-Z0-9]/gi, "").slice(0, 12).toUpperCase();
  return `TMB-RESI-${compact}`;
}

export function createVerificationCode(orderCode: string) {
  const normalized = orderCode.toUpperCase();
  let acc = 0;
  for (let i = 0; i < normalized.length; i++) {
    acc = (acc + normalized.charCodeAt(i) * (i + 17)) % 99999999;
  }
  return `VRF-${String(acc).padStart(8, "0")}`;
}

export function getPaymentStatusLabel(status?: PaymentStatus) {
  if (!status) return "Lunas";
  return paymentStatusLabels[status] || status;
}

export function getOrderProgressLabel(
  order?: Pick<PublicOrder, "paymentStatus" | "shippedToExpedition"> | null,
) {
  if (!order) return "Dikonfirmasi";
  if (order.paymentStatus === "PAID" && order.shippedToExpedition) {
    return "Diserahkan ke Ekspedisi";
  }

  return getPaymentStatusLabel(order.paymentStatus);
}
