"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

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

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  STAFF: 'bg-gray-100 text-gray-700',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STAFF',
    permissions: [] as string[],
  });
  const { addToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  async function fetchUsers() {
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.users.update(editingUser.id, {
          name: formData.name || undefined,
          role: formData.role,
          permissions: formData.permissions,
        });
      } else {
        await api.users.create({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          role: formData.role,
          permissions: formData.permissions,
        });
      }

      addToast(editingUser ? 'Pengguna diperbarui' : 'Pengguna ditambahkan', 'success');
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      addToast('Gagal menyimpan pengguna', 'error');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name || '',
      role: user.role,
      permissions: JSON.parse(user.permissions || '[]'),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        await api.users.delete(id);
        addToast('Pengguna dihapus', 'success');
        fetchUsers();
      } catch (error) {
        addToast('Gagal menghapus pengguna', 'error');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.users.toggleActive(id);
      addToast('Status pengguna diperbarui', 'success');
      fetchUsers();
    } catch (error) {
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
          <p className="text-[#4c739a]">Kelola semua pengguna dan权限</p>
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
            <option value="STAFF">Staff</option>
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
                          onClick={() => handleDelete(user.id)}
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
                  <option value="STAFF">Staff</option>
                </select>
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
    </div>
  );
}
