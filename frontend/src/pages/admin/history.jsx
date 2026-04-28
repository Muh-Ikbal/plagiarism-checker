import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Pagination from '../../components/admin/Pagination';

const API_BASE = 'http://localhost:8000';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function RiwayatView() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [historyData, setHistoryData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/api/admin/history?page=${currentPage}&per_page=${itemsPerPage}&search=${encodeURIComponent(debouncedSearch)}`)
      .then(res => res.json())
      .then(data => {
        setHistoryData(data.history || []);
        setTotalPages(data.total_pages || 1);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal mengambil riwayat", err);
        setIsLoading(false);
      });
  }, [currentPage, itemsPerPage, debouncedSearch]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <input 
            type="text" 
            placeholder="Cari nama dokumen atau user..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <button className="text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 shadow-sm">
          Ekspor CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Pengguna</th>
                <th className="px-4 py-3 font-semibold">Nama Dokumen</th>
                <th className="px-4 py-3 font-semibold text-center">Skor Plagiarisme</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Memuat data riwayat...</p>
                  </td>
                </tr>
              ) : historyData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-slate-500 text-sm">
                    {debouncedSearch ? 'Tidak ada hasil yang cocok dengan pencarian Anda.' : 'Belum ada riwayat pengecekan.'}
                  </td>
                </tr>
              ) : (
                historyData.map((item) => {
                  const isPlagiat = item.plagiarismScore > 30;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{item.date}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.user}</td>
                      <td className="px-4 py-3 text-sm text-teal-600 font-medium cursor-pointer hover:underline">{item.document}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${isPlagiat ? 'text-rose-600' : 'text-emerald-600'}`}>{item.plagiarismScore}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                          isPlagiat ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isPlagiat ? 'Terindikasi' : 'Aman'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}
