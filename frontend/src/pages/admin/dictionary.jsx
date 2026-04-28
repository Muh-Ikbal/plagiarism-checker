import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, FileDown, UploadCloud } from 'lucide-react';

export default function KamusView() {
  const { triggerToast } = useOutletContext();
  const [kamusFile, setKamusFile] = useState({ name: 'Belum ada kamus aktif', size: '0 MB', updated: '-' });
  const [isLoading, setIsLoading] = useState(true);
  const kamusInputRef = useRef(null);

  useEffect(() => {
    fetchActiveDictionary();
  }, []);

  const fetchActiveDictionary = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:8000/admin/dictionary/active');
      const data = await res.json();
      if (data.id) {
        setKamusFile({
          name: data.name,
          size: data.file_size_mb,
          updated: data.updated_at ? new Date(data.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB' : new Date(data.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB'
        });
      }
    } catch (error) {
      console.error('Error fetching dictionary:', error);
      triggerToast('Gagal memuat info kamus.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['.dic', '.csv', '.txt'].some(ext => file.name.toLowerCase().endsWith(ext))) {
         triggerToast('Format file tidak disetujui.', 'error');
         return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        triggerToast('Mulai mengunggah...', 'info');
        const res = await fetch('http://localhost:8000/admin/dictionary/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.detail || 'Gagal mengunggah file.');
        }
        
        triggerToast('File kamus master berhasil diperbarui!', 'success');
        fetchActiveDictionary();
      } catch (error) {
        console.error('Upload error:', error);
        triggerToast(error.message, 'error');
      }
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start space-x-4">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600 shrink-0">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-slate-800">Master Dictionary</h3>
            <p className="text-sm text-slate-500 mt-0.5">Basis data kata baku untuk algoritma pengecekan ejaan.</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <FileDown className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{isLoading ? 'Memuat...' : kamusFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Ukuran: {kamusFile.size} • Diperbarui: {kamusFile.updated}</p>
              </div>
            </div>
            <button className="text-teal-600 hover:text-teal-800 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-teal-50 transition-colors">
              Unduh
            </button>
          </div>

          <div className="text-center">
            <input type="file" className="hidden" ref={kamusInputRef} accept=".dic,.txt,.csv" onChange={handleUpload} />
            <button onClick={() => kamusInputRef.current.click()} className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg transition-colors text-sm font-medium shadow-sm">
              <UploadCloud className="w-4 h-4" />
              <span>Ganti File Kamus</span>
            </button>
            <p className="text-xs text-slate-500 mt-3">Mendukung format .dic, .txt, .csv (Satu kata per baris atau dipisahkan koma)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
