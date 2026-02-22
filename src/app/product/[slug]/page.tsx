"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, Product } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { useToast } from "@/components/ui/Toast";
import Navbar from "@/components/layout/Navbar";
import { getHardcodedReviews, getProductRatingSummary } from "@/lib/product-reviews";

type ProductTab = "description" | "specs" | "reviews" | "faq";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedPool, setRelatedPool] = useState<Product[]>([]);
  const [relatedVisibleCount, setRelatedVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedAttr1, setSelectedAttr1] = useState("");
  const [selectedAttr2, setSelectedAttr2] = useState("");
  const [activeTab, setActiveTab] = useState<ProductTab>("description");
  const [reviewPage, setReviewPage] = useState(1);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchProductAndRelated() {
      try {
        setLoading(true);
        setError("");

        const data = await api.products.getBySlug(slug);
        setProduct(data);
        setSelectedImage(0);
        setReviewPage(1);

        const relatedResponse = await api.products.getAll({
          limit: 200,
          status: "AVAILABLE",
          sort: "popular",
        });

        const candidates = relatedResponse.data.filter((item) => item.id !== data.id);
        const sameCategory = candidates.filter((item) => item.category && item.category === data.category);
        const otherCategory = candidates.filter((item) => !data.category || item.category !== data.category);
        const mixed = [...sameCategory, ...otherCategory].slice(0, 32);

        setRelatedPool(mixed);
        setRelatedVisibleCount(Math.min(8, mixed.length));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Produk tidak ditemukan");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProductAndRelated();
    }
  }, [slug]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        setRelatedVisibleCount((prev) => Math.min(prev + 8, relatedPool.length));
      },
      { rootMargin: "0px 0px 180px 0px" },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [relatedPool.length]);

  const images = useMemo(() => {
    if (!product) return [] as string[];
    return product.images && product.images.length > 0
      ? product.images.map((img) => img.url)
      : ["https://via.placeholder.com/800x800?text=No+Image"];
  }, [product]);

  const variants = useMemo(() => (Array.isArray(product?.variants) ? product.variants : []), [product?.variants]);
  const attr1Name = variants[0]?.attribute1Name || "Atribut 1";
  const attr2Name = variants[0]?.attribute2Name || "Atribut 2";
  const attr1Options = Array.from(new Set(variants.map((variant) => variant.attribute1Value)));
  const attr2Options = Array.from(new Set(variants.map((variant) => variant.attribute2Value)));
  const selectedVariant = variants.find((variant) => variant.attribute1Value === selectedAttr1 && variant.attribute2Value === selectedAttr2);
  const activePrice = selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : product?.price || 0;
  const activeStock = selectedVariant ? selectedVariant.stock : product?.stock || 0;
  const visibleRelated = relatedPool.slice(0, relatedVisibleCount);
  const ratingSummary = useMemo(() => (product ? getProductRatingSummary(product.slug) : { average: 0, total: 0 }), [product]);
  const reviews = useMemo(() => (product ? getHardcodedReviews(product.slug, product.title) : []), [product]);
  const reviewPerPage = 6;
  const reviewTotalPages = Math.max(1, Math.ceil(reviews.length / reviewPerPage));
  const safeReviewPage = Math.min(reviewPage, reviewTotalPages);
  const visibleReviews = reviews.slice((safeReviewPage - 1) * reviewPerPage, safeReviewPage * reviewPerPage);

  const handleBuyNow = () => {
    if (!product) return;
    const query = new URLSearchParams();
    if (selectedVariant) {
      query.set("variantKey", selectedVariant.key);
      query.set("variantLabel", selectedVariant.label);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    router.push(`/checkout/${product.slug}${suffix}`);
  };

  const handleAddToCart = () => {
    if (!product || product.status !== "AVAILABLE") return;
    if (variants.length > 0 && !selectedVariant) {
      addToast("Pilih varian terlebih dahulu", "warning");
      return;
    }

    setAddingToCart(true);
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description || "",
        price: activePrice,
        image: images[0],
        variantKey: selectedVariant?.key,
        variantLabel: selectedVariant?.label,
      },
      1,
    );
    setAddingToCart(false);
    router.push("/cart");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8]">
        <p className="text-[#4c739a]">Memuat produk...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f8]">
        <p className="mb-4 text-[#4c739a]">{error || "Produk tidak ditemukan"}</p>
        <Link href="/shop" className="text-[#137fec] hover:underline">
          Kembali ke Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7f8]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center text-sm text-[#4c739a]">
          <Link className="hover:text-[#137fec]" href="/">Beranda</Link>
          <span className="mx-2">/</span>
          <Link className="hover:text-[#137fec]" href="/shop">{product.category || "Produk"}</Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-[#0d141b]">{product.title}</span>
        </nav>

        <div className="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img src={images[selectedImage]} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={img + idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedImage === idx ? "border-[#137fec]" : "border-slate-200"}`}
                >
                  <img src={img} alt={`${product.title} ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${activeStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {activeStock > 0 ? "Stok Tersedia" : "Stok Habis"}
                </span>
                <span className="text-xs font-medium text-[#4c739a]">Official Store</span>
              </div>
              <h1 className="mb-4 text-3xl font-bold text-[#0d141b] sm:text-4xl">{product.title}</h1>
              <p className="mb-3 text-sm font-medium text-[#4c739a]">{ratingSummary.average.toFixed(1)} / 5.0 dari {ratingSummary.total} ulasan</p>
              <p className="mb-6 text-sm leading-relaxed text-[#4c739a]">{product.description || "Produk premium dengan kualitas terbaik dan jaminan resmi."}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[#137fec]">{formatPrice(activePrice)}</span>
              </div>
            </div>

            {variants.length > 0 && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#0d141b]">{attr1Name}</p>
                  <div className="flex flex-wrap gap-2">
                    {attr1Options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedAttr1(option)}
                        className={`rounded-md border px-3 py-1 text-sm ${selectedAttr1 === option ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]" : "border-slate-200 text-[#0d141b]"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-[#0d141b]">{attr2Name}</p>
                  <div className="flex flex-wrap gap-2">
                    {attr2Options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedAttr2(option)}
                        className={`rounded-md border px-3 py-1 text-sm ${selectedAttr2 === option ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]" : "border-slate-200 text-[#0d141b]"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                {!selectedVariant && <p className="text-xs text-amber-700">Pilih kombinasi varian untuk melihat stok akurat.</p>}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleBuyNow}
                disabled={product.status !== "AVAILABLE" || addingToCart || (variants.length > 0 && !selectedVariant) || activeStock <= 0}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#137fec] font-semibold text-white hover:bg-[#0f65bd] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                Beli Sekarang
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.status !== "AVAILABLE" || addingToCart || (variants.length > 0 && !selectedVariant) || activeStock <= 0}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-semibold text-[#0d141b] hover:border-[#137fec] hover:text-[#137fec] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <div className="border-b border-slate-200">
            <div className="-mb-px flex gap-8 overflow-x-auto">
              {[
                ["description", "Deskripsi"],
                ["specs", "Spesifikasi"],
                ["reviews", "Review"],
                ["faq", "FAQ"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key as ProductTab)}
                  className={`whitespace-nowrap border-b-2 pb-4 text-sm ${activeTab === key ? "border-[#137fec] font-semibold text-[#137fec]" : "border-transparent text-[#4c739a] hover:text-[#0d141b]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-4xl space-y-4 py-8 text-sm leading-relaxed text-[#4c739a]">
            {activeTab === "description" && (
              <>
                <h3 className="text-xl font-bold text-[#0d141b]">Deskripsi Produk</h3>
                <p>{product.description || "Produk ini dirancang untuk kenyamanan penggunaan harian dengan kualitas material premium."}</p>
                <p>Setiap pembelian mendapatkan dukungan resmi, kemasan aman, dan proses pengiriman cepat.</p>
              </>
            )}

            {activeTab === "specs" && (
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[#4c739a]">Kategori</span><span className="font-semibold text-[#0d141b]">{product.category || "Umum"}</span></div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[#4c739a]">Status</span><span className="font-semibold text-[#0d141b]">{product.status}</span></div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[#4c739a]">Stok</span><span className="font-semibold text-[#0d141b]">{activeStock} unit</span></div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[#4c739a]">Berat</span><span className="font-semibold text-[#0d141b]">{product.weightGram} gram</span></div>
                <div className="flex items-center justify-between sm:col-span-2"><span className="text-[#4c739a]">Variasi</span><span className="font-semibold text-[#0d141b]">{variants.length > 0 ? `${variants.length} kombinasi` : "Tanpa varian"}</span></div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#0d141b]">Review Pelanggan</h3>
                {visibleReviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-semibold text-[#0d141b]">{review.author}</p>
                      <div className="flex items-center gap-0.5 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: star <= review.rating ? "'FILL' 1" : "'FILL' 0" }}>
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="mb-1 text-xs text-[#4c739a]">{new Date(review.date).toLocaleDateString("id-ID")}</p>
                    <p>{review.comment}</p>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-[#4c739a]">Halaman {safeReviewPage} dari {reviewTotalPages}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeReviewPage === 1}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-[#0d141b] disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewPage((prev) => Math.min(reviewTotalPages, prev + 1))}
                      disabled={safeReviewPage >= reviewTotalPages}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-[#0d141b] disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "faq" && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#0d141b]">Pertanyaan Umum</h3>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-[#0d141b]">Apakah produk ini original?</p>
                  <p>Ya, semua produk dijamin original dan melalui quality check sebelum dikirim.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-[#0d141b]">Berapa lama pengiriman?</p>
                  <p>Estimasi tergantung wilayah dan kurir, umumnya 1-3 hari kerja.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0d141b]">Related Products</h2>
            <span className="text-xs font-medium text-[#4c739a]">Menampilkan {visibleRelated.length} dari {relatedPool.length} produk</span>
          </div>

          {visibleRelated.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-[#4c739a]">Belum ada produk terkait.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleRelated.map((item) => {
                const image = item.images?.[0]?.url || "https://via.placeholder.com/400";
                return (
                  <Link key={item.id} href={`/product/${item.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#137fec]/40 hover:shadow-lg">
                    <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-slate-100">
                      <img src={image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <h3 className="line-clamp-1 text-sm font-semibold text-[#0d141b]">{item.title}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-[#4c739a]">{item.category || "Produk"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-base font-bold text-[#137fec]">{formatPrice(item.price)}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(
                            {
                              productId: item.id,
                              slug: item.slug,
                              title: item.title,
                              description: item.description || "",
                              price: item.price,
                              image,
                            },
                            1,
                          );
                        }}
                        className="rounded-full bg-slate-100 p-2 text-[#4c739a] hover:bg-[#137fec] hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {visibleRelated.length < relatedPool.length && (
            <div ref={loadMoreRef} className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setRelatedVisibleCount((prev) => Math.min(prev + 8, relatedPool.length))}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-[#0d141b] hover:border-[#137fec] hover:text-[#137fec]"
              >
                Muat 8 Produk Lagi
              </button>
            </div>
          )}

          {relatedPool.length > 0 && visibleRelated.length >= relatedPool.length && (
            <p className="mt-6 text-center text-sm text-[#4c739a]">
              Kamu sudah melihat semua produk terkait.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
