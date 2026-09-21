'use client';
import { useState, useEffect } from 'react';
import { HexagonIcon, PackageIcon, AlertTriangleIcon, PlusIcon } from '@/components/Icons';
import { apiFetch } from '@/lib/apiClient';
import GeofenceWrapper from '@/components/GeofenceWrapper';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  isActive: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTAINER: 'Envases Vacíos',
  BULK_HONEY: 'Miel a Granel',
  DEHYDRATED: 'Deshidratados',
};

const UNIT_LABELS: Record<string, string> = {
  PIECE: 'Piezas',
  KG: 'Kilogramos',
  GRAM: 'Gramos',
};

const defaultForm = { name: '', category: 'CONTAINER', unit: 'PIECE', minStock: '0', costPerUnit: '0' };

export default function Almacen() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  // Entry form
  const [selectedItemId, setSelectedItemId] = useState('');
  const [formatType, setFormatType] = useState('PIEZA');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState('');

  // Item management modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  async function fetchData() {
    try {
      const res = await apiFetch('/almacen/items');
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
  }

  useEffect(() => { fetchData(); }, []);

  // ── Entry Form ────────────────────────────────────────────
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEntrySuccess('');
    try {
      let baseQty = Number(quantity);
      if (formatType === 'CUBETA') baseQty = baseQty * 27;
      if (formatType === 'GALON') baseQty = baseQty * 25;

      const res = await apiFetch('/almacen/entradas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: Number(selectedItemId),
          formatType,
          formatQuantity: Number(quantity),
          totalBaseQuantity: baseQty
        })
      });
      if (res.ok) {
        setQuantity(''); setSelectedItemId('');
        setEntrySuccess('¡Entrada registrada correctamente!');
        fetchData();
        setTimeout(() => setEntrySuccess(''), 3000);
      }
    } catch (e) { console.error(e); }
    setIsSubmitting(false);
  };

  // ── Item Modal ────────────────────────────────────────────
  const openNew = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setModalSuccess(''); setModalError('');
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      minStock: String(item.minStock),
      costPerUnit: String(item.costPerUnit ?? 0),
    });
    setModalSuccess(''); setModalError('');
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalSuccess(''); setModalError('');
    try {
      const payload = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        minStock: Number(form.minStock),
        costPerUnit: Number(form.costPerUnit),
        currentStock: editingItem ? editingItem.currentStock : 0,
        isActive: editingItem ? editingItem.isActive : true,
      };

      let res;
      if (editingItem) {
        res = await apiFetch(`/almacen/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/almacen/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setModalSuccess(editingItem ? '¡Item actualizado!' : '¡Item creado correctamente!');
        fetchData();
        setTimeout(() => { setShowModal(false); setModalSuccess(''); }, 1500);
      } else {
        setModalError('Error al guardar. Intenta de nuevo.');
      }
    } catch { setModalError('Error de conexión.'); }
    setModalSubmitting(false);
  };

  const toggleActive = async (item: InventoryItem) => {
    try {
      await apiFetch(`/almacen/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: !item.isActive })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
      <GeofenceWrapper>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-4xl font-black text-[#2c4c3b] tracking-tight mb-2">Almacén de Materia Prima</h2>
            <p className="text-gray-500 font-medium">Controla el inventario de mieles, envases y deshidratados.</p>
          </div>
          <button
            onClick={openNew}
            className="self-start flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2c4c3b] to-[#3a634d] text-white font-bold rounded-2xl hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95 text-sm whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            Nuevo Material
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Col: Entry Form */}
          <div className="md:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white/40 sticky top-24">
              <h3 className="text-lg font-extrabold mb-4 text-[#2c4c3b]">Registrar Entrada</h3>

              {entrySuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold animate-in fade-in">
                  {entrySuccess}
                </div>
              )}

              <form onSubmit={handleEntrySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Material</label>
                  <select
                    required value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}
                    className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e07a5f] font-medium text-gray-800"
                  >
                    <option value="" disabled>Selecciona un material...</option>
                    {items.filter(i => i.isActive).map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({CATEGORY_LABELS[i.category] ?? i.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Formato de Entrada</label>
                  <select
                    required value={formatType} onChange={e => setFormatType(e.target.value)}
                    className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e07a5f] font-medium text-gray-800"
                  >
                    <option value="PIEZA">Piezas / Unidades</option>
                    <option value="KILO">Kilos sueltos</option>
                    <option value="CUBETA">Cubetas (27 kg)</option>
                    <option value="GALON">Galones (25 kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Cantidad ({formatType}S)</label>
                  <input
                    required value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" step="any"
                    className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b] font-medium text-gray-800"
                    placeholder="Ej. 10"
                  />
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-[#2c4c3b] to-[#3a634d] text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Registrar Entrada'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Col: Inventory by Category */}
          <div className="md:col-span-2 space-y-6">
            {(['BULK_HONEY', 'DEHYDRATED', 'CONTAINER'] as const).map(category => (
              <div key={category} className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between bg-white/40">
                  <h3 className="text-lg font-extrabold text-[#1f3d2e]">{CATEGORY_LABELS[category]}</h3>
                </div>
                <div className="divide-y divide-gray-100/60">
                  {items.filter(i => i.category === category).map(item => (
                    <div key={item.id} className={`flex items-center justify-between px-6 py-3 hover:bg-white/40 transition-colors ${!item.isActive ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                          {category === 'CONTAINER' ? <PackageIcon className="w-5 h-5" /> : <HexagonIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-[#1f3d2e] text-sm">{item.name}</p>
                          <p className="text-xs text-gray-400">${Number(item.costPerUnit ?? 0).toFixed(2)} / {UNIT_LABELS[item.unit] ?? item.unit}</p>
                          {item.isActive && item.currentStock <= item.minStock && (
                            <span className="text-[10px] uppercase font-bold text-red-500 flex items-center gap-1">
                              <AlertTriangleIcon className="w-3 h-3" /> Bajo Stock
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`font-black text-lg ${item.currentStock <= item.minStock && item.isActive ? 'text-red-600' : 'text-[#2c4c3b]'}`}>
                            {Number(item.currentStock).toFixed(2)} <span className="text-xs font-bold text-gray-400 uppercase">{UNIT_LABELS[item.unit] ?? item.unit}</span>
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(item)}
                            className="px-3 py-1.5 text-xs font-bold bg-[#2c4c3b]/10 text-[#2c4c3b] rounded-lg hover:bg-[#2c4c3b]/20 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleActive(item)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${item.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            {item.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.filter(i => i.category === category).length === 0 && (
                    <div className="py-6 text-center text-gray-400 text-sm">
                      Sin ítems en esta categoría. <button onClick={openNew} className="text-[#2c4c3b] font-bold underline">Agregar uno</button>.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Modal de Creación/Edición ─────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black text-[#2c4c3b] mb-6">
                {editingItem ? `Editar: ${editingItem.name}` : 'Nuevo Material'}
              </h3>

              {modalSuccess && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-bold">{modalSuccess}</div>}
              {modalError && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold">{modalError}</div>}

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre</label>
                  <input
                    required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} type="text"
                    pattern="^[A-Za-z0-9ñÑáéíóúÁÉÍÓÚ\s.,_-]{2,100}$"
                    title="Solo letras, números, espacios y caracteres básicos de puntuación"
                    maxLength={100}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b]/30 font-medium"
                    placeholder="Ej. Cubeta 27kg, Polen Silvestre..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Categoría</label>
                    <select
                      value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b]/30 font-medium"
                    >
                      <option value="CONTAINER">Envases Vacíos</option>
                      <option value="BULK_HONEY">Miel a Granel</option>
                      <option value="DEHYDRATED">Deshidratados</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Unidad</label>
                    <select
                      value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b]/30 font-medium"
                    >
                      <option value="PIECE">Piezas</option>
                      <option value="KG">Kilogramos</option>
                      <option value="GRAM">Gramos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Stock Mínimo</label>
                    <input
                      required value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} type="number" min="0" step="any"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c4c3b]/30 font-medium"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Precio / Costo ($)</label>
                    <input
                      required value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))} type="number" min="0" step="0.01"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/40 focus:border-[#e07a5f] font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit" disabled={modalSubmitting}
                    className="flex-1 py-3 bg-gradient-to-r from-[#2c4c3b] to-[#3a634d] text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    {modalSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </GeofenceWrapper>
    </div>
  );
}
