"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { api, ProductVariant } from "@/lib/api";

type VariantDraft = ProductVariant;

function parseOptions(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function variantKey(aName: string, a: string, bName: string, b: string) {
  return `${aName}:${a}|${bName}:${b}`;
}

export default function CreateProduct() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "",
    price: "",
    stock: "",
    weightGram: "1000",
    description: "",
    status: "AVAILABLE",
  });
  const [variantEnabled, setVariantEnabled] = useState(false);
  const [variantAttr1Name, setVariantAttr1Name] = useState("Warna");
  const [variantAttr1Options, setVariantAttr1Options] = useState("");
  const [variantAttr2Name, setVariantAttr2Name] = useState("Ukuran");
  const [variantAttr2Options, setVariantAttr2Options] = useState("");
  const [variantRows, setVariantRows] = useState<VariantDraft[]>([]);

  const categories = [
    "Smartphone",
    "Laptop",
    "Tablet",
    "Headphones",
    "Smartwatch",
    "Camera",
    "Accessories",
    "Other",
  ];

  const generatedKeys = useMemo(() => {
    if (!variantEnabled) return [] as string[];
    const aOptions = parseOptions(variantAttr1Options);
    const bOptions = parseOptions(variantAttr2Options);
    if (!aOptions.length || !bOptions.length) return [];
    return aOptions.flatMap((a) => bOptions.map((b) => variantKey(variantAttr1Name, a, variantAttr2Name, b)));
  }, [variantEnabled, variantAttr1Options, variantAttr2Options, variantAttr1Name, variantAttr2Name]);

  useEffect(() => {
    if (!variantEnabled) {
      setVariantRows([]);
      return;
    }
    const aOptions = parseOptions(variantAttr1Options);
    const bOptions = parseOptions(variantAttr2Options);
    if (!aOptions.length || !bOptions.length) {
      setVariantRows([]);
      return;
    }

    setVariantRows((prev) => {
      const prevMap = new Map(prev.map((row) => [row.key, row]));
      const next: VariantDraft[] = [];
      for (const a of aOptions) {
        for (const b of bOptions) {
          const key = variantKey(variantAttr1Name, a, variantAttr2Name, b);
          next.push(
            prevMap.get(key) || {
              key,
              label: `${variantAttr1Name}: ${a} / ${variantAttr2Name}: ${b}`,
              attribute1Name: variantAttr1Name,
              attribute1Value: a,
              attribute2Name: variantAttr2Name,
              attribute2Value: b,
              stock: 0,
              price: Number(formData.price || 0),
              weightGram: Number(formData.weightGram || 1000),
            },
          );
        }
      }
      return next;
    });
  }, [variantEnabled, variantAttr1Name, variantAttr1Options, variantAttr2Name, variantAttr2Options, formData.price, formData.weightGram]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageUrlAdd = () => {
    const url = prompt("Masukkan URL gambar:");
    if (url) {
      setImages((prev) => [...prev, url]);
    }
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
      const payloadVariants = variantEnabled ? variantRows : null;
      const stock = payloadVariants
        ? payloadVariants.reduce((sum, row) => sum + row.stock, 0)
        : Number(formData.stock);

      await api.products.create({
        title: formData.name,
        slug: formData.slug,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        stock,
        weightGram: Number(formData.weightGram),
        variants: payloadVariants,
        images: images.map((url, index) => ({ url, position: index })),
      });

      if (formData.status === "ARCHIVED") {
        const latest = await api.products.getAll({ limit: 1, search: formData.slug });
        const created = latest.data.find((item) => item.slug === formData.slug);
        if (created) {
          await api.products.update(created.id, { status: "ARCHIVED" });
        }
      }

      addToast("Produk berhasil dibuat", "success");
      router.push("/admin/products");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat produk";
      addToast(message, "error");
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Tambah Produk Baru</h1>
          <p className="text-[#4c739a]">Tambahkan produk baru ke toko Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Informasi Produk</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#0d141b]">Nama Produk <span className="text-red-500">*</span></label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]" required />
              </div>
              <div>
                <label htmlFor="slug" className="mb-2 block text-sm font-medium text-[#0d141b]">Slug <span className="text-red-500">*</span></label>
                <input type="text" id="slug" name="slug" value={formData.slug} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]" required />
              </div>
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-[#0d141b]">Kategori <span className="text-red-500">*</span></label>
                <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]" required>
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-[#0d141b]">Deskripsi</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Varian Produk (2 Atribut)</h2>

            <label className="mb-4 flex items-center gap-2 text-sm text-[#0d141b]">
              <input type="checkbox" checked={variantEnabled} onChange={(e) => setVariantEnabled(e.target.checked)} /> Aktifkan varian
            </label>

            {variantEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={variantAttr1Name} onChange={(e) => setVariantAttr1Name(e.target.value)} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Nama Atribut 1 (contoh: Warna)" />
                  <input value={variantAttr1Options} onChange={(e) => setVariantAttr1Options(e.target.value)} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Opsi Atribut 1 (Merah, Hitam)" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input value={variantAttr2Name} onChange={(e) => setVariantAttr2Name(e.target.value)} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Nama Atribut 2 (contoh: Ukuran)" />
                  <input value={variantAttr2Options} onChange={(e) => setVariantAttr2Options(e.target.value)} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Opsi Atribut 2 (S, M, L)" />
                </div>
                <p className="text-xs text-[#4c739a]">Total kombinasi: {generatedKeys.length}</p>

                {variantRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e7edf3] text-left text-[#4c739a]">
                          <th className="py-2">Varian</th>
                          <th className="py-2">Stok</th>
                          <th className="py-2">Harga</th>
                          <th className="py-2">Berat (gram)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantRows.map((row) => (
                          <tr key={row.key} className="border-b border-[#f3f5f7]">
                            <td className="py-2 text-[#0d141b]">{row.label}</td>
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
            )}
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Gambar Produk</h2>
            <div className="mb-4 grid grid-cols-3 gap-4">
              {images.map((url, index) => (
                <div key={index} className="group relative">
                  <img src={url} alt={`Product ${index + 1}`} className="h-32 w-full rounded-lg object-cover" />
                  <button type="button" onClick={() => handleImageRemove(index)} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={handleImageUrlAdd} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#e7edf3] py-4 text-[#4c739a] transition-colors hover:border-[#137fec] hover:text-[#137fec]">
              <span className="material-symbols-outlined">add_photo_alternate</span>
              Tambah Gambar (URL)
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Harga & Stok</h2>
            <div className="space-y-5">
              <div>
                <label htmlFor="price" className="mb-2 block text-sm font-medium text-[#0d141b]">Harga Dasar</label>
                <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
              </div>
              {!variantEnabled && (
                <div>
                  <label htmlFor="stock" className="mb-2 block text-sm font-medium text-[#0d141b]">Stok</label>
                  <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
                </div>
              )}
              <div>
                <label htmlFor="weightGram" className="mb-2 block text-sm font-medium text-[#0d141b]">Berat Dasar (gram)</label>
                <input type="number" id="weightGram" name="weightGram" value={formData.weightGram} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Status</h2>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]">
              <option value="AVAILABLE">Aktif</option>
              <option value="ARCHIVED">Arsip</option>
            </select>
          </div>

          <div className="space-y-3">
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#137fec] py-3 font-semibold text-white transition-colors hover:bg-[#0f65bd] disabled:opacity-50">
              {loading ? <><span className="material-symbols-outlined animate-spin">sync</span>Menyimpan...</> : <><span className="material-symbols-outlined">save</span>Simpan Produk</>}
            </button>
            <Link href="/admin/products" className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-3 font-semibold text-[#0d141b] transition-colors hover:bg-gray-200">
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
