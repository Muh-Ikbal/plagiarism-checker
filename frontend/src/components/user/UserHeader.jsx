import React from 'react';
import { Search, UserCircle, LogOut } from 'lucide-react';

export default function UserHeader({ activeTab, setActiveTab }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-600 p-2 rounded-lg shadow-sm">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight hidden sm:block">Akademik<span className="text-teal-600">Checker</span></span>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-4">
            <button 
              onClick={() => setActiveTab('ejaan')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ejaan' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Pengecekan Ejaan
            </button>
            <button 
              onClick={() => setActiveTab('plagiarisme')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'plagiarisme' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Cek Plagiarisme
            </button>
          </div>

          <div className="flex items-center space-x-4 border-l border-slate-200 pl-4 ml-2">
            <div className="hidden md:flex items-center space-x-2">
              <UserCircle className="w-8 h-8 text-slate-400" />
              <div className="text-sm">
                <p className="font-medium text-slate-700 leading-tight">M. Mahasiswa</p>
                <p className="text-[11px] text-slate-500">NIM: 12345678</p>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Keluar">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
