"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { api, ProductVariant } from "@/lib/api";

type VariantDraft = ProductVariant;
type VariantAttribute = { id: string; name: string; optionsText: string };

function parseOptions(input: string) {
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function combinationsFromAttributes(attributes: VariantAttribute[]) {
  const valid = attributes
    .map((attr) => ({ name: attr.name.trim(), options: parseOptions(attr.optionsText) }))
    .filter((attr) => attr.name && attr.options.length > 0);

  if (valid.length === 0) return [] as Array<{ values: string[]; key: string; label: string }>;

  const combos: Array<{ values: string[]; key: string; label: string }> = [];
  const walk = (index: number, picked: string[]) => {
    if (index === valid.length) {
      const key = valid.map((attr, i) => `${attr.name}:${picked[i]}`).join("|");
      const label = valid.map((attr, i) => `${attr.name}: ${picked[i]}`).join(" / ");
      combos.push({ values: [...picked], key, label });
      return;
    }
    valid[index].options.forEach((option) => {
      picked.push(option);
      walk(index + 1, picked);
      picked.pop();
    });
  };
  walk(0, []);
  return combos;
}

function parseAttributesFromRows(rows: VariantDraft[]) {
  const map = new Map<string, Set<string>>();
  rows.forEach((row) => {
    String(row.key || "")
      .split("|")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .forEach((pair) => {
        const [name, ...rest] = pair.split(":");
        const value = rest.join(":").trim();
        const cleanName = (name || "").trim();
        if (!cleanName || !value) return;
        if (!map.has(cleanName)) map.set(cleanName, new Set<string>());
        map.get(cleanName)?.add(value);
      });
  });

  if (map.size === 0) {
    return [
      { id: crypto.randomUUID(), name: "Warna", optionsText: "" },
      { id: crypto.randomUUID(), name: "Ukuran", optionsText: "" },
    ];
  }

  return Array.from(map.entries()).map(([name, values]) => ({
    id: crypto.randomUUID(),
    name,
    optionsText: Array.from(values).join(", "),
  }));
}

async function processImageFile(file: File) {
  const imageUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const ratio = Math.min(size / image.width, size / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const offsetX = (size - drawWidth) / 2;
  const offsetY = (size - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [variantRows, setVariantRows] = useState<VariantDraft[]>([]);
  const [variantEnabled, setVariantEnabled] = useState(false);
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([
    { id: crypto.randomUUID(), name: "Warna", optionsText: "" },
    { id: crypto.randomUUID(), name: "Ukuran", optionsText: "" },
  ]);

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

  const categories = ["Smartphone", "Laptop", "Tablet", "Headphones", "Smartwatch", "Camera", "Accessories", "Other"];

  const generatedCombinations = useMemo(() => {
    if (!variantEnabled) return [];
    return combinationsFromAttributes(variantAttributes);
  }, [variantAttributes, variantEnabled]);

  useEffect(() => {
    if (!params.id) return;
    async function fetchProduct(id: string) {
      try {
        setLoadingData(true);
        const products = await api.products.getAll({ limit: 300 });
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
        const variants = Array.isArray(product.variants) ? (product.variants as VariantDraft[]) : [];
        setVariantRows(variants);
        setVariantEnabled(variants.length > 0);
        setVariantAttributes(parseAttributesFromRows(variants));
      } catch {
        addToast("Gagal memuat produk", "error");
      } finally {
        setLoadingData(false);
      }
    }
    fetchProduct(params.id as string);
  }, [addToast, params.id, router]);

  useEffect(() => {
    if (!variantEnabled) {
      setVariantRows([]);
      return;
    }

    setVariantRows((previous) => {
      const prevMap = new Map(previous.map((row) => [row.key, row]));
      return generatedCombinations.slice(0, 240).map((combo) => {
        const existing = prevMap.get(combo.key);
        if (existing) return existing;

        const attr1Name = combo.key.split("|")[0]?.split(":")[0] || "Atribut 1";
        const attr1Value = combo.values[0] || "";
        const attr2Name = combo.key.split("|")[1]?.split(":")[0] || "Atribut 2";
        const attr2Value = combo.values[1] || "-";

        return {
          key: combo.key,
          label: combo.label,
          attribute1Name: attr1Name,
          attribute1Value: attr1Value,
          attribute2Name: attr2Name,
          attribute2Value: attr2Value,
          stock: 0,
          price: Number(formData.price || 0),
          weightGram: Number(formData.weightGram || 1000),
        };
      });
    });
  }, [generatedCombinations, formData.price, formData.weightGram, variantEnabled]);

  const updateVariantField = (key: string, field: "stock" | "price" | "weightGram", value: number) => {
    const minValue = field === "stock" ? 0 : 1;
    setVariantRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: Math.max(minValue, Number.isFinite(value) ? value : minValue) } : row)),
    );
  };

  const addAttribute = () => {
    setVariantAttributes((prev) => [...prev, { id: crypto.randomUUID(), name: "", optionsText: "" }]);
  };

  const removeAttribute = (id: string) => {
    setVariantAttributes((prev) => prev.filter((attr) => attr.id !== id));
  };

  const updateAttribute = (id: string, field: "name" | "optionsText", value: string) => {
    setVariantAttributes((prev) => prev.map((attr) => (attr.id === id ? { ...attr, [field]: value } : attr)));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUrlAdd = () => {
    const url = prompt("Masukkan URL gambar:");
    if (!url) return;
    setImages((prev) => [...prev, url]);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const processed = await Promise.all(Array.from(files).map((file) => processImageFile(file)));
      setImages((prev) => [...prev, ...processed]);
      addToast(`${processed.length} gambar berhasil diunggah`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Gagal memproses gambar", "error");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
    } catch {
      addToast("Gagal memperbarui produk", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-8">
        <div className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">sync</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0d141b]">Ubah Produk</h1>
        <p className="text-[#4c739a]">Ubah varian custom dan gambar upload 1:1</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0d141b]">Informasi Produk</h2>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
            <input name="slug" value={formData.slug} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
            <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3">
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" />
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0d141b]">Varian Produk (Custom)</h2>
              <label className="flex items-center gap-2 text-sm text-[#0d141b]"><input type="checkbox" checked={variantEnabled} onChange={(e) => setVariantEnabled(e.target.checked)} />Aktifkan varian</label>
            </div>

            {variantEnabled && (
              <div className="space-y-4">
                {variantAttributes.map((attr, index) => (
                  <div key={attr.id} className="rounded-lg border border-[#e7edf3] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#0d141b]">Atribut {index + 1}</p>
                      {variantAttributes.length > 1 && <button type="button" onClick={() => removeAttribute(attr.id)} className="text-xs text-red-600">Hapus atribut</button>}
                    </div>
                    <input value={attr.name} onChange={(e) => updateAttribute(attr.id, "name", e.target.value)} className="mb-2 w-full rounded-lg border border-[#e7edf3] px-3 py-2" placeholder="Nama atribut" />
                    <textarea rows={2} value={attr.optionsText} onChange={(e) => updateAttribute(attr.id, "optionsText", e.target.value)} className="w-full rounded-lg border border-[#e7edf3] px-3 py-2" placeholder="Opsi per baris atau koma" />
                  </div>
                ))}
                <button type="button" onClick={addAttribute} className="rounded-lg border border-dashed border-[#137fec] px-3 py-2 text-sm font-semibold text-[#137fec]">+ Tambah Atribut Varian</button>
                <p className="text-xs text-[#4c739a]">Total kombinasi otomatis: {generatedCombinations.length} (maks 240 akan ditampilkan)</p>

                {variantRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-[#e7edf3] text-left text-[#4c739a]"><th className="py-2">Varian</th><th className="py-2">Stok</th><th className="py-2">Harga</th><th className="py-2">Berat</th></tr></thead>
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
            )}
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Gambar Produk</h2>
            <p className="mb-4 text-xs text-[#4c739a]">Upload dikompresi + kanvas 1:1 tanpa stretch.</p>
            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {images.map((url, index) => (
                <div key={index} className="group relative overflow-hidden rounded-lg border border-[#e7edf3]"><img src={url} alt={`Product ${index + 1}`} className="h-32 w-full object-cover" /><button type="button" onClick={() => handleImageRemove(index)} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100"><span className="material-symbols-outlined text-sm">close</span></button></div>
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingImages} className="rounded-lg border-2 border-dashed border-[#e7edf3] py-3 text-[#4c739a] hover:border-[#137fec] hover:text-[#137fec] disabled:opacity-60">{uploadingImages ? "Memproses..." : "Upload Gambar"}</button>
              <button type="button" onClick={handleImageUrlAdd} className="rounded-lg border border-[#e7edf3] py-3 text-[#0d141b] hover:bg-slate-50">Tambah dari URL</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0d141b]">Harga & Stok</h2>
            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
            {!variantEnabled && <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />}
            <input type="number" name="weightGram" value={formData.weightGram} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Status</h2>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3">
              <option value="AVAILABLE">Aktif</option>
              <option value="SOLD">Terjual</option>
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
