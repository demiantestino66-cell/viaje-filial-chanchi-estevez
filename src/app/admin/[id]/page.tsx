'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CarnetSocio from '@/components/CarnetSocio';
import Link from 'next/link';

export default function DetalleSocioAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [socio, setSocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    localidad: '',
    socio_racing: '',
    numero_socio_filial: '',
    estado: 'pendiente',
    cuota_al_dia: 'si',
    fecha_inscripcion: '',
    fecha_deuda: '',
  });

  const [cuotaAnterior, setCuotaAnterior] = useState('si');

  useEffect(() => {
    const fetchSocio = async () => {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al cargar socio:', error);
      } else if (data) {
        setSocio(data);
        setCuotaAnterior(data.cuota_al_dia || 'si');
        setFormData({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni || '',
          telefono: data.telefono || '',
          localidad: data.localidad || '',
          socio_racing: data.socio_racing || '',
          numero_socio_filial: data.numero_socio_filial || '',
          estado: data.estado || 'pendiente',
          cuota_al_dia: data.cuota_al_dia || 'si',
          fecha_inscripcion: data.fecha_inscripcion ? data.fecha_inscripcion.split('T')[0] : '',
          fecha_deuda: data.fecha_deuda ? data.fecha_deuda.split('T')[0] : '',
        });
      }
      setLoading(false);
    };

    fetchSocio();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si cambia el estado de cuota a 'no' (en deuda) y antes estaba en 'si', autocompletamos con la fecha de hoy si está vacía
    if (name === 'cuota_al_dia' && value === 'no' && cuotaAnterior === 'si' && !formData.fecha_deuda) {
      const hoy = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, cuota_al_dia: value, fecha_deuda: hoy }));
      return;
    }

    // Si pasa a 'si' (al día), limpiamos la fecha de deuda automáticamente
    if (name === 'cuota_al_dia' && value === 'si') {
      setFormData(prev => ({ ...prev, cuota_al_dia: value, fecha_deuda: '' }));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleGuardar = async (nuevoEstado?: string) => {
    setSaving(true);
    setMensaje(null);

    const estadoFinal = nuevoEstado || formData.estado;

    const datosParaEnviar = {
      ...formData,
      estado: estadoFinal,
      fecha_inscripcion: formData.fecha_inscripcion ? formData.fecha_inscripcion : null,
      fecha_deuda: formData.cuota_al_dia === 'no' && formData.fecha_deuda ? formData.fecha_deuda : null,
    };

    const { error } = await supabase
      .from('socios')
      .update(datosParaEnviar)
      .eq('id', id);

    if (error) {
      setMensaje({ tipo: 'error', texto: `Error al guardar: ${error.message}` });
    } else {
      setMensaje({ tipo: 'exito', texto: '¡Datos, estado de cuota y fecha de deuda actualizados correctamente!' });
      setCuotaAnterior(formData.cuota_al_dia);
      setSocio((prev: any) => ({ ...prev, ...datosParaEnviar }));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <p className="text-sky-400 font-bold animate-pulse">Cargando datos del socio...</p>
      </div>
    );
  }

  if (!socio) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <p className="text-red-400 font-bold mb-4">No se encontró la solicitud de este socio.</p>
        <Link href="/admin" className="text-sky-400 underline text-sm">
          ← Volver al Panel
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans relative">
      
      {/* Sello de agua institucional */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-5 overflow-hidden z-0">
        <img src="/logos/Logo1.png" alt="Marca de agua" className="w-[600px] h-[600px] object-contain" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin" className="text-slate-400 hover:text-sky-300 text-sm font-semibold flex items-center gap-1">
            ← Volver al Listado
          </Link>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
              formData.cuota_al_dia === 'si' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}>
              Cuota: {formData.cuota_al_dia === 'si' ? 'Al Día' : `En Deuda ${formData.fecha_deuda ? `(Desde: ${formData.fecha_deuda})` : ''}`}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
              formData.estado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              formData.estado === 'pendiente' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
              'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {formData.estado}
            </span>
          </div>
        </div>

        {mensaje && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold border ${
            mensaje.tipo === 'exito' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Formulario de Edición ampliado con Cuota, Antigüedad y Fecha de Deuda */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-sky-400 uppercase tracking-wide pb-2 border-b border-slate-800">
              🛠️ Gestión Administrativa
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">DNI</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-400 uppercase mb-1">N° Socio Filial</label>
                <input
                  type="text"
                  name="numero_socio_filial"
                  placeholder="Ej: 0045"
                  value={formData.numero_socio_filial}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-sky-500/50 rounded-lg p-2.5 text-sm font-mono text-sky-300 focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Localidad</label>
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">Estado de Cuota</label>
                <select
                  name="cuota_al_dia"
                  value={formData.cuota_al_dia}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg p-2.5 text-sm text-emerald-300 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="si">Al Día (🟢)</option>
                  <option value="no">En Deuda (🟠)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha de Ingreso</label>
                <input
                  type="date"
                  name="fecha_inscripcion"
                  value={formData.fecha_inscripcion}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* CAMPO DE FECHA DE DEUDA (Aparece si está en deuda) */}
            {formData.cuota_al_dia === 'no' && (
              <div className="bg-orange-950/30 border border-orange-500/40 p-3 rounded-xl space-y-1">
                <label className="block text-xs font-bold text-orange-400 uppercase mb-1">
                  ⚠️ Fecha Desde Que Debe Cuota
                </label>
                <input
                  type="date"
                  name="fecha_deuda"
                  value={formData.fecha_deuda}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-orange-500/50 rounded-lg p-2.5 text-sm text-orange-200 focus:border-orange-400 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-orange-300/80">
                  Esta fecha indica exactamente desde cuándo el socio adeuda cuotas para el control administrativo.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-yellow-400 uppercase mb-1">N° Socio Racing Avellaneda</label>
              <input
                type="text"
                name="socio_racing"
                value={formData.socio_racing}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-yellow-500/40 rounded-lg p-2.5 text-sm text-yellow-200 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estado de Solicitud</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            <button
              onClick={() => handleGuardar()}
              disabled={saving}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl uppercase text-xs tracking-wider transition-colors shadow-lg cursor-pointer disabled:opacity-50 mt-2"
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios Administrativos'}
            </button>
          </div>

          {/* Vista Previa del Carnet y Aprobación Directa */}
          <div className="flex flex-col items-center justify-between bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="w-full text-center mb-2">
              <h2 className="text-lg font-bold text-sky-400 uppercase tracking-wide border-b border-slate-800 pb-2">
                🪪 Vista Previa del Carnet
              </h2>
            </div>

            <CarnetSocio
              socio={{
                nombre: formData.nombre,
                apellido: formData.apellido,
                dni: formData.dni,
                socio_racing: formData.socio_racing,
                numero_socio_filial: formData.numero_socio_filial,
                foto_url: socio.foto_url,
              }}
            />
        
            <div className="w-full space-y-2 mt-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleGuardar('aprobado')}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl uppercase text-xs tracking-wider transition-colors shadow-md cursor-pointer disabled:opacity-50"
                >
                  ✅ Aprobar Socio
                </button>

                <button
                  onClick={() => handleGuardar('rechazado')}
                  disabled={saving}
                  className="bg-red-600/80 hover:bg-red-600 text-white font-bold py-3 rounded-xl uppercase text-xs tracking-wider transition-colors shadow-md cursor-pointer disabled:opacity-50"
                >
                  ❌ Rechazar
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}