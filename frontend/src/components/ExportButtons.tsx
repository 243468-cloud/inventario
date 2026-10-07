'use client';
import { useState } from 'react';
import { DownloadIcon, FileTextIcon } from '@/components/Icons';

export default function ExportButtons({ token, role }: { token: string; role?: string }) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  // Si no es SUPER_ADMIN o ADMIN, no mostrar los botones a empleados
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  if (!isAdmin) return null;

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
    <div className="flex items-center gap-2">
      <button
        id="btn-export-excel"
        onClick={() => downloadFile(`${API_URL}/reports/export/inventory`, 'inventario_miel.xlsx', 'excel')}
        disabled={isExportingExcel}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-sm disabled:opacity-50"
      >
        {isExportingExcel ? (
          <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <DownloadIcon className="w-3.5 h-3.5 text-stone-500" />
        )}
        Excel
      </button>

      <button
        id="btn-export-pdf"
        onClick={() => downloadFile(`${API_URL}/reports/export/pdf`, 'inventario_miel.pdf', 'pdf')}
        disabled={isExportingPdf}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-sm disabled:opacity-50"
      >
        {isExportingPdf ? (
          <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileTextIcon className="w-3.5 h-3.5 text-stone-500" />
        )}
        PDF
      </button>
    </div>
  );
}
