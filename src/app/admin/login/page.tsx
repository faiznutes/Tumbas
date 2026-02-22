"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { setCurrentAdminUser } from "@/lib/admin-permissions";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminNotice, setAdminNotice] = useState({ enabled: false, title: "", message: "" });
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("sessionExpired") === "1") {
      addToast("Sesi login berakhir. Silakan login ulang.", "warning");
      url.searchParams.delete("sessionExpired");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [addToast]);

  useEffect(() => {
    async function loadNotice() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/settings/admin-notice-public`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed");
        }

        const notice = await response.json();
        setAdminNotice({
          enabled: Boolean(notice?.enabled),
          title: String(notice?.title || ""),
          message: String(notice?.message || ""),
        });
      } catch {
        setAdminNotice({ enabled: false, title: "", message: "" });
      }
    }

    loadNotice();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await api.auth.login(email, password);
      setAuthToken(response.accessToken);
      setCurrentAdminUser(response.user);
      const nextPath =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next") || "/admin/dashboard"
          : "/admin/dashboard";
      router.push(nextPath);
    } catch (err: any) {
      setError(err.message || "Email atau kata sandi salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-100 via-slate-100 to-gray-200 px-4 py-8">
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/70 bg-white/55 px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sistem Berjalan Normal</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">ADMIN LOGIN</span>
          </div>

          <div className="p-8 sm:p-10">
            {adminNotice.enabled && adminNotice.message.trim() && (
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/90 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <span className="material-symbols-outlined text-base">info</span>
                  {adminNotice.title || "Info Admin"}
                </div>
                <p className="text-sm leading-relaxed text-blue-900">{adminNotice.message}</p>
              </div>
            )}

            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#137fec] to-[#0f65bd] text-white shadow-lg shadow-blue-500/30">
                <span className="material-symbols-outlined text-4xl">shield</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0d141b]">Akses Admin TUMBAS</h1>
              <p className="mt-1 text-sm text-[#4c739a]">Masuk untuk melanjutkan ke dashboard admin</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-[#0d141b] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  placeholder="admin@tumbas.id"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 pr-12 text-[#0d141b] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#137fec] to-[#0f65bd] py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:translate-y-[-1px] hover:from-[#0f65bd] hover:to-[#0d539d] disabled:opacity-50"
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

            <p className="mt-6 text-center text-xs text-slate-500">
              <span className="material-symbols-outlined mr-1 align-bottom text-[14px]">encrypted</span>
              Koneksi terenkripsi. Akses hanya untuk personel berwenang.
            </p>
          </div>

          <div className="border-t border-white/70 bg-slate-50/80 px-8 py-4 text-center">
            <Link href="/" className="text-sm font-medium text-[#137fec] hover:underline">
              ← Kembali ke Homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
