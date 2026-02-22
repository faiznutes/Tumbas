"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Popup from "@/components/ui/Popup";
import { api } from "@/lib/api";
import { getCurrentAdminUser } from "@/lib/admin-permissions";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    products: number;
    orders: number;
  };
}

const permissionGroups = [
  {
    key: "orders",
    label: "Pesanan",
    permissions: [
      { key: "orders.view", label: "Lihat pesanan" },
      { key: "orders.edit", label: "Ubah/konfirmasi pesanan" },
    ],
  },
  {
    key: "products",
    label: "Produk",
    permissions: [
      { key: "products.edit", label: "Kelola produk" },
      { key: "products.categories.view", label: "Lihat halaman kategori" },
      { key: "products.categories.edit", label: "Kelola kategori" },
    ],
  },
  {
    key: "messages",
    label: "Pesan",
    permissions: [
      { key: "messages.view", label: "Lihat pesan" },
      { key: "messages.edit", label: "Balas/update/hapus pesan" },
    ],
  },
  {
    key: "settings",
    label: "Pengaturan",
    permissions: [
      { key: "settings.view", label: "Lihat semua pengaturan" },
      { key: "settings.edit", label: "Ubah semua pengaturan" },
      { key: "settings.general.view", label: "Lihat pengaturan umum" },
      { key: "settings.general.edit", label: "Ubah pengaturan umum" },
      { key: "settings.store.view", label: "Lihat pengaturan toko" },
      { key: "settings.store.edit", label: "Ubah pengaturan toko" },
      { key: "settings.notifications.view", label: "Lihat pengaturan notifikasi" },
      { key: "settings.notifications.edit", label: "Ubah pengaturan notifikasi" },
      { key: "settings.promo.view", label: "Lihat pengaturan promo" },
      { key: "settings.promo.edit", label: "Ubah pengaturan promo" },
      { key: "settings.weekly.view", label: "Lihat penawaran mingguan" },
      { key: "settings.weekly.edit", label: "Ubah penawaran mingguan" },
      { key: "settings.featured.view", label: "Lihat kategori pilihan" },
      { key: "settings.featured.edit", label: "Ubah kategori pilihan" },
      { key: "settings.payment.view", label: "Lihat pengaturan pembayaran" },
      { key: "settings.payment.edit", label: "Ubah pengaturan pembayaran" },
      { key: "settings.shipping.view", label: "Lihat pengaturan pengiriman" },
      { key: "settings.shipping.edit", label: "Ubah pengaturan pengiriman" },
      { key: "settings.notice.view", label: "Lihat admin notice" },
    ],
  },
] as const;

const defaultEditorPermissions = [
  "orders.view",
  "orders.edit",
  "products.edit",
  "products.categories.view",
  "products.categories.edit",
  "messages.view",
  "messages.edit",
  "settings.view",
  "settings.edit",
  "settings.general.view",
  "settings.general.edit",
  "settings.store.view",
  "settings.store.edit",
  "settings.notifications.view",
  "settings.notifications.edit",
  "settings.promo.view",
  "settings.promo.edit",
  "settings.weekly.view",
  "settings.weekly.edit",
  "settings.featured.view",
  "settings.featured.edit",
  "settings.payment.view",
  "settings.payment.edit",
  "settings.shipping.view",
  "settings.shipping.edit",
  "settings.notice.view",
];

const defaultViewerPermissions = [
  "orders.view",
  "messages.view",
  "settings.general.view",
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staf',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-gray-100 text-gray-700',
};

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STAFF',
    permissions: [] as string[],
  });
  const { addToast } = useToast();

  useEffect(() => {
    const user = getCurrentAdminUser();
    if (user.role !== "SUPER_ADMIN") {
      addToast("Anda tidak memiliki akses ke halaman pengguna", "warning");
      router.replace("/admin/dashboard");
    }
  }, [addToast, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: { limit: number; search?: string; role?: string } = { limit: 100 };
      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;

      const data = await api.users.getAll(params);
      setUsers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password.length < 6) {
      addToast('Password minimal 6 karakter', 'warning');
      return;
    }

    try {
      if (editingUser) {
        await api.users.update(editingUser.id, {
          name: formData.name || undefined,
          role: formData.role,
          permissions: formData.permissions,
        });

        if (formData.password) {
          await api.users.updatePassword(editingUser.id, formData.password);
          addToast('Profil pengguna diperbarui dan password berhasil diganti', 'success');
        } else {
          addToast('Profil pengguna diperbarui', 'success');
        }
      } else {
        await api.users.create({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          role: formData.role,
          permissions: formData.permissions,
        });
        addToast('Pengguna ditambahkan', 'success');
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch {
      addToast('Gagal menyimpan pengguna', 'error');
    }
  };

  const handleEdit = (user: User) => {
    let parsedPermissions: string[] = [];
    try {
      const raw = JSON.parse(user.permissions || "[]");
      parsedPermissions = Array.isArray(raw) ? raw : [];
    } catch {
      parsedPermissions = [];
    }

    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name || '',
      role: user.role,
      permissions: parsedPermissions,
    });
    setShowModal(true);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => {
      if (prev.permissions.includes(permission)) {
        return { ...prev, permissions: prev.permissions.filter((item) => item !== permission) };
      }
      return { ...prev, permissions: [...prev.permissions, permission] };
    });
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await api.users.delete(deletingUser.id);
      addToast('Pengguna dihapus', 'success');
      setDeletingUser(null);
      fetchUsers();
    } catch {
      addToast('Gagal menghapus pengguna', 'error');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.users.toggleActive(id);
      addToast('Status pengguna diperbarui', 'success');
      fetchUsers();
    } catch {
      addToast('Gagal memperbarui status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'STAFF',
      permissions: [],
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d141b]">Kelola Pengguna</h1>
          <p className="text-[#4c739a]">Kelola semua pengguna dan hak akses</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
          className="bg-[#137fec] hover:bg-[#0f65bd] text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e7edf3] p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#4c739a]">search</span>
              <input
                type="text"
                placeholder="Cari pengguna..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec] text-[#0d141b]"
          >
            <option value="all">Semua Peran</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staf</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#e7edf3]">
        {loading ? (
          <div className="p-8 text-center text-[#4c739a]">Memuat...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-[#4c739a]">Tidak ada pengguna</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Pengguna</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Peran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Pesanan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4c739a] uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7edf3]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#137fec] flex items-center justify-center font-bold text-white">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#0d141b]">{user.name || '-'}</p>
                          <p className="text-sm text-[#4c739a]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#0d141b]">{user._count.products}</td>
                    <td className="px-6 py-4 text-sm text-[#0d141b]">{user._count.orders}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-[#137fec] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-[#0d141b] mb-6">
              {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0d141b] mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                  required
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-[#0d141b] mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                    required={!editingUser}
                  />
                </div>
              )}
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-[#0d141b] mb-2">Password Baru (opsional)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                    placeholder="Kosongkan jika tidak ingin ganti password"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#0d141b] mb-2">Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0d141b] mb-2">Peran</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-[#e7edf3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#137fec]"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staf</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-[#0d141b]">Permission Modul</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, permissions: defaultViewerPermissions }))}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-[#0d141b] hover:bg-slate-50"
                    >
                      Preset Viewer
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, permissions: defaultEditorPermissions }))}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-[#0d141b] hover:bg-slate-50"
                    >
                      Preset Editor
                    </button>
                  </div>
                </div>

                <div className="max-h-52 space-y-3 overflow-y-auto rounded-lg border border-[#e7edf3] p-3">
                  {permissionGroups.map((group) => (
                    <div key={group.key}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4c739a]">{group.label}</p>
                      <div className="space-y-2">
                        {group.permissions.map((permission) => (
                          <label key={permission.key} className="flex items-center gap-2 text-sm text-[#0d141b]">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.key)}
                              onChange={() => togglePermission(permission.key)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            <span>{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#4c739a]">
                  Super Admin otomatis punya akses penuh. Pengguna lain mengikuti permission yang dipilih.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingUser(null); }}
                  className="flex-1 px-4 py-2 border border-[#e7edf3] rounded-lg text-[#0d141b] hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#137fec] text-white rounded-lg hover:bg-[#0f65bd]"
                >
                  {editingUser ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Popup
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Hapus Pengguna"
        message={`Yakin ingin menghapus pengguna ${deletingUser?.email || ''}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
