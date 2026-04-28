import { useState, useEffect } from 'react';
import { Library, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/admin/StatCard';

const API_BASE = 'http://localhost:8000';

export default function DashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRefs: 0,
    totalChecks: 0
  });
  const [recentHistory, setRecentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ambil data stats
    fetch(`${API_BASE}/api/admin/stats`)
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({ ...prev, totalRefs: data.indexed_documents || data.total_documents || 0, totalChecks: data.total_checks || 0 }));
      })
      .catch(console.error);

    // Ambil data history terbaru (4 item)
    fetch(`${API_BASE}/api/admin/history?page=1&per_page=4`)
      .then(res => res.json())
      .then(data => {
        setRecentHistory(data.history || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal mengambil history", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatCard 
          icon={Library} title="Total Jurnal Referensi" value={stats.totalRefs} 
          iconBgClass="bg-teal-50" iconTextClass="text-teal-600" 
        />
        <StatCard 
          icon={Clock} title="Total Pengecekan Sistem" value={stats.totalChecks.toLocaleString()} 
          iconBgClass="bg-blue-50" iconTextClass="text-blue-600" 
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 text-sm">Aktivitas Pengecekan Plagiarisme Terbaru</h3>
          <button onClick={() => navigate('/admin/history')} className="text-xs font-medium text-teal-600 hover:text-teal-700">Lihat Semua</button>
        </div>
        <div className="divide-y divide-slate-50 min-h-[100px] flex flex-col justify-center">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : recentHistory.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Belum ada aktivitas pengecekan.</p>
          ) : (
            recentHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {item.user ? item.user.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 leading-tight">{item.document}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.user} • {item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      item.plagiarismScore > 30 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      Skor: {item.plagiarismScore}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}