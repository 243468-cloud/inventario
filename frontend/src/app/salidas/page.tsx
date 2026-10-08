'use client';
import { useState, useEffect } from 'react';
import { 
  PackageMinusIcon, 
  CheckCircleIcon, 
  AlertCircleIcon, 
  PackageIcon, 
  HexagonIcon, 
  AlertTriangleIcon,
  ArrowUpRightIcon
} from '@/components/Icons';
import { apiFetch } from '@/lib/apiClient';
import GeofenceWrapper from '@/components/GeofenceWrapper';

interface PresentationItem {
  id: number;
  name: string;
  weightGrams: number;
  isActive: boolean;
  minStock: number;
  currentStock?: number;
}

interface RealTimeInventoryItem {
  presentation_id: number;
  presentation_name: string;
  stock_actual: number;
}

interface WarehouseItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  isActive: boolean;
}

interface SalidaMovement {
  id: number;
  itemType: string;
  category?: string;
  name: string;
  movementType: string;
  quantity: number;
  referenceType: string;
  movementDate: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTAINER:  'Envases Vacíos',
  BULK_HONEY: 'Miel y Derivados',
  DEHYDRATED: 'Deshidratados',
  CHEESE:     'Quesos',
  OTHER:      'Extras',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function SalidasPage() {
  const [activeTab, setActiveTab] = useState<'PRODUCTO' | 'ALMACEN'>('PRODUCTO');

  // Data states
  const [presentations, setPresentaciones] = useState<PresentationItem[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, number>>({});
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [salidasHistory, setSalidasHistory] = useState<SalidaMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State: Producto Terminado
  const [presId, setPresId] = useState('');
  const [presQuantity, setPresQuantity] = useState('');
  const [presReason, setPresReason] = useState('VENTA');
  const [presNotes, setPresNotes] = useState('');
  const [presSubmitting, setPresSubmitting] = useState(false);
  const [presMessage, setPresMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Form State: Almacén
  const [whItemId, setWhItemId] = useState('');
  const [whFormat, setWhFormat] = useState('PIEZA');
  const [whQuantity, setWhQuantity] = useState('');
  const [whReason, setWhReason] = useState('VENTA_DIRECTA');
  const [whNotes, setWhNotes] = useState('');
  const [whSubmitting, setWhSubmitting] = useState(false);
  const [whMessage, setWhMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function loadData() {
    try {
      const [presRes, rtRes, whRes, salRes] = await Promise.all([
        apiFetch('/presentations?is_active=eq.true'),
        apiFetch('/inventory/real-time'),
        apiFetch('/almacen/items'),
        apiFetch('/inventory/salidas')
      ]);

      if (presRes.ok) {
        setPresentaciones(await presRes.json());
      }
      if (rtRes.ok) {
        const rtData: RealTimeInventoryItem[] = await rtRes.json();
        const map: Record<number, number> = {};
        rtData.forEach(item => {
          map[item.presentation_id] = item.stock_actual;
        });
        setStockMap(map);
      }
      if (whRes.ok) {
        setWarehouseItems(await whRes.json());
      }
      if (salRes.ok) {
        setSalidasHistory(await salRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── Salida de Producto Terminado ─────────────────────────
  const handlePresentationExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPresSubmitting(true);
    setPresMessage(null);

    const qty = Number(presQuantity);
    const available = stockMap[Number(presId)] || 0;

    if (qty > available) {
      setPresMessage({
        text: `Stock insuficiente. Solo hay ${available} piezas disponibles de este producto.`,
        isError: true
      });
      setPresSubmitting(false);
      return;
    }

    try {
      const res = await apiFetch('/inventory/presentation-exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: Number(presId),
          quantity: qty,
          reason: presReason,
          notes: presNotes
        })
      });

      if (res.ok) {
        setPresMessage({
          text: '¡Salida registrada exitosamente! El inventario se ha actualizado.',
          isError: false
        });
        setPresQuantity('');
        setPresNotes('');
        setPresId('');
        loadData();
        setTimeout(() => setPresMessage(null), 4000);
      } else {
        const err = await res.json().catch(() => null);
        setPresMessage({
          text: err?.message || 'No se pudo registrar la salida.',
          isError: true
        });
      }
    } catch {
      setPresMessage({ text: 'Error de conexión con el servidor.', isError: true });
    }
    setPresSubmitting(false);
  };

  // ── Salida de Almacén ────────────────────────────────────
  const handleWarehouseExit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhSubmitting(true);
    setWhMessage(null);

    const qty = Number(whQuantity);
    let baseQty = qty;
    if (whFormat === 'CUBETA') baseQty = qty * 24.5;
    if (whFormat === 'GALON') baseQty = qty * 25;

    const selectedItem = warehouseItems.find(i => i.id === Number(whItemId));
    if (selectedItem && baseQty > selectedItem.currentStock) {
      setWhMessage({
        text: `Stock insuficiente. Disponible: ${selectedItem.currentStock} ${selectedItem.unit}.`,
        isError: true
      });
      setWhSubmitting(false);
      return;
    }

    try {
      const res = await apiFetch('/almacen/salidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: Number(whItemId),
          formatType: whFormat,
          formatQuantity: qty,
          totalBaseQuantity: baseQty,
          reason: whReason,
          notes: whNotes
        })
      });

      if (res.ok) {
        setWhMessage({
          text: '¡Salida de almacén registrada correctamente! Stock descontado.',
          isError: false
        });
        setWhQuantity('');
        setWhNotes('');
        setWhItemId('');
        loadData();
        setTimeout(() => setWhMessage(null), 4000);
      } else {
        const err = await res.json().catch(() => null);
        setWhMessage({
          text: err?.message || 'Error al registrar la salida de almacén.',
          isError: true
        });
      }
    } catch {
      setWhMessage({ text: 'Error de conexión con el servidor.', isError: true });
    }
    setWhSubmitting(false);
  };

  const selectedPresStock = presId ? (stockMap[Number(presId)] ?? 0) : null;
  const selectedWhItem = whItemId ? warehouseItems.find(i => i.id === Number(whItemId)) : null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16 font-sans text-stone-800">
      <GeofenceWrapper>
        <div className="max-w-4xl mx-auto pt-6 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-stone-200/80 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#9e2a2b] to-[#c1121f] text-white shadow-lg shadow-red-900/20 flex items-center justify-center flex-shrink-0">
                <PackageMinusIcon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#2c4c3b] tracking-tight">
                  Registro de Salidas
                </h1>
                <p className="text-stone-500 text-sm mt-0.5">
                  Descuenta ventas, mermas, degustaciones o ajustes de inventario
                </p>
              </div>
            </div>

            {/* Quick Pill Tabs */}
            <div className="inline-flex p-1 bg-stone-200/70 rounded-2xl self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('PRODUCTO')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'PRODUCTO'
                    ? 'bg-white text-[#2c4c3b] shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <PackageIcon className="w-4 h-4" />
                <span>Producto Terminado</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALMACEN')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'ALMACEN'
                    ? 'bg-white text-[#2c4c3b] shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <HexagonIcon className="w-4 h-4" />
                <span>Almacén / Insumos</span>
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgb(0,0,0,0.05)] border border-stone-200/80 mb-10">
            
            {/* TAB 1: PRODUCTO TERMINADO (PRESENTACIONES) */}
            {activeTab === 'PRODUCTO' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-stone-900">
                      Salida de Producto Envasado
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      Frascos y botellas listos para venta al cliente o baja por merma.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-xs font-bold">
                    14 Presentaciones
                  </span>
                </div>

                {presMessage && (
                  <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold animate-in zoom-in-95 ${
                    presMessage.isError 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {presMessage.isError ? <AlertCircleIcon /> : <CheckCircleIcon />}
                    <span>{presMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handlePresentationExit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Selector de Presentación */}
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                          Presentación a descontar *
                        </label>
                        {selectedPresStock !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            selectedPresStock > 0 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            Stock actual: {selectedPresStock} pzas
                          </span>
                        )}
                      </div>
                      <select
                        required
                        value={presId}
                        onChange={e => setPresId(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      >
                        <option value="" disabled>Selecciona la presentación...</option>
                        {presentations.map(p => {
                          const stock = stockMap[p.id] ?? 0;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} {stock > 0 ? `(Stock: ${stock} pza)` : '(Agotado: 0 pza)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Cantidad a retirar */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Cantidad (Piezas) *
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        max={selectedPresStock !== null && selectedPresStock > 0 ? selectedPresStock : undefined}
                        step="1"
                        placeholder="Ej. 6"
                        value={presQuantity}
                        onChange={e => setPresQuantity(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      />
                      {selectedPresStock !== null && Number(presQuantity) > selectedPresStock && (
                        <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1">
                          <AlertTriangleIcon className="w-3.5 h-3.5" />
                          Supera las {selectedPresStock} piezas disponibles en almacén
                        </p>
                      )}
                    </div>

                    {/* Motivo de la salida */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Motivo de Salida *
                      </label>
                      <select
                        required
                        value={presReason}
                        onChange={e => setPresReason(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      >
                        <option value="VENTA">Venta a Cliente / Tienda</option>
                        <option value="MERMA">Merma / Frasco Dañado o Roto</option>
                        <option value="DEGUSTACION">Degustación / Muestra</option>
                        <option value="OBSEQUIO">Obsequio / Promoción</option>
                        <option value="AJUSTE">Ajuste de Inventario Físico</option>
                      </select>
                    </div>

                    {/* Notas / Observaciones */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Notas o Referencia (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Venta al mostrador, Ticket #312, Frasco despostillado en transporte..."
                        value={presNotes}
                        onChange={e => setPresNotes(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={presSubmitting || (selectedPresStock !== null && selectedPresStock === 0)}
                    className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#9e2a2b] to-[#ba181b] hover:from-[#80191a] hover:to-[#a01416] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <PackageMinusIcon className="w-5 h-5" />
                    <span>{presSubmitting ? 'Registrando salida...' : 'Confirmar Salida de Producto'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: ALMACÉN E INSUMOS */}
            {activeTab === 'ALMACEN' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-stone-900">
                      Salida de Materia Prima / Insumos
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                      Descuenta envases vacíos, cubetas de miel a granel, quesos o extras.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded-full text-xs font-bold">
                    Almacén General
                  </span>
                </div>

                {whMessage && (
                  <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-bold animate-in zoom-in-95 ${
                    whMessage.isError 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    {whMessage.isError ? <AlertCircleIcon /> : <CheckCircleIcon />}
                    <span>{whMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleWarehouseExit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Material */}
                    <div className="sm:col-span-2">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                          Material / Insumo *
                        </label>
                        {selectedWhItem && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                            Disponible: {selectedWhItem.currentStock} {selectedWhItem.unit}
                          </span>
                        )}
                      </div>
                      <select
                        required
                        value={whItemId}
                        onChange={e => setWhItemId(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      >
                        <option value="" disabled>Selecciona un material...</option>
                        {warehouseItems.filter(i => i.isActive).map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} — {CATEGORY_LABELS[item.category] || item.category} (Stock: {item.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Formato */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Formato de Salida *
                      </label>
                      <select
                        required
                        value={whFormat}
                        onChange={e => setWhFormat(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      >
                        <option value="PIEZA">Piezas / Unidades</option>
                        <option value="KILO">Kilos sueltos</option>
                        <option value="CUBETA">Cubeta completa (27 kg)</option>
                        <option value="GALON">Galón completo (25 kg)</option>
                      </select>
                    </div>

                    {/* Cantidad */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Cantidad ({whFormat}s) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Ej. 1"
                        value={whQuantity}
                        onChange={e => setWhQuantity(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      />
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Motivo *
                      </label>
                      <select
                        required
                        value={whReason}
                        onChange={e => setWhReason(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      >
                        <option value="VENTA_DIRECTA">Venta Directa</option>
                        <option value="MERMA">Merma / Roto / Dañado</option>
                        <option value="CONSUMO_INTERNO">Consumo Interno</option>
                        <option value="AJUSTE">Ajuste de Conteo Físico</option>
                      </select>
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                        Notas (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Observaciones..."
                        value={whNotes}
                        onChange={e => setWhNotes(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={whSubmitting}
                    className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#9e2a2b] to-[#ba181b] hover:from-[#80191a] hover:to-[#a01416] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <PackageMinusIcon className="w-5 h-5" />
                    <span>{whSubmitting ? 'Registrando...' : 'Confirmar Salida de Almacén'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Historial de Salidas */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_4px_25px_rgb(0,0,0,0.05)] border border-stone-200/80">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  Historial de Salidas Recientes
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Últimos movimientos de baja y salidas confirmadas.
                </p>
              </div>
              <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-black">
                {salidasHistory.length} Registros
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-stone-400 font-semibold text-sm">
                Cargando historial de salidas...
              </div>
            ) : salidasHistory.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                  <PackageMinusIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-stone-600">Aún no se han registrado salidas</p>
                <p className="text-xs text-stone-400 mt-1">
                  Usa el formulario arriba para registrar la primera salida de producto o insumo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-bold">Fecha</th>
                      <th className="py-3 px-4 font-bold">Artículo / Producto</th>
                      <th className="py-3 px-4 font-bold">Cantidad</th>
                      <th className="py-3 px-4 font-bold">Motivo</th>
                      <th className="py-3 px-4 font-bold">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {salidasHistory.map(item => (
                      <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-stone-500 text-xs whitespace-nowrap">
                          {formatDate(item.movementDate)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4 font-black text-red-700 whitespace-nowrap">
                          -{item.quantity} {item.itemType === 'PRESENTATION' ? 'pzas' : ''}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/60">
                            {item.referenceType || 'Salida'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-500 text-xs whitespace-nowrap">
                          {item.itemType === 'PRESENTATION' ? 'Terminado' : 'Almacén'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </GeofenceWrapper>
    </div>
  );
}
