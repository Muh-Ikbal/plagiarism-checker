import { Navigate } from 'react-router-dom';
import { authApi } from '@/lib/api';

/**
 * ProtectedRoute — Wrapper yang mengecek status login user.
 * 
 * Props:
 *  - children: Komponen yang akan di-render jika lolos pengecekan
 *  - requiredRole: (opsional) Role yang diperlukan ('admin' | 'user')
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const isLoggedIn = authApi.isLoggedIn();
  const user = authApi.getCurrentUser();

  // Jika belum login, redirect ke landing page
  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }

  // Jika butuh role tertentu dan role user tidak sesuai
  if (requiredRole && user.role !== requiredRole) {
    // Admin yang akses halaman user → redirect ke admin
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // User biasa yang akses halaman admin → redirect ke dashboard user
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
