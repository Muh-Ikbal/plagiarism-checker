import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import UserHeader from './UserHeader';

/**
 * UserLayout — Layout wrapper untuk semua halaman user (dashboard, history, dll).
 * Menyediakan UserHeader dengan tab navigation yang konsisten.
 */
export default function UserLayout() {
  const [activeTab, setActiveTab] = useState('ejaan'); // 'ejaan' | 'plagiarisme'

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <UserHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Outlet renders the child route, passing activeTab via context */}
        <Outlet context={{ activeTab, setActiveTab }} />
      </main>

      {/* Basic Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
