"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function AdminCategoriesPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await api.settings.getProductCategories();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Gagal memuat kategori", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [addToast]);

  const normalizeCategory = (value: string) => value.replace(/\s+/g, " ").trim();

  const addCategory = () => {
    const clean = normalizeCategory(newCategory);
    if (!clean) return;
    if (categories.some((item) => item.toLowerCase() === clean.toLowerCase())) {
      addToast("Kategori sudah ada", "warning");
      return;
    }
    setCategories((prev) => [...prev, clean]);
    setNewCategory("");
  };

  const removeCategory = (target: string) => {
    setCategories((prev) => prev.filter((item) => item !== target));
  };

  const updateCategory = (index: number, value: string) => {
    setCategories((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const saveCategories = async () => {
    const cleaned = categories
      .map((item) => normalizeCategory(item))
      .filter(Boolean)
      .filter((item, index, arr) => arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === index);

    try {
      setSaving(true);
      const data = await api.settings.updateProductCategories({ categories: cleaned });
      setCategories(data.categories || cleaned);
      addToast("Kategori berhasil disimpan", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Gagal menyimpan kategori", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-[#4c739a]">Memuat kategori...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Kategori</h1>
        <p className="text-[#4c739a]">Tambah, ubah, dan hapus kategori produk untuk form admin.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nama kategori baru"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2"
          />
          <button
            type="button"
            onClick={addCategory}
            className="rounded-lg bg-[#137fec] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f65bd]"
          >
            Tambah
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((category, index) => (
            <div key={`${category}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
              <input
                value={category}
                onChange={(e) => updateCategory(index, e.target.value)}
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeCategory(category)}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                Hapus
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-[#4c739a]">Belum ada kategori.</p>}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={saveCategories}
            disabled={saving}
            className="rounded-lg bg-[#137fec] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0f65bd] disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Kategori"}
          </button>
        </div>
      </div>
    </div>
  );
}
