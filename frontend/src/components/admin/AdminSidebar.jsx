import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  BookOpen, 
  Clock, 
  Settings, 
  Search, 
  UserCircle,
  LogOut,
  Users
} from 'lucide-react';
import { authApi } from '../../lib/api';

export default function AdminSidebar() {
  const navigate = useNavigate();
  const user = authApi.getCurrentUser() || { username: 'Administrator', email: 'admin@sistem.id' };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/journals', label: 'Jurnal Referensi', icon: Library },
    { path: '/admin/dictionary', label: 'Kamus Ejaan', icon: BookOpen },
    { path: '/admin/users', label: 'Manajemen Pengguna', icon: Users },
    { path: '/admin/history', label: 'Riwayat Pengecekan', icon: Clock },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 shrink-0">
      <div className="p-5 flex items-center space-x-3 border-b border-slate-800/60 shrink-0">
        <div className="bg-teal-500 p-1.5 rounded-lg">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className='text-sm font-bold text-white tracking-wide uppercase'>
            Admin Panel
          </h1>
          <p className='text-[10px] text-teal-400 uppercase tracking-wider'>
            Plagiarism & SpellCheck
          </p>
        </div>
      </div>

      <nav className='flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar'>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`
            }
          >
            <item.icon className='w-4 h-4' />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className='pt-6 pb-2'>
          <p className='px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest'>
            Sistem
          </p>
        </div>
        <NavLink
          to='/admin/settings'
          className={({ isActive }) =>
            `w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`
          }
        >
          <Settings className='w-4 h-4' />
          <span>Konfigurasi</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-800/60 bg-slate-900/50">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center space-x-3">
            <UserCircle className="w-8 h-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-white leading-tight">{user.username}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
