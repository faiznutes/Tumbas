export type WeeklyDealPricing = {
  enabled: boolean;
  endDate?: string;
  selectedProductIds?: string[];
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
};

type LineInput = {
  productId: string;
  unitPrice: number;
  quantity: number;
};

export function isWeeklyDealActive(weeklyDeal?: WeeklyDealPricing | null) {
  if (!weeklyDeal?.enabled) return false;
  const endDateRaw = (weeklyDeal.endDate || '').trim();
  if (!endDateRaw) return true;
  const endDate = new Date(endDateRaw);
  if (!Number.isFinite(endDate.getTime())) return true;
  endDate.setHours(23, 59, 59, 999);
  return Date.now() <= endDate.getTime();
}

export function calculateCheckoutPricing(params: {
  lines: LineInput[];
  shipping: number;
  taxRate: number;
  weeklyDeal?: WeeklyDealPricing | null;
}) {
  const shipping = Math.max(0, params.shipping || 0);
  const taxRate = Math.max(0, params.taxRate || 0);
  const activeDeal = isWeeklyDealActive(params.weeklyDeal) ? params.weeklyDeal : null;
  const selectedSet = new Set((activeDeal?.selectedProductIds || []).filter(Boolean));
  const discountType = activeDeal?.discountType === 'amount' ? 'amount' : 'percentage';
  const discountValue = Math.max(0, Number(activeDeal?.discountValue || 0));

  const normalizedLines = params.lines.map((line) => {
    const unitPrice = Math.max(0, Number(line.unitPrice || 0));
    const quantity = Math.max(1, Math.floor(Number(line.quantity || 1)));
    const eligible = selectedSet.has(line.productId) && discountValue > 0;
    const rawDiscount = eligible
      ? (discountType === 'amount' ? discountValue : Math.round((unitPrice * discountValue) / 100))
      : 0;
    const discountPerUnit = Math.min(unitPrice, Math.max(0, rawDiscount));
    const discountedUnitPrice = Math.max(0, unitPrice - discountPerUnit);

    return {
      ...line,
      unitPrice,
      quantity,
      eligible,
      discountPerUnit,
      discountedUnitPrice,
    };
  });

  const subtotal = normalizedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const discount = normalizedLines.reduce((sum, line) => sum + line.discountPerUnit * line.quantity, 0);
  const discountedSubtotal = normalizedLines.reduce((sum, line) => sum + line.discountedUnitPrice * line.quantity, 0);
  const taxableBase = discountedSubtotal + shipping;
  const tax = Math.round((taxableBase * taxRate) / 100);
  const total = taxableBase + tax;

  return {
    lines: normalizedLines,
    subtotal,
    discount,
    discountedSubtotal,
    shipping,
    taxableBase,
    taxRate,
    tax,
    total,
    weeklyDealActive: Boolean(activeDeal),
  };
}
