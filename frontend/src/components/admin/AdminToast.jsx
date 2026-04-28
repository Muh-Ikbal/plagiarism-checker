import { CheckCircle } from 'lucide-react';

export default function AdminToast({ message }) {
  if (!message) return null;
  
  return (
    <div className="fixed top-6 right-1/2 translate-x-1/2 bg-slate-800 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2.5 z-50 animate-fade-in-down border border-slate-700">
      <CheckCircle className="w-4 h-4 text-emerald-400" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
