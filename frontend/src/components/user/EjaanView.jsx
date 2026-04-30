import React, { useState } from 'react';
import { SpellCheck, AlertCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function EjaanView() {
  const [ejaanText, setEjaanText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isCheckingEjaan, setIsCheckingEjaan] = useState(false);
  const [ejaanResult, setEjaanResult] = useState(null);

  const [activeCandidateIndex, setActiveCandidateIndex] = useState(null);

  const handleCheckEjaan = async () => {
    if (!ejaanText.trim()) return;
    setIsCheckingEjaan(true);
    setEjaanResult(null);
    setCorrectedText('');
    setActiveCandidateIndex(null);

    try {
      const response = await fetchWithAuth('http://localhost:8000/api/spelling/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: ejaanText })
      });

      if (!response.ok) {
        throw new Error('Gagal memproses pengecekan ejaan ke server');
      }

      const data = await response.json();

      const foundErrors = data.corrections.map(corr => ({
        original: corr.original,
        appliedSuggestion: corr.suggestions.length > 0 ? corr.suggestions[0] : corr.original,
        candidates: corr.suggestions
      }));

      setCorrectedText(data.corrected_text);
      setEjaanResult({
        totalWords: ejaanText.trim().split(/\s+/).length,
        errors: foundErrors
      });
    } catch (error) {
      console.error(error);
      // Fallback jika API gagal
      alert('Gagal terhubung ke backend server. Pastikan backend WordLens sudah berjalan.');
    } finally {
      setIsCheckingEjaan(false);
    }
  };

  const handleSelectCandidate = (errorIndex, selectedCandidate) => {
    // Perbarui kata yang diterapkan pada state hasil
    const updatedErrors = ejaanResult.errors.map((err, idx) =>
      idx === errorIndex ? { ...err, appliedSuggestion: selectedCandidate } : err
    );

    setEjaanResult({ ...ejaanResult, errors: updatedErrors });

    // Generate ulang teks perbaikan berdasarkan pilihan baru
    let newText = ejaanText;
    updatedErrors.forEach(err => {
      const regex = new RegExp(`\\b${err.original}\\b`, 'ig');
      newText = newText.replace(regex, err.appliedSuggestion);
    });

    setCorrectedText(newText);
    setActiveCandidateIndex(null); // Tutup menu kandidat setelah memilih
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Pengecekan Ejaan (SymSpell)</h2>
        <p className="text-slate-500 mt-2 text-sm">Sistem akan menganalisis teks Anda dan menghasilkan versi perbaikannya di kotak terpisah.</p>
      </div>

      <div className="space-y-6">

        {/* Kotak Input Teks - 1 Baris Penuh */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Teks Input Asli</span>
            <span className="text-xs text-slate-500">{ejaanText.split(/\s+/).filter(w => w.length > 0).length} Kata</span>
          </div>
          <textarea
            value={ejaanText}
            onChange={(e) => {
              setEjaanText(e.target.value);
              setEjaanResult(null); // Reset hasil jika teks diubah
              setCorrectedText('');
            }}
            placeholder="Ketik atau paste teks dokumen Anda di sini..."
            className="w-full p-4 resize-y outline-none text-slate-700 leading-relaxed text-sm bg-white focus:bg-slate-50 transition-colors min-h-[150px]"
            spellCheck="false"
          ></textarea>
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={handleCheckEjaan}
              disabled={isCheckingEjaan || !ejaanText.trim()}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors text-sm font-bold shadow-sm"
            >
              {isCheckingEjaan ? <Loader2 className="w-4 h-4 animate-spin" /> : <SpellCheck className="w-4 h-4" />}
              <span>{isCheckingEjaan ? 'Menganalisis Teks...' : 'Cek Ejaan Teks'}</span>
            </button>
          </div>
        </div>

        {/* Hasil Perbaikan dan Rekomendasi - Bersampingan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">

          {/* Kotak Output (Hasil Perbaikan) */}
          <div className="bg-white rounded-xl border border-teal-200 shadow-sm flex flex-col overflow-hidden h-full relative">
            <div className="p-3 border-b border-teal-100 bg-teal-50 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Hasil Perbaikan Sistem</span>
            </div>

            {isCheckingEjaan ? (
              <div className="flex-grow flex flex-col items-center justify-center text-teal-600 bg-slate-50/50">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm font-medium">Memproses algoritma...</p>
              </div>
            ) : (
              <textarea
                value={correctedText || "Hasil perbaikan akan muncul di sini setelah Anda mengklik tombol Cek Ejaan."}
                readOnly
                className={`flex-grow w-full p-4 resize-none outline-none leading-relaxed text-sm ${correctedText ? 'text-slate-800 bg-white' : 'text-slate-400 bg-slate-50 italic'}`}
              ></textarea>
            )}
          </div>

          {/* Panel Riwayat Perbaikan & Feedback User */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span>Detail Perbaikan & Alternatif</span>
            </div>

            <div className="flex-grow overflow-auto p-4 bg-slate-50/30">
              {!ejaanResult && !isCheckingEjaan && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <SpellCheck className="w-10 h-10 opacity-20" />
                  <p className="text-sm text-center">Silakan lakukan pengecekan<br />untuk melihat detail perbaikan.</p>
                </div>
              )}

              {ejaanResult && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-xs font-medium text-slate-500 text-center mb-4">Sistem mendeteksi <span className="font-bold text-orange-600">{ejaanResult.errors.length}</span> potensi kesalahan (typo).</p>

                  <div className="space-y-3">
                    {ejaanResult.errors.map((err, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200">
                        <div
                          className="p-3 flex items-start justify-between cursor-pointer hover:bg-slate-50"
                          onClick={() => setActiveCandidateIndex(activeCandidateIndex === idx ? null : idx)}
                        >
                          <div>
                            {err.appliedSuggestion === err.original ? (
                              <>
                                <p className="text-xs text-slate-500 mb-1">Dipertahankan (Batal Diubah):</p>
                                <p className="text-sm font-bold text-slate-700">{err.original}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-slate-500 mb-1">Diubah dari <span className="text-rose-600 line-through decoration-rose-300 font-medium">{err.original}</span> menjadi:</p>
                                <p className="text-sm font-bold text-emerald-600">{err.appliedSuggestion}</p>
                              </>
                            )}
                          </div>

                          <div className="flex items-center text-slate-400 mt-2">
                            <span className="text-[10px] mr-2">Kandidat lain</span>
                            {activeCandidateIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {activeCandidateIndex === idx && (
                          <div className="bg-slate-50 p-3 border-t border-slate-100 animate-fade-in">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Rekomendasi Lain:</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleSelectCandidate(idx, err.original)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${err.appliedSuggestion === err.original
                                    ? 'bg-rose-500 text-white border-rose-500'
                                    : 'bg-white text-rose-600 border-rose-200 hover:border-rose-400 hover:bg-rose-50'
                                  }`}
                              >
                                Batalkan Perubahan
                              </button>

                              {err.candidates.map((candidate, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => handleSelectCandidate(idx, candidate)}
                                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${err.appliedSuggestion === candidate
                                      ? 'bg-teal-600 text-white border-teal-600'
                                      : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400 hover:text-teal-700'
                                    }`}
                                >
                                  {candidate}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {ejaanResult.errors.length === 0 && (
                      <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700 text-sm font-medium">
                        Hebat! Tidak ditemukan kesalahan ejaan pada teks Anda.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
