"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ContactMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { hasAdminPermission } from "@/lib/admin-permissions";
import Popup from "@/components/ui/Popup";

const statusLabels: Record<ContactMessage["status"], string> = {
  NEW: "Baru",
  IN_PROGRESS: "Diproses",
  RESOLVED: "Selesai",
  SPAM: "Spam",
};

const statusColors: Record<ContactMessage["status"], string> = {
  NEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-700",
  SPAM: "bg-red-100 text-red-700",
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContactMessage["status"]>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMessage, setActiveMessage] = useState<ContactMessage | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showBulkDeletePopup, setShowBulkDeletePopup] = useState(false);
  const [detailStatus, setDetailStatus] = useState<ContactMessage["status"]>("NEW");
  const [detailNotes, setDetailNotes] = useState("");
  const { addToast } = useToast();
  const canEditMessages = hasAdminPermission("messages.edit");

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.contactMessages.getAll({ limit: 200 });
      setMessages(response.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat pesan";
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!activeMessage) return;
    setDetailStatus(activeMessage.status);
    setDetailNotes(activeMessage.adminNotes || "");
  }, [activeMessage]);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesStatus = statusFilter === "all" || message.status === statusFilter;
      const keyword = searchQuery.toLowerCase();
      const matchesSearch =
        message.name.toLowerCase().includes(keyword) ||
        message.email.toLowerCase().includes(keyword) ||
        message.subject.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [messages, searchQuery, statusFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMessages.map((message) => message.id));
      return;
    }
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBulkStatus = async (status: ContactMessage["status"]) => {
    if (selectedIds.length === 0) return;

    try {
      const result = await api.contactMessages.bulkUpdate({ ids: selectedIds, status });
      addToast(`${result.updated} pesan diperbarui ke status ${statusLabels[status]}`, "success");
      setSelectedIds([]);
      fetchMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui pesan";
      addToast(message, "error");
    }
  };

  const handleSaveDetail = async () => {
    if (!activeMessage) return;

    try {
      const updated = await api.contactMessages.updateById(activeMessage.id, {
        status: detailStatus,
        adminNotes: detailNotes,
      });

      setMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setActiveMessage(updated);
      addToast("Pesan berhasil diperbarui", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui pesan";
      addToast(message, "error");
    }
  };

  const handleDeleteById = async (id: string) => {
    try {
      await api.contactMessages.deleteById(id);
      setMessages((prev) => prev.filter((message) => message.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      if (activeMessage?.id === id) {
        setActiveMessage(null);
      }
      addToast("Pesan berhasil dihapus", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus pesan";
      addToast(message, "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const result = await api.contactMessages.bulkDelete(selectedIds);
      setMessages((prev) => prev.filter((message) => !selectedIds.includes(message.id)));
      setSelectedIds([]);
      if (activeMessage && selectedIds.includes(activeMessage.id)) {
        setActiveMessage(null);
      }
      addToast(`${result.deleted} pesan berhasil dihapus`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus pesan terpilih";
      addToast(message, "error");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0d141b]">Pesan Masuk</h1>
        <p className="text-[#4c739a]">Kelola pesan dari halaman kontak pelanggan</p>
      </div>

      <div className="mb-6 rounded-xl border border-[#e7edf3] bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#4c739a]">search</span>
              <input
                type="text"
                placeholder="Cari nama, email, atau subjek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#e7edf3] py-2 pl-10 pr-4 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ContactMessage["status"])}
            className="rounded-lg border border-[#e7edf3] px-4 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
          >
            <option value="all">Semua Status</option>
            <option value="NEW">Baru</option>
            <option value="IN_PROGRESS">Diproses</option>
            <option value="RESOLVED">Selesai</option>
            <option value="SPAM">Spam</option>
          </select>
        </div>
      </div>

      {canEditMessages && selectedIds.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#137fec] p-4 text-white">
          <span>{selectedIds.length} pesan dipilih</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleBulkStatus("IN_PROGRESS")} className="rounded-lg bg-white/20 px-3 py-2 hover:bg-white/30">
              Tandai Diproses
            </button>
            <button onClick={() => handleBulkStatus("RESOLVED")} className="rounded-lg bg-white/20 px-3 py-2 hover:bg-white/30">
              Tandai Selesai
            </button>
            <button onClick={() => handleBulkStatus("SPAM")} className="rounded-lg bg-red-500 px-3 py-2 hover:bg-red-600">
              Tandai Spam
            </button>
            <button onClick={() => setShowBulkDeletePopup(true)} className="rounded-lg bg-red-700 px-3 py-2 hover:bg-red-800">
              Hapus
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#e7edf3] bg-white">
        {loading ? (
          <div className="p-8 text-center text-[#4c739a]">Memuat pesan...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-[#4c739a]">Belum ada pesan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredMessages.length > 0 && selectedIds.length === filteredMessages.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Pengirim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Subjek</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Kontak</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[#4c739a]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7edf3]">
                {filteredMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(message.id)}
                        onChange={() => handleToggleSelect(message.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0d141b]">{message.name}</p>
                      <p className="text-xs text-[#4c739a]">{message.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#0d141b]">{message.subject}</td>
                    <td className="px-6 py-4 text-xs text-[#4c739a]">
                      <p>{message.phone || "-"}</p>
                      <p>{message.whatsapp || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[message.status]}`}>
                        {statusLabels[message.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#4c739a]">{formatDate(message.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setActiveMessage(message)}
                        className="rounded-lg p-2 text-[#137fec] transition-colors hover:bg-blue-50"
                        title="Lihat detail"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      {canEditMessages && (
                        <button
                          onClick={() => setDeleteTargetId(message.id)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="Hapus pesan"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0d141b]">Detail Pesan</h2>
              <button onClick={() => setActiveMessage(null)} className="text-[#4c739a] hover:text-[#0d141b]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#4c739a]">Nama</p>
                  <p className="font-medium text-[#0d141b]">{activeMessage.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4c739a]">Email</p>
                  <p className="font-medium text-[#0d141b]">{activeMessage.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4c739a]">Telepon</p>
                  <p className="font-medium text-[#0d141b]">{activeMessage.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#4c739a]">WhatsApp</p>
                  <p className="font-medium text-[#0d141b]">{activeMessage.whatsapp || "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#4c739a]">Subjek</p>
                <p className="font-medium text-[#0d141b]">{activeMessage.subject}</p>
              </div>

              <div>
                <p className="text-xs text-[#4c739a]">Isi Pesan</p>
                <div className="mt-1 rounded-lg border border-[#e7edf3] bg-slate-50 p-3 whitespace-pre-wrap text-sm text-[#0d141b]">
                  {activeMessage.message}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0d141b]">Status</label>
                  <select
                    value={detailStatus}
                    onChange={(e) => setDetailStatus(e.target.value as ContactMessage["status"])}
                    disabled={!canEditMessages}
                    className="w-full rounded-lg border border-[#e7edf3] px-3 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  >
                    <option value="NEW">Baru</option>
                    <option value="IN_PROGRESS">Diproses</option>
                    <option value="RESOLVED">Selesai</option>
                    <option value="SPAM">Spam</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#0d141b]">Catatan Admin</label>
                  <textarea
                    rows={3}
                    value={detailNotes}
                    onChange={(e) => setDetailNotes(e.target.value)}
                    disabled={!canEditMessages}
                    className="w-full rounded-lg border border-[#e7edf3] px-3 py-2 text-[#0d141b] focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                    placeholder="Catatan proses pesan"
                  />
                </div>
              </div>

              {canEditMessages ? (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDeleteTargetId(activeMessage.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100"
                  >
                    Hapus Pesan
                  </button>
                  <button
                    onClick={handleSaveDetail}
                    className="rounded-lg bg-[#137fec] px-4 py-2 font-medium text-white hover:bg-[#0f65bd]"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#4c739a]">
                  Mode hanya lihat: Anda tidak memiliki izin untuk mengubah pesan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Popup
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Hapus Pesan"
        message="Yakin ingin menghapus pesan ini secara permanen?"
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await handleDeleteById(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />

      <Popup
        isOpen={showBulkDeletePopup}
        onClose={() => setShowBulkDeletePopup(false)}
        title="Hapus Pesan Terpilih"
        message={`Yakin ingin menghapus ${selectedIds.length} pesan terpilih secara permanen?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={async () => {
          await handleBulkDelete();
          setShowBulkDeletePopup(false);
        }}
      />
    </div>
  );
}
