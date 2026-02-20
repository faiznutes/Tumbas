import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReceiptPrintHtml,
  buildReceiptText,
  createReceiptQrUrl,
  RECEIPT_FOOTER_TEXT,
} from "./receipt-print";

test("createReceiptQrUrl includes encoded payload", () => {
  const url = createReceiptQrUrl("RCPT-1", "order-1", "TMB-RESI-1", "VRF-00000001");

  assert.match(url, /^https:\/\/api\.qrserver\.com/);
  assert.match(url, /size=120x120/);
  assert.match(url, /RCPT-1%7Corder-1%7CTMB-RESI-1%7CVRF-00000001/);
});

test("buildReceiptText returns consistent plain text content", () => {
  const text = buildReceiptText({
    orderId: "order-1",
    orderCode: "ORD-1",
    receiptNo: "RCPT-ORD-1",
    shippingResi: "TMB-RESI-ORD1",
    statusLabel: "Lunas",
    dateText: "21 Feb 2026",
    productTitle: "Produk A",
    totalText: "Rp99.000",
    verificationCode: "VRF-00000001",
  });

  assert.match(text, /TUMBAS - RECEIPT/);
  assert.match(text, /Order ID: order-1/);
  assert.match(text, /Status: Lunas/);
  assert.match(text, /Total: Rp99\.000/);
});

test("buildReceiptPrintHtml escapes unsafe values and uses footer", () => {
  const html = buildReceiptPrintHtml(
    {
      receiptNo: "RCPT-<X>",
      orderId: "order-1",
      dateText: "21 Feb 2026",
      shippingResi: "TMB-RESI-1",
      statusLabel: "Lunas",
      productTitle: "Produk <b>Unsafe</b>",
      totalText: "Rp99.000",
      verificationCode: "VRF-00000001",
      footerText: RECEIPT_FOOTER_TEXT,
    },
    "https://example.com/qr?x=<y>",
  );

  assert.match(html, /Official Payment Receipt/);
  assert.match(html, /Produk &lt;b&gt;Unsafe&lt;\/b&gt;/);
  assert.doesNotMatch(html, /Produk <b>Unsafe<\/b>/);
  assert.match(html, /Receipt ini diterbitkan otomatis oleh sistem Tumbas/);
});
