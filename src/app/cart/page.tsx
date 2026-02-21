"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { CartItem, getCartItems, onCartUpdated, removeCartItem, updateCartQuantity } from "@/lib/cart";

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setCartItems(getCartItems());
    const unwatch = onCartUpdated(() => {
      setCartItems(getCartItems());
    });
    setLoading(false);
    return unwatch;
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 100000000 ? 0 : 15000;
  const total = subtotal + shipping;

  const updateQuantity = (id: string, delta: number) => {
    const target = cartItems.find((item) => item.id === id);
    if (!target) return;
    const nextQuantity = Math.max(1, target.quantity + delta);
    updateCartQuantity(id, nextQuantity);
    setCartItems(getCartItems());
  };

  const removeItem = (id: string) => {
    removeCartItem(id);
    setCartItems(getCartItems());
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      const first = cartItems[0];
      const params = new URLSearchParams();
      if (first.variantKey) params.set("variantKey", first.variantKey);
      if (first.variantLabel) params.set("variantLabel", first.variantLabel);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      router.push(`/checkout/${first.slug}${suffix}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#137fec]">sync</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="flex mb-8">
          <ol className="flex items-center space-x-2">
            <li><Link className="text-[#4c739a] hover:text-[#137fec]" href="/"><span className="material-symbols-outlined text-xl">home</span></Link></li>
            <li><span className="text-[#4c739a]">/</span></li>
            <li><span className="text-sm font-medium text-[#137fec]">Keranjang</span></li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-[#0d141b] mb-8">Keranjang Belanja</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-6xl text-[#4c739a] mb-4">shopping_cart</span>
            <h2 className="text-xl font-semibold text-[#0d141b] mb-2">Keranjang Anda kosong</h2>
            <p className="text-[#4c739a] mb-6">Sepertinya Anda belum menambahkan produk apapun.</p>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold rounded-lg transition-colors">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-[#e7edf3] p-4 flex gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.slug}`} className="font-semibold text-[#0d141b] hover:text-[#137fec] truncate block">
                      {item.title}
                    </Link>
                    <p className="text-sm text-[#4c739a] truncate">{item.description}</p>
                    {item.variantLabel && <p className="text-xs text-[#4c739a]">Varian: {item.variantLabel}</p>}
                    <p className="font-bold text-[#137fec] mt-2">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeItem(item.id)} className="text-[#4c739a] hover:text-red-500 p-1">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <div className="flex items-center gap-2 border border-[#e7edf3] rounded-lg">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-[#137fec]">-</button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-[#137fec]">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-[#e7edf3] p-6 sticky top-24">
                <h2 className="text-lg font-bold text-[#0d141b] mb-6">Ringkasan Pesanan</h2>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4c739a]">Subtotal ({cartItems.length} produk)</span>
                    <span className="font-medium text-[#0d141b]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4c739a]">Biaya Pengiriman</span>
                    <span className="font-medium text-[#0d141b]">{shipping === 0 ? "Gratis" : formatPrice(shipping)}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-green-600">Gratis pengiriman jika belanja lebih dari {formatPrice(100000000)}</p>
                  )}
                  <div className="border-t border-[#e7edf3] pt-4 flex justify-between">
                    <span className="font-bold text-[#0d141b]">Total</span>
                    <span className="font-bold text-[#137fec] text-lg">{formatPrice(total)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full mt-6 bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Checkout Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#e7edf3] py-8 mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-[#137fec]">
                <span className="material-symbols-outlined text-2xl">shopping_bag</span>
              </div>
              <span className="text-lg font-bold">Tumbas</span>
            </div>
            <p className="text-sm text-[#4c739a]">&copy; 2026 Tumbas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
