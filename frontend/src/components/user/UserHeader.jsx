import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, UserCircle, LogOut, Clock, SpellCheck, ShieldCheck, Menu, X } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function UserHeader({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authApi.getCurrentUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    authApi.logout();
    navigate('/');
  };

  const isHistoryPage = location.pathname === '/dashboard/history';
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  const handleNav = (tab) => {
    setActiveTab(tab);
    if (!isDashboard) {
      navigate('/dashboard');
    }
    setIsMobileMenuOpen(false);
  };

  const handleHistoryNav = () => {
    if (!isHistoryPage) {
      navigate('/dashboard/history');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-600 p-2 rounded-lg shadow-sm">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">
              Word<span className="text-teal-600">Lens</span>
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <button 
              onClick={() => handleNav('ejaan')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(!isHistoryPage && activeTab === 'ejaan') ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <SpellCheck className="w-4 h-4" />
              <span>Ejaan</span>
            </button>
            <button 
              onClick={() => handleNav('plagiarisme')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(!isHistoryPage && activeTab === 'plagiarisme') ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Plagiarisme</span>
            </button>
            <button
              onClick={handleHistoryNav}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isHistoryPage ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Clock className="w-4 h-4" />
              <span>Riwayat</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4 border-l border-slate-200 pl-4 ml-2">
            <div className="flex items-center space-x-2">
              <UserCircle className="w-8 h-8 text-slate-400" />
              <div className="text-sm">
                <p className="font-medium text-slate-700 leading-tight">{user?.username || 'User'}</p>
                <p className="text-[11px] text-slate-500">{user?.email || ''}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <button 
              onClick={() => handleNav('ejaan')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${(!isHistoryPage && activeTab === 'ejaan') ? 'bg-teal-50 text-teal-700' : 'text-slate-600 active:bg-slate-50'}`}
            >
              <SpellCheck className="w-5 h-5" />
              <span>Pengecekan Ejaan</span>
            </button>
            <button 
              onClick={() => handleNav('plagiarisme')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${(!isHistoryPage && activeTab === 'plagiarisme') ? 'bg-teal-50 text-teal-700' : 'text-slate-600 active:bg-slate-50'}`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Cek Plagiarisme</span>
            </button>
            <button
              onClick={handleHistoryNav}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isHistoryPage ? 'bg-teal-50 text-teal-700' : 'text-slate-600 active:bg-slate-50'}`}
            >
              <Clock className="w-5 h-5" />
              <span>Riwayat Pengecekan</span>
            </button>
            
            <div className="border-t border-slate-100 my-2 pt-2"></div>
            
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCircle className="w-8 h-8 text-slate-400" />
                <div className="text-sm">
                  <p className="font-medium text-slate-700 leading-tight">{user?.username || 'User'}</p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{user?.email || ''}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center" 
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
