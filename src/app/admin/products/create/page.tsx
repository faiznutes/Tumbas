"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

function normalizeSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function combinationsFromAttributes(attributes: VariantAttribute[]) {
  const valid = attributes
    .map((attr) => ({
      name: attr.name.trim(),
      options: parseOptions(attr.optionsText),
    }))
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

export default function CreateProduct() {
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([
    { id: crypto.randomUUID(), name: "Warna", optionsText: "Hitam, Putih" },
    { id: crypto.randomUUID(), name: "Ukuran", optionsText: "64GB, 128GB" },
  ]);
  const [variantRows, setVariantRows] = useState<VariantDraft[]>([]);

  const categories = ["Smartphone", "Laptop", "Tablet", "Headphones", "Smartwatch", "Camera", "Accessories", "Other"];

  const generatedCombinations = useMemo(() => {
    if (!variantEnabled) return [];
    return combinationsFromAttributes(variantAttributes);
  }, [variantAttributes, variantEnabled]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      setFormData((prev) => ({ ...prev, name: value, slug: normalizeSlug(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const updateVariantField = (key: string, field: "stock" | "price" | "weightGram", value: number) => {
    const minValue = field === "stock" ? 0 : 1;
    setVariantRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: Math.max(minValue, Number.isFinite(value) ? value : minValue) } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payloadVariants = variantEnabled ? variantRows : null;
      const stock = payloadVariants ? payloadVariants.reduce((sum, row) => sum + row.stock, 0) : Number(formData.stock);

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

      addToast("Produk berhasil dibuat", "success");
      router.push("/admin/products");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Gagal membuat produk", "error");
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0d141b]">Tambah Produk Baru</h1>
        <p className="text-[#4c739a]">Produk, varian custom, dan gambar upload 1:1</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Informasi Produk</h2>
            <div className="space-y-5">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nama produk" className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
              <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="Slug" className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required />
              <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" required>
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Deskripsi" className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" />
            </div>
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0d141b]">Varian Produk (Custom)</h2>
              <label className="flex items-center gap-2 text-sm text-[#0d141b]">
                <input type="checkbox" checked={variantEnabled} onChange={(e) => setVariantEnabled(e.target.checked)} />
                Aktifkan varian
              </label>
            </div>

            {variantEnabled && (
              <div className="space-y-4">
                {variantAttributes.map((attr, index) => (
                  <div key={attr.id} className="rounded-lg border border-[#e7edf3] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#0d141b]">Atribut {index + 1}</p>
                      {variantAttributes.length > 1 && (
                        <button type="button" onClick={() => removeAttribute(attr.id)} className="text-xs text-red-600 hover:text-red-700">Hapus atribut</button>
                      )}
                    </div>
                    <input
                      value={attr.name}
                      onChange={(e) => updateAttribute(attr.id, "name", e.target.value)}
                      placeholder="Nama atribut (contoh: Warna, Ukuran, Material)"
                      className="mb-2 w-full rounded-lg border border-[#e7edf3] px-3 py-2"
                    />
                    <textarea
                      rows={2}
                      value={attr.optionsText}
                      onChange={(e) => updateAttribute(attr.id, "optionsText", e.target.value)}
                      placeholder="Isi opsi per baris atau dipisahkan koma"
                      className="w-full rounded-lg border border-[#e7edf3] px-3 py-2"
                    />
                  </div>
                ))}

                <button type="button" onClick={addAttribute} className="rounded-lg border border-dashed border-[#137fec] px-3 py-2 text-sm font-semibold text-[#137fec] hover:bg-[#137fec]/5">
                  + Tambah Atribut Varian
                </button>

                <p className="text-xs text-[#4c739a]">Total kombinasi otomatis: {generatedCombinations.length} (maks 240 akan ditampilkan)</p>

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
            <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Gambar Produk</h2>
            <p className="mb-4 text-xs text-[#4c739a]">Upload akan dikompresi dan dinormalisasi ke kanvas 1:1 tanpa stretch.</p>

            <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {images.map((url, index) => (
                <div key={index} className="group relative overflow-hidden rounded-lg border border-[#e7edf3]">
                  <img src={url} alt={`Product ${index + 1}`} className="h-32 w-full object-cover" />
                  <button type="button" onClick={() => handleImageRemove(index)} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#e7edf3] py-3 text-[#4c739a] hover:border-[#137fec] hover:text-[#137fec] disabled:opacity-60"
              >
                <span className="material-symbols-outlined">upload</span>
                {uploadingImages ? "Memproses gambar..." : "Upload Gambar"}
              </button>
              <button type="button" onClick={handleImageUrlAdd} className="rounded-lg border border-[#e7edf3] py-3 text-[#0d141b] hover:bg-slate-50">
                Tambah dari URL
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Harga & Stok</h2>
            <div className="space-y-5">
              <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Harga dasar" required />
              {!variantEnabled && <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Stok" required />}
              <input type="number" id="weightGram" name="weightGram" value={formData.weightGram} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Berat gram" required />
            </div>
          </div>

          <div className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h2 className="mb-6 text-lg font-bold text-[#0d141b]">Status</h2>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3">
              <option value="AVAILABLE">Aktif</option>
              <option value="ARCHIVED">Arsip</option>
            </select>
          </div>

          <div className="space-y-3">
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#137fec] py-3 font-semibold text-white hover:bg-[#0f65bd] disabled:opacity-50">
              {loading ? <><span className="material-symbols-outlined animate-spin">sync</span>Menyimpan...</> : <><span className="material-symbols-outlined">save</span>Simpan Produk</>}
            </button>
            <Link href="/admin/products" className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-3 font-semibold text-[#0d141b] hover:bg-gray-200">
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
