import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Search, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  User as UserIcon,
  X,
  Loader2
} from 'lucide-react';
import { userManagementApi } from '../../lib/api';
import Pagination from '../../components/admin/Pagination';

export default function AdminUsers() {
  const { triggerToast } = useOutletContext();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Modal states
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [processing, setProcessing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userManagementApi.getUsers(page, 10, search);
      setUsers(data.users);
      setTotalPages(data.total_pages);
      setTotalUsers(data.total);
    } catch (error) {
      triggerToast(error.message || 'Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active;
    try {
      setProcessing(true);
      await userManagementApi.updateUserStatus(user.id, newStatus);
      triggerToast(`Status pengguna berhasil diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}`);
      fetchUsers();
    } catch (error) {
      triggerToast(error.message || 'Gagal mengubah status pengguna');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    try {
      setProcessing(true);
      await userManagementApi.deleteUser(deleteModal.user.id);
      triggerToast('Pengguna berhasil dihapus');
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      triggerToast(error.message || 'Gagal menghapus pengguna');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.user) return;
    
    const formData = new FormData(e.target);
    const updateData = {
      username: formData.get('username'),
      email: formData.get('email'),
      role: formData.get('role'),
    };
    
    const password = formData.get('password');
    if (password) {
      updateData.password = password;
    }

    try {
      setProcessing(true);
      await userManagementApi.updateUser(editModal.user.id, updateData);
      triggerToast('Data pengguna berhasil diperbarui');
      setEditModal({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      triggerToast(error.message || 'Gagal memperbarui pengguna');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data dan hak akses pengguna sistem.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari username atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow text-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="py-4 px-6 font-semibold">User</th>
                <th className="py-4 px-6 font-semibold">Role</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">Tanggal Daftar</th>
                <th className="py-4 px-6 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                    Memuat data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <UserIcon className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    Tidak ada pengguna yang ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{user.username}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={processing}
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                          user.is_active 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                        title="Klik untuk mengubah status"
                      >
                        {user.is_active ? (
                          <><UserCheck className="w-3 h-3 mr-1" /> Aktif</>
                        ) : (
                          <><UserX className="w-3 h-3 mr-1" /> Nonaktif</>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-6 text-slate-500">
                      {user.created_at}
                    </td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <button 
                        onClick={() => setEditModal({ open: true, user })}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteModal({ open: true, user })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && users.length > 0 && (
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        )}
      </div>

      {/* Edit Modal */}
      {editModal.open && editModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-down">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Edit Pengguna</h3>
              <button 
                onClick={() => setEditModal({ open: false, user: null })}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  defaultValue={editModal.user.username}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={editModal.user.email}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  name="role" 
                  defaultValue={editModal.user.role}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru (Opsional)</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setEditModal({ open: false, user: null })}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center"
                >
                  {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-down">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Pengguna?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Anda yakin ingin menghapus pengguna <span className="font-semibold text-slate-700">{deleteModal.user.username}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={handleDelete}
                  disabled={processing}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus Pengguna'}
                </button>
                <button 
                  onClick={() => setDeleteModal({ open: false, user: null })}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
