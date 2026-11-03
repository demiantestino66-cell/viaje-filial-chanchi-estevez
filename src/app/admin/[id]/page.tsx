'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import CarnetSocio from '@/components/CarnetSocio';
import Link from 'next/link';

type SocioDetalle = {
  id: string;
  nombre?: string | null;
  apellido?: string | null;
  dni?: string | null;
  telefono?: string | null;
  localidad?: string | null;
  socio_racing?: string | null;
  numero_socio_filial?: string | null;
  estado?: string | null;
  cuota_al_dia?: string | null;
  fecha_inscripcion?: string | null;
  fecha_deuda?: string | null;
  foto_url?: string | null;
};

export default function DetalleSocioAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [socio, setSocio] = useState<SocioDetalle | null>(null);
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
        .select(
          'id,nombre,apellido,dni,telefono,localidad,socio_racing,numero_socio_filial,estado,cuota_al_dia,fecha_inscripcion,fecha_deuda,foto_url',
        )
        .eq('id', id)
        .single();

      if (error) {
        setMensaje({ tipo: 'error', texto: `Error al cargar el socio: ${error.message}` });
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
      setSocio((prev) => (prev ? { ...prev, ...datosParaEnviar } : prev));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b16] font-sans text-white">
        <p className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-sky-200 shadow-2xl backdrop-blur-md">
          Cargando datos del socio...
        </p>
      </div>
    );
  }

  if (!socio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050b16] p-4 text-white">
        <p className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-center text-sm font-semibold text-rose-200">
          {mensaje?.tipo === 'error' ? mensaje.texto : 'No se encontró la solicitud de este socio.'}
        </p>
        <Link href="/admin" className="text-sm font-semibold text-sky-300 underline underline-offset-4 transition hover:text-white">
          ← Volver al Panel
        </Link>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050b16] p-4 font-sans text-white sm:p-6 lg:p-10">
      
      {/* Sello de agua institucional */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.035]">
        <img src="/logos/Logo1.png" alt="Marca de agua" className="h-[min(80vw,700px)] w-[min(80vw,700px)] object-contain" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-300 hover:border-sky-300/20 hover:bg-white/[0.07] hover:text-sky-200">
            ← Volver al Listado
          </Link>

        </div>

        {mensaje && (
          <div role="alert" className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${
            mensaje.tipo === 'exito' ? 'bg-emerald-400/10 text-emerald-200 border-emerald-300/20' : 'bg-rose-400/10 text-rose-200 border-rose-300/25'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              src={socio.foto_url || '/logos/Logo1.png'}
              alt=""
              className="h-20 w-20 rounded-2xl border border-white/10 bg-white/5 object-cover object-top shadow-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200/60">Ficha de socio</p>
              <h1 className="mt-1 truncate text-3xl font-bold uppercase tracking-tight text-white">
                {formData.nombre} {formData.apellido}
              </h1>
              <p className="mt-1 font-mono text-sm text-slate-400">DNI {formData.dni}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                formData.estado === 'aprobado'
                  ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                  : formData.estado === 'pendiente'
                    ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
                    : 'border-rose-300/20 bg-rose-400/10 text-rose-200'
              }`}>
                {formData.estado}
              </span>
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                formData.cuota_al_dia === 'si'
                  ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                  : 'border-rose-300/20 bg-rose-400/10 text-rose-200'
              }`}>
                {formData.cuota_al_dia === 'si' ? 'Al día' : 'Deudor'}
              </span>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-slate-950/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Socio filial</p>
              <p className="mt-1 font-mono text-sm font-semibold text-sky-200">
                {formData.numero_socio_filial ? `#${formData.numero_socio_filial}` : 'Sin asignar'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-slate-950/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Teléfono</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">{formData.telefono || 'Sin registrar'}</p>
            </div>
            <div className={`rounded-2xl border p-3 ${
              formData.cuota_al_dia === 'si' ? 'border-emerald-300/10 bg-emerald-400/[0.04]' : 'border-rose-300/10 bg-rose-400/[0.05]'
            }`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Estado de cuota</p>
              <p className={`mt-1 text-sm font-semibold ${
                formData.cuota_al_dia === 'si' ? 'text-emerald-200' : 'text-rose-200'
              }`}>
                {formData.cuota_al_dia === 'si'
                  ? 'Al día'
                  : `En deuda${formData.fecha_deuda ? ` · desde ${formData.fecha_deuda}` : ''}`}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          
          {/* Formulario de Edición ampliado con Cuota, Antigüedad y Fecha de Deuda */}
          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-6">
            <h2 className="border-b border-white/[0.08] pb-4 text-lg font-bold uppercase tracking-wide text-white">
              Gestión Administrativa
            </h2>

            <section className="space-y-4 rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4 sm:p-5">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Datos personales</h3>
                <p className="mt-1 text-xs text-slate-500">Información de contacto y registro del socio.</p>
              </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">DNI</label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Localidad</label>
              <input
                type="text"
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            </section>

            <section className="space-y-4 rounded-2xl border border-white/[0.07] bg-slate-950/25 p-4 sm:p-5">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Estado administrativo</h3>
                <p className="mt-1 text-xs text-slate-500">Afiliación, cuota y estado de la solicitud.</p>
              </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Estado de Cuota</label>
                <select
                  name="cuota_al_dia"
                  value={formData.cuota_al_dia}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  <option value="si">Al Día (🟢)</option>
                  <option value="no">En Deuda (🟠)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">Fecha de Ingreso</label>
                <input
                  type="date"
                  name="fecha_inscripcion"
                  value={formData.fecha_inscripcion}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">N° Socio Filial</label>
                <input
                  type="text"
                  name="numero_socio_filial"
                  placeholder="Ej: 0045"
                  value={formData.numero_socio_filial}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 font-mono text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">N° Socio Racing Avellaneda</label>
                <input
                  type="text"
                  name="socio_racing"
                  value={formData.socio_racing}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* CAMPO DE FECHA DE DEUDA (Aparece si está en deuda) */}
            {formData.cuota_al_dia === 'no' && (
              <div className="space-y-2 rounded-xl border border-rose-300/15 bg-rose-400/[0.06] p-4">
                <label className="mb-1.5 block text-xs font-semibold text-rose-200">
                  Fecha desde que debe cuota
                </label>
                <input
                  type="date"
                  name="fecha_deuda"
                  value={formData.fecha_deuda}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-rose-300/20 bg-white/5 p-3 font-mono text-sm text-rose-100 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-400/50 focus:outline-none"
                />
                <p className="text-xs leading-relaxed text-rose-100/60">
                  Esta fecha indica exactamente desde cuándo el socio adeuda cuotas para el control administrativo.
                </p>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Estado de Solicitud</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            </section>

            <button
              onClick={() => handleGuardar()}
              disabled={saving}
              className="mt-2 w-full cursor-pointer rounded-xl bg-gradient-to-r from-sky-300 to-sky-500 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-sky-500/15 transition-all duration-300 hover:scale-105 hover:from-sky-200 hover:to-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios Administrativos'}
            </button>
          </div>

          {/* Vista Previa del Carnet y Aprobación Directa */}
          <div className="flex flex-col items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-6">
            <div className="mb-2 w-full text-center">
              <h2 className="border-b border-white/[0.08] pb-2 text-lg font-bold uppercase tracking-wide text-white">
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
        
            <div className="mt-4 w-full space-y-3 border-t border-white/[0.08] pt-5">
              <p className="text-center text-xs font-semibold text-slate-400">Acciones de aprobación</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => handleGuardar('aprobado')}
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-3 py-3 text-xs font-black uppercase tracking-wide text-emerald-950 shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:scale-105 hover:from-emerald-300 hover:to-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  ✅ Aprobar Socio
                </button>

                <button
                  onClick={() => handleGuardar('rechazado')}
                  disabled={saving}
                  className="rounded-xl border border-rose-300/20 bg-rose-400/[0.08] px-3 py-3 text-xs font-bold uppercase tracking-wide text-rose-200 transition-all duration-300 hover:scale-105 hover:bg-rose-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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