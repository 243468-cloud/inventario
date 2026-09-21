'use client';
import { useState } from 'react';
import { DownloadIcon, FileTextIcon } from '@/components/Icons';

export default function ExportButtons({ token }: { token: string }) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  const downloadFile = async (url: string, filename: string, type: 'excel' | 'pdf') => {
    try {
      if (type === 'excel') setIsExportingExcel(true);
      else setIsExportingPdf(true);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Error al descargar');

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Hubo un error al intentar descargar el archivo.');
    } finally {
      if (type === 'excel') setIsExportingExcel(false);
      else setIsExportingPdf(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
      <button
        id="btn-export-excel"
        onClick={() => downloadFile(`${API_URL}/reports/export/inventory`, 'inventario_miel.xlsx', 'excel')}
        disabled={isExportingExcel}
        className="group relative overflow-hidden flex items-center justify-center gap-2 px-6 h-12 bg-white text-[#1f3d2e] border border-gray-200 font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-[#1f3d2e]/30 transition-all active:scale-[0.98] shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {isExportingExcel ? (
          <span className="w-5 h-5 border-2 border-[#1f3d2e] border-t-transparent rounded-full animate-spin" />
        ) : (
          <DownloadIcon className="w-5 h-5 text-[#1f3d2e]/70 group-hover:text-[#1f3d2e] transition-colors" />
        )}
        Excel
      </button>

      <button
        id="btn-export-pdf"
        onClick={() => downloadFile(`${API_URL}/reports/export/pdf`, 'inventario_miel.pdf', 'pdf')}
        disabled={isExportingPdf}
        className="group relative overflow-hidden flex items-center justify-center gap-2 px-6 h-12 bg-gradient-to-r from-[#c96f4a] to-[#b85c37] text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(201,111,74,0.5)] transition-all active:scale-[0.98] shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        {isExportingPdf ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
        ) : (
          <FileTextIcon className="w-5 h-5 relative z-10" />
        )}
        <span className="relative z-10">PDF</span>
      </button>
    </div>
  );
}
