"use client";

import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('sessionExpired') === '1') {
      addToast('Sesi login berakhir. Silakan login ulang.', 'warning');
      url.searchParams.delete('sessionExpired');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await api.auth.login(email, password);
      setAuthToken(response.accessToken);
      localStorage.setItem("user", JSON.stringify(response.user));
      const nextPath = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next') || '/admin/dashboard'
        : '/admin/dashboard';
      router.push(nextPath);
    } catch (err: any) {
      setError(err.message || "Email atau kata sandi salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7f8]">
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#137fec] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl">store</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0d141b]">Admin Tumbas</h1>
            <p className="text-[#4c739a]">Masuk ke dashboard admin</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e7edf3] p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0d141b] mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  placeholder="admin@tumbas.id"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#0d141b] mb-2">Kata Sandi</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#137fec] hover:bg-[#0f65bd] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined">sync</span>
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-[#137fec] hover:underline">
              ← Kembali ke Homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
