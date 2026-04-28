import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminToast from './AdminToast';

export default function AdminLayout() {
  const [toast, setToast] = useState({ show: false, message: '' });

  const triggerToast = useCallback((msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }, []);

  return (
    <div className="h-screen w-full bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader />

        <div className="flex-1 overflow-auto p-6 relative">
          {toast.show && <AdminToast message={toast.message} />}
          {/* Inject triggerToast method to the child routes via Outlet context */}
          <Outlet context={{ triggerToast }} />
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out;
        }
      `}} />
    </div>
  );
}
