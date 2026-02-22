export type WeeklyDealDisplay = {
  enabled?: boolean;
  endDate?: string;
  selectedProductIds?: string[];
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
  itemDiscounts?: Record<string, { discountType?: 'percentage' | 'amount'; discountValue?: number }>;
};

export type DiscountCampaignDisplay = {
  type?: 'PRODUCT' | 'BULK' | 'MIN_PURCHASE' | 'BUNDLE';
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  productIds?: string[];
  discountType?: 'percentage' | 'amount';
  discountValue?: number;
};

function isInDateRange(startDate?: string, endDate?: string) {
  const now = Date.now();
  if (startDate) {
    const start = new Date(startDate);
    if (Number.isFinite(start.getTime()) && now < start.getTime()) return false;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (Number.isFinite(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      if (now > end.getTime()) return false;
    }
  }
  return true;
}

export function resolveProductDiscount(params: {
  productId: string;
  unitPrice: number;
  weeklyDeal?: WeeklyDealDisplay | null;
  campaigns?: DiscountCampaignDisplay[];
}) {
  const unitPrice = Math.max(0, Number(params.unitPrice || 0));
  let bestDiscount = 0;

  const weekly = params.weeklyDeal;
  if (weekly?.enabled && isInDateRange(undefined, weekly.endDate)) {
    const selectedSet = new Set((weekly.selectedProductIds || []).filter(Boolean));
    if (selectedSet.has(params.productId)) {
      const itemRule = weekly.itemDiscounts?.[params.productId];
      const discountType = itemRule?.discountType === 'amount' ? 'amount' : (weekly.discountType === 'amount' ? 'amount' : 'percentage');
      const discountValue = Math.max(0, Number(itemRule?.discountValue ?? weekly.discountValue ?? 0));
      const raw = discountType === 'amount' ? discountValue : Math.round((unitPrice * discountValue) / 100);
      bestDiscount = Math.max(bestDiscount, Math.min(unitPrice, raw));
    }
  }

  (params.campaigns || []).forEach((campaign) => {
    if (!campaign?.enabled) return;
    if (!isInDateRange(campaign.startDate, campaign.endDate)) return;
    const productSet = new Set((campaign.productIds || []).filter(Boolean));
    if (productSet.size > 0 && !productSet.has(params.productId)) return;
    const discountType = campaign.discountType === 'amount' ? 'amount' : 'percentage';
    const discountValue = Math.max(0, Number(campaign.discountValue || 0));
    if (discountValue <= 0) return;
    const raw = discountType === 'amount' ? discountValue : Math.round((unitPrice * discountValue) / 100);
    bestDiscount = Math.max(bestDiscount, Math.min(unitPrice, raw));
  });

  return {
    discountAmount: bestDiscount,
    finalPrice: Math.max(0, unitPrice - bestDiscount),
    hasDiscount: bestDiscount > 0,
  };
}
