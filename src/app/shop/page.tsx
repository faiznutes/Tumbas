"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, Product } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { addToCart } from "@/lib/cart";
import { getProductRatingSummary } from "@/lib/product-reviews";
import { resolveProductDiscount } from "@/lib/discount-display";

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price-low", label: "Harga: Rendah ke Tinggi" },
  { value: "price-high", label: "Harga: Tinggi ke Rendah" },
  { value: "popular", label: "Terpopuler" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState(1000000);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [showFilters, setShowFilters] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [gridView, setGridView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [minRating, setMinRating] = useState(0);
  const [shopHero, setShopHero] = useState({
    badge: "Koleksi Baru",
    title: "Koleksi Musim Panas Telah Tiba",
    subtitle: "Temukan tren aksesori terbaru dan nikmati diskon 20% untuk waktu terbatas.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeedSfej9dHlWKKsEZrhnlgVKTEkuxcUJvEzvKBxFq0eerDfw-ZXQB--pIyO00S4U6EsuEStAMeBYMujBGYj5a8NUIBX8F-xqLlP_t3ysmOc2fNeVmNWAF9M4HnK03c8vrHpEOhGq6msw8XUNw3adG5-hLCWYHKP3S73bgLRh7UrWbw-c2zYMc6cYtYpUtwPLpjwMCCx2wME-RA0k33V5x1yunQWF0EHev5_L1B8VU-ZxlAv8LTF_cGOp2XObWtgk9J900RRsTef4",
    ctaText: "Belanja Sekarang",
  });
  const [weeklyDeal, setWeeklyDeal] = useState<any>(null);
  const [discountCampaigns, setDiscountCampaigns] = useState<any[]>([]);

  const categories = useMemo(() => {
    const counts = allProducts.reduce((acc: Record<string, number>, product) => {
      const cat = product.category || "Lainnya";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: "Semua", slug: "all", count: allProducts.length },
      ...Object.entries(counts).map(([name, count]) => ({
        name,
        slug: name.toLowerCase(),
        count,
      })),
    ];
  }, [allProducts]);

  const products = useMemo(() => {
    const normalizedCategory = selectedCategory.trim().toLowerCase();
    let filtered = [...allProducts];

    if (normalizedCategory !== "all") {
      filtered = filtered.filter((product) => (product.category || "lainnya").trim().toLowerCase() === normalizedCategory);
    }

    if (priceRange > 0 && priceRange < maxPrice) {
      filtered = filtered.filter((product) => product.price <= priceRange);
    }

    if (minRating > 0) {
      filtered = filtered.filter((product) => getProductRatingSummary(product.slug).average >= minRating);
    }

    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }, [allProducts, maxPrice, priceRange, selectedCategory, sortBy, minRating]);

  const itemsPerPage = gridView ? 12 : 10;
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const resultStart = products.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const resultEnd = Math.min(safeCurrentPage * itemsPerPage, products.length);
  const paginatedProducts = products.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const visiblePages = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set([1, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, totalPages]);
    return [...pages].filter((page) => page > 0 && page <= totalPages).sort((a, b) => a - b);
  })();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setFetchError("");
        const [response, heroSettings, weekly, campaignsRes] = await Promise.all([
          api.products.getAll({ limit: 100, status: 'AVAILABLE', sort: 'popular' }),
          api.settings.getShopHeroPublic(),
          api.settings.getWeeklyDealPublic(),
          api.settings.getDiscountCampaignsPublic(),
        ]);
        setAllProducts(response.data);
        setShopHero(heroSettings);
        setWeeklyDeal(weekly);
        setDiscountCampaigns(campaignsRes.campaigns || []);

        const highestPrice = response.data.reduce((max, product) => Math.max(max, product.price), 0);
        const nextMaxPrice = Math.max(1000000, Math.ceil(highestPrice / 50000) * 50000);
        setMaxPrice(nextMaxPrice);
        setPriceRange(nextMaxPrice);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        const message = error instanceof Error ? error.message : "Gagal memuat produk";
        if (message.includes("Too Many Requests") || message.includes("429")) {
          setFetchError("Terlalu banyak permintaan ke server. Tunggu beberapa detik lalu refresh halaman.");
        } else {
          setFetchError("Produk belum bisa dimuat saat ini. Periksa koneksi lalu coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy, priceRange, gridView, minRating]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlY5BkbHt410RV0oCRWTnDjDUojhp8hqe-w_g-tpE5aRu_tx1Cbdr-7AD4a6eH0Yxkdn41Q-PTNKSlppWGmNOkRFFtjJuRpvxkua911WGEg9QRxmD6HySauVZi2j1VHN4GEwNLaNPeJpy6HCUU6iQAeZsvtGB-vusD-teVGyubSThLSHNgz_-5vQG43I6zIvunbaM_M2-f0tGBv4cvffrOvJntpgS2jq1-qZZS3cbkcH9RIsJ5mKEpmmyZb28i3WRVKiIFhgbLD-Q';
  };

  const getBadge = (product: Product) => {
    if (product.status === 'SOLD') return { text: 'Terjual', class: 'bg-gray-500' };
    const discount = resolveProductDiscount({ productId: product.id, unitPrice: product.price, weeklyDeal, campaigns: discountCampaigns });
    if (discount.hasDiscount) return { text: 'Diskon', class: 'bg-red-500' };
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <Navbar />
      
      {/* Hero Section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative rounded-2xl overflow-hidden mb-12 shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
          <img 
            alt="Summer Collection Banner" 
            className="w-full h-[400px] object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
            src={shopHero.image}
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-start p-8 md:p-16">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-white uppercase bg-[#137fec] rounded-full">{shopHero.badge}</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 max-w-xl">
              {shopHero.title}
            </h2>
            <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-lg font-light">
              {shopHero.subtitle}
            </p>
            <Link href="/shop" className="bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#137fec]/30 flex items-center gap-2">
              {shopHero.ctaText}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Layout Grid: Sidebar + Product Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-[#0d141b]">Filter</h3>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-[#137fec] font-medium"
              >
                <span className="material-symbols-outlined">filter_list</span>
                Tampilkan Filter
              </button>
            </div>

            {/* Categories */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
              <h3 className="font-bold text-lg text-[#0d141b] flex items-center justify-between">
                Kategori
                <span className="material-symbols-outlined text-[#4c739a] cursor-pointer">expand_less</span>
              </h3>
              <ul className="space-y-2 text-sm text-[#4c739a]">
                {categories.map((category) => (
                  <li key={category.slug} className="flex items-center gap-3 group cursor-pointer">
                    <input 
                      className="rounded border-gray-300 text-[#137fec] focus:ring-[#137fec] bg-white"
                      id={`cat-${category.slug}`}
                      type="checkbox"
                      checked={selectedCategory === category.slug}
                      onChange={() => setSelectedCategory(category.slug)}
                    />
                    <label 
                      className={`group-hover:text-[#137fec] transition-colors flex-1 ${selectedCategory === category.slug ? 'text-[#137fec] font-medium' : ''}`}
                      htmlFor={`cat-${category.slug}`}
                    >
                      {category.name}
                    </label>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === category.slug ? 'bg-[#137fec]/10 text-[#137fec]' : 'bg-gray-100'}`}>
                      {category.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <hr className="border-[#e7edf3] hidden lg:block"/>

            {/* Price Range */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
              <h3 className="font-bold text-lg text-[#0d141b] flex items-center justify-between">
                Rentang Harga
                <span className="material-symbols-outlined text-[#4c739a] cursor-pointer">expand_less</span>
              </h3>
              <div className="px-2">
                <input 
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  max={maxPrice}
                  min="0"
                  type="range"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                />
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 items-center justify-center rounded border border-[#e7edf3] bg-white px-2 py-1.5 text-center text-xs font-medium text-[#0d141b] sm:text-sm">
                    {formatPrice(0)}
                  </div>
                  <span className="text-[#4c739a]">-</span>
                  <div className="flex min-w-0 flex-[1.35] items-center justify-end overflow-hidden rounded border border-[#e7edf3] bg-white px-2 py-1.5 text-right text-xs font-medium tabular-nums text-[#0d141b] sm:text-sm">
                    {formatPrice(priceRange)}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#e7edf3] hidden lg:block"/>

            {/* Rating */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
                <h3 className="font-bold text-lg text-[#0d141b] flex items-center justify-between">
                  Penilaian
                  <span className="material-symbols-outlined text-[#4c739a] cursor-pointer">expand_less</span>
                </h3>
                <ul className="space-y-2 text-sm text-[#4c739a]">
                  {[5, 4, 3].map((rating) => (
                    <li key={rating} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded p-1 -ml-1">
                      <input 
                        className="rounded border-gray-300 text-[#137fec] focus:ring-[#137fec] bg-white"
                        id={`rate-${rating}`}
                        type="checkbox"
                        checked={minRating === rating}
                        onChange={() => setMinRating((prev) => (prev === rating ? 0 : rating))}
                      />
                    <label className="flex items-center gap-1 cursor-pointer" htmlFor={`rate-${rating}`}>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span 
                            key={i}
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-[#4c739a] ml-1">ke atas</span>
                    </label>
                  </li>
                  ))}
                </ul>
                {minRating > 0 && (
                  <button
                    type="button"
                    onClick={() => setMinRating(0)}
                    className="text-xs font-medium text-[#137fec] hover:underline"
                  >
                    Reset filter bintang
                  </button>
                )}
              </div>
            </aside>

          {/* Main Product Grid Area */}
          <div className="flex-1">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-[#e7edf3]">
              <p className="text-sm text-[#4c739a] font-medium">
                Menampilkan <span className="text-[#0d141b] font-bold">{resultStart}-{resultEnd}</span> dari <span className="text-[#0d141b] font-bold">{products.length}</span> hasil
              </p>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <label className="text-sm font-medium text-[#4c739a]" htmlFor="sort">Urutkan:</label>
                <div className="relative">
                  <select 
                    className="appearance-none bg-[#f6f7f8] border border-[#e7edf3] text-[#0d141b] text-sm rounded-lg focus:ring-[#137fec] focus:border-[#137fec] block w-40 p-2.5 pr-8 cursor-pointer"
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#4c739a]">
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                  </div>
                </div>
                <div className="flex bg-[#f6f7f8] rounded-lg p-1 border border-[#e7edf3]">
                  <button 
                    onClick={() => setGridView(true)}
                    className={`p-1.5 rounded ${gridView ? 'bg-white shadow-sm text-[#137fec]' : 'text-[#4c739a] hover:text-[#0d141b]'}`}
                  >
                    <span className="material-symbols-outlined text-xl">grid_view</span>
                  </button>
                  <button 
                    onClick={() => setGridView(false)}
                    className={`p-1.5 rounded ${!gridView ? 'bg-white shadow-sm text-[#137fec]' : 'text-[#4c739a] hover:text-[#0d141b]'}`}
                  >
                    <span className="material-symbols-outlined text-xl">view_list</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-[#4c739a]">Memuat produk...</p>
              </div>
            ) : fetchError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                {fetchError}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#4c739a]">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => {
                  const badge = getBadge(product);
                  const rating = getProductRatingSummary(product.slug);
                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="group bg-white rounded-xl border border-[#e7edf3] overflow-hidden hover:shadow-xl hover:border-[#137fec]/30 transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        {badge && (
                          <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm z-10 text-white ${badge.class}`}>
                            {badge.text}
                          </span>
                        )}
                        <button 
                          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-gray-400 hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 duration-300"
                          onClick={(e) => { e.preventDefault(); }}
                        >
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>favorite</span>
                        </button>
                        <img
                          src={getProductImage(product)}
                          alt={product.title}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Quick Add Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent flex justify-center">
                          <button 
                            className="bg-[#137fec] hover:bg-[#0f65bd] text-white text-sm font-bold py-2 px-6 rounded-full shadow-lg flex items-center gap-2 w-full justify-center"
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(
                                {
                                  productId: product.id,
                                  slug: product.slug,
                                  title: product.title,
                                  description: product.description || "",
                                  price: product.price,
                                  image: getProductImage(product),
                                },
                                1,
                              );
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                            Tambah ke Keranjang
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[16px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-xs text-[#4c739a] font-medium">{rating.average.toFixed(1)} ({rating.total})</span>
                        </div>
                        <h3 className="font-bold text-[#0d141b] text-lg mb-1 truncate">{product.title}</h3>
                        <p className="text-sm text-[#4c739a] mb-3 truncate">{product.description || ''}</p>
                        <div className="flex items-baseline gap-2">
                          {(() => {
                            const discount = resolveProductDiscount({ productId: product.id, unitPrice: product.price, weeklyDeal, campaigns: discountCampaigns });
                            if (!discount.hasDiscount) {
                              return <span className="text-xl font-bold text-[#137fec]">{formatPrice(product.price)}</span>;
                            }
                            return (
                              <>
                                <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
                                <span className="text-xl font-bold text-[#137fec]">{formatPrice(discount.finalPrice)}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="p-2 rounded-lg border border-[#e7edf3] text-[#4c739a] hover:bg-gray-100 transition-colors disabled:opacity-50"
                disabled={safeCurrentPage === 1}
              >
                <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
              </button>

              {visiblePages.map((page, index) => {
                const previousPage = visiblePages[index - 1];
                const showEllipsis = index > 0 && previousPage !== undefined && page - previousPage > 1;

                return (
                  <span key={page} className="flex items-center gap-2">
                    {showEllipsis && (
                      <span className="w-8 text-center text-sm font-medium text-[#4c739a]">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-lg font-medium transition-colors ${
                        safeCurrentPage === page
                          ? "bg-[#137fec] text-white shadow-md shadow-[#137fec]/30"
                          : "text-[#4c739a] hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-lg border border-[#e7edf3] text-[#4c739a] hover:bg-gray-100 transition-colors disabled:opacity-50"
                disabled={safeCurrentPage === totalPages}
              >
                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Simple */}
      <footer className="bg-white border-t border-[#e7edf3] py-12 mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              </div>
              <span className="text-lg font-bold">Tumbas</span>
            </div>
            <div className="text-sm text-[#4c739a] text-center md:text-right">
              <p>&copy; 2024 Tumbas Inc. Seluruh hak cipta dilindungi.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
