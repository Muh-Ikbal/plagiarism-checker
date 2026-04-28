import { useState, useRef, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Plus, Trash2, ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Pagination from '../../components/admin/Pagination';

const API_BASE = 'http://localhost:8000';

export default function JurnalView() {
  const { triggerToast } = useOutletContext();
  const [journals, setJournals] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formFile, setFormFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // ═══════════════════════════════════════════════
  // FETCH: GET /api/plagiarism/references
  // ═══════════════════════════════════════════════
  const fetchJournals = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(itemsPerPage),
        search: searchQuery,
      });
      const res = await fetch(`${API_BASE}/api/plagiarism/references?${params}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setJournals(data.documents || []);
      setTotalPages(data.total_pages || 1);
      setTotalDocs(data.total || 0);
    } catch (err) {
      console.error(err);
      triggerToast('Gagal memuat data referensi dari server.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, triggerToast]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  // ═══════════════════════════════════════════════
  // UPLOAD: POST /api/plagiarism/upload-reference
  // ═══════════════════════════════════════════════
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formFile || !formTitle.trim()) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', formFile);
      formData.append('title', formTitle);

      const res = await fetch(`${API_BASE}/api/plagiarism/upload-reference`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload gagal: ${res.status}`);
      }

      triggerToast('Dokumen referensi berhasil diunggah! Sedang diproses oleh AI.');
      setFormTitle('');
      setFormFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setView('list');
      setCurrentPage(1);
      fetchJournals();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // DELETE: DELETE /api/plagiarism/references/{id}
  // ═══════════════════════════════════════════════
  const handleDelete = async (doc) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${doc.title}"?\nModel AI akan dilatih ulang setelah penghapusan.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/plagiarism/references/${doc.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Gagal menghapus');
      }

      triggerToast('Referensi berhasil dihapus dan model AI diperbarui.');
      fetchJournals();
    } catch (err) {
      triggerToast(`Gagal menghapus: ${err.message}`);
    }
  };

  // Search with debounce
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Status badge helper
  const StatusBadge = ({ status }) => {
    const configs = {
      indexed:    { label: 'Siap',      bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
      processing: { label: 'Diproses',  bg: 'bg-amber-100',   text: 'text-amber-700',   icon: Loader2 },
      pending:    { label: 'Menunggu',   bg: 'bg-slate-100',   text: 'text-slate-600',   icon: RefreshCw },
      failed:     { label: 'Gagal',      bg: 'bg-rose-100',    text: 'text-rose-700',    icon: AlertCircle },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold ${config.bg} ${config.text}`}>
        <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {config.label}
      </span>
    );
  };

  // ═══════════════════════════════════════════════
  // FORM VIEW
  // ═══════════════════════════════════════════════
  if (view === 'form') {
    return (
      <div className="max-w-3xl">
        <button onClick={() => { setView('list'); setUploadError(null); }} className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar</span>
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Upload Jurnal Referensi Baru</h3>
            <p className="text-xs text-slate-500 mt-1">File PDF akan diekstrak dan dilatih ke dalam model AI untuk pencocokan plagiarisme.</p>
          </div>
          
          <form onSubmit={handleUpload} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Judul Publikasi</label>
              <input 
                type="text" required value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all shadow-sm"
                placeholder="Masukkan judul lengkap jurnal..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">File Referensi (PDF)</label>
              <div 
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current.click()}
              >
                <input 
                  type="file" className="hidden" ref={fileInputRef} accept=".pdf"
                  onChange={(e) => e.target.files[0] && setFormFile(e.target.files[0])}
                />
                {formFile ? (
                  <>
                    <FileText className="w-8 h-8 text-teal-500 mb-2" />
                    <p className="text-sm font-medium text-slate-700">{formFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(formFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-teal-500 mb-2" />
                    <p className="text-sm font-medium text-slate-700">Klik untuk memilih file PDF</p>
                    <p className="text-xs text-slate-500 mt-1">Hanya menerima format PDF</p>
                  </>
                )}
              </div>
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-700">{uploadError}</p>
              </div>
            )}

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
              <button type="button" onClick={() => setView('list')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors">
                Batal
              </button>
              <button 
                type="submit" 
                disabled={isUploading || !formFile || !formTitle.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Latih AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <input 
              type="text" 
              placeholder="Cari judul jurnal..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <span className="text-xs text-slate-400">{totalDocs} referensi</span>
        </div>
        <button onClick={() => { setView('form'); setUploadError(null); setFormTitle(''); setFormFile(null); }} className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Tambah Referensi</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Memuat data...</span>
          </div>
        ) : journals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">{searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada jurnal referensi'}</p>
            <p className="text-xs mt-1">{searchQuery ? 'Coba kata kunci lain' : 'Klik "Tambah Referensi" untuk memulai'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Judul Jurnal</th>
                    <th className="px-4 py-3 font-semibold">File Asli</th>
                    <th className="px-4 py-3 font-semibold text-center">Kalimat</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 font-semibold">Tanggal Upload</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journals.map((journal) => (
                    <tr key={journal.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 max-w-[300px] leading-tight">
                        {journal.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-teal-600">
                        <div className="flex items-center space-x-1.5">
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[150px]" title={journal.original_filename}>
                            {journal.original_filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center font-medium">
                        {journal.sentence_count}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={journal.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {journal.created_at ? new Date(journal.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleDelete(journal)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors" 
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </>
        )}
      </div>
    </div>
  );
}
