import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
      <div className="text-sm text-slate-500">
        Halaman <span className="font-medium text-slate-800">{currentPage}</span> dari <span className="font-medium text-slate-800">{totalPages}</span>
      </div>
      <div className="flex items-center space-x-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md text-slate-500 border border-transparent hover:border-slate-300 hover:bg-white shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:shadow-none transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md text-slate-500 border border-transparent hover:border-slate-300 hover:bg-white shadow-sm disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:shadow-none transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
