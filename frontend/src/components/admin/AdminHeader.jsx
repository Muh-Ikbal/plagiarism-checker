import { Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function AdminHeader() {
  const location = useLocation();
  
  const getPageTitle = (path) => {
    if (path === '/admin') return 'Dasbor';
    if (path.startsWith('/admin/journals')) return 'Manajemen Jurnal Referensi';
    if (path.startsWith('/admin/dictionary')) return 'Manajemen Kamus';
    if (path.startsWith('/admin/history')) return 'Riwayat Pengecekan';
    if (path.startsWith('/admin/settings')) return 'Konfigurasi';
    return '';
  };

  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0 z-0">
      <h2 className="text-lg font-bold text-slate-800 capitalize">
        {getPageTitle(location.pathname)}
      </h2>
      <div className="flex items-center space-x-4">
        <button className="text-slate-400 hover:text-teal-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute 1 top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
