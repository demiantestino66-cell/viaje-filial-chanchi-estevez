'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type SocioAdmin = {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string | null;
  localidad?: string | null;
  socio_racing?: string | null;
  numero_socio_filial?: string | null;
  cuota_al_dia?: string | null;
  fecha_deuda?: string | null;
  fecha_inscripcion?: string | null;
  estado?: string | null;
  foto_url?: string | null;
};

const normalizarBusqueda = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR');

export default function AdminSociosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [socios, setSocios] = useState<SocioAdmin[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filtroSocios, setFiltroSocios] = useState('');
  const filtroDiferido = useDeferredValue(normalizarBusqueda(filtroSocios.trim()));

  // Estados para el Modal de Alta Manual
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardandoManual, setGuardandoManual] = useState(false);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  // Filtro para la sección de WhatsApp (todos, al día, o en deuda)
  const [filtroWp, setFiltroWp] = useState<'todos' | 'deuda'>('deuda');

  const [nuevoSocio, setNuevoSocio] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    localidad: 'Trelew',
    socio_racing: '',
    numero_socio_filial: '',
    cuota_al_dia: 'si',
    fecha_inscripcion: new Date().toISOString().split('T')[0],
  });

  useEffect(() => () => {
    if (previewFoto) URL.revokeObjectURL(previewFoto);
  }, [previewFoto]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
          router.push('/login');
          return;
        }

        setAuthenticated(true);
        await fetchSocios();
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : 'No se pudo verificar el acceso.');
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  async function fetchSocios() {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select(
          'id,nombre,apellido,dni,telefono,localidad,socio_racing,numero_socio_filial,cuota_al_dia,fecha_deuda,fecha_inscripcion,estado,foto_url,created_at',
        )
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMsg(error.message);
      } else if (data) {
        setSocios(data);
        setErrorMsg(null);
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo cargar el padrón de socios.');
    } finally {
      setLoading(false);
    }
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivoFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  // Excel reconoce el BOM y el separador regional; se escapan comillas y separadores CSV.
  const exportarAExcel = () => {
    if (socios.length === 0) {
      alert('No hay socios para exportar.');
      return;
    }

    const headers = ['Nombre', 'Apellido', 'DNI', 'N° Socio Filial', 'Estado Cuota', 'Fecha Inicio Deuda', 'Fecha Ingreso / Antigüedad', 'Estado Solicitud'];
    
    const csvCell = (value: string) => {
      const safeValue = /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const rows = socios.map((s) => [
      s.nombre || '',
      s.apellido || '',
      s.dni || '',
      s.numero_socio_filial || 'Sin asignar',
      s.cuota_al_dia === 'si' ? 'Al Día' : 'En Deuda',
      s.fecha_deuda ? s.fecha_deuda.split('T')[0] : '-',
      s.fecha_inscripcion ? s.fecha_inscripcion.split('T')[0] : 'Sin fecha',
      s.estado || 'pendiente',
    ].map(csvCell).join(';'));

    const csvContent = '\uFEFF' + [headers.map(csvCell).join(';'), ...rows].join('\r\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const fechaActual = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Socios_Filial_Trelew_${fechaActual}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Guardar Alta Manual de Socio desde el Panel
  const handleAltaManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoManual(true);

    try {
      let fotoUrl = '/logos/Logo1.png';

      if (archivoFoto) {
        const fileExt = archivoFoto.type.split('/')[1] || 'jpg';
        const fileName = `${nuevoSocio.dni.trim()}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-socios')
          .upload(fileName, archivoFoto, {
            contentType: archivoFoto.type,
            upsert: true,
          });

        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from('fotos-socios')
          .getPublicUrl(fileName);
        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from('socios').insert([
        {
          nombre: nuevoSocio.nombre.trim(),
          apellido: nuevoSocio.apellido.trim(),
          dni: nuevoSocio.dni.trim(),
          telefono: nuevoSocio.telefono.trim(),
          localidad: nuevoSocio.localidad,
          socio_racing: nuevoSocio.socio_racing?.trim() || 'No es socio',
          numero_socio_filial: nuevoSocio.numero_socio_filial.trim(),
          cuota_al_dia: nuevoSocio.cuota_al_dia,
          fecha_inscripcion: nuevoSocio.fecha_inscripcion,
          foto_url: fotoUrl,
          estado: 'aprobado',
        },
      ]);

      if (dbError) throw dbError;

      alert('¡Socio agregado y aprobado con éxito!');
      setModalAbierto(false);
      setArchivoFoto(null);
      setPreviewFoto(null);
      setNuevoSocio({
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        localidad: 'Trelew',
        socio_racing: '',
        numero_socio_filial: '',
        cuota_al_dia: 'si',
        fecha_inscripcion: new Date().toISOString().split('T')[0],
      });
      await fetchSocios();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Error al registrar socio: ${message}`);
    } finally {
      setGuardandoManual(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b16] font-sans text-white">
        <p className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-sky-200 shadow-2xl backdrop-blur-md">
          Verificando acceso y cargando socios...
        </p>
      </div>
    );
  }

  if (!authenticated) {
    if (!errorMsg) return null;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b16] p-4 text-center text-sm text-rose-200">
        No se pudo verificar el acceso: {errorMsg}
      </div>
    );
  }

  // Filtrar socios para la sección de WhatsApp
  const sociosParaWp = socios.filter(s => {
    if (!s.telefono || s.telefono.trim() === '') return false;
    if (filtroWp === 'deuda') return s.cuota_al_dia === 'no';
    return true;
  });
  const sociosFiltrados = socios.filter((socio) => {
    if (!filtroDiferido) return true;
    const dniFiltro = filtroDiferido.replace(/\D/g, '');
    const dniSocio = (socio.dni || '').replace(/\D/g, '');
    const nombre = normalizarBusqueda(`${socio.nombre || ''} ${socio.apellido || ''}`);
    return (
      (dniFiltro.length > 0 && dniSocio.includes(dniFiltro)) ||
      nombre.includes(filtroDiferido)
    );
  });
  const sociosAlDia = socios.filter((socio) => socio.cuota_al_dia === 'si').length;
  const sociosMorosos = socios.filter((socio) => socio.cuota_al_dia === 'no').length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050b16] p-4 font-sans text-white sm:p-6 lg:p-10">
      
      {/* Sello / Marca de agua institucional de fondo */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.035]">
        <img src="/logos/Logo1.png" alt="Marca de agua Filial" className="h-[min(80vw,700px)] w-[min(80vw,700px)] object-contain" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        
        {/* Cabecera */}
        <header className="mb-6 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-sky-300/75">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
              Filial Trelew · Chanchi Estévez
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Panel de Administración
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Gestión centralizada del padrón de socios
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              onClick={() => setModalAbierto(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-300 to-sky-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-sky-500/20 transition-all duration-300 hover:scale-[1.03] hover:from-sky-200 hover:to-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <span aria-hidden="true">＋</span> Nuevo Socio Manual
            </button>

            <button
              onClick={exportarAExcel}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-200 transition-all duration-300 hover:scale-[1.03] hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <span aria-hidden="true">↧</span> Exportar a Excel
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-200/90 transition-all duration-300 hover:scale-[1.03] hover:bg-rose-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <span aria-hidden="true">↗</span> Cerrar Sesión
            </button>
          </div>
        </header>

        <section aria-label="Métricas del padrón" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="group relative overflow-hidden rounded-2xl border border-sky-300/15 bg-gradient-to-br from-sky-400/[0.12] to-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-sky-300/30">
            <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl transition group-hover:bg-sky-300/20" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Total socios</p>
                <p className="mt-2 text-3xl font-black tabular-nums text-white">{socios.length}</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-300/10 text-xl text-sky-200" aria-hidden="true">◎</span>
            </div>
          </article>
          <article className="group relative overflow-hidden rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-400/[0.1] to-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300/30">
            <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl transition group-hover:bg-emerald-300/20" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Al día</p>
                <p className="mt-2 text-3xl font-black tabular-nums text-emerald-200">{sociosAlDia}</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/10 text-xl text-emerald-200" aria-hidden="true">✓</span>
            </div>
          </article>
          <article className="group relative overflow-hidden rounded-2xl border border-rose-300/15 bg-gradient-to-br from-rose-400/[0.1] to-white/[0.035] p-5 shadow-xl shadow-black/10 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-rose-300/30">
            <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-rose-400/10 blur-2xl transition group-hover:bg-rose-300/20" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Morosos</p>
                <p className="mt-2 text-3xl font-black tabular-nums text-rose-200">{sociosMorosos}</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/15 bg-rose-300/10 text-xl text-rose-200" aria-hidden="true">!</span>
            </div>
          </article>
        </section>

        {errorMsg && (
          <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200 backdrop-blur-md" role="alert">
            {errorMsg}
          </div>
        )}

        {/* PANEL DE CENTRO DE MENSAJERÍA WHATSAPP (SIN BLOQUEO DE POP-UPS) */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:p-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300" aria-hidden="true">↗</span>
                Centro de avisos por WhatsApp
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Dispará los recordatorios de cuota o avisos de deuda de forma segura y directa con un solo clic por socio.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-slate-950/60 p-1">
              <button
                onClick={() => setFiltroWp('deuda')}
                className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-300 cursor-pointer sm:text-xs ${
                  filtroWp === 'deuda' ? 'bg-rose-400/15 text-rose-200 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Morosos ({socios.filter(s => s.cuota_al_dia === 'no' && s.telefono).length})
              </button>
              <button
                onClick={() => setFiltroWp('todos')}
                className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-300 cursor-pointer sm:text-xs ${
                  filtroWp === 'todos' ? 'bg-sky-400/15 text-sky-200 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({socios.filter(s => s.telefono && s.telefono.trim() !== '').length})
              </button>
            </div>
          </div>

          {sociosParaWp.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              No hay socios en esta categoría con teléfono registrado.
            </div>
          ) : (
            <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {sociosParaWp.map((socio) => {
                const esDeudor = socio.cuota_al_dia === 'no';
                const telefono = (socio.telefono ?? '').replace(/\D/g, '');
                const nombreCompleto = `${socio.nombre} ${socio.apellido}`.trim();
                const mensajeWp = esDeudor
                  ? `¡Hola ${nombreCompleto}! ⚠️ Desde la Filial Trelew "Chanchi Estévez" te informamos que registrás cuotas pendientes con la filial (${socio.fecha_deuda ? `desde el ${socio.fecha_deuda}` : 'meses anteriores'}). Te recordamos que al mantener deuda se suspenden temporalmente los beneficios y descuentos institucionales. Podés regularizar respondiendo a este mensaje para ponernos al día. ¡Racing Club! 🔵⚪🔵`
                  : `¡Hola ${nombreCompleto}! 💙 Te recordamos desde la Filial Trelew "Chanchi Estévez" que hasta el día 15 recibimos el aporte de la cuota societaria para estar al día y mantener activos todos tus beneficios. ¡Académico! ⚽`;

                return (
                  <article key={socio.id} className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-slate-950/45 p-4 transition-all duration-300 hover:border-sky-300/20 hover:bg-white/[0.055]">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold uppercase text-slate-100">
                          {socio.nombre} {socio.apellido}
                        </p>
                        <p className="mt-1 truncate font-mono text-xs text-slate-400">{socio.telefono}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          esDeudor ? 'border-rose-300/20 bg-rose-400/10 text-rose-200' : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                        }`}>
                          {esDeudor ? 'Deudor' : 'Al Día'}
                      </span>
                    </div>

                    <a
                      href={`https://wa.me/${telefono}?text=${encodeURIComponent(mensajeWp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                          esDeudor ? 'bg-rose-400/10 text-rose-100 hover:bg-rose-400/20' : 'bg-sky-400/10 text-sky-100 hover:bg-sky-400/20'
                        }`}
                    >
                      <span aria-hidden="true">↗</span> Enviar WhatsApp
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur-md">
          <div className="flex flex-col gap-4 border-b border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wide text-white">Padrón de socios</h2>
              <p className="mt-1.5 text-xs text-slate-400">
                {sociosFiltrados.length} de {socios.length} socios
              </p>
            </div>
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">Buscar por DNI, apellido o nombre</span>
              <input
                type="search"
                value={filtroSocios}
                onChange={(event) => setFiltroSocios(event.target.value)}
                placeholder="Buscar por DNI, nombre o apellido..."
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-300/50 focus:ring-2 focus:ring-sky-300/15"
              />
            </label>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {sociosFiltrados.map((socio) => {
              const estado = socio.estado || 'pendiente';
              const alDia = socio.cuota_al_dia === 'si';
              const estadoClase = estado === 'aprobado'
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                : estado === 'pendiente'
                  ? 'border-amber-300/20 bg-amber-400/10 text-amber-200'
                  : 'border-rose-300/20 bg-rose-400/10 text-rose-200';

              return (
                <article key={socio.id} className="rounded-2xl border border-white/[0.08] bg-slate-950/40 p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={socio.foto_url || '/logos/Logo1.png'}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover object-top"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold uppercase text-white">
                        {socio.apellido}, {socio.nombre}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-slate-400">DNI {socio.dni}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        N° filial {socio.numero_socio_filial ? `#${socio.numero_socio_filial}` : 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                        alDia
                          ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'
                          : 'border-rose-300/20 bg-rose-400/10 text-rose-200'
                      }`}>
                        {alDia ? 'Al día' : 'Deudor'}
                      </span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${estadoClase}`}>
                        {estado}
                      </span>
                    </div>
                    <Link
                      href={`/admin/${socio.id}`}
                      className="inline-flex min-h-9 items-center rounded-xl border border-sky-300/15 bg-sky-300/[0.08] px-3 py-2 text-xs font-bold uppercase text-sky-200 transition-all duration-300 hover:bg-sky-300/15 hover:text-white"
                    >
                      Gestionar →
                    </Link>
                  </div>
                </article>
              );
            })}
            {sociosFiltrados.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                {socios.length === 0 ? 'Todavía no hay socios registrados.' : 'No se encontraron socios con ese criterio.'}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[760px] divide-y divide-white/[0.07] text-left text-sm">
              <thead className="bg-white/[0.025] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-bold">Socio</th>
                  <th scope="col" className="px-5 py-3 font-bold">DNI</th>
                  <th scope="col" className="px-5 py-3 font-bold">N° filial</th>
                  <th scope="col" className="px-5 py-3 font-bold">Cuota</th>
                  <th scope="col" className="px-5 py-3 font-bold">Solicitud</th>
                  <th scope="col" className="px-5 py-3 text-right font-bold">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {sociosFiltrados.map((socio) => {
                  const estado = socio.estado || 'pendiente';
                  const alDia = socio.cuota_al_dia === 'si';
                  const estadoClase = estado === 'aprobado'
                    ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                    : estado === 'pendiente'
                      ? 'border-amber-400/25 bg-amber-400/10 text-amber-200'
                      : 'border-red-400/25 bg-red-400/10 text-red-300';

                  return (
                    <tr key={socio.id} className="transition-colors duration-200 hover:bg-sky-300/[0.035]">
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={socio.foto_url || '/logos/Logo1.png'}
                            alt=""
                            className="h-10 w-10 rounded-xl border border-white/10 object-cover object-top"
                          />
                          <span className="font-bold uppercase text-slate-100">
                            {socio.apellido}, {socio.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-sky-200">{socio.dni}</td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-slate-300">
                        {socio.numero_socio_filial ? `#${socio.numero_socio_filial}` : 'Sin asignar'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                          alDia
                            ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                            : 'border-red-400/25 bg-red-400/10 text-red-300'
                        }`}>
                          {alDia ? 'Al día' : 'Deudor'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${estadoClase}`}>
                          {estado}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <Link
                          href={`/admin/${socio.id}`}
                          className="inline-flex rounded-xl border border-sky-300/15 bg-sky-300/[0.08] px-3 py-2 text-xs font-bold uppercase text-sky-200 transition-all duration-300 hover:border-sky-200/40 hover:bg-sky-300/15 hover:text-white"
                        >
                          Gestionar →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {sociosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                      {socios.length === 0 ? 'Todavía no hay socios registrados.' : 'No se encontraron socios con ese criterio.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODAL DE ALTA MANUAL DE SOCIO */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md">
            <div className="my-8 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/50 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <h2 className="text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                  ➕ Alta Manual de Socio
                </h2>
                <button 
                  onClick={() => setModalAbierto(false)}
                  className="cursor-pointer rounded-lg border border-transparent px-3 py-2 text-xs font-bold text-slate-400 transition-all duration-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                >
                  ✕ Cerrar
                </button>
              </div>

              <form onSubmit={handleAltaManualSubmit} className="space-y-4">
                
                {/* Selector de Foto */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-20 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/5">
                    {previewFoto ? (
                      <img src={previewFoto} alt="Preview" className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-[10px] text-slate-500 text-center px-1">Sin foto (Usa logo)</span>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-[11px] font-bold uppercase text-sky-200 transition-all duration-300 hover:bg-sky-300/20">
                    Subir / Cambiar Foto
                    <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={nuevoSocio.nombre}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={nuevoSocio.apellido}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, apellido: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">DNI *</label>
                    <input
                      type="text"
                      required
                      value={nuevoSocio.dni}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, dni: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">N° Socio Filial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 0015"
                      value={nuevoSocio.numero_socio_filial}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, numero_socio_filial: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">Teléfono</label>
                    <input
                      type="text"
                      value={nuevoSocio.telefono}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">Localidad</label>
                    <select
                      value={nuevoSocio.localidad}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, localidad: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="Trelew">Trelew</option>
                      <option value="Rawson">Rawson</option>
                      <option value="Gaiman">Gaiman</option>
                      <option value="Dolavon">Dolavon</option>
                      <option value="Puerto Madryn">Puerto Madryn</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">N° Socio Racing</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={nuevoSocio.socio_racing}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, socio_racing: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">Estado de Cuota</label>
                    <select
                      value={nuevoSocio.cuota_al_dia}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, cuota_al_dia: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="si">Al día (🟢)</option>
                      <option value="no">En deuda (🟠)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-300">Fecha de Ingreso / Antigüedad</label>
                  <input
                    type="date"
                    value={nuevoSocio.fecha_inscripcion}
                    onChange={(e) => setNuevoSocio({ ...nuevoSocio, fecha_inscripcion: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoManual}
                  className="mt-4 w-full cursor-pointer rounded-xl bg-gradient-to-r from-sky-300 to-sky-500 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-sky-500/15 transition-all duration-300 hover:scale-105 hover:from-sky-200 hover:to-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardandoManual ? 'Registrando Socio...' : '💾 Guardar y Aprobar Socio'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}