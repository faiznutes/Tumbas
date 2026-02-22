export type WeeklyDealPricing = {
  enabled: boolean;
  endDate?: string;
  selectedProductIds?: string[];
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  itemDiscounts?: Record<string, { discountType?: 'percentage' | 'amount'; discountValue?: number }>;
};

export type DiscountCampaignPricing = {
  id: string;
  name: string;
  type: 'PRODUCT' | 'BULK' | 'MIN_PURCHASE' | 'BUNDLE';
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  productIds?: string[];
  bundleProductIds?: string[];
  minQuantity?: number;
  minPurchaseAmount?: number;
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  priority?: number;
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
  discountCampaigns?: DiscountCampaignPricing[];
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
    const weeklyItemRule = activeDeal?.itemDiscounts?.[line.productId];
    const weeklyDiscountType = weeklyItemRule?.discountType === 'amount' ? 'amount' : discountType;
    const weeklyDiscountValue = Math.max(0, Number(weeklyItemRule?.discountValue ?? discountValue));
    const weeklyRawDiscount = eligible
      ? (weeklyDiscountType === 'amount' ? weeklyDiscountValue : Math.round((unitPrice * weeklyDiscountValue) / 100))
      : 0;

    const subtotalBeforeDiscount = params.lines.reduce((sum, item) => sum + Math.max(0, Number(item.unitPrice || 0)) * Math.max(1, Math.floor(Number(item.quantity || 1))), 0);

    const isCampaignActive = (campaign: DiscountCampaignPricing) => {
      if (!campaign.enabled) return false;
      const start = (campaign.startDate || '').trim();
      const end = (campaign.endDate || '').trim();
      const now = Date.now();
      if (start) {
        const startDate = new Date(start);
        if (Number.isFinite(startDate.getTime()) && now < startDate.getTime()) return false;
      }
      if (end) {
        const endDate = new Date(end);
        if (Number.isFinite(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          if (now > endDate.getTime()) return false;
        }
      }
      return true;
    };

    const cartProductIds = new Set(params.lines.map((item) => item.productId));
    let campaignRawDiscount = 0;
    for (const campaign of (params.discountCampaigns || [])) {
      if (!isCampaignActive(campaign)) continue;
      const campaignDiscountType = campaign.discountType === 'amount' ? 'amount' : 'percentage';
      const campaignDiscountValue = Math.max(0, Number(campaign.discountValue || 0));
      if (campaignDiscountValue <= 0) continue;

      const campaignProductIds = new Set((campaign.productIds || []).filter(Boolean));
      const hasProductFilter = campaignProductIds.size > 0;
      const appliesToThisLine = !hasProductFilter || campaignProductIds.has(line.productId);
      if (!appliesToThisLine) continue;

      if (campaign.type === 'BULK' && quantity < Math.max(1, Number(campaign.minQuantity || 1))) continue;
      if (campaign.type === 'MIN_PURCHASE' && subtotalBeforeDiscount < Math.max(0, Number(campaign.minPurchaseAmount || 0))) continue;
      if (campaign.type === 'BUNDLE') {
        const bundleIds = (campaign.bundleProductIds || []).filter(Boolean);
        if (bundleIds.length === 0) continue;
        if (!bundleIds.every((id) => cartProductIds.has(id))) continue;
      }

      const rawDiscount = campaignDiscountType === 'amount'
        ? campaignDiscountValue
        : Math.round((unitPrice * campaignDiscountValue) / 100);
      campaignRawDiscount = Math.max(campaignRawDiscount, rawDiscount);
    }

    const discountPerUnit = Math.min(unitPrice, Math.max(0, weeklyRawDiscount, campaignRawDiscount));
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
