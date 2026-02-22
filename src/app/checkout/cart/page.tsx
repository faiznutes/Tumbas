"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Navbar from "@/components/layout/Navbar";
import { api, ShippingCity, ShippingRateService } from "@/lib/api";
import { clearCart, getCartItems, CartItem } from "@/lib/cart";
import { savePublicOrderRef } from "@/lib/order-tracking";
import { useToast } from "@/components/ui/Toast";
import { calculateCheckoutPricing, WeeklyDealPricing } from "@/lib/pricing";

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

export default function CartCheckoutPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    customerPostalCode: "",
    notes: "",
  });
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
  const [selectedCityLabel, setSelectedCityLabel] = useState("");
  const [cityOptions, setCityOptions] = useState<ShippingCity[]>([]);
  const citySearchRequestIdRef = useRef(0);
  const [shippingServices, setShippingServices] = useState<ShippingRateService[]>([]);
  const [selectedShippingService, setSelectedShippingService] = useState("");
  const [loadingRates, setLoadingRates] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [runtimePaymentClientKey, setRuntimePaymentClientKey] = useState("");
  const [taxRate, setTaxRate] = useState(11);
  const [weeklyDeal, setWeeklyDeal] = useState<WeeklyDealPricing | null>(null);

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const effectiveClientKey = midtransClientKey || runtimePaymentClientKey;
  const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || "https://app.sandbox.midtrans.com/snap/snap.js";

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
    if (!isReady || !window.snap || !effectiveClientKey) {
      addToast("Popup pembayaran belum siap. Pastikan pop-up diizinkan lalu klik Bayar Sekarang lagi.", "warning");
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: () => router.push(successUrl),
      onPending: () => router.push(pendingUrl),
      onError: () => router.push(`/payment/failed?orderId=${orderId}`),
      onClose: () => router.push(pendingUrl),
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

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const estimatedWeight = useMemo(() => {
    const weightByItem = Math.max(1, shippingConfig.defaultWeightGram);
    return Math.max(1, items.reduce((sum, item) => sum + item.quantity * weightByItem, 0));
  }, [items, shippingConfig.defaultWeightGram]);

  const cityLower = formData.customerCity.trim().toLowerCase();
  const jawaKeywords = ["jakarta", "bandung", "bogor", "depok", "bekasi", "semarang", "yogyakarta", "solo", "surabaya", "malang", "kediri", "cirebon", "tegal"];
  const isJawa = jawaKeywords.some((key) => cityLower.includes(key));
  const shippingRegion = isJawa ? "Jawa" : "Luar Jawa";
  const selectedService = shippingServices.find((service) => service.service === selectedShippingService);
  const dynamicShipping = selectedService?.cost ?? 0;
  const fallbackShipping = isJawa ? shippingConfig.estimateJawa : shippingConfig.estimateLuarJawa;
  const shipping = subtotal >= shippingConfig.minFreeShipping ? 0 : (selectedService ? dynamicShipping : fallbackShipping);
  const pricing = useMemo(() => calculateCheckoutPricing({
    lines: items.map((item) => ({ productId: item.productId, unitPrice: item.price, quantity: item.quantity })),
    shipping,
    taxRate,
    weeklyDeal,
  }), [items, shipping, taxRate, weeklyDeal]);

  useEffect(() => {
    setItems(getCartItems());
    setLoading(false);
  }, []);

  useEffect(() => {
    async function fetchShipping() {
      try {
        const data = await api.settings.getShippingPublic();
        setShippingConfig(data);
        if (data.providers.length > 0) {
          setShippingProvider(data.providers[0]);
        }
      } catch {
        // fallback defaults
      }
    }
    fetchShipping();
  }, []);

  useEffect(() => {
    async function fetchPricingConfig() {
      try {
        const [store, weekly] = await Promise.all([
          api.settings.getStorePublic(),
          api.settings.getWeeklyDealPublic(),
        ]);
        setTaxRate(Number(store.taxRate || 0));
        setWeeklyDeal(weekly);
      } catch {
        // fallback defaults
      }
    }
    fetchPricingConfig();
  }, []);

  useEffect(() => {
    async function fetchPaymentSettings() {
      try {
        const payment = await api.settings.getPaymentPublic();
        if (payment.midtransEnabled && payment.midtransClientKey) {
          setRuntimePaymentClientKey(payment.midtransClientKey);
        }
      } catch {
        // ignore and rely on env fallback
      }
    }
    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    const query = formData.customerCity.trim();
    const requestId = ++citySearchRequestIdRef.current;

    if (destinationCityId && selectedCityLabel && query.toLowerCase() === selectedCityLabel.toLowerCase()) {
      setCityOptions([]);
      return;
    }
    if (query.length < 3) {
      setCityOptions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const cities = await api.shipping.searchCities(query, 8);
        if (requestId !== citySearchRequestIdRef.current) {
          return;
        }
        setCityOptions(cities);
      } catch {
        if (requestId !== citySearchRequestIdRef.current) {
          return;
        }
        setCityOptions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [destinationCityId, formData.customerCity, selectedCityLabel]);

  useEffect(() => {
    async function fetchRates() {
      if (!destinationCityId || !shippingProvider || items.length === 0) {
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
          weightGram: estimatedWeight,
          originCityId: String(shippingConfig.originCityId),
        });
        setShippingServices(rates.services);
        setSelectedShippingService(rates.services[0]?.service || "");
      } catch (error) {
        setShippingError(error instanceof Error ? error.message : "Gagal menghitung ongkir");
        setShippingServices([]);
        setSelectedShippingService("");
      } finally {
        setLoadingRates(false);
      }
    }
    fetchRates();
  }, [destinationCityId, estimatedWeight, items.length, shippingConfig.originCityId, shippingProvider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "customerCity") {
      setDestinationCityId("");
      setSelectedCityLabel("");
      setShippingServices([]);
      setSelectedShippingService("");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast("Keranjang kosong", "warning");
      return;
    }

    setSubmitting(true);
    try {
      if (!effectiveClientKey) {
        throw new Error("Konfigurasi pembayaran belum lengkap. Hubungi admin.");
      }
      const snapAvailable = snapReady || (await ensureSnapReady());
      if (!snapAvailable) {
        throw new Error("Popup pembayaran belum siap. Tunggu sebentar lalu klik Bayar Sekarang lagi.");
      }
      if (!destinationCityId) throw new Error("Pilih kelurahan dari daftar yang tersedia");
      if (!selectedService && shipping !== 0) throw new Error("Pilih layanan pengiriman terlebih dahulu");

      const order = await api.orders.create({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedVariantKey: item.variantKey,
          selectedVariantLabel: item.variantLabel,
        })),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        customerCity: formData.customerCity,
        customerPostalCode: formData.customerPostalCode,
        notes: formData.notes,
        shippingCost: shipping,
        shippingProvider: shippingProvider.toLowerCase(),
        shippingRegion,
        shippingService: selectedService?.service,
        shippingEtd: selectedService?.etd,
        shippingWeightGram: estimatedWeight,
        shippingDestinationCityId: destinationCityId,
      });

      clearCart();

      if (order.snapToken) {
        localStorage.setItem("pendingOrderId", order.id);
        if (order.publicToken) savePublicOrderRef(order.id, order.publicToken);
        const successUrl = order.publicToken
          ? `/success?orderId=${order.id}&token=${encodeURIComponent(order.publicToken)}`
          : `/success?orderId=${order.id}`;
        const pendingUrl = order.publicToken
          ? `/payment/pending?orderId=${order.id}&token=${encodeURIComponent(order.publicToken)}`
          : `/payment/pending?orderId=${order.id}`;

        setSubmitting(false);
        await openSnapPayment(order.snapToken, order.id, successUrl, pendingUrl);
      } else {
        setSubmitting(false);
        const successUrl = order.publicToken
          ? `/success?orderId=${order.id}&token=${encodeURIComponent(order.publicToken)}`
          : `/success?orderId=${order.id}`;
        router.push(successUrl);
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Gagal membuat pesanan", "error");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center"><p>Memuat checkout...</p></div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-[#0d141b]">Keranjang kosong</h1>
          <p className="mt-2 text-[#4c739a]">Silakan tambahkan produk terlebih dahulu.</p>
          <Link href="/shop" className="mt-6 inline-flex rounded-lg bg-[#137fec] px-6 py-3 font-semibold text-white">Ke Belanja</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {effectiveClientKey && (
        <Script
          src={snapUrl}
          data-client-key={effectiveClientKey}
          strategy="afterInteractive"
          onLoad={() => setSnapReady(Boolean(window.snap))}
        />
      )}
      <Navbar />
      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="rounded-xl border border-[#e7edf3] bg-white p-6">
            <h1 className="mb-4 text-xl font-bold text-[#0d141b]">Checkout Keranjang</h1>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input required name="customerName" value={formData.customerName} onChange={handleChange} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Nama lengkap" />
              <input required type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Email" />
              <input required name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="No. telepon" />
              <input required name="customerPostalCode" value={formData.customerPostalCode} onChange={handleChange} className="rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Kode pos" />
              <textarea required name="customerAddress" value={formData.customerAddress} onChange={handleChange} className="md:col-span-2 rounded-lg border border-[#e7edf3] px-4 py-3" rows={3} placeholder="Alamat lengkap" />
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#0d141b]">Kelurahan / Kecamatan</label>
                <input required name="customerCity" value={formData.customerCity} onChange={handleChange} className="w-full rounded-lg border border-[#e7edf3] px-4 py-3" placeholder="Ketik kelurahan (contoh: Jelambar)" />
                {cityOptions.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-[#e7edf3] bg-white">
                    {cityOptions.map((city) => (
                      <button
                        key={city.cityId}
                        type="button"
                        className="block w-full border-b border-[#f2f4f7] px-3 py-2 text-left text-sm hover:bg-[#f6f7f8]"
                        onClick={() => {
                          citySearchRequestIdRef.current += 1;
                          setDestinationCityId(city.cityId);
                          setSelectedCityLabel(city.label);
                          setFormData((prev) => ({ ...prev, customerCity: city.label, customerPostalCode: city.postalCode || prev.customerPostalCode }));
                          setCityOptions([]);
                        }}
                      >
                        {city.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select value={shippingProvider} onChange={(e) => setShippingProvider(e.target.value)} className="rounded-lg border border-[#e7edf3] px-4 py-3">
                {shippingConfig.providers.map((provider) => <option key={provider} value={provider}>{provider.toUpperCase()}</option>)}
              </select>
              <select value={selectedShippingService} onChange={(e) => setSelectedShippingService(e.target.value)} className="rounded-lg border border-[#e7edf3] px-4 py-3" disabled={loadingRates || shippingServices.length === 0}>
                {loadingRates && <option>Menghitung ongkir...</option>}
                {!loadingRates && shippingServices.length === 0 && <option>Belum ada layanan</option>}
                {shippingServices.map((service) => (
                  <option key={service.service} value={service.service}>{service.service} - {formatPrice(service.cost)} ({service.etd} hari)</option>
                ))}
              </select>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="md:col-span-2 rounded-lg border border-[#e7edf3] px-4 py-3" rows={2} placeholder="Catatan tambahan" />
            </div>
            {shippingError && <p className="mt-3 text-sm text-red-600">{shippingError}</p>}
            <button type="submit" disabled={submitting} className="mt-6 inline-flex rounded-lg bg-[#137fec] px-6 py-3 font-semibold text-white disabled:opacity-60">
              {submitting ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </form>
        </section>

        <aside className="rounded-xl border border-[#e7edf3] bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-[#0d141b]">Ringkasan</h2>
          <div className="space-y-3 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-2 border-b border-[#f2f4f7] pb-2">
                <div className="flex gap-2">
                  <div className="h-10 w-10 overflow-hidden rounded bg-slate-100">
                    <img
                      src={item.image || "https://via.placeholder.com/120?text=No+Image"}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = "https://via.placeholder.com/120?text=No+Image";
                      }}
                    />
                  </div>
                  <div>
                  <p className="font-medium text-[#0d141b]">{item.title}</p>
                  {item.variantLabel && <p className="text-xs text-[#4c739a]">{item.variantLabel}</p>}
                  <p className="text-xs text-[#4c739a]">{item.quantity} x {formatPrice(item.price)}</p>
                  </div>
                </div>
                <p className="font-semibold text-[#0d141b]">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            {pricing.discount > 0 && <div className="flex justify-between text-green-700"><span>Diskon Penawaran Mingguan</span><span>-{formatPrice(pricing.discount)}</span></div>}
            <div className="flex justify-between"><span>Ongkir</span><span>{formatPrice(shipping)}</span></div>
            <div className="flex justify-between"><span>Pajak ({pricing.taxRate}%)</span><span>{formatPrice(pricing.tax)}</span></div>
            <div className="flex justify-between"><span>Berat</span><span>{estimatedWeight} gr</span></div>
            <div className="mt-3 flex justify-between border-t border-[#e7edf3] pt-3 text-base font-bold"><span>Total</span><span>{formatPrice(pricing.total)}</span></div>
          </div>
        </aside>
      </main>
    </div>
  );
}
