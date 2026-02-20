import test from "node:test";
import assert from "node:assert/strict";

import {
  createReceiptNo,
  createResi,
  createVerificationCode,
  formatDateId,
  formatDateTimeId,
  formatPriceIdr,
  getOrderProgressLabel,
  getPaymentStatusLabel,
} from "./order-presenter";

test("create helpers generate expected receipt identifiers", () => {
  assert.equal(createReceiptNo("ORD-2026-ABC"), "RCPT-ORD-2026-ABC");
  assert.equal(createResi("ord-2026-abc"), "TMB-RESI-ORD2026ABC");
  assert.equal(createVerificationCode("ORD-2026-ABC").startsWith("VRF-"), true);
  assert.equal(createVerificationCode("ORD-2026-ABC").length, 12);
});

test("price and date formatters return indonesia formatted output", () => {
  const price = formatPriceIdr(15000);
  assert.match(price, /^Rp\s?15\.000$/);

  const dateOnly = formatDateId("2026-02-21T10:30:00.000Z");
  assert.equal(typeof dateOnly, "string");
  assert.match(dateOnly, /\d{2}/);

  const dateTime = formatDateTimeId("2026-02-21T10:30:00.000Z");
  assert.equal(typeof dateTime, "string");
  assert.match(dateTime, /\d{2}/);
});

test("status labels map payment and expedition states consistently", () => {
  assert.equal(getPaymentStatusLabel("PENDING"), "Menunggu Pembayaran");
  assert.equal(getPaymentStatusLabel("PAID"), "Lunas");
  assert.equal(getOrderProgressLabel(null), "Dikonfirmasi");

  assert.equal(
    getOrderProgressLabel({ paymentStatus: "PAID", shippedToExpedition: true }),
    "Diserahkan ke Ekspedisi",
  );

  assert.equal(
    getOrderProgressLabel({ paymentStatus: "FAILED", shippedToExpedition: false }),
    "Gagal",
  );
});
