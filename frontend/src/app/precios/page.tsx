'use client';

import { useState, useEffect } from 'react';
import { Presentacion } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import { HexagonIcon, CheckCircleIcon, PackageIcon } from '@/components/Icons';

export default function CostosYPrecios() {
  const [bulkCost, setBulkCost] = useState<number>(0);
  const [editingBulkCost, setEditingBulkCost] = useState<string>('');
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const [bulkRes, presRes] = await Promise.all([
        apiFetch('/costs'),
        apiFetch('/presentations')
      ]);
      if (bulkRes.ok) {
        const costData = await bulkRes.json();
        setBulkCost(costData.cost_per_kg || 0);
        setEditingBulkCost(String(costData.cost_per_kg || 0));
      }
      if (presRes.ok) {
        setPresentaciones(await presRes.json());
      }
    } catch (e) {
      console.error('Error fetching data', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBulkCost = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch('/costs/bulk-honey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost_per_kg: Number(editingBulkCost) })
      });
      if (res.ok) {
        setBulkCost(Number(editingBulkCost));
        showSuccess('Costo de miel actualizado.');
      }
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  const handleUpdateContainerCost = async (id: number, newCost: number) => {
    try {
      const res = await apiFetch(`/presentations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerCost: newCost })
      });
      if (res.ok) {
        setPresentaciones(prev => prev.map(p => p.id === id ? { ...p, containerCost: newCost } : p));
        showSuccess('Costo de envase guardado.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#1f3d2e] tracking-tight">
            Costos y Precios Sugeridos
          </h2>
          <p className="text-[#1f3d2e]/60 font-medium text-base">
            Administra el costo de tu materia prima y calcula precios de venta recomendados.
          </p>
        </div>
        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100 animate-in fade-in">
            <CheckCircleIcon className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Bulk Honey Cost Card */}
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/60 shadow-sm mb-10 flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <HexagonIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Costo Actual Miel a Granel</p>
            <p className="text-sm text-gray-400">¿Cuánto te cuesta producir o comprar 1 kg de miel?</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editingBulkCost}
              onChange={(e) => setEditingBulkCost(e.target.value)}
              className="w-32 bg-white border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-xl font-black text-[#1f3d2e] focus:outline-none focus:border-[#c96f4a] focus:ring-2 focus:ring-[#c96f4a]/20"
            />
          </div>
          <span className="font-bold text-gray-500">/ kg</span>
          <button
            onClick={handleSaveBulkCost}
            disabled={isSaving || Number(editingBulkCost) === bulkCost}
            className="ml-2 px-6 py-3 bg-[#1f3d2e] text-white font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Presentations Pricing Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100/60 bg-white/40">
          <h3 className="text-lg font-extrabold text-[#1f3d2e]">Análisis de Precios por Presentación</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-5 font-bold">Presentación</th>
                <th className="p-5 font-bold">Costo Miel</th>
                <th className="p-5 font-bold">Costo Envase</th>
                <th className="p-5 font-bold text-[#1f3d2e]">Costo Total</th>
                <th className="p-5 font-bold text-emerald-700 bg-emerald-50/30">Sugerido 30%</th>
                <th className="p-5 font-bold text-blue-700 bg-blue-50/30">Sugerido 40%</th>
                <th className="p-5 font-bold text-purple-700 bg-purple-50/30">Sugerido 50%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {presentaciones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <PackageIcon className="w-10 h-10 text-gray-300" />
                      No hay presentaciones activas.
                    </div>
                  </td>
                </tr>
              ) : (
                presentaciones.map(p => {
                  const honeyCost = (p.weightGrams / 1000) * bulkCost;
                  const containerCost = Number(p.containerCost || 0);
                  const totalCost = honeyCost + containerCost;
                  
                  return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-[#2c4c3b]">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.weightGrams}g</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format((p.weightGrams / 1000) * bulkCost)}
                    </td>
                      <td className="p-5">
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={containerCost}
                            onBlur={(e) => {
                              const val = Number(e.target.value);
                              if (val !== containerCost) handleUpdateContainerCost(p.id, val);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-7 pr-2 text-sm font-bold text-[#1f3d2e] focus:outline-none focus:border-[#c96f4a]"
                          />
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="inline-block px-3 py-1 bg-gray-100 text-[#1f3d2e] font-black rounded-lg">
                          ${totalCost.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-5 font-black text-emerald-700 bg-emerald-50/30">
                        ${(totalCost * 1.3).toFixed(2)}
                      </td>
                      <td className="p-5 font-black text-blue-700 bg-blue-50/30">
                        ${(totalCost * 1.4).toFixed(2)}
                      </td>
                      <td className="p-5 font-black text-purple-700 bg-purple-50/30">
                        ${(totalCost * 1.5).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
