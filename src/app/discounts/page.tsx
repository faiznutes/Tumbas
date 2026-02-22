"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { api, DiscountCampaign, Product } from "@/lib/api";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function DiscountsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>([]);
  const [weeklyDeal, setWeeklyDeal] = useState<{
    enabled: boolean;
    endDate: string;
    selectedProductIds: string[];
    discountType: "percentage" | "amount";
    discountValue: number;
    itemDiscounts?: Record<string, { discountType: "percentage" | "amount"; discountValue: number }>;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [weekly, productsRes, campaignsRes] = await Promise.all([
          api.settings.getWeeklyDealPublic(),
          api.products.getAll({ limit: 300, status: "AVAILABLE", sort: "newest" }),
          api.settings.getDiscountCampaignsPublic(),
        ]);
        setWeeklyDeal(weekly);
        setProducts(productsRes.data || []);
        setCampaigns(campaignsRes.campaigns || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const weeklyDealActive = useMemo(() => {
    if (!weeklyDeal?.enabled) return false;
    if (!weeklyDeal.endDate) return true;
    const endDate = new Date(weeklyDeal.endDate);
    if (!Number.isFinite(endDate.getTime())) return true;
    endDate.setHours(23, 59, 59, 999);
    return Date.now() <= endDate.getTime();
  }, [weeklyDeal]);

  const discountedProducts = useMemo(() => {
    const activeCampaigns = campaigns.filter((campaign) => {
      if (!campaign.enabled) return false;
      const now = Date.now();
      if (campaign.startDate) {
        const start = new Date(campaign.startDate);
        if (Number.isFinite(start.getTime()) && now < start.getTime()) return false;
      }
      if (campaign.endDate) {
        const end = new Date(campaign.endDate);
        if (Number.isFinite(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          if (now > end.getTime()) return false;
        }
      }
      return true;
    });

    const weeklySelectedSet = new Set((weeklyDeal?.selectedProductIds || []).filter(Boolean));
    const cartIds = new Set(products.map((product) => product.id));

    return products
      .map((product) => {
        let bestDiscount = 0;

        if (weeklyDealActive && weeklyDeal && weeklySelectedSet.has(product.id)) {
          const itemRule = weeklyDeal.itemDiscounts?.[product.id];
          const discountType = itemRule?.discountType || weeklyDeal.discountType;
          const discountValue = itemRule?.discountValue || weeklyDeal.discountValue;
          const rawDiscount = discountType === "amount"
            ? discountValue
            : Math.round((product.price * discountValue) / 100);
          bestDiscount = Math.max(bestDiscount, Math.min(product.price, Math.max(0, rawDiscount)));
        }

        activeCampaigns.forEach((campaign) => {
          const discountType = campaign.discountType === "amount" ? "amount" : "percentage";
          const discountValue = Math.max(0, Number(campaign.discountValue || 0));
          if (discountValue <= 0) return;

          const productSet = new Set((campaign.productIds || []).filter(Boolean));
          if (productSet.size > 0 && !productSet.has(product.id)) return;

          if (campaign.type === "BUNDLE") {
            const bundleIds = (campaign.bundleProductIds || []).filter(Boolean);
            if (bundleIds.length === 0) return;
            if (!bundleIds.every((id) => cartIds.has(id))) return;
          }

          const raw = discountType === "amount"
            ? discountValue
            : Math.round((product.price * discountValue) / 100);
          bestDiscount = Math.max(bestDiscount, Math.min(product.price, raw));
        });

        const discountedPrice = Math.max(0, product.price - bestDiscount);
        return { ...product, discountAmount: bestDiscount, discountedPrice };
      })
      .filter((product) => product.discountAmount > 0);
  }, [products, weeklyDeal, weeklyDealActive, campaigns]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    discountedProducts.forEach((product) => {
      const key = product.category || "Lainnya";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count, slug: name.toLowerCase() }));
  }, [discountedProducts]);

  const filteredProducts = discountedProducts.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || (product.category || "Lainnya").toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-[#0d141b]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3">
          <h1 className="text-3xl font-black">Halaman Diskon</h1>
          <p className="text-sm text-[#4c739a]">Lihat produk yang sedang diskon aktif. Filter berdasarkan nama dan kategori.</p>
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk diskon"
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
            <option value="all">Semua kategori</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name} ({item.count})</option>
            ))}
          </select>
        </div>

        {!weeklyDealActive && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Saat ini tidak ada penawaran mingguan aktif.
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#4c739a]">Memuat produk diskon...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-sm text-[#4c739a]">Belum ada produk diskon yang sesuai filter.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100">
                  <img src={product.images?.[0]?.url || "https://via.placeholder.com/400"} alt={product.title} className="h-full w-full object-cover" />
                </div>
                <p className="line-clamp-2 text-sm font-bold text-[#0d141b]">{product.title}</p>
                <p className="mt-1 text-xs text-[#4c739a]">{product.category || "Produk"}</p>
                <div className="mt-3">
                  <p className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</p>
                  <p className="text-lg font-black text-[#137fec]">{formatPrice(product.discountedPrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
