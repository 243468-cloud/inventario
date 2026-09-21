'use client';
import { useState, useEffect } from 'react';
import { CheckCircleIcon, AlertCircleIcon, PackageOpenIcon, ArrowRightCircleIcon, HexagonIcon } from '@/components/Icons';
import { Presentacion } from '@/types';
import { apiFetch } from '@/lib/apiClient';
import GeofenceWrapper from '@/components/GeofenceWrapper';

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2c4c3b] text-white text-sm font-black flex items-center justify-center shadow-md">
        {number}
      </div>
      <div>
        <p className="font-bold text-[#2c4c3b] text-sm">{title}</p>
        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function Produccion() {
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiFetch('/presentations?is_active=eq.true')
      .then(res => res.json())
      .then(data => setPresentaciones(data))
      .catch(console.error);
  }, []);

  const selectedPresentation = presentaciones.find(p => String(p.id) === selectedId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiFetch('/inventory/production-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_presentation_id: Number(selectedId),
          p_quantity_produced: Number(quantity)
        })
      });
      if (res.ok) {
        setIsError(false);
        setMessage('Lote registrado exitosamente. Inventario actualizado.');
        setSelectedId('');
        setQuantity('');
        setTimeout(() => setMessage(''), 4000);
      } else {
        setIsError(true);
        setMessage('No se pudo registrar el lote. Verifica los datos.');
      }
    } catch {
      setIsError(true);
      setMessage('Error de conexión con el servidor.');
    }
    setIsSubmitting(false);
  };

  const honeyUsed = selectedPresentation && quantity
    ? ((selectedPresentation.weightGrams * Number(quantity)) / 1000).toFixed(3)
    : null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-12 font-sans selection:bg-[#2c4c3b] selection:text-white">
      <GeofenceWrapper>
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 mt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#e07a5f] to-[#e89a85] text-white shadow-lg shadow-[#e07a5f]/25 flex items-center justify-center flex-shrink-0">
            <PackageOpenIcon />
          </div>
          <div>
            <h2 className="text-3xl font-black text-[#2c4c3b] tracking-tight">Captura de Producción</h2>
            <p className="text-gray-500 text-sm mt-0.5">Registra un lote de envasado de miel</p>
          </div>
        </div>

      {/* How it works */}
      <div className="bg-[#f1f6f3]/80 backdrop-blur border border-[#2c4c3b]/10 rounded-2xl p-5 mb-6">
        <p className="text-xs font-black text-[#2c4c3b]/60 uppercase tracking-widest mb-4">¿Para qué sirve esta pantalla?</p>
        <div className="space-y-4">
          <StepCard
            number="1"
            title="Selecciona el tipo de envase"
            desc="Elige qué presentación (frasco, tarro, bolsa) vas a llenar en este lote de producción."
          />
          <StepCard
            number="2"
            title="Indica cuántas piezas produjiste"
            desc="El sistema calcula automáticamente los kilogramos de miel a granel que se consumirán para ese lote."
          />
          <StepCard
            number="3"
            title="Registra la entrada al inventario"
            desc="Al confirmar, se descuenta la miel a granel y se suma el stock de la presentación elegida. Todo queda en el historial."
          />
        </div>
      </div>

      {/* Form card */}
      <div className="relative bg-white/70 backdrop-blur-2xl p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-white/50">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#2c4c3b]/8 to-[#e07a5f]/8 rounded-[1.8rem] blur-xl -z-10" />

        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl mb-6 font-bold text-sm animate-in zoom-in-95 duration-300
            ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {isError ? <AlertCircleIcon /> : <CheckCircleIcon />}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Presentation card picker */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
              Tipo de Presentación
            </label>
            {presentaciones.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No hay presentaciones activas registradas.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {presentaciones.map(p => {
                  const active = String(p.id) === selectedId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(String(p.id))}
                      className={`relative flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all duration-200 group
                        ${ active
                          ? 'border-[#2c4c3b] bg-[#2c4c3b] text-white shadow-lg shadow-[#2c4c3b]/20 scale-[1.02]'
                          : 'border-gray-200 bg-white/60 text-[#2c4c3b] hover:border-[#2c4c3b]/40 hover:bg-white/80 hover:scale-[1.01]'
                        }`}
                    >
                      <HexagonIcon className="w-5 h-5 mb-1" />
                      <span className="font-bold text-sm leading-tight">{p.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        active ? 'bg-white/20 text-white' : 'bg-[#2c4c3b]/10 text-[#2c4c3b]'
                      }`}>
                        {p.weightGrams}g
                      </span>
                      {active && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#2c4c3b] rounded-full" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {/* Hidden input to satisfy required form validation */}
            <input type="hidden" required value={selectedId} />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              Cantidad Producida (unidades)
            </label>
            <input
              required
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              type="number"
              min="1"
              className="w-full bg-white/60 border border-gray-200 rounded-xl px-4 py-3.5 text-3xl text-center focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/30 focus:border-[#e07a5f] transition-all font-black text-[#e07a5f] placeholder-gray-300"
              placeholder="0"
            />
          </div>

          {/* Preview */}
          {honeyUsed && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-amber-700">
                <HexagonIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Miel a granel que se descontará:</span>
              </div>
              <span className="font-black text-amber-700 text-lg">{honeyUsed} kg</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="relative overflow-hidden w-full group bg-gradient-to-r from-[#e07a5f] to-[#d46d53] text-white font-bold text-base py-4 rounded-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-[0_8px_20px_-5px_rgba(224,122,95,0.4)] disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              {isSubmitting ? 'Procesando Lote...' : (
                <>
                  <ArrowRightCircleIcon />
                  Procesar Entrada a Inventario
                </>
              )}
            </span>
          </button>
        </form>
      </div>
      </div>
      </GeofenceWrapper>
    </div>
  );
}
