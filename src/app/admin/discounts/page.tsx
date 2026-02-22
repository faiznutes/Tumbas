"use client";

import { useEffect, useMemo, useState } from "react";
import { api, DiscountCampaign } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { hasAdminPermission } from "@/lib/admin-permissions";

type CampaignDraft = DiscountCampaign;

function createEmptyCampaign(): CampaignDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "PRODUCT",
    enabled: true,
    startDate: "",
    endDate: "",
    productIds: [],
    bundleProductIds: [],
    minQuantity: 1,
    minPurchaseAmount: 0,
    discountType: "percentage",
    discountValue: 0,
    priority: 0,
  };
}

export default function AdminDiscountsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignDraft[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [search, setSearch] = useState("");
  const canEdit = hasAdminPermission("products.edit");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [campaignRes, productsRes] = await Promise.all([
          api.settings.getDiscountCampaigns(),
          api.products.getAll({ limit: 400, status: "AVAILABLE", sort: "newest" }),
        ]);
        setCampaigns(campaignRes.campaigns || []);
        setProducts((productsRes.data || []).map((item) => ({ id: item.id, title: item.title })));
      } catch {
        addToast("Gagal memuat data diskon", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [addToast]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 100);
    return products.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 120);
  }, [products, search]);

  const updateCampaign = (id: string, updater: (prev: CampaignDraft) => CampaignDraft) => {
    setCampaigns((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const saveAll = async () => {
    if (!canEdit) return;
    try {
      setSaving(true);
      const cleaned = campaigns
        .map((item) => ({
          ...item,
          name: item.name.trim(),
          discountValue: Math.max(0, Number(item.discountValue || 0)),
          minQuantity: Math.max(1, Number(item.minQuantity || 1)),
          minPurchaseAmount: Math.max(0, Number(item.minPurchaseAmount || 0)),
          priority: Math.max(0, Number(item.priority || 0)),
          productIds: (item.productIds || []).filter(Boolean),
          bundleProductIds: (item.bundleProductIds || []).filter(Boolean),
        }))
        .filter((item) => item.id && item.name);
      const response = await api.settings.updateDiscountCampaigns({ campaigns: cleaned });
      setCampaigns(response.campaigns || cleaned);
      addToast("Pengaturan diskon berhasil disimpan", "success");
    } catch {
      addToast("Gagal menyimpan pengaturan diskon", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-[#4c739a]">Memuat pengaturan diskon...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Diskon</h1>
          <p className="text-[#4c739a]">Atur diskon produk, bulk, bundling, dan minimal pembelian.</p>
        </div>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => setCampaigns((prev) => [createEmptyCampaign(), ...prev])}
          className="rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Tambah Campaign
        </button>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk untuk campaign"
          className="w-full rounded-lg border border-slate-200 px-4 py-2"
        />
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 grid gap-3 md:grid-cols-3">
              <input
                value={campaign.name}
                disabled={!canEdit}
                onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nama campaign"
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
              <select
                value={campaign.type}
                disabled={!canEdit}
                onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, type: e.target.value as CampaignDraft["type"] }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="PRODUCT">Diskon Produk</option>
                <option value="BULK">Diskon Bulk</option>
                <option value="BUNDLE">Diskon Bundling</option>
                <option value="MIN_PURCHASE">Minimal Pembelian</option>
              </select>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={campaign.enabled}
                  disabled={!canEdit}
                  onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, enabled: e.target.checked }))}
                />
                Aktif
              </label>
            </div>

            <div className="mb-3 grid gap-3 md:grid-cols-4">
              <input type="date" value={campaign.startDate || ""} disabled={!canEdit} onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, startDate: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2" />
              <input type="date" value={campaign.endDate || ""} disabled={!canEdit} onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, endDate: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2" />
              <select value={campaign.discountType} disabled={!canEdit} onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, discountType: e.target.value as 'percentage' | 'amount' }))} className="rounded-lg border border-slate-200 px-3 py-2">
                <option value="percentage">Persen</option>
                <option value="amount">Nominal</option>
              </select>
              <input type="number" min={0} value={campaign.discountValue} disabled={!canEdit} onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, discountValue: Number(e.target.value) || 0 }))} className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Nilai diskon" />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input type="number" min={1} value={campaign.minQuantity} disabled={!canEdit} onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, minQuantity: Number(e.target.value) || 1 }))} className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Min qty (bulk)" />
              <input type="number" min={0} value={campaign.minPurchaseAmount} disabled={!canEdit} onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, minPurchaseAmount: Number(e.target.value) || 0 }))} className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Min belanja (Rp)" />
              <input type="number" min={0} value={campaign.priority} disabled={!canEdit} onChange={(e) => updateCampaign(campaign.id, (prev) => ({ ...prev, priority: Number(e.target.value) || 0 }))} className="rounded-lg border border-slate-200 px-3 py-2" placeholder="Prioritas" />
            </div>

            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
              {filteredProducts.map((product) => {
                const selected = (campaign.productIds || []).includes(product.id);
                return (
                  <button
                    key={`${campaign.id}-${product.id}`}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => updateCampaign(campaign.id, (prev) => ({
                      ...prev,
                      productIds: selected
                        ? (prev.productIds || []).filter((id) => id !== product.id)
                        : [...(prev.productIds || []), product.id],
                    }))}
                    className={`flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${selected ? 'bg-[#137fec]/5 text-[#137fec]' : 'text-[#0d141b]'}`}
                  >
                    <span>{product.title}</span>
                    <span>{selected ? 'Dipilih' : 'Pilih'}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setCampaigns((prev) => prev.filter((item) => item.id !== campaign.id))}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
              >
                Hapus Campaign
              </button>
            </div>
          </div>
        ))}

        {campaigns.length === 0 && <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-[#4c739a]">Belum ada campaign diskon.</div>}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={saveAll}
          disabled={saving || !canEdit}
          className="rounded-lg bg-[#137fec] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Semua"}
        </button>
      </div>
    </div>
  );
}
