interface ReceiptPrintPayload {
  receiptNo: string;
  orderId: string;
  dateText: string;
  shippingResi: string;
  statusLabel: string;
  productTitle: string;
  totalText: string;
  verificationCode: string;
  footerText: string;
}

interface ReceiptTextPayload {
  orderId: string;
  orderCode: string;
  receiptNo: string;
  shippingResi: string;
  statusLabel: string;
  dateText: string;
  productTitle: string;
  totalText: string;
  verificationCode: string;
}

export const RECEIPT_FOOTER_TEXT =
  "Receipt ini diterbitkan otomatis oleh sistem Tumbas. Simpan sebagai bukti pembayaran.";

export function buildReceiptText(payload: ReceiptTextPayload) {
  return [
    "TUMBAS - RECEIPT",
    "",
    `Order ID: ${payload.orderId}`,
    `Order Code: ${payload.orderCode}`,
    `Receipt No: ${payload.receiptNo}`,
    `Resi Pengiriman: ${payload.shippingResi}`,
    `Kode Verifikasi: ${payload.verificationCode}`,
    `Status: ${payload.statusLabel}`,
    `Tanggal: ${payload.dateText}`,
    `Produk: ${payload.productTitle}`,
    `Total: ${payload.totalText}`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createReceiptQrUrl(
  receiptNo: string,
  orderId: string,
  shippingResi: string,
  verificationCode: string,
) {
  const qrData = encodeURIComponent(`${receiptNo}|${orderId}|${shippingResi}|${verificationCode}`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
}

export function buildReceiptPrintHtml(payload: ReceiptPrintPayload, qrUrl: string) {
  const safe = {
    receiptNo: escapeHtml(payload.receiptNo),
    orderId: escapeHtml(payload.orderId),
    dateText: escapeHtml(payload.dateText),
    shippingResi: escapeHtml(payload.shippingResi),
    statusLabel: escapeHtml(payload.statusLabel),
    productTitle: escapeHtml(payload.productTitle),
    totalText: escapeHtml(payload.totalText),
    verificationCode: escapeHtml(payload.verificationCode),
    footerText: escapeHtml(payload.footerText),
    qrUrl: escapeHtml(qrUrl),
  };

  return `
    <html>
      <head>
        <title>${safe.receiptNo}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: "Segoe UI", "Aptos", "Helvetica Neue", Arial, sans-serif; margin: 0; background: #f4f7fb; color: #0d141b; }
          .page { max-width: 820px; margin: 24px auto; background: #fff; border: 1px solid #e7edf3; border-radius: 14px; overflow: hidden; }
          .head { background: linear-gradient(135deg, #137fec, #0f65bd); color: white; padding: 24px; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 22px; font-weight: 700; }
          .sub { font-size: 12px; opacity: 0.9; margin-top: 4px; }
          .badge { background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.25); padding: 8px 12px; border-radius: 999px; font-size: 12px; }
          .content { padding: 24px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .card { border: 1px solid #e7edf3; border-radius: 10px; padding: 12px; background: #fafcff; }
          .label { color: #4c739a; font-size: 12px; margin-bottom: 4px; }
          .value { font-size: 14px; font-weight: 600; }
          .total { margin-top: 12px; display: flex; justify-content: flex-end; }
          .total-box { min-width: 260px; border: 1px solid #e7edf3; border-radius: 10px; padding: 12px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; gap: 8px; }
          .total-row span:last-child, .total-row strong:last-child { text-align: right; }
          .total-row strong { font-size: 15px; }
          .verify-wrap { margin-top: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; border: 1px dashed #c4d8ec; border-radius: 10px; padding: 12px; background: #f8fbff; }
          .verify-label { color: #4c739a; font-size: 12px; }
          .verify-code { font-size: 15px; font-weight: 700; letter-spacing: 0.4px; }
          .qr { width: 96px; height: 96px; border: 1px solid #e7edf3; border-radius: 8px; background: white; }
          .foot { border-top: 1px solid #e7edf3; padding: 14px 24px; color: #4c739a; font-size: 12px; }
          @media print { body { background: #fff; } .page { margin: 0; border: 0; border-radius: 0; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="head">
            <div>
              <div class="brand">Tumbas</div>
              <div class="sub">Official Payment Receipt</div>
            </div>
            <div class="badge">${safe.statusLabel}</div>
          </div>
          <div class="content">
            <div class="meta">
              <div class="card"><div class="label">Receipt No</div><div class="value">${safe.receiptNo}</div></div>
              <div class="card"><div class="label">Tanggal</div><div class="value">${safe.dateText}</div></div>
              <div class="card"><div class="label">Order ID</div><div class="value">${safe.orderId}</div></div>
              <div class="card"><div class="label">Resi Pengiriman</div><div class="value">${safe.shippingResi}</div></div>
            </div>
            <div class="total">
              <div class="total-box">
                <div class="total-row"><span>Produk</span><span>${safe.productTitle}</span></div>
                <div class="total-row"><span>Status</span><span>${safe.statusLabel}</span></div>
                <div class="total-row"><strong>Total Dibayar</strong><strong>${safe.totalText}</strong></div>
              </div>
            </div>
            <div class="verify-wrap">
              <div>
                <div class="verify-label">Kode Verifikasi Receipt</div>
                <div class="verify-code">${safe.verificationCode}</div>
              </div>
              <img class="qr" src="${safe.qrUrl}" alt="Receipt QR" />
            </div>
          </div>
          <div class="foot">${safe.footerText}</div>
        </div>
      </body>
    </html>
  `;
}
