"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { api, Product } from "@/lib/api";

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    price: '',
    stock: '0',
    description: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  async function fetchProduct(id: string) {
    try {
      setLoadingData(true);
      const products = await api.products.getAll({ limit: 100 });
      const product = products.data.find(p => p.id === id);
      if (product) {
        setFormData({
          title: product.title,
          slug: product.slug,
          category: product.category || '',
          price: product.price.toString(),
          stock: product.stock.toString(),
          description: product.description || '',
          status: product.status,
        });
        setImages(product.images?.map(img => img.url) || []);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      addToast('Gagal memuat produk', 'error');
    } finally {
      setLoadingData(false);
    }
  }

  const categories = [
    "Smartphone",
    "Laptop",
    "Tablet",
    "Headphones",
    "Smartwatch",
    "Camera",
    "Fashion",
    "Home",
    "Beauty",
    "Sports",
    "Books",
    "Other",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "title") {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.products.update(params.id as string, {
        title: formData.title,
        slug: formData.slug,
        category: formData.category || undefined,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        description: formData.description || undefined,
        status: formData.status,
        images: images.map((url, position) => ({ url, position })),
      });
      addToast('Produk berhasil diperbarui', 'success');
      router.push("/admin/products");
    } catch (error) {
      console.error('Failed to update product:', error);
      addToast('Gagal memperbarui produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin material-symbols-outlined text-4xl text-[#137fec]">sync</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Edit Produk</h1>
          <p className="text-[#4c739a]">Perbarui informasi produk</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#e7edf3] p-6">
            <h2 className="text-lg font-bold text-[#0d141b] mb-6">Informasi Produk</h2>
            
            <div className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[#0d141b] mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  placeholder="Contoh: iPhone 15 Pro Max"
                  required
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-[#0d141b] mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  placeholder="iphone-15-pro-max"
                  required
                />
                <p className="text-xs text-[#4c739a] mt-1">URL: /product/{formData.slug || "..."}</p>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-[#0d141b] mb-2">
                  Kategori
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#0d141b] mb-2">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  placeholder="Deskripsi produk..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e7edf3] p-6">
            <h2 className="text-lg font-bold text-[#0d141b] mb-6">Gambar Produk</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleImageUrlAdd}
              className="w-full py-4 border-2 border-dashed border-[#e7edf3] rounded-lg text-[#4c739a] hover:border-[#137fec] hover:text-[#137fec] transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add_photo_alternate</span>
              Tambah Gambar (URL)
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#e7edf3] p-6">
            <h2 className="text-lg font-bold text-[#0d141b] mb-6">Harga & Stok</h2>
            
            <div className="space-y-5">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-[#0d141b] mb-2">
                  Harga <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4c739a]">Rp</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                    placeholder="24990000"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-[#0d141b] mb-2">
                  Stok <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  placeholder="100"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e7edf3] p-6">
            <h2 className="text-lg font-bold text-[#0d141b] mb-6">Status</h2>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-[#0d141b] mb-2">
                Status Produk
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
              >
                <option value="AVAILABLE">Aktif</option>
                <option value="SOLD">Sold</option>
                <option value="ARCHIVED">Arsip</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Perbarui Produk
                </>
              )}
            </button>
            
            <Link
              href="/admin/products"
              className="w-full bg-gray-100 hover:bg-gray-200 text-[#0d141b] font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
