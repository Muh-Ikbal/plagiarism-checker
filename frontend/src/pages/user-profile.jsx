import React, { useState, useEffect } from 'react';
import { UserCircle, Mail, Key, ShieldCheck, Loader2, Save } from 'lucide-react';
import { authApi } from '../lib/api';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData((prev) => ({
        ...prev,
        username: currentUser.username,
        email: currentUser.email,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        username: formData.username,
        email: formData.email,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      const updatedUser = await authApi.updateProfile(updateData);
      setUser(updatedUser);
      setFormData((prev) => ({ ...prev, password: '' })); // Reset password field
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      
      // Auto dismiss success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Gagal memperbarui profil.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Profil</h1>
        <p className="text-slate-500 mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-400 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center">
                <UserCircle className="w-16 h-16 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800">{user.username}</h2>
            <div className="flex items-center text-slate-500 mt-1 space-x-4 text-sm">
              <span className="flex items-center"><Mail className="w-4 h-4 mr-1" /> {user.email}</span>
              <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-teal-600" /> Role: <span className="capitalize ml-1 font-medium">{user.role}</span></span>
            </div>
          </div>

          {message.text && (
            <div className={`p-4 rounded-lg mb-6 flex items-start text-sm ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  placeholder="Username Anda"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 block w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-md font-semibold text-slate-800 mb-4">Ubah Password</h3>
              <p className="text-sm text-slate-500 mb-4">Kosongkan jika Anda tidak ingin mengubah password.</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
