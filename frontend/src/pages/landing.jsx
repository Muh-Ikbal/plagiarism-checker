import React from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Navigate } from 'react-router-dom';
import { 
  BookOpen, ShieldCheck, SpellCheck, Clock, ArrowRight, 
  FileText, Search, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';

export default function LandingPage() {
  // Jika sudah login, redirect ke dashboard yang sesuai
  const user = authApi.getCurrentUser();
  if (user && authApi.isLoggedIn()) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ═══════ NAVBAR ═══════ */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-600 p-2 rounded-xl shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-800 text-xl tracking-tight">
                Word<span className="text-teal-600">Lens</span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-teal-700 px-4 py-2 rounded-lg transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/signup"
                className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-teal-600/20 active:scale-[0.98]"
              >
                Daftar Gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl"></div>
          <div className="absolute top-20 -left-20 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-50/50 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Akademik Cerdas
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Cek Plagiarisme &{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Ejaan Dokumen
              </span>{' '}
              Akademik Anda
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              WordLens membantu mahasiswa dan peneliti memastikan orisinalitas karya tulis 
              dengan teknologi <span className="font-semibold text-slate-600">Cosine Similarity</span> dan 
              pengecekan ejaan berbasis <span className="font-semibold text-slate-600">SymSpell</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <Link
                to="/signup"
                className="group flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-xl text-base font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
              >
                Mulai Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 text-slate-600 hover:text-teal-700 px-6 py-3.5 rounded-xl text-base font-semibold border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/50 transition-all"
              >
                Sudah Punya Akun
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES SECTION ═══════ */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Fitur Unggulan</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto text-base">
              Tiga fitur utama yang dirancang khusus untuk kebutuhan akademik Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-teal-100/50 hover:border-teal-200 transition-all duration-300">
              <div className="bg-teal-50 text-teal-600 p-3.5 rounded-xl w-fit mb-5 group-hover:bg-teal-100 transition-colors">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Deteksi Plagiarisme</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Bandingkan dokumen Anda dengan database jurnal referensi menggunakan 
                algoritma <strong>TF-IDF Cosine Similarity</strong>. Mendukung format PDF dan DOCX.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-emerald-100/50 hover:border-emerald-200 transition-all duration-300">
              <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl w-fit mb-5 group-hover:bg-emerald-100 transition-colors">
                <SpellCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Pengecekan Ejaan</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Koreksi ejaan Bahasa Indonesia secara otomatis dengan algoritma 
                <strong> SymSpell</strong>. Dapatkan hingga 5 rekomendasi kata untuk setiap kesalahan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:shadow-cyan-100/50 hover:border-cyan-200 transition-all duration-300">
              <div className="bg-cyan-50 text-cyan-600 p-3.5 rounded-xl w-fit mb-5 group-hover:bg-cyan-100 transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Riwayat Pengecekan</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Simpan dan akses kembali semua hasil pengecekan plagiarisme Anda. 
                Unduh laporan PDF lengkap dengan <strong>highlight warna</strong> per sumber.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Cara Kerja</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Mudah dan Cepat
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
            {[
              { step: '1', icon: FileText, title: 'Daftar Akun', desc: 'Buat akun gratis dalam hitungan detik.' },
              { step: '2', icon: Search, title: 'Unggah Dokumen', desc: 'Upload PDF/DOCX atau paste teks langsung.' },
              { step: '3', icon: ShieldCheck, title: 'Analisis AI', desc: 'Sistem memproses dan membandingkan dengan database.' },
              { step: '4', icon: CheckCircle2, title: 'Lihat Hasil', desc: 'Dapatkan laporan detail dan unduh PDF.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="bg-white border-2 border-teal-200 text-teal-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="absolute top-7 left-[calc(50%+2rem)] right-0 h-[2px] bg-teal-100 hidden md:block last:hidden"></div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Langkah {step}</p>
                <h4 className="text-base font-bold text-slate-800 mb-1">{title}</h4>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA SECTION ═══════ */}
      <section className="py-16 md:py-20 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Siap Memastikan Orisinalitas Karya Anda?
          </h2>
          <p className="text-slate-500 mb-8 text-base max-w-xl mx-auto">
            Bergabunglah sekarang dan mulai gunakan WordLens untuk memeriksa plagiarisme dan ejaan dokumen akademik Anda.
          </p>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
          >
            Daftar Gratis Sekarang
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="bg-teal-600 p-1.5 rounded-lg">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-700 text-sm">
              Word<span className="text-teal-600">Lens</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} WordLens. Hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
