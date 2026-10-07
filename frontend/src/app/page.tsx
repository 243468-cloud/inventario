import { cookies } from 'next/headers'
import { PackageIcon, HexagonIcon, AlertTriangleIcon } from '@/components/Icons'
import ExportButtons from '@/components/ExportButtons'
import { InventoryItem } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const dynamic = 'force-dynamic';

const CheeseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12l9-9 9 9v9H3z"/><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

async function getInventory(): Promise<InventoryItem[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  try {
    const res = await fetch(`${API_URL}/inventory/real-time`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getInventoryItems(): Promise<any[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  try {
    const res = await fetch(`${API_URL}/almacen/items`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || '';
  const role = cookieStore.get('user_role')?.value || '';
  const [inventory, rawItems] = await Promise.all([
    getInventory(),
    getInventoryItems()
  ]);
  
  const totalValue = inventory.reduce((sum, item) => sum + (item.valor_total_stock || 0), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.stock_actual, 0);
  const lowStockCount = inventory.filter(item => item.low_stock_alert).length;

  return (
    <div className="max-w-5xl mx-auto pt-2 space-y-6">
      {/* Header Minimalista */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-stone-200/60 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            Panel Principal
          </h2>
          <p className="text-stone-500 text-sm mt-0.5">
            Estado del inventario y existencias en tiempo real.
          </p>
        </div>
        
        {/* Los empleados no pueden ver ni descargar reportes Excel/PDF */}
        <ExportButtons token={token} role={role} />
      </div>

      {/* KPI Cards Minimalistas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Valor Proyectado</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">${totalValue.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
            <PackageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Presentaciones</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{totalItems} <span className="text-xs font-normal text-stone-400">unidades</span></p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
            <HexagonIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Alertas de Stock</p>
            <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-stone-900'}`}>{lowStockCount}</p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-600'}`}>
            <AlertTriangleIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Lista de Inventario Minimalista */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-sm overflow-hidden divide-y divide-stone-100">
        
        {/* Presentaciones envasadas */}
        {inventory.length > 0 && (
          <div>
            <div className="px-6 py-3.5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">Envases Llenos (Producto Terminado)</h3>
              <span className="text-xs text-stone-400 font-medium">{inventory.length} presentaciones</span>
            </div>
            <div className="divide-y divide-stone-100 max-h-[300px] overflow-y-auto">
              {inventory.map(item => (
                <div key={`pres-${item.presentation_id}`} className="flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 transition-colors">
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{item.presentation_name}</p>
                    <p className="text-xs text-stone-400">{item.weight_grams} g</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${item.low_stock_alert ? 'text-amber-600' : 'text-stone-900'}`}>
                      {item.stock_actual} und.
                    </p>
                    <p className="text-xs text-stone-400">${item.valor_total_stock?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Miel y Derivados */}
        {rawItems.some(i => i.category === 'BULK_HONEY') && (
          <div>
            <div className="px-6 py-3.5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">Miel y Derivados</h3>
            </div>
            <div className="divide-y divide-stone-100 max-h-[250px] overflow-y-auto">
              {rawItems.filter(i => i.category === 'BULK_HONEY').map(item => (
                <div key={`raw-${item.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 transition-colors">
                  <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                  <p className={`font-bold text-sm ${item.currentStock <= item.minStock && item.isActive ? 'text-amber-600' : 'text-stone-900'}`}>
                    {item.currentStock} {item.unit === 'KG' ? 'kg' : 'pza'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Envases Vacíos */}
        {rawItems.some(i => i.category === 'CONTAINER') && (
          <div>
            <div className="px-6 py-3.5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">Envases Vacíos</h3>
            </div>
            <div className="divide-y divide-stone-100 max-h-[250px] overflow-y-auto">
              {rawItems.filter(i => i.category === 'CONTAINER').map(item => (
                <div key={`raw-${item.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 transition-colors">
                  <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                  <p className={`font-bold text-sm ${item.currentStock <= item.minStock && item.isActive ? 'text-amber-600' : 'text-stone-900'}`}>
                    {item.currentStock} und.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quesos */}
        {rawItems.some(i => i.category === 'CHEESE') && (
          <div>
            <div className="px-6 py-3.5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">Quesos</h3>
            </div>
            <div className="divide-y divide-stone-100 max-h-[250px] overflow-y-auto">
              {rawItems.filter(i => i.category === 'CHEESE').map(item => (
                <div key={`cheese-${item.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 transition-colors">
                  <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                  <p className={`font-bold text-sm ${item.currentStock <= item.minStock && item.isActive ? 'text-amber-600' : 'text-stone-900'}`}>
                    {item.currentStock} pza
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extras */}
        {rawItems.some(i => i.category === 'OTHER') && (
          <div>
            <div className="px-6 py-3.5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">Extras</h3>
            </div>
            <div className="divide-y divide-stone-100 max-h-[250px] overflow-y-auto">
              {rawItems.filter(i => i.category === 'OTHER').map(item => (
                <div key={`other-${item.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 transition-colors">
                  <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                  <p className={`font-bold text-sm ${item.currentStock <= item.minStock && item.isActive ? 'text-amber-600' : 'text-stone-900'}`}>
                    {item.currentStock} pza
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deshidratados (si hay) */}
        {rawItems.some(i => i.category === 'DEHYDRATED') && (
          <div>
            <div className="px-6 py-3.5 bg-stone-50/70 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider">Deshidratados</h3>
            </div>
            <div className="divide-y divide-stone-100 max-h-[250px] overflow-y-auto">
              {rawItems.filter(i => i.category === 'DEHYDRATED').map(item => (
                <div key={`deh-${item.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 transition-colors">
                  <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                  <p className="font-bold text-sm text-stone-900">{item.currentStock} pza</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
