'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, PackageIcon, HexagonIcon } from '@/components/Icons';
import { Presentacion } from '@/types';
import { apiFetch } from '@/lib/apiClient';

interface HistoryItem {
  id: number;
  itemType: string;
  presentationName: string;
  movementType: string;
  quantity: number;
  referenceType: string;
  movementDate: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  isActive: boolean;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function MovementBadge({ type }: { type: string }) {
  const isIn = type === 'IN';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold
      ${isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isIn ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {isIn ? 'Entrada' : 'Salida'}
    </span>
  );
}

export default function Presentaciones() {
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  const [selectedPresId, setSelectedPresId] = useState<number | 'NEW' | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [minStock, setMinStock] = useState('');
  const [envaseId, setEnvaseId] = useState('');
  const [mielId, setMielId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  async function fetchData() {
    try {
      const [presRes, histRes, invRes] = await Promise.all([
        apiFetch('/presentations'),
        apiFetch('/inventory/history'),
        apiFetch('/almacen/items')
      ]);
      if (presRes.ok) setPresentaciones(await presRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (invRes.ok) setInventoryItems(await invRes.json());
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const handleSelect = (id: number | 'NEW') => {
    setSelectedPresId(id);
    setSuccess('');
    if (id === 'NEW') {
      setName(''); setWeight(''); setMinStock(''); setEnvaseId(''); setMielId('');
    } else {
      const p = presentaciones.find(x => x.id === id);
      if (p) {
        setName(p.name);
        setWeight(p.weightGrams.toString());
        setMinStock(p.minStock.toString());
        // We don't fetch recipes for editing yet, so just leave envase/miel empty for existing
        setEnvaseId('');
        setMielId('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess('');
    try {
      if (selectedPresId === 'NEW') {
        // 1. Create Presentation
        const res = await apiFetch('/presentations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, weightGrams: Number(weight), minStock: Number(minStock), containerCost: 0 })
        });
        if (res.ok) {
          const newPres = await res.json();
          // 2. Create Recipes
          if (envaseId) {
            await apiFetch('/almacen/recipes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ presentationId: newPres.id, inventoryItemId: Number(envaseId), quantityRequired: 1 })
            });
          }
          if (mielId) {
            await apiFetch('/almacen/recipes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ presentationId: newPres.id, inventoryItemId: Number(mielId), quantityRequired: Number(weight) / 1000 })
            });
          }
          setSuccess('¡Presentación registrada correctamente!');
          fetchData();
          setSelectedPresId(null);
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        // Edit existing
        const res = await apiFetch(`/presentations/${selectedPresId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, minStock: Number(minStock) })
        });
        if (res.ok) {
          setSuccess('¡Presentación actualizada correctamente!');
          fetchData();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  const envases = inventoryItems.filter(i => i.category === 'CONTAINER' && i.isActive);
  const mieles = inventoryItems.filter(i => i.category === 'BULK_HONEY' && i.isActive);

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h2 className="text-4xl font-black text-[#2c4c3b] tracking-tight mb-2">Presentaciones y Recetas</h2>
        <p className="text-gray-500 font-medium">Selecciona una presentación existente o crea una nueva definiendo su envase y contenido.</p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 border border-white/40">
        
        {/* Selection Dropdown */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-[#2c4c3b] mb-2">Seleccionar Presentación</label>
          <select 
            className="w-full bg-white/60 border border-[#2c4c3b]/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e07a5f] font-medium text-gray-800"
            value={selectedPresId || ''}
            onChange={(e) => handleSelect(e.target.value === 'NEW' ? 'NEW' : Number(e.target.value))}
          >
            <option value="" disabled>-- Selecciona una opción --</option>
            {presentaciones.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.weightGrams}g)</option>
            ))}
            <option value="NEW" className="font-bold text-[#e07a5f]">+ Crear Nueva (Otra)</option>
          </select>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold animate-in fade-in">
            {success}
          </div>
        )}

        {selectedPresId && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
            <h3 className="text-lg font-extrabold mb-4 text-[#2c4c3b] border-b pb-2">
              {selectedPresId === 'NEW' ? 'Nueva Presentación' : 'Editar Presentación'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre Comercial</label>
                <input
                  required value={name} onChange={e => setName(e.target.value)} type="text"
                  pattern="^[A-Za-z0-9ñÑáéíóúÁÉÍÓÚ\s.,_-]{2,100}$"
                  title="Solo letras, números, espacios y caracteres básicos de puntuación"
                  maxLength={100}
                  className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/40 focus:border-[#e07a5f] font-medium text-gray-800"
                  placeholder="Ej. Frasco 500g Limón"
                  disabled={selectedPresId !== 'NEW'} // Disable editing name for now if no PUT endpoint
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Min. Stock (Alertas)</label>
                <input
                  required value={minStock} onChange={e => setMinStock(e.target.value)} type="number" min="0"
                  className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b]/30 focus:border-[#2c4c3b] font-medium text-gray-800"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Peso de Miel (g)</label>
                <input
                  required value={weight} onChange={e => setWeight(e.target.value)} type="number" min="1"
                  className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b]/30 focus:border-[#2c4c3b] font-medium text-gray-800"
                  placeholder="500"
                  disabled={selectedPresId !== 'NEW'}
                />
              </div>
              {selectedPresId === 'NEW' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Envase</label>
                    <select required value={envaseId} onChange={e => setEnvaseId(e.target.value)} className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/40 font-medium text-gray-800">
                      <option value="" disabled>Selecciona...</option>
                      {envases.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Tipo de Miel</label>
                    <select required value={mielId} onChange={e => setMielId(e.target.value)} className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/40 font-medium text-gray-800">
                      <option value="" disabled>Selecciona...</option>
                      {mieles.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit" disabled={isSubmitting}
              className="w-full py-3 mt-4 bg-gradient-to-r from-[#2c4c3b] to-[#3a634d] text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </form>
        )}
      </div>

      {/* History */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100/60 flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-[#2c4c3b]">Historial de Movimientos</h3>
          <span className="text-xs text-gray-400 font-medium">Últimos 50 registros</span>
        </div>

        {history.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-medium flex flex-col items-center">
            <PackageIcon className="w-12 h-12 mb-3 text-gray-300" />
            <p>Sin movimientos registrados aún.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/60">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between px-8 py-4 hover:bg-white/40 transition-colors group">
                <div className="flex items-center gap-4">
                  <MovementBadge type={item.movementType} />
                  <div>
                    <p className="font-bold text-[#2c4c3b] text-sm group-hover:text-[#e07a5f] transition-colors">
                      {item.presentationName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.referenceType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-base ${item.movementType === 'IN' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {item.movementType === 'IN' ? '+' : '-'}{item.quantity}
                    <span className="text-xs font-medium text-gray-400 ml-1">
                      {item.itemType === 'BULK_HONEY' ? 'kg' : 'und.'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.movementDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
