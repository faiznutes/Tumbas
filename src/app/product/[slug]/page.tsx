"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, Product } from "@/lib/api";
import { addToCart } from "@/lib/cart";

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
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedAttr1, setSelectedAttr1] = useState("");
  const [selectedAttr2, setSelectedAttr2] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const data = await api.products.getBySlug(slug);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Produk tidak ditemukan');
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleBuyNow = () => {
    if (product) {
      const query = new URLSearchParams();
      if (selectedVariant) {
        query.set("variantKey", selectedVariant.key);
        query.set("variantLabel", selectedVariant.label);
      }
      const suffix = query.toString() ? `?${query.toString()}` : "";
      router.push(`/checkout/${product.slug}${suffix}`);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.status !== "AVAILABLE") return;
    if (variants.length > 0 && !selectedVariant) {
      alert("Pilih varian terlebih dahulu");
      return;
    }
    setAddingToCart(true);
    const image = product.images?.[0]?.url || "https://via.placeholder.com/400";
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description || "",
        price: activePrice,
        image,
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
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <p className="text-[#4c739a]">Memuat produk...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex flex-col items-center justify-center">
        <p className="text-[#4c739a] mb-4">{error || 'Produk tidak ditemukan'}</p>
        <Link href="/shop" className="text-[#137fec] hover:underline">Kembali ke Belanja</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images.map(img => img.url)
    : ['https://via.placeholder.com/400'];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const attr1Name = variants[0]?.attribute1Name || "Atribut 1";
  const attr2Name = variants[0]?.attribute2Name || "Atribut 2";
  const attr1Options = Array.from(new Set(variants.map((variant) => variant.attribute1Value)));
  const attr2Options = Array.from(new Set(variants.map((variant) => variant.attribute2Value)));
  const selectedVariant = variants.find((variant) => variant.attribute1Value === selectedAttr1 && variant.attribute2Value === selectedAttr2);
  const activePrice = selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : product.price;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <nav className="sticky top-0 z-50 w-full border-b border-[#e7edf3] bg-white flex-shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-[#137fec]">
                  <span className="material-symbols-outlined text-3xl">shopping_bag</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-[#0d141b] hidden sm:block">Tumbas</h1>
              </Link>
            </div>
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/">Beranda</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/shop">Belanja</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/about">Tentang</Link>
              <Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/contact">Kontak</Link>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/cart" className="p-2 text-[#4c739a] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-full relative">
                <span className="material-symbols-outlined">shopping_cart</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex mb-8">
          <ol className="flex items-center space-x-2">
            <li><Link className="text-[#4c739a] hover:text-[#137fec]" href="/"><span className="material-symbols-outlined text-xl">home</span></Link></li>
            <li><span className="text-[#4c739a]">/</span></li>
            <li><Link className="text-sm font-medium text-[#4c739a] hover:text-[#137fec]" href="/shop">{product.category || 'Produk'}</Link></li>
            <li><span className="text-[#4c739a]">/</span></li>
            <li><span className="text-sm font-medium text-[#137fec]">{product.title}</span></li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? "border-[#137fec]" : "border-transparent"
                  }`}
                >
                  <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              {product.category && (
                <span className="inline-block px-3 py-1 text-xs font-medium bg-[#137fec]/10 text-[#137fec] rounded-full mb-3">
                  {product.category}
                </span>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0d141b]">{product.title}</h1>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#137fec]">{formatPrice(activePrice)}</span>
            </div>

            <div className="flex items-center gap-2">
              {product.status === 'AVAILABLE' ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-green-600 font-medium">Stok tersedia ({activeStock} unit)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className="text-sm text-red-500 font-medium">Stok habis</span>
                </>
              )}
            </div>

            {product.description && (
              <div>
                <h2 className="font-semibold text-[#0d141b] mb-2">Deskripsi</h2>
                <p className="text-[#4c739a] text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {variants.length > 0 && (
              <div className="space-y-3 rounded-lg border border-[#e7edf3] p-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-[#0d141b]">{attr1Name}</p>
                  <div className="flex flex-wrap gap-2">
                    {attr1Options.map((option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => setSelectedAttr1(option)}
                        className={`rounded-md border px-3 py-1 text-sm ${selectedAttr1 === option ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]" : "border-[#dfe5ec] text-[#0d141b]"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-[#0d141b]">{attr2Name}</p>
                  <div className="flex flex-wrap gap-2">
                    {attr2Options.map((option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => setSelectedAttr2(option)}
                        className={`rounded-md border px-3 py-1 text-sm ${selectedAttr2 === option ? "border-[#137fec] bg-[#137fec]/10 text-[#137fec]" : "border-[#dfe5ec] text-[#0d141b]"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
                {!selectedVariant && <p className="text-xs text-amber-600">Pilih kombinasi varian untuk melihat stok akurat.</p>}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.status !== 'AVAILABLE' || addingToCart || (variants.length > 0 && !selectedVariant) || activeStock <= 0}
                className={`flex-1 border border-[#137fec] text-[#137fec] hover:bg-[#137fec]/10 font-semibold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  product.status !== 'AVAILABLE' ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span className="material-symbols-outlined">add_shopping_cart</span>
                {product.status !== 'AVAILABLE' ? "Stok Habis" : "Tambah ke Keranjang"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.status !== 'AVAILABLE' || addingToCart || (variants.length > 0 && !selectedVariant) || activeStock <= 0}
                className={`flex-1 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  product.status !== 'AVAILABLE' ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                {product.status !== 'AVAILABLE' ? "Stok Habis" : "Beli Sekarang"}
              </button>
              <button className="p-3 border border-[#e7edf3] rounded-lg hover:border-[#137fec] hover:text-[#137fec] transition-colors">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#e7edf3] py-12 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]"><span className="material-symbols-outlined text-2xl">shopping_bag</span></div>
              <span className="text-lg font-bold text-[#0d141b]">Tumbas</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#4c739a]">
              <Link href="/about" className="hover:text-[#137fec]">Tentang</Link>
              <Link href="/terms" className="hover:text-[#137fec]">Syarat & Ketentuan</Link>
              <Link href="/privacy" className="hover:text-[#137fec]">Kebijakan Privasi</Link>
              <Link href="/contact" className="hover:text-[#137fec]">Kontak</Link>
            </div>
            <div className="text-sm text-[#4c739a]">
              <p>&copy; {new Date().getFullYear()} Tumbas Inc.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
