"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { api, Product, ShippingCity, ShippingRateService } from "@/lib/api";
import { savePublicOrderRef } from "@/lib/order-tracking";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = params?.productId as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    customerName: "", customerEmail: "", customerPhone: "", customerAddress: "", customerCity: "", customerPostalCode: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [shippingConfig, setShippingConfig] = useState({
    minFreeShipping: 200000,
    estimateJawa: 15000,
    estimateLuarJawa: 30000,
    providers: ["jne", "jnt", "sicepat"],
    originCityId: 444,
    defaultWeightGram: 1000,
  });
  const [shippingProvider, setShippingProvider] = useState("jne");
  const [destinationCityId, setDestinationCityId] = useState("");
  const [cityOptions, setCityOptions] = useState<ShippingCity[]>([]);
  const [shippingServices, setShippingServices] = useState<ShippingRateService[]>([]);
  const [selectedShippingService, setSelectedShippingService] = useState("");
  const [loadingRates, setLoadingRates] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [snapReady, setSnapReady] = useState(false);
  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js";
  const selectedVariantKey = searchParams.get("variantKey") || "";
  const selectedVariantLabel = searchParams.get("variantLabel") || "";
  const variantList = Array.isArray(product?.variants) ? product.variants : [];
  const selectedVariant = variantList.find((item) => item.key === selectedVariantKey);
  const unitPrice = selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : (product?.price || 0);
  const effectiveWeight = selectedVariant?.weightGram || shippingConfig.defaultWeightGram;

  const openSnapPayment = async (
    snapToken: string,
    orderId: string,
    successUrl: string,
    pendingUrl: string,
  ) => {
    const waitUntilReady = async () => {
      if (window.snap) return true;
      for (let i = 0; i < 10; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        if (window.snap) return true;
      }
      return false;
    };

    const isReady = snapReady || (await waitUntilReady());
    if (!isReady || !window.snap || !midtransClientKey) {
      alert("Popup pembayaran belum siap. Pastikan pop-up diizinkan, lalu klik Bayar Sekarang lagi.");
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: () => {
        router.push(successUrl);
      },
      onPending: () => {
        router.push(pendingUrl);
      },
      onError: () => {
        router.push(`/payment/failed?orderId=${orderId}`);
      },
      onClose: () => {
        router.push(pendingUrl);
      },
    });
  };

  const ensureSnapReady = async () => {
    if (window.snap) return true;
    for (let i = 0; i < 12; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (window.snap) return true;
    }
    return false;
  };

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await api.products.getBySlug(productId);
        setProduct(data);
      } catch {
        setError("Produk tidak ditemukan");
      } finally {
        setLoading(false);
      }
    }
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  useEffect(() => {
    async function fetchShipping() {
      try {
        const data = await api.settings.getShipping();
        setShippingConfig(data);
        if (data.providers.length > 0) {
          setShippingProvider(data.providers[0]);
        }
      } catch {
        // use defaults
      }
    }
    fetchShipping();
  }, []);

  useEffect(() => {
    const query = formData.customerCity.trim();
    if (query.length < 3) {
      setCityOptions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const cities = await api.shipping.searchCities(query, 8);
        setCityOptions(cities);
      } catch {
        setCityOptions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [formData.customerCity]);

  useEffect(() => {
    async function fetchRates() {
      if (!destinationCityId || !shippingProvider || !product) {
        setShippingServices([]);
        setSelectedShippingService("");
        return;
      }

      setLoadingRates(true);
      setShippingError("");
      try {
        const rates = await api.shipping.getRates({
          destinationCityId,
          courier: shippingProvider.toLowerCase(),
          weightGram: effectiveWeight,
          originCityId: String(shippingConfig.originCityId),
        });
        setShippingServices(rates.services);
        setSelectedShippingService(rates.services[0]?.service || "");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal menghitung ongkir";
        setShippingError(message);
        setShippingServices([]);
        setSelectedShippingService("");
      } finally {
        setLoadingRates(false);
      }
    }

    fetchRates();
  }, [destinationCityId, effectiveWeight, product, shippingConfig.originCityId, shippingProvider]);

  const cityLower = formData.customerCity.trim().toLowerCase();
  const jawaKeywords = ["jakarta", "bandung", "bogor", "depok", "bekasi", "semarang", "yogyakarta", "solo", "surabaya", "malang", "kediri", "cirebon", "tegal"];
  const isJawa = jawaKeywords.some((key) => cityLower.includes(key));
  const shippingRegion = isJawa ? "Jawa" : "Luar Jawa";
  const selectedService = shippingServices.find((service) => service.service === selectedShippingService);
  const dynamicShipping = selectedService?.cost ?? 0;
  const fallbackShipping = isJawa ? shippingConfig.estimateJawa : shippingConfig.estimateLuarJawa;
  const shipping = unitPrice >= shippingConfig.minFreeShipping ? 0 : (selectedService ? dynamicShipping : fallbackShipping);
  const total = unitPrice + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    setSubmitting(true);
    try {
      if (!midtransClientKey) {
        throw new Error("Konfigurasi pembayaran belum lengkap. Hubungi admin.");
      }
      const snapAvailable = snapReady || (await ensureSnapReady());
      if (!snapAvailable) {
        throw new Error("Popup pembayaran belum siap. Tunggu sebentar lalu klik Bayar Sekarang lagi.");
      }
      if (!destinationCityId) {
        throw new Error("Pilih kelurahan dari daftar yang tersedia");
      }

      if (!selectedService && shipping !== 0) {
        throw new Error("Pilih layanan pengiriman terlebih dahulu");
      }

      if (selectedVariantKey && !selectedVariant) {
        throw new Error("Varian produk tidak valid, kembali pilih varian dari halaman produk");
      }

      const order = await api.orders.create({
        productId: product.id,
        ...formData,
        shippingCost: shipping,
        shippingProvider: shippingProvider.toLowerCase(),
        shippingRegion,
        shippingService: selectedService?.service,
        shippingEtd: selectedService?.etd,
        shippingWeightGram: effectiveWeight,
        shippingDestinationCityId: destinationCityId,
        selectedVariantKey: selectedVariantKey || undefined,
        selectedVariantLabel: selectedVariantLabel || undefined,
      });
      
      if (order.snapToken) {
        localStorage.setItem("pendingOrderId", order.id);
        if (order.publicToken) {
          savePublicOrderRef(order.id, order.publicToken);
        }
        const pendingUrl = order.publicToken
          ? `/payment/pending?orderId=${order.id}&token=${encodeURIComponent(order.publicToken)}`
          : `/payment/pending?orderId=${order.id}`;
        const successUrl = order.publicToken
          ? `/success?orderId=${order.id}&token=${encodeURIComponent(order.publicToken)}`
          : `/success?orderId=${order.id}`;

        setSubmitting(false);
        await openSnapPayment(order.snapToken, order.id, successUrl, pendingUrl);
      } else {
        setSubmitting(false);
        if (order.publicToken) {
          savePublicOrderRef(order.id, order.publicToken);
        }
        const successUrl = order.publicToken
          ? `/success?orderId=${order.id}&token=${encodeURIComponent(order.publicToken)}`
          : `/success?orderId=${order.id}`;
        router.push(successUrl);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal membuat pesanan";
      alert(message);
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "customerCity") {
      setDestinationCityId("");
      setShippingServices([]);
      setSelectedShippingService("");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <p className="text-[#4c739a]">Memuat...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex flex-col items-center justify-center">
        <p className="text-[#4c739a] mb-4">{error || "Produk tidak ditemukan"}</p>
        <Link href="/shop" className="text-[#137fec] hover:underline">Kembali ke Belanja</Link>
      </div>
    );
  }

  const productImage = product.images && product.images.length > 0 
    ? product.images[0].url 
    : "https://via.placeholder.com/400";

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      {midtransClientKey && (
        <Script
          src={snapUrl}
          data-client-key={midtransClientKey}
          strategy="afterInteractive"
          onLoad={() => setSnapReady(Boolean(window.snap))}
        />
      )}
      <nav className="sticky top-0 z-50 w-full border-b border-[#e7edf3] bg-white flex-shrink-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-[#137fec]"><span className="material-symbols-outlined text-3xl">shopping_bag</span></div>
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

      <main className="flex-1 py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-[#4c739a] mb-6">
            <Link href="/" className="hover:text-[#137fec]">Beranda</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#137fec]">Belanja</Link>
            <span>/</span>
            <Link href={`/product/${product.slug}`} className="hover:text-[#137fec]">{product.title}</Link>
            <span>/</span>
            <span className="text-[#0d141b]">Checkout</span>
          </div>

          <h1 className="text-2xl font-bold text-[#0d141b] mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl border border-[#e7edf3] p-6">
                  <h2 className="text-lg font-bold text-[#0d141b] mb-4">Data Pengiriman</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Kurir</label>
                      <select value={shippingProvider} onChange={(e) => setShippingProvider(e.target.value)} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]">
                        {shippingConfig.providers.map((provider) => (
                          <option key={provider} value={provider}>{provider.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Nama Lengkap</label>
                      <input required name="customerName" value={formData.customerName} onChange={handleChange} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]" placeholder="Nama lengkap Anda" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Email</label>
                      <input required type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]" placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">No. Telepon</label>
                      <input required type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]" placeholder="0812xxxxxxx" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Kelurahan / Kecamatan</label>
                      <input required name="customerCity" value={formData.customerCity} onChange={handleChange} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]" placeholder="Jelambar" />
                      {cityOptions.length > 0 && (
                        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#e7edf3] bg-white">
                          {cityOptions.map((city) => (
                            <button
                              key={city.cityId}
                              type="button"
                              onClick={() => {
                                setDestinationCityId(city.cityId);
                                setFormData((prev) => ({
                                  ...prev,
                                  customerCity: `${city.type} ${city.cityName}`,
                                  customerPostalCode: city.postalCode || prev.customerPostalCode,
                                }));
                                setCityOptions([]);
                              }}
                              className="block w-full border-b border-[#f2f4f7] px-3 py-2 text-left text-sm text-[#0d141b] hover:bg-[#f6f7f8]"
                            >
                              {city.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Kode Pos</label>
                      <input required name="customerPostalCode" value={formData.customerPostalCode} onChange={handleChange} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]" placeholder="12345" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Alamat Lengkap</label>
                      <textarea required name="customerAddress" value={formData.customerAddress} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]" placeholder="Jl. Example No. 123" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Layanan Pengiriman</label>
                      <select
                        value={selectedShippingService}
                        onChange={(e) => setSelectedShippingService(e.target.value)}
                        className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                        disabled={loadingRates || shippingServices.length === 0}
                      >
                        {loadingRates && <option value="">Menghitung ongkir...</option>}
                        {!loadingRates && shippingServices.length === 0 && <option value="">Belum ada layanan</option>}
                        {shippingServices.map((service) => (
                          <option key={service.service} value={service.service}>
                            {service.service} - {service.description} ({formatPrice(service.cost)}, ETD {service.etd} hari)
                          </option>
                        ))}
                      </select>
                      {shippingError && <p className="mt-2 text-xs text-red-600">{shippingError}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#0d141b] mb-2">Catatan (Opsional)</label>
                      <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]" placeholder="Catatan untuk pesanan" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <span className="animate-spin material-symbols-outlined">sync</span>
                      Memproses...
                    </>
                  ) : (
                    <>Bayar Sekarang ({formatPrice(total)})</>
                  )}
                </button>
              </form>
            </div>

            <div>
              <div className="bg-white rounded-xl border border-[#e7edf3] p-6 sticky top-24">
                <h2 className="text-lg font-bold text-[#0d141b] mb-4">Ringkasan Pesanan</h2>
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={productImage}
                      alt={product.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#0d141b] line-clamp-2">{product.title}</h3>
                    {selectedVariantLabel && <p className="text-xs text-[#4c739a]">Varian: {selectedVariantLabel}</p>}
                    <p className="text-sm text-[#4c739a]">{formatPrice(unitPrice)}</p>
                  </div>
                </div>
                <div className="border-t border-[#e7edf3] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4c739a]">Subtotal</span>
                    <span className="text-[#0d141b]">{formatPrice(unitPrice)}</span>
                  </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#4c739a]">Ongkir</span>
                      <span className="text-[#0d141b]">{formatPrice(shipping)}</span>
                    </div>
                    <p className="text-xs text-[#4c739a]">Estimasi wilayah: {shippingRegion} via {shippingProvider.toUpperCase()} {selectedService ? `(${selectedService.service}, ETD ${selectedService.etd} hari)` : ""}</p>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-[#e7edf3]">
                      <span className="text-[#0d141b]">Total</span>
                      <span className="text-[#137fec]">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
