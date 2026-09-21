import { cookies } from 'next/headers'
import { DownloadIcon, FileTextIcon, PackageIcon, HexagonIcon, AlertTriangleIcon } from '@/components/Icons'
import Link from 'next/link'
import { InventoryItem } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const dynamic = 'force-dynamic';

async function getInventory(): Promise<InventoryItem[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  try {
    const res = await fetch(`${API_URL}/inventory/real-time`, { 
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

async function getInventoryItems(): Promise<any[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  try {
    const res = await fetch(`${API_URL}/almacen/items`, { 
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || '';
  const [inventory, rawItems] = await Promise.all([
    getInventory(),
    getInventoryItems()
  ]);
  
  const totalValue = inventory.reduce((sum, item) => sum + (item.valor_total_stock || 0), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.stock_actual, 0);
  const lowStockCount = inventory.filter(item => item.low_stock_alert).length;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
      {/* Header section with refined spacing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#1f3d2e] tracking-tight">
            Panel Principal
          </h2>
          <p className="text-[#1f3d2e]/60 font-medium text-base">
            Resumen de tu inventario y exportación de reportes.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <a
              id="btn-export-excel"
              href={`${API_URL}/reports/export/inventory?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden flex items-center justify-center gap-2 px-6 h-12 bg-white text-[#1f3d2e] border border-gray-200 font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-md hover:border-[#1f3d2e]/30 transition-all active:scale-[0.98] shadow-sm w-full sm:w-auto"
            >
              <DownloadIcon className="w-5 h-5 text-[#1f3d2e]/70 group-hover:text-[#1f3d2e] transition-colors" />
              Excel
            </a>
            <a
              id="btn-export-pdf"
              href={`${API_URL}/reports/export/pdf?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden flex items-center justify-center gap-2 px-6 h-12 bg-gradient-to-r from-[#c96f4a] to-[#b85c37] text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-6px_rgba(201,111,74,0.5)] transition-all active:scale-[0.98] shadow-sm w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <FileTextIcon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">PDF</span>
            </a>
        </div>
      </div>

      {/* KPI Cards with hover effects and consistent shadows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
           <div className="w-14 h-14 rounded-xl bg-[#1f3d2e]/5 text-[#1f3d2e] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
             <PackageIcon className="w-6 h-6" />
           </div>
           <div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Valor Total</p>
             <p className="text-2xl font-black text-[#1f3d2e]">${totalValue.toFixed(2)}</p>
           </div>
        </div>
        <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
           <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
             <HexagonIcon className="w-6 h-6" />
           </div>
           <div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Productos en Stock</p>
             <p className="text-2xl font-black text-[#1f3d2e]">{totalItems}</p>
           </div>
        </div>
        <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
           <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
             <AlertTriangleIcon className="w-6 h-6" />
           </div>
           <div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Alertas de Stock</p>
             <p className="text-2xl font-black text-red-600">{lowStockCount}</p>
           </div>
        </div>
      </div>
      
       {/* Small list instead of full table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden min-h-[300px] flex flex-col">
        <div className="px-8 py-5 border-b border-gray-100/60 bg-white/40">
          <h3 className="text-lg font-extrabold text-[#1f3d2e]">Envases Llenos (Listos para Venta)</h3>
        </div>
        
        {inventory.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12 px-6 text-center text-gray-400">
             <div className="flex flex-col items-center max-w-sm">
               <div className="w-16 h-16 bg-[#1f3d2e]/5 rounded-full flex items-center justify-center mb-4">
                 <PackageIcon className="w-8 h-8 text-[#1f3d2e]/40" />
               </div>
               <p className="font-bold text-[#1f3d2e] mb-1">Inventario Vacío</p>
             </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/60 max-h-[350px] overflow-y-auto">
             {inventory.map(item => (
                <div key={`pres-${item.presentation_id}`} className="flex items-center justify-between px-8 py-4 hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                       <HexagonIcon className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-bold text-[#1f3d2e] text-sm">{item.presentation_name}</p>
                       <p className="text-xs text-gray-500">{item.weight_grams}g</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`font-black text-lg ${item.low_stock_alert ? 'text-red-600' : 'text-[#2c4c3b]'}`}>
                       {item.stock_actual} und.
                     </p>
                     <p className="text-xs text-gray-400">${item.valor_total_stock?.toFixed(2)}</p>
                  </div>
                </div>
             ))}
          </div>
        )}

        <div className="px-8 py-5 border-y border-gray-100/60 bg-white/40">
          <h3 className="text-lg font-extrabold text-[#1f3d2e]">Materia Prima: Mieles (Cubetas y Galones)</h3>
        </div>
        <div className="divide-y divide-gray-100/60 max-h-[250px] overflow-y-auto">
             {rawItems.filter(i => i.category === 'BULK_HONEY').map(item => {
                 const isAgave = item.name.toLowerCase().includes('agave');
                 const divider = isAgave ? 25 : 27;
                 const format = isAgave ? 'Galones' : 'Cubetas';
                 const qty = Math.floor(item.currentStock / divider);
                 return (
                    <div key={`raw-${item.id}`} className="flex items-center justify-between px-8 py-4 hover:bg-white/40 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                           <HexagonIcon className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="font-bold text-[#1f3d2e] text-sm">{item.name}</p>
                           <p className="text-xs text-gray-500">{item.currentStock} kg totales</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`font-black text-lg ${item.currentStock <= item.minStock ? 'text-red-600' : 'text-[#2c4c3b]'}`}>
                           {qty} {format}
                         </p>
                      </div>
                    </div>
                 );
             })}
        </div>

        <div className="px-8 py-5 border-y border-gray-100/60 bg-white/40">
          <h3 className="text-lg font-extrabold text-[#1f3d2e]">Envases Vacíos</h3>
        </div>
        <div className="divide-y divide-gray-100/60 max-h-[250px] overflow-y-auto">
             {rawItems.filter(i => i.category === 'CONTAINER').map(item => (
                <div key={`raw-${item.id}`} className="flex items-center justify-between px-8 py-4 hover:bg-white/40 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                       <PackageIcon className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-bold text-[#1f3d2e] text-sm">{item.name}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`font-black text-lg ${item.currentStock <= item.minStock ? 'text-red-600' : 'text-[#2c4c3b]'}`}>
                       {item.currentStock} und.
                     </p>
                  </div>
                </div>
             ))}
        </div>
      </div>

    </div>
  )
}
