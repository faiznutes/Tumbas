"use client";

import { useCallback, useEffect, useState } from "react";
import { api, WebhookMonitorResponse } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

function formatDate(date: string) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const statusStyles: Record<string, string> = {
  processed: "bg-green-100 text-green-700",
  processed_with_warning: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  invalid_signature: "bg-red-100 text-red-700",
  unknown: "bg-slate-100 text-slate-700",
};

export default function AdminWebhookMonitorPage() {
  const [minutes, setMinutes] = useState(60);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchOrderId, setSearchOrderId] = useState("");
  const [minAttempts, setMinAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WebhookMonitorResponse | null>(null);
  const { addToast } = useToast();

  const filteredIssues = (data?.recentFailures || []).filter((item) => {
    const statusMatch = statusFilter === "all" || item.status === statusFilter;
    const orderIdMatch = !searchOrderId || (item.orderId || "").toLowerCase().includes(searchOrderId.toLowerCase());
    const attemptsMatch = item.attempts >= minAttempts;
    return statusMatch && orderIdMatch && attemptsMatch;
  });

  const healthState = (() => {
    if (!data) return { level: "unknown", text: "Menunggu data monitor webhook...", className: "border-slate-200 bg-slate-50 text-slate-700" };
    if ((data.summary.failed || 0) > 0) {
      return {
        level: "critical",
        text: "Ada webhook gagal diproses. Tindak lanjut sekarang: cek error detail dan retry incident flow di runbook.",
        className: "border-red-200 bg-red-50 text-red-700",
      };
    }
    if ((data.summary.invalidSignature || 0) > 0) {
      return {
        level: "warning",
        text: "Terdeteksi invalid signature. Periksa konfigurasi Midtrans callback URL/key segera.",
        className: "border-amber-200 bg-amber-50 text-amber-800",
      };
    }
    if ((data.summary.warning || 0) > 0) {
      return {
        level: "warning",
        text: "Ada warning webhook. Pantau order terkait dan pastikan sinkronisasi status pembayaran berjalan normal.",
        className: "border-yellow-200 bg-yellow-50 text-yellow-800",
      };
    }

    return {
      level: "healthy",
      text: "Webhook Midtrans sehat pada rentang waktu yang dipilih.",
      className: "border-green-200 bg-green-50 text-green-700",
    };
  })();

  const exportCsv = () => {
    if (!data) {
      addToast("Data monitor belum tersedia", "warning");
      return;
    }

    const lines: string[] = [];
    lines.push("Metric,Value");
    lines.push(`Range Minutes,${data.rangeMinutes}`);
    lines.push(`Since,${data.since}`);
    lines.push(`Total Received,${data.summary.totalReceived}`);
    lines.push(`Processed,${data.summary.processed}`);
    lines.push(`Warning,${data.summary.warning}`);
    lines.push(`Gagal,${data.summary.failed}`);
    lines.push(`Invalid Signature,${data.summary.invalidSignature}`);
    lines.push("");
    lines.push("Recent Issues");
    lines.push("Created At,Order ID,Status,Attempts,Error");

    filteredIssues.forEach((item) => {
      const createdAt = formatDate(item.createdAt).replace(/,/g, " ");
      const orderId = (item.orderId || "-").replace(/,/g, " ");
      const status = item.status.replace(/,/g, " ");
      const attempts = String(item.attempts);
      const error = (item.error || "-").replace(/,/g, " ");
      lines.push(`${createdAt},${orderId},${status},${attempts},${error}`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `midtrans-webhook-monitor-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast("Export CSV berhasil", "success");
  };

  const loadData = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const response = await api.webhooks.getMidtransMonitor(minutes);
      setData(response);
      if (showToast) {
        addToast("Data webhook diperbarui", "success");
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Gagal memuat monitor webhook", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, minutes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Monitor Webhook</h1>
          <p className="text-[#4c739a]">Monitoring kesehatan webhook Midtrans secara real-time.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#0d141b]"
          >
            <option value={15}>15 menit</option>
            <option value={30}>30 menit</option>
            <option value={60}>60 menit</option>
            <option value={180}>3 jam</option>
            <option value={720}>12 jam</option>
          </select>
          <button
            onClick={() => loadData(true)}
            className="rounded-lg bg-[#137fec] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f65bd]"
          >
            Muat Ulang
          </button>
          <button
            onClick={exportCsv}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0d141b] hover:bg-slate-50"
          >
            Ekspor CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#4c739a]">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
          >
            <option value="all">Semua</option>
            <option value="failed">failed</option>
            <option value="processed_with_warning">processed_with_warning</option>
            <option value="invalid_signature">invalid_signature</option>
            <option value="unknown">unknown</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#4c739a]">Cari Order ID</label>
          <input
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            placeholder="contoh: TMB-"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#4c739a]">Minimum Percobaan</label>
          <input
            type="number"
            min={0}
            value={minAttempts}
            onChange={(e) => setMinAttempts(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#0d141b]"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setStatusFilter("all");
              setSearchOrderId("");
              setMinAttempts(0);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0d141b] hover:bg-slate-50"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-[#4c739a]">Memuat data webhook...</div>
      ) : (
        <>
          <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${healthState.className}`}>
            {healthState.text}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-[#4c739a]">Total Diterima</p>
              <p className="text-2xl font-bold text-[#0d141b]">{data?.summary.totalReceived ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-[#4c739a]">Diproses</p>
              <p className="text-2xl font-bold text-green-700">{data?.summary.processed ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-[#4c739a]">Peringatan</p>
              <p className="text-2xl font-bold text-yellow-700">{data?.summary.warning ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-[#4c739a]">Gagal</p>
              <p className="text-2xl font-bold text-red-700">{data?.summary.failed ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-[#4c739a]">Signature Tidak Valid</p>
              <p className="text-2xl font-bold text-red-700">{data?.summary.invalidSignature ?? 0}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-[#0d141b]">Isu Terbaru</h2>
              <p className="text-sm text-[#4c739a]">
                Menampilkan status warning/failure dalam {data?.rangeMinutes ?? minutes} menit terakhir.
              </p>
            </div>

            {!filteredIssues.length ? (
              <div className="px-6 py-8 text-sm text-[#4c739a]">Tidak ada issue pada rentang waktu ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-[#4c739a]">
                    <tr>
                      <th className="px-6 py-3">Waktu</th>
                      <th className="px-6 py-3">Order ID</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Percobaan</th>
                      <th className="px-6 py-3">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredIssues.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-3 text-[#0d141b]">{formatDate(item.createdAt)}</td>
                        <td className="px-6 py-3 text-[#0d141b]">{item.orderId || "-"}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status] || statusStyles.unknown}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[#0d141b]">{item.attempts}</td>
                        <td className="px-6 py-3 text-[#4c739a]">{item.error || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
