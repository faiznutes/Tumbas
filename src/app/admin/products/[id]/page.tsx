"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { api, ProductVariant } from "@/lib/api";

type VariantDraft = ProductVariant;

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [variantRows, setVariantRows] = useState<VariantDraft[]>([]);
  const [variantEnabled, setVariantEnabled] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "",
    price: "",
    stock: "0",
    weightGram: "1000",
    description: "",
    status: "AVAILABLE",
  });

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  async function fetchProduct(id: string) {
    try {
      setLoadingData(true);
      const products = await api.products.getAll({ limit: 200 });
      const product = products.data.find((item) => item.id === id);
      if (!product) {
        addToast("Produk tidak ditemukan", "error");
        router.push("/admin/products");
        return;
      }

      setFormData({
        title: product.title,
        slug: product.slug,
        category: product.category || "",
        price: String(product.price),
        stock: String(product.stock),
        weightGram: String(product.weightGram || 1000),
        description: product.description || "",
        status: product.status,
      });
      setImages(product.images?.map((img) => img.url) || []);
      const variants = Array.isArray(product.variants) ? product.variants : [];
      setVariantRows(variants || []);
      setVariantEnabled(variants.length > 0);
    } catch (error) {
      addToast("Gagal memuat produk", "error");
    } finally {
      setLoadingData(false);
    }
  }

  const categories = ["Smartphone", "Laptop", "Tablet", "Headphones", "Smartwatch", "Camera", "Fashion", "Home", "Beauty", "Sports", "Books", "Other"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUrlAdd = () => {
    const url = prompt("Masukkan URL gambar:");
    if (url) setImages((prev) => [...prev, url]);
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariantField = (key: string, field: "stock" | "price" | "weightGram", value: number) => {
    setVariantRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: Math.max(field === "stock" ? 0 : 1, value) } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.products.update(params.id as string, {
        title: formData.title,
        slug: formData.slug,
        category: formData.category || undefined,
        price: Number(formData.price),
        stock: variantEnabled ? variantRows.reduce((sum, row) => sum + row.stock, 0) : Number(formData.stock),
        weightGram: Number(formData.weightGram),
        description: formData.description || undefined,
        status: formData.status,
        variants: variantEnabled ? variantRows : null,
        images: images.map((url, position) => ({ url, position })),
      });
      addToast("Produk berhasil diperbarui", "success");
      router.push("/admin/products");
    } catch (error) {
      addToast("Gagal memperbarui produk", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="p-8"><div className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">sync</div></div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-2xl font-bold text-[#0d141b]">Edit Produk</h1><p className="text-[#4c739a]">Perbarui informasi produk</p></div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Informasi Produk</h2>
            <div className="space-y-5">
              <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
              <input name="slug" value={formData.slug} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
              <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3">
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" />
            </div>
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Varian</h2>
            <label className="mb-4 flex items-center gap-2"><input type="checkbox" checked={variantEnabled} onChange={(e) => setVariantEnabled(e.target.checked)} />Aktifkan varian</label>
            {variantEnabled && variantRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[#e7edf3]"><th className="py-2 text-left">Varian</th><th className="py-2 text-left">Stok</th><th className="py-2 text-left">Harga</th><th className="py-2 text-left">Berat</th></tr></thead>
                  <tbody>
                    {variantRows.map((row) => (
                      <tr key={row.key} className="border-b border-[#f3f5f7]">
                        <td className="py-2">{row.label}</td>
                        <td className="py-2"><input type="number" min={0} value={row.stock} onChange={(e) => updateVariantField(row.key, "stock", Number(e.target.value) || 0)} className="w-24 rounded border border-[#e7edf3] px-2 py-1" /></td>
                        <td className="py-2"><input type="number" min={1} value={row.price} onChange={(e) => updateVariantField(row.key, "price", Number(e.target.value) || 1)} className="w-32 rounded border border-[#e7edf3] px-2 py-1" /></td>
                        <td className="py-2"><input type="number" min={1} value={row.weightGram} onChange={(e) => updateVariantField(row.key, "weightGram", Number(e.target.value) || 1)} className="w-28 rounded border border-[#e7edf3] px-2 py-1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Gambar Produk</h2>
            <div className="mb-4 grid grid-cols-3 gap-4">
              {images.map((url, index) => (
                <div key={index} className="group relative"><img src={url} alt={`Product ${index + 1}`} className="h-32 w-full rounded-lg object-cover" /><button type="button" onClick={() => handleImageRemove(index)} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100"><span className="material-symbols-outlined text-sm">close</span></button></div>
              ))}
            </div>
            <button type="button" onClick={handleImageUrlAdd} className="w-full rounded-lg border-2 border-dashed border-[#e7edf3] py-4 text-[#4c739a] hover:border-[#137fec] hover:text-[#137fec]">Tambah Gambar (URL)</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Harga & Stok</h2>
            <div className="space-y-5">
              <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
              {!variantEnabled && <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />}
              <input type="number" name="weightGram" value={formData.weightGram} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
            </div>
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Status</h2>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3">
              <option value="AVAILABLE">Aktif</option>
              <option value="SOLD">Sold</option>
              <option value="ARCHIVED">Arsip</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#137fec] py-3 font-semibold text-white hover:bg-[#0f65bd] disabled:opacity-50">{loading ? "Menyimpan..." : "Perbarui Produk"}</button>
          <Link href="/admin/products" className="flex w-full items-center justify-center rounded-lg bg-gray-100 py-3 font-semibold text-[#0d141b] hover:bg-gray-200">Kembali</Link>
        </div>
      </form>
    </div>
  );
}
