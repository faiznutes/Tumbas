"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { api, Product } from "@/lib/api";
import { hasAdminPermission } from "@/lib/admin-permissions";
import Popup from "@/components/ui/Popup";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  SOLD: "bg-red-100 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-700",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { addToast } = useToast();
  const canEditProducts = hasAdminPermission("products.edit");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.products.getAll({ limit: 100 });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      addToast('Gagal memuat produk', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    return 'https://via.placeholder.com/200';
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: string) => {
    try {
      if (action === 'DELETE') {
        for (const id of selectedProducts) {
          await api.products.delete(id);
        }
        addToast(`${selectedProducts.length} produk dihapus`, 'success');
      } else if (action === 'MARK_SOLD') {
        await api.products.bulkAction({ action: 'CHANGE_STATUS', ids: selectedProducts, status: 'SOLD' });
        addToast(`${selectedProducts.length} produk ditandai sold`, 'success');
      } else if (action === 'ACTIVE') {
        await api.products.bulkAction({ action: 'CHANGE_STATUS', ids: selectedProducts, status: 'AVAILABLE' });
        addToast(`${selectedProducts.length} produk diaktifkan`, 'success');
      }
      setSelectedProducts([]);
      fetchProducts();
    } catch {
      addToast('Gagal melakukan aksi', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.products.delete(deleteTargetId);
      addToast('Produk dihapus', 'success');
      setDeleteTargetId(null);
      fetchProducts();
    } catch {
      addToast('Gagal menghapus produk', 'error');
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean) as string[])];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Produk</h1>
            <p className="text-[#4c739a]">Kelola semua produk di toko Anda</p>
          </div>
          {canEditProducts && (
          <Link href="/admin/products/create" className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined">add</span>
            Tambah Produk
          </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#e7edf3] p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#4c739a]">search</span>
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {canEditProducts && selectedProducts.length > 0 && (
          <div className="bg-[#137fec] text-white rounded-lg p-4 mb-6 flex items-center justify-between">
            <span>{selectedProducts.length} produk dipilih</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('ACTIVE')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Aktifkan
              </button>
              <button
                onClick={() => handleBulkAction('MARK_SOLD')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Tandai Terjual
              </button>
              <button
                onClick={() => handleBulkAction('DELETE')}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-[#e7edf3]">
          {loading ? (
            <div className="p-8 text-center text-[#4c739a]">Memuat...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-[#4c739a]">Tidak ada produk</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        disabled={!canEditProducts}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Produk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Harga</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Stok</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7edf3]">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            disabled={!canEditProducts}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={product.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <span className="font-medium text-[#0d141b] block">{product.title}</span>
                            <span className="text-xs text-[#4c739a]">{product.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#4c739a]">{product.category || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#0d141b]">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4 text-sm text-[#0d141b]">{product.stock} unit</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[product.status]}`}>
                          {product.status === "AVAILABLE" && "Aktif"}
                          {product.status === "SOLD" && "Terjual"}
                          {product.status === "ARCHIVED" && "Arsip"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {canEditProducts ? (
                            <>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="p-2 text-[#137fec] hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ubah"
                              >
                                <span className="material-symbols-outlined">edit</span>
                              </Link>
                              <button
                                onClick={() => setDeleteTargetId(product.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined">delete</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-[#4c739a]">Hanya lihat</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      <Popup
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Hapus Produk"
        message="Yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
