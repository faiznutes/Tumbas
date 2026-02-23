"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, Product } from "@/lib/api";
import Navbar from "@/components/layout/Navbar";
import { addToCart } from "@/lib/cart";
import { resolveProductDiscount } from "@/lib/discount-display";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function Beranda() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [promo, setPromo] = useState({
    heroImage: '',
    heroTitle: '',
    heroSubtitle: '',
    heroBadge: '',
    discountText: '',
  });
  const [promoReady, setPromoReady] = useState(false);

  const [weeklyDeal, setWeeklyDeal] = useState({
    title: '',
    subtitle: '',
    enabled: false,
    discount: 20,
    endDate: '',
  });
  const [weeklyDealReady, setWeeklyDealReady] = useState(false);
  const [homepageFeaturedSettings, setHomepageFeaturedSettings] = useState({
    maxItems: 12,
    newArrivalsLimit: 12,
  });
  const [discountCampaigns, setDiscountCampaigns] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [promoRes, weeklyRes, featuredSettingsRes, popularRes, availableRes, campaignsRes] = await Promise.allSettled([
          api.settings.getPromoPublic(),
          api.settings.getWeeklyDealPublic(),
          api.settings.getHomepageFeaturedPublic(),
          api.products.getAll({ limit: 12, status: 'AVAILABLE', sort: 'popular' }),
          api.products.getAll({ limit: 200, status: 'AVAILABLE', sort: 'newest' }),
          api.settings.getDiscountCampaignsPublic(),
        ]);

        if (promoRes.status === 'fulfilled' && promoRes.value) {
          setPromo(promoRes.value);
        }
        if (weeklyRes.status === 'fulfilled' && weeklyRes.value) {
          setWeeklyDeal(weeklyRes.value);
        }
        if (campaignsRes.status === 'fulfilled' && campaignsRes.value) {
          setDiscountCampaigns(campaignsRes.value.campaigns || []);
        }

        const maxItems =
          featuredSettingsRes.status === 'fulfilled'
            ? Math.min(50, Math.max(1, featuredSettingsRes.value.maxItems || 12))
            : 12;
        const newArrivalsLimit =
          featuredSettingsRes.status === 'fulfilled'
            ? Math.min(64, Math.max(1, featuredSettingsRes.value.newArrivalsLimit || 12))
            : 12;
        setHomepageFeaturedSettings({ maxItems, newArrivalsLimit });
        const manualSlugs =
          featuredSettingsRes.status === 'fulfilled'
            ? featuredSettingsRes.value.manualSlugs
            : [];

        const allAvailable = availableRes.status === 'fulfilled' ? availableRes.value.data : [];
        const popularProducts = popularRes.status === 'fulfilled' ? popularRes.value.data : [];
        const featuredCandidate: Product[] = [];

        if (manualSlugs.length > 0 && allAvailable.length > 0) {
          const bySlug = new Map(allAvailable.map((product) => [product.slug, product]));
          manualSlugs.forEach((slug) => {
            const product = bySlug.get(slug);
            if (product && !featuredCandidate.some((item) => item.id === product.id)) {
              featuredCandidate.push(product);
            }
          });
        }

        popularProducts.forEach((product) => {
          if (!featuredCandidate.some((item) => item.id === product.id)) {
            featuredCandidate.push(product);
          }
        });

        if (featuredCandidate.length === 0) {
          featuredCandidate.push(...allAvailable);
        }

        setFeaturedProducts(featuredCandidate.slice(0, maxItems));
        setLatestProducts(allAvailable);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setPromoReady(true);
        setWeeklyDealReady(true);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0].url;
    }
    return 'https://via.placeholder.com/400';
  };

  const isWeeklyDealActive = (() => {
    if (!weeklyDealReady) return false;
    if (!weeklyDeal.enabled) return false;
    if (!weeklyDeal.endDate) return true;
    const endDate = new Date(weeklyDeal.endDate);
    if (!Number.isFinite(endDate.getTime())) return true;
    endDate.setHours(23, 59, 59, 999);
    return Date.now() <= endDate.getTime();
  })();

  const countdown = (() => {
    if (!isWeeklyDealActive || !weeklyDeal.endDate) return null;
    const endDate = new Date(weeklyDeal.endDate);
    if (!Number.isFinite(endDate.getTime())) return null;
    endDate.setHours(23, 59, 59, 999);
    const diffMs = Math.max(0, endDate.getTime() - nowTick);
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return { days, hours, minutes };
  })();

  const displayedNewArrivalsCount = isWeeklyDealActive
    ? homepageFeaturedSettings.newArrivalsLimit
    : Math.max(12, homepageFeaturedSettings.newArrivalsLimit);

  const displayedNewArrivals = latestProducts.slice(0, displayedNewArrivalsCount);

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <Navbar />
      
      {/* Hero Banner */}
      <section className="relative min-h-[430px] bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-60">
              {promoReady && promo.heroImage ? (
                <img
                  alt="Banner Promo Tumbas"
                  className="w-full h-full object-cover"
                  src={promo.heroImage}
                />
              ) : null}
            </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-40 flex flex-col items-start justify-center">
          <span className="inline-block px-3 py-1 bg-[#137fec]/20 text-[#137fec] border border-[#137fec]/30 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            {promoReady ? (promo.heroBadge || "Penawaran Terbatas") : "\u00A0"}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6 max-w-2xl">
            {!promoReady ? (
              <span className="invisible">Promo Pilihan Minggu Ini</span>
            ) : (
              (promo.heroTitle || "Promo Pilihan Minggu Ini").split(':').map((part, i) => (
                <span key={i}>{i > 0 ? ':' : ''}<br/>{i === 1 && <span className="text-[#137fec]">{part}</span>}{i === 0 && part}</span>
              ))
            )}
          </h1>
          <p className="text-lg text-slate-300 mb-10 max-w-lg">
            {promoReady ? (promo.heroSubtitle || "Lihat produk terbaru dan penawaran terkurasi langsung dari pengaturan admin.") : "\u00A0"}
          </p>
          <div className={`flex flex-wrap gap-4 transition-opacity ${promoReady ? 'opacity-100' : 'opacity-0'}`}>
            <Link href="/shop" className="px-8 py-4 bg-[#137fec] hover:bg-[#137fec]/90 text-white rounded-lg font-bold text-lg transition-all shadow-lg shadow-[#137fec]/20 flex items-center gap-2">
              Belanja Sekarang
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link href="/shop" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-bold text-lg backdrop-blur-sm transition-all">
              Lihat Katalog
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Kategori Pilihan</h2>
            <p className="text-slate-500 mt-2">Gabungan pilihan admin dan produk yang sedang ramai</p>
          </div>
          <Link className="text-[#137fec] font-semibold flex items-center gap-1 hover:underline" href="/shop">
            Lihat Semua Kategori <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-2">
          {featuredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group relative aspect-[4/5] w-[260px] flex-none cursor-pointer overflow-hidden rounded-xl bg-slate-100 sm:w-[280px]">
              <img 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src={getProductImage(product)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-xs uppercase tracking-wide text-white/80 mb-2">{product.category || 'Pilihan'}</p>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-900 transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined">chevron_right</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
        {!loading && featuredProducts.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">Belum ada produk pilihan untuk ditampilkan.</p>
        )}
      </section>

      {/* Weekly Deals & Countdown */}
      {isWeeklyDealActive && (
      <section className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900">{weeklyDealReady ? (weeklyDeal.title || "Penawaran Mingguan") : "Memuat..."}</h2>
              <p className="text-slate-500 mt-2">{weeklyDealReady ? (weeklyDeal.subtitle || "Promo spesial terbatas waktu") : "Memuat penawaran mingguan..."}</p>
              <Link href="/discounts" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#137fec] hover:underline">
                Lihat semua produk promo
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>
            </div>
            {countdown ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Berakhir Dalam:</span>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-xl font-bold text-[#137fec]">{String(countdown.days).padStart(2, '0')}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Hari</span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-xl font-bold text-[#137fec]">{String(countdown.hours).padStart(2, '0')}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Jam</span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <span className="text-xl font-bold text-[#137fec]">{String(countdown.minutes).padStart(2, '0')}</span>
                    <span className="text-[10px] text-slate-400 uppercase">Menit</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#4c739a]">
                Promo sedang aktif tanpa batas waktu khusus.
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* New Arrivals Product Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900">Produk Baru</h2>
          <div className="h-1 w-20 bg-[#137fec] mx-auto my-4 rounded-full"></div>
          <p className="text-slate-500">Styles terbaru dan inovasi terkini baru saja tiba.</p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-[#4c739a]">Memuat produk...</p>
          </div>
        ) : displayedNewArrivals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#4c739a]">Belum ada produk</p>
            <Link href="/shop" className="text-[#137fec] hover:underline mt-2 inline-block">Lihat semua produk</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayedNewArrivals.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`} className="group block">
                <div className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden mb-4">
                  <span className="absolute top-3 left-3 z-10 bg-[#137fec] text-white text-[10px] font-black px-2 py-1 rounded uppercase">Baru</span>
                    <button
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
                      className="absolute top-3 right-3 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300"
                    >
                    <span className="material-symbols-outlined text-xl">favorite</span>
                  </button>
                  <img 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    src={getProductImage(product)}
                  />
                  <div className="absolute inset-x-4 bottom-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <button
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
                        router.push("/cart");
                      }}
                      className="w-full py-2 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      Tambah ke Keranjang
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-tighter">{product.category || 'Produk'}</p>
                  <h3 className="font-bold text-slate-900 group-hover:text-[#137fec] transition-colors">{product.title}</h3>
                  {(() => {
                    const discount = resolveProductDiscount({
                      productId: product.id,
                      unitPrice: product.price,
                      weeklyDeal,
                      campaigns: discountCampaigns,
                    });
                    if (!discount.hasDiscount) {
                      return <p className="text-[#137fec] font-bold">{formatPrice(product.price)}</p>;
                    }
                    return (
                      <div>
                        <p className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</p>
                        <p className="text-[#137fec] font-bold">{formatPrice(discount.finalPrice)}</p>
                      </div>
                    );
                  })()}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/shop" className="px-8 py-3 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-[#137fec] hover:text-white transition-all">
            Lihat Semua Produk
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-[#137fec] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="material-symbols-outlined text-5xl mb-6">mail</span>
            <h2 className="text-3xl font-black mb-4">Bergabung dengan komunitas kami dan dapat 10% off</h2>
            <p className="text-white/80 mb-10 text-lg">Berlangganan newsletter kami dan jadi yang pertama tahu tentang produk baru, sale, dan promo eksklusif.</p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                className="flex-grow px-6 py-4 rounded-lg bg-white/10 border border-white/20 placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 text-white backdrop-blur-sm" 
                placeholder="Masukkan alamat email" 
                type="email"
              />
              <button className="px-8 py-4 bg-white text-[#137fec] font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-xl">
                Berlangganan
              </button>
            </form>
            <p className="text-xs text-white/50 mt-6 italic">Dengan berlangganan, Anda setuju dengan Kebijakan Privasi kami.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-[#137fec] p-1 rounded-lg text-white">
                  <span className="material-symbols-outlined text-xl block">shopping_bag</span>
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900">Tumbas</span>
              </div>
              <p className="text-slate-500 mb-8 max-w-sm">
                Meningkatkan pengalaman digital dan gaya hidup Anda sejak 2018. Produk berkualitas, layanan luar biasa, dan pengiriman global.
              </p>
              <div className="flex gap-4">
                <a className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-[#137fec] hover:text-white transition-all" href="#">
                  <span className="material-symbols-outlined">public</span>
                </a>
                <a className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-[#137fec] hover:text-white transition-all" href="#">
                  <span className="material-symbols-outlined">alternate_email</span>
                </a>
                <a className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-[#137fec] hover:text-white transition-all" href="#">
                  <span className="material-symbols-outlined">rss_feed</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Belanja</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link className="hover:text-[#137fec] transition-colors" href="/shop">Produk Baru</Link></li>
                <li><Link className="hover:text-[#137fec] transition-colors" href="/shop">Terlaris</Link></li>
                <li><Link className="hover:text-[#137fec] transition-colors" href="/shop">Sale</Link></li>
                <li><Link className="hover:text-[#137fec] transition-colors" href="/shop">Koleksi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Bantuan</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link className="hover:text-[#137fec] transition-colors" href="#">Lacak Pesanan</Link></li>
                <li><Link className="hover:text-[#137fec] transition-colors" href="#">Kebijakan Pengiriman</Link></li>
                <li><Link className="hover:text-[#137fec] transition-colors" href="#">Retur & Refund</Link></li>
                <li><Link className="hover:text-[#137fec] transition-colors" href="/faq">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Hubungi Kami</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#137fec] text-sm mt-1">location_on</span>
                  <span>Jakarta, Indonesia</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#137fec] text-sm mt-1">call</span>
                  <span>+62 812 3456 7890</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-slate-500">&copy; 2026 Tumbas. Seluruh hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
