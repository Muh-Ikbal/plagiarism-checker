import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, FileText, UploadCloud, Loader2, X, Type, Download, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, ShieldAlert, ExternalLink, SlidersHorizontal, BookOpen } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// Palet warna sumber plagiat — sinkron dengan warna di backend (PDF highlighting)
const SOURCE_COLORS = [
  { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-400' },
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-400' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-400' },
  { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-400' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-400' },
];

function getColorByIndex(colorIndex) {
  return SOURCE_COLORS[colorIndex % SOURCE_COLORS.length];
}

// Verdict badge helper
function VerdictBadge({ verdict }) {
  const configs = {
    CLEAN: { label: 'Bersih', icon: ShieldCheck, bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    LOW: { label: 'Rendah', icon: ShieldCheck, bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    MEDIUM: { label: 'Sedang', icon: ShieldAlert, bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    HIGH: { label: 'Tinggi', icon: AlertTriangle, bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  };
  const config = configs[verdict?.toUpperCase()] || configs.CLEAN;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.text} ${config.border} border`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// Circular gauge SVG
function GaugeChart({ percentage }) {
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const getColor = (pct) => {
    if (pct <= 10) return '#10b981';  // emerald
    if (pct <= 30) return '#22c55e';  // green
    if (pct <= 60) return '#f59e0b';  // amber
    return '#ef4444';                  // red
  };
  const color = getColor(clampedPct);
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-slate-100"
          strokeWidth="3" stroke="currentColor" fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          strokeDasharray={`${clampedPct}, 100`}
          strokeWidth="3" strokeLinecap="round" stroke={color} fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-800">{clampedPct.toFixed(1)}%</span>
        <span className="text-[10px] text-slate-400 font-medium mt-0.5">Kemiripan</span>
      </div>
    </div>
  );
}

// Sentence item with expandable detail
function SentenceItem({ sentence, index }) {
  const [expanded, setExpanded] = useState(false);

  if (!sentence.is_flagged) {
    return (
      <div className="py-2 px-3 text-sm text-slate-700 leading-relaxed border-l-2 border-transparent">
        <span className="text-slate-400 text-xs font-mono mr-2">{index + 1}.</span>
        {sentence.text}
      </div>
    );
  }

  const color = getColorByIndex(sentence.color_index || 0);
  return (
    <div className={`rounded-lg ${color.bg} ${color.border} border overflow-hidden transition-all duration-200`}>
      <div
        className="py-2.5 px-3 cursor-pointer flex items-start gap-2 hover:opacity-90 transition-opacity"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-slate-400 text-xs font-mono mt-0.5 shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${color.text} leading-relaxed`}>
            {sentence.text}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[11px] font-bold ${color.text} bg-white/60 px-2 py-0.5 rounded-md`}>
              {sentence.similarity_pct}% mirip
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              → {sentence.matched_source_title}
            </span>
          </div>
        </div>
        <div className="mt-1 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/40 animate-fade-in">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kalimat Referensi Asli:</p>
          <p className="text-sm text-slate-700 bg-white/50 rounded-md p-2.5 leading-relaxed italic">
            "{sentence.matched_sentence_text}"
          </p>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Sumber: <span className="font-medium">{sentence.matched_source_title}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────── MAIN COMPONENT ────────────────────
export default function PlagiarismeView() {
  const [plagMode, setPlagMode] = useState('text'); // 'text' | 'file'
  const [plagText, setPlagText] = useState('');
  const [plagFile, setPlagFile] = useState(null);
  const [isCheckingPlag, setIsCheckingPlag] = useState(false);
  const [plagResult, setPlagResult] = useState(null);
  const [jobId, setJobId] = useState(null); // Job ID dari file upload (untuk download)
  const [apiError, setApiError] = useState(null);
  const [pollingStatus, setPollingStatus] = useState(''); // Status teks saat polling

  // Filter settings
  const [tolerance, setTolerance] = useState(1); // Toleransi: sumber dengan kontribusi < X% akan diabaikan
  const [excludeBibliography, setExcludeBibliography] = useState(true); // Exclude daftar pustaka

  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);

  // Bersihkan polling saat unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════
  // MODE TEKS: POST /api/plagiarism/check-text
  // ═══════════════════════════════════════════════
  const handleCheckText = useCallback(async () => {
    if (!plagText.trim()) return;
    setIsCheckingPlag(true);
    setPlagResult(null);
    setJobId(null);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append('content', plagText);
      formData.append('tolerance', String(tolerance));

      const response = await fetch(`${API_BASE}/api/plagiarism/check-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      setPlagResult({
        mode: 'text',
        summary: data.summary,
        sources: data.sources || [],
        sentences: data.sentences || [],
      });
    } catch (err) {
      console.error('Plagiarism check error:', err);
      setApiError(err.message || 'Gagal terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setIsCheckingPlag(false);
    }
  }, [plagText, tolerance]);
  const handleCheckFile = useCallback(async () => {
    if (!plagFile) return;
    setIsCheckingPlag(true);
    setPlagResult(null);
    setJobId(null);
    setApiError(null);
    setPollingStatus('Mengunggah dokumen...');

    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', plagFile);
      formData.append('title', plagFile.name.replace(/\.[^/.]+$/, '')); // Nama file tanpa ekstensi
      formData.append('tolerance', String(tolerance));
      formData.append('exclude_bibliography', String(excludeBibliography));

      const uploadRes = await fetch(`${API_BASE}/api/plagiarism/check-document`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.detail || `Upload gagal: ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      const newJobId = uploadData.job_id;
      setJobId(newJobId);
      setPollingStatus('Dokumen sedang diproses oleh sistem...');

      // 2. Polling untuk hasil
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 120; // 6 menit max (120 x 3 detik)

        pollingRef.current = setInterval(async () => {
          attempts++;

          if (attempts > maxAttempts) {
            clearInterval(pollingRef.current);
            reject(new Error('Timeout: Proses terlalu lama. Silakan coba lagi.'));
            return;
          }

          try {
            const pollRes = await fetch(`${API_BASE}/api/plagiarism/report/${newJobId}/json`);
            const pollData = await pollRes.json();

            if (pollData.status === 'done') {
              clearInterval(pollingRef.current);

              setPlagResult({
                mode: 'file',
                jobId: newJobId,
                documentTitle: pollData.document_title,
                summary: pollData.summary,
                sources: pollData.sources || [],
                sentences: pollData.sentences || [],
              });

              resolve();
            } else if (pollData.status === 'failed') {
              clearInterval(pollingRef.current);
              reject(new Error('Proses gagal di server. Silakan coba upload ulang.'));
            } else {
              setPollingStatus(`Menganalisis dokumen... (${attempts * 3} detik)`);
            }
          } catch (pollErr) {
            // Jangan langsung gagal, coba lagi di interval berikutnya
            console.warn('Polling error, retrying...', pollErr);
          }
        }, 3000);
      });

    } catch (err) {
      console.error('File plagiarism check error:', err);
      setApiError(err.message || 'Gagal memproses dokumen.');
    } finally {
      setIsCheckingPlag(false);
      setPollingStatus('');
    }
  }, [plagFile, tolerance, excludeBibliography]);

  // Handler utama
  const handleCheckPlagiarisme = () => {
    if (plagMode === 'text') {
      handleCheckText();
    } else {
      handleCheckFile();
    }
  };

  // Download PDF report
  const handleDownloadReport = useCallback(async () => {
    if (!plagResult?.jobId) return;

    try {
      const response = await fetch(`${API_BASE}/api/plagiarism/download-report/${plagResult.jobId}`);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Gagal mengunduh laporan');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Plagiarisme_${plagResult.documentTitle || 'dokumen'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Gagal mengunduh laporan.');
    }
  }, [plagResult]);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPlagFile(e.target.files[0]);
      setPlagResult(null);
      setApiError(null);
    }
  };

  const clearPlagFile = () => {
    setPlagFile(null);
    setPlagResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    setPlagText('');
    setPlagFile(null);
    setPlagResult(null);
    setJobId(null);
    setApiError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const wordCount = plagText.split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Deteksi Plagiarisme (Cosine Similarity)</h2>
        <p className="text-slate-500 mt-2 text-sm">Cek kemiripan dokumen Anda dengan database jurnal referensi kami.</p>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto">
        {/* ═══════════════ INPUT SECTION ═══════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Mode Toggle */}
          <div className="flex justify-center p-3 border-b border-slate-100 bg-white shadow-sm z-10 relative">
            <div className="bg-slate-100/80 p-1 rounded-lg inline-flex relative border border-slate-200 shadow-inner">
              <button
                onClick={() => { setPlagMode('text'); setPlagResult(null); setApiError(null); }}
                className={`flex items-center space-x-2 px-6 py-1.5 rounded-md text-sm font-medium transition-all ${plagMode === 'text' ? 'bg-white text-teal-700 shadow border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
              >
                <Type className="w-4 h-4" />
                <span>Input Teks</span>
              </button>
              <button
                onClick={() => { setPlagMode('file'); setPlagResult(null); setApiError(null); }}
                className={`flex items-center space-x-2 px-6 py-1.5 rounded-md text-sm font-medium transition-all ${plagMode === 'file' ? 'bg-white text-teal-700 shadow border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 border border-transparent'}`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Unggah Dokumen</span>
              </button>
            </div>
          </div>

          <div className="min-h-[250px] flex flex-col bg-slate-50/30">
            {plagMode === 'text' ? (
              <div className="flex flex-col flex-grow">
                <div className="px-5 pt-3 pb-1 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Maks. 250 kata</span>
                  <span className={`text-xs font-medium ${wordCount > 250 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {wordCount}/250 Kata
                  </span>
                </div>
                <textarea
                  id="plagiarism-text-input"
                  value={plagText}
                  onChange={(e) => { setPlagText(e.target.value); setApiError(null); }}
                  placeholder="Ketik atau paste teks abstrak/paragraf Anda di sini (maks. 250 kata)..."
                  className="flex-grow w-full px-5 pb-5 resize-y outline-none text-slate-700 leading-relaxed text-sm bg-transparent min-h-[180px]"
                ></textarea>
              </div>
            ) : (
              <div className="flex-grow p-8 flex flex-col items-center justify-center relative">
                <input
                  type="file" ref={fileInputRef} onChange={handleFileUpload}
                  className="hidden" accept=".pdf,.docx"
                  id="plagiarism-file-input"
                />

                {plagFile ? (
                  <div className="w-full max-w-sm bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center relative animate-fade-in">
                    <button onClick={clearPlagFile} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <FileText className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-800 truncate px-4" title={plagFile.name}>{plagFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(plagFile.size / 1024).toFixed(1)} KB</p>
                    <button onClick={() => fileInputRef.current.click()} className="mt-4 text-xs font-medium text-teal-600 hover:text-teal-800 underline decoration-teal-300 underline-offset-4">Ganti File</button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="w-full h-full max-w-lg min-h-[180px] bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center hover:bg-slate-50 hover:border-teal-400 transition-colors cursor-pointer group shadow-sm"
                  >
                    <div className="p-4 bg-teal-50 text-teal-500 rounded-full mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-slate-700 font-medium text-sm">Klik atau Seret file ke area ini</p>
                    <p className="text-slate-400 text-xs mt-2">Mendukung format PDF dan DOCX (Max 15MB)</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════ FILTER SETTINGS (hanya muncul di mode file) ═══════ */}
          {plagMode === 'file' && (
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pengaturan Filter</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Tolerance (Small Match Exclusion) */}
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <label className="text-xs font-semibold text-slate-600 block mb-2" htmlFor="plagiarism-tolerance-input">
                    Toleransi (Small Match Exclusion)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
                    Sumber referensi yang kontribusinya di bawah angka ini akan diabaikan dari hasil akhir.
                  </p>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={tolerance}
                      onChange={(e) => {
                        const val = Math.min(5, Math.max(0, Number(e.target.value) || 0));
                        setTolerance(val);
                      }}
                      className="w-20 text-center text-sm font-bold text-slate-700 border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      id="plagiarism-tolerance-input"
                    />
                    <span className="text-xs text-slate-500 font-medium">%</span>
                  </div>
                </div>

                {/* Exclude Bibliography */}
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <label className="text-xs font-semibold text-slate-600 block mb-2">
                    Daftar Pustaka / Bibliografi
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5 leading-relaxed">
                    Opsi untuk menyertakan atau mengecualikan bagian daftar pustaka dari pengecekan.
                  </p>
                  <label className="flex items-center gap-2.5 cursor-pointer group" htmlFor="plagiarism-exclude-bib">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="plagiarism-exclude-bib"
                        checked={excludeBibliography}
                        onChange={(e) => setExcludeBibliography(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-checked:bg-teal-500 rounded-full transition-colors"></div>
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4"></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      <span className={`text-sm font-medium transition-colors ${excludeBibliography ? 'text-teal-700' : 'text-slate-500'}`}>
                        {excludeBibliography ? 'Tidak termasuk daftar pustaka' : 'Termasuk daftar pustaka'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <p className="text-xs text-rose-700">{apiError}</p>
            </div>
          )}

          {/* Action Bar */}
          <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
            <button
              onClick={handleReset}
              disabled={isCheckingPlag}
              className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40 transition-colors"
            >
              Reset
            </button>
            <button
              id="plagiarism-check-button"
              onClick={handleCheckPlagiarisme}
              disabled={isCheckingPlag || (plagMode === 'text' ? (!plagText.trim() || wordCount > 250) : !plagFile)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm"
            >
              {isCheckingPlag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{isCheckingPlag ? (pollingStatus || 'Memindai Database...') : 'Mulai Cek Kemiripan'}</span>
            </button>
          </div>
        </div>

        {/* ═══════════════ RESULT SECTION ═══════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 text-sm flex items-center space-x-2">
            <Search className="w-4 h-4 text-teal-600" />
            <span>Hasil Deteksi Plagiarisme</span>
          </div>

          <div className="flex-grow flex flex-col min-h-[300px] bg-white">
            {/* Empty State */}
            {!plagResult && !isCheckingPlag && (
              <div className="h-full flex-grow flex flex-col items-center justify-center text-slate-400 space-y-3 py-10">
                <FileText className="w-10 h-10 opacity-20" />
                <p className="text-sm text-center">Hasil kemiripan dokumen<br />akan tampil di sini.</p>
              </div>
            )}

            {/* Loading State */}
            {isCheckingPlag && (
              <div className="h-full flex-grow flex flex-col items-center justify-center text-teal-600 space-y-3 py-10">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium text-center">
                  {pollingStatus || 'Menghitung jarak vektor...'}
                  <br />
                  <span className="text-xs text-slate-400">Mencocokkan dengan database jurnal referensi.</span>
                </p>
              </div>
            )}

            {/* ═══════ RESULT DISPLAY ═══════ */}
            {plagResult && (
              <div className="animate-fade-in">
                {/* Summary + Gauge */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Gauge */}
                    <div className="flex flex-col items-center shrink-0">
                      <GaugeChart percentage={plagResult.summary.overall_similarity_pct} />
                      <div className="mt-3">
                        <VerdictBadge verdict={plagResult.summary.verdict} />
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="flex-1 w-full min-w-0">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Kalimat Diperiksa</p>
                          <p className="text-xl font-black text-slate-800 mt-1">{plagResult.summary.total_sentence_count}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Kalimat Terdeteksi</p>
                          <p className="text-xl font-black text-rose-600 mt-1">{plagResult.summary.flagged_sentence_count}</p>
                        </div>
                      </div>

                      {/* Sources Legend */}
                      {plagResult.sources.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sumber Terdeteksi</p>
                          <div className="space-y-1.5">
                            {plagResult.sources.map((source, idx) => {
                              const color = getColorByIndex(source.color_index ?? idx);
                              const detailLink = source.document_link || `/api/plagiarism/view-reference/${source.source_id || idx + 1}`; // fallback pencegahan
                              return (
                                <div key={idx} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md ${color.bg} ${color.border} border min-w-0 overflow-hidden`}>
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className={`w-2.5 h-2.5 rounded-full ${color.dot} shrink-0`} />
                                    <p className={`text-xs font-medium ${color.text} flex-1 truncate`} title={source.source_title}>
                                      {source.source_title}
                                    </p>
                                    <span className={`text-xs font-bold ${color.text} shrink-0`}>
                                      {source.similarity_pct !== undefined ? `${source.similarity_pct}%` : `${source.matched_sentences_count} kalimat`}
                                    </span>
                                  </div>

                                  <a
                                    href={`${API_BASE}${detailLink}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`shrink-0 flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold px-2.5 py-1.5 bg-white/70 hover:bg-white rounded-md transition-shadow shadow-sm ${color.text} border border-white`}
                                    title="Lihat Dokumen Asli"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Lihat Referensi</span>
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>


                {/* Download Button (File mode only) */}
                <div className="p-4 bg-slate-50">
                  {plagResult.mode === 'file' && plagResult.jobId ? (
                    <button
                      id="plagiarism-download-button"
                      onClick={handleDownloadReport}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Unduh Laporan PDF (Dengan Highlight)
                    </button>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-2">
                      Tips: Gunakan mode "Unggah Dokumen" untuk mendapatkan laporan PDF yang bisa diunduh.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
