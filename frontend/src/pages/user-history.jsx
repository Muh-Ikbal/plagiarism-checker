import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Loader2, Search, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, AlertTriangle, ExternalLink, Download } from 'lucide-react';
import { fetchWithAuth, API_BASE_URL } from '@/lib/api';

const API_BASE = API_BASE_URL;

function VerdictBadge({ verdict }) {
  const configs = {
    clean: { label: 'Bersih', icon: ShieldCheck, bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    low: { label: 'Rendah', icon: ShieldCheck, bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    medium: { label: 'Sedang', icon: ShieldAlert, bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    high: { label: 'Tinggi', icon: AlertTriangle, bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  };
  const config = configs[verdict?.toLowerCase()] || configs.clean;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${config.bg} ${config.text} ${config.border} border`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const configs = {
    queued: { label: 'Antrian', bg: 'bg-slate-100', text: 'text-slate-600' },
    running: { label: 'Proses', bg: 'bg-blue-100', text: 'text-blue-600' },
    done: { label: 'Selesai', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    failed: { label: 'Gagal', bg: 'bg-rose-100', text: 'text-rose-600' },
  };
  const config = configs[status] || configs.queued;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export default function UserHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_BASE}/api/plagiarism/history/user`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mengambil data riwayat');
      }

      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat mengambil riwayat');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDownloadReport = async (jobId, docTitle) => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/plagiarism/download-report/${jobId}`);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Gagal mengunduh laporan');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Plagiarisme_${docTitle || 'dokumen'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Gagal mengunduh laporan.');
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (pct) => {
    if (pct <= 10) return 'text-emerald-600';
    if (pct <= 30) return 'text-green-600';
    if (pct <= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Riwayat Pengecekan</h2>
        <p className="text-slate-500 mt-2 text-sm">Lihat semua riwayat pengecekan plagiarisme yang pernah Anda lakukan.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Daftar Riwayat Pengecekan</span>
          </div>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-teal-600 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Memuat riwayat...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-rose-600 space-y-3">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchHistory} className="text-xs text-teal-600 hover:underline">Coba lagi</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
            <FileText className="w-10 h-10 opacity-20" />
            <p className="text-sm text-center">Belum ada riwayat pengecekan.<br />Mulai cek plagiarisme untuk melihat hasilnya di sini.</p>
          </div>
        )}

        {/* History List */}
        {!loading && !error && history.length > 0 && (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Doc Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-sm font-semibold text-slate-800 truncate" title={item.document_title}>
                        {item.document_title}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(item.created_at)}</span>
                      <span className="text-slate-300">•</span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  {/* Right: Score & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {item.report ? (
                      <>
                        <div className="text-right">
                          <p className={`text-lg font-black ${getScoreColor(item.report.overall_similarity_pct)}`}>
                            {item.report.overall_similarity_pct.toFixed(1)}%
                          </p>
                        </div>
                        <VerdictBadge verdict={item.report.verdict} />
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {item.status === 'failed' ? 'Gagal' : 'Menunggu...'}
                      </span>
                    )}

                    {item.status === 'done' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDownloadReport(item.id, item.document_title)}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Unduh PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
