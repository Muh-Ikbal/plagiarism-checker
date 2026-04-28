import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save } from 'lucide-react';

export default function KonfigurasiView() {
  const { triggerToast } = useOutletContext();
  const [config, setConfig] = useState({ maxEditDistance: 2, thresholdCosine: 80 });

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={(e) => { e.preventDefault(); triggerToast('Konfigurasi berhasil disimpan!'); }} className="space-y-6">
          
          <div className="pb-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Pengaturan SymSpell</h3>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700">Max Edit Distance</label>
                <p className="text-xs text-slate-500 mt-1">Batas toleransi jarak ubah (typo) untuk pencarian kata di kamus.</p>
              </div>
              <input 
                type="number" min="1" max="5" step="1"
                value={config.maxEditDistance}
                onChange={(e) => setConfig({...config, maxEditDistance: parseInt(e.target.value)})}
                className="w-20 px-3 py-1.5 text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="pb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Pengaturan Cosine Similarity</h3>
            <div className="flex items-center justify-between">
              <div className="pr-8">
                <label className="block text-sm font-medium text-slate-700">Ambang Batas Plagiarisme (%)</label>
                <p className="text-xs text-slate-500 mt-1">Dokumen dengan persentase kemiripan melebihi nilai ini akan ditandai dengan status <span className="text-rose-600 font-semibold">Terindikasi</span>.</p>
              </div>
              <div className="relative w-24">
                <input 
                  type="number" min="1" max="100" step="1"
                  value={config.thresholdCosine}
                  onChange={(e) => setConfig({...config, thresholdCosine: parseInt(e.target.value)})}
                  className="w-full pl-3 pr-8 py-1.5 text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                />
                <span className="absolute right-3 top-1.5 text-slate-400 font-medium">%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm">
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
