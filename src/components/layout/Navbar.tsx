"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCartCount, onCartUpdated } from "@/lib/cart";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    return onCartUpdated(() => {
      setCartCount(getCartCount());
    });
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#e7edf3] bg-white/95 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-primary">
                <span className="material-symbols-outlined text-3xl">shopping_bag</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                Tumbas
              </h1>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-auto hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-[#4c739a]">
                  search
                </span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2.5 border border-[#e7edf3] rounded-lg leading-5 bg-[#f6f7f8] placeholder-[#4c739a] focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] sm:text-sm transition-all"
                placeholder="Search for products, brands and more..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Navigation Links & Icons */}
          <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#4c739a]">
              <Link
                className="hover:text-[#137fec] transition-colors"
                href="/"
              >
                Beranda
              </Link>
              <Link
                className="hover:text-[#137fec] transition-colors"
                href="/shop"
              >
                Belanja
              </Link>
              <Link
                className="hover:text-[#137fec] transition-colors"
                href="/about"
              >
                Tentang
              </Link>
              <Link
                className="hover:text-[#137fec] transition-colors"
                href="/contact"
              >
                Kontak
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-[#4c739a] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>

              <Link
                href="/cart"
                className="p-2 text-[#4c739a] hover:text-[#137fec] hover:bg-[#137fec]/10 rounded-full transition-colors relative"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#137fec] text-white text-[10px] font-bold rounded-full border-2 border-white">
                  {cartCount}
                </span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-[#4c739a]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden py-3 border-t border-[#e7edf3]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[#4c739a]">
                search
              </span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-[#e7edf3] rounded-lg bg-[#f6f7f8] text-sm placeholder-[#4c739a] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
              placeholder="Search..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

          {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#e7edf3]">
            <div className="flex flex-col gap-3 text-sm font-medium">
              <Link
                className="hover:text-[#137fec] transition-colors py-2"
                href="/"
              >
                Beranda
              </Link>
              <Link
                className="hover:text-[#137fec] transition-colors py-2"
                href="/shop"
              >
                Belanja
              </Link>
              <Link
                className="hover:text-[#137fec] transition-colors py-2"
                href="/about"
              >
                Tentang
              </Link>
              <Link
                className="hover:text-[#137fec] transition-colors py-2"
                href="/contact"
              >
                Kontak
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
