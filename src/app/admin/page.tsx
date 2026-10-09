'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminSociosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [socios, setSocios] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setAuthenticated(true);
      fetchSocios();
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchSocios = async () => {
    const { data, error } = await supabase
      .from('socios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setSocios(data);
    }
    setLoading(false);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivoFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  // Función para convertir archivo a Base64
  const convertBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // Función para exportar el listado completo a Excel de forma prolija (con separador punto y coma ';')
  const exportarAExcel = () => {
    if (socios.length === 0) {
      alert('No hay socios para exportar.');
      return;
    }

    const headers = ['Nombre', 'Apellido', 'DNI', 'N° Socio Filial', 'Estado Cuota', 'Fecha Inicio Deuda', 'Fecha Ingreso / Antigüedad', 'Estado Solicitud'];
    
    const rows = socios.map(s => [
      `"${s.nombre || ''}"`,
      `"${s.apellido || ''}"`,
      `"${s.dni || ''}"`,
      `"${s.numero_socio_filial || 'Sin asignar'}"`,
      `"${s.cuota_al_dia === 'si' ? 'Al Día' : 'En Deuda'}"`,
      `"${s.fecha_deuda ? s.fecha_deuda.split('T')[0] : '-'}"`,
      `"${s.fecha_inscripcion ? s.fecha_inscripcion.split('T')[0] : 'Sin fecha'}"`,
      `"${s.estado || 'pendiente'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const fechaActual = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Socios_Filial_Trelew_${fechaActual}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Guardar Alta Manual de Socio desde el Panel
  const handleAltaManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoManual(true);

    try {
      let fotoUrl = '/logos/Logo1.png';

      if (archivoFoto) {
        const fotoBase64 = await convertBase64(archivoFoto);
        const fileBuffer = Buffer.from(fotoBase64.split(',')[1], 'base64');
        const fileExt = archivoFoto.type.split('/')[1] || 'jpg';
        const fileName = `${nuevoSocio.dni.trim()}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-socios')
          .upload(fileName, fileBuffer, {
            contentType: archivoFoto.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('fotos-socios')
            .getPublicUrl(fileName);
          fotoUrl = publicUrlData.publicUrl;
        }
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
      fetchSocios();
    } catch (err: any) {
      alert(`Error al registrar socio: ${err.message}`);
    } finally {
      setGuardandoManual(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <p className="text-sky-400 font-bold animate-pulse text-sm">Verificando acceso y cargando socios...</p>
      </div>
    );
  }

  if (!authenticated) return null;

  // Filtrar socios para la sección de WhatsApp
  const sociosParaWp = socios.filter(s => {
    if (!s.telefono || s.telefono.trim() === '') return false;
    if (filtroWp === 'deuda') return s.cuota_al_dia === 'no';
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-12 font-sans relative">
      
      {/* Sello / Marca de agua institucional de fondo */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-5 overflow-hidden z-0">
        <img src="/logos/Logo1.png" alt="Marca de agua Filial" className="w-[600px] h-[600px] object-contain" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-black text-sky-400 uppercase tracking-wide">
              Panel de Administración
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gestión de Socios - Filial Trelew "Chanchi Estévez"
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setModalAbierto(true)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl transition-colors cursor-pointer uppercase tracking-wider shadow-lg shadow-sky-500/20"
            >
              ➕ Nuevo Socio Manual
            </button>

            <button
              onClick={exportarAExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-colors cursor-pointer uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              📊 Exportar a Excel
            </button>

            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
              <span className="text-sm text-slate-300">Total: </span>
              <span className="font-bold text-sky-400">{socios.length}</span>
            </div>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded-xl mb-6 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {/* PANEL DE CENTRO DE MENSAJERÍA WHATSAPP (SIN BLOQUEO DE POP-UPS) */}
        <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-lg font-bold text-sky-400 uppercase tracking-wide flex items-center gap-2">
                📱 Centro de Avisos por WhatsApp (Días 5, 10 y 15)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Dispará los recordatorios de cuota o avisos de deuda de forma segura y directa con un solo clic por socio.
              </p>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFiltroWp('deuda')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase transition-all cursor-pointer ${
                  filtroWp === 'deuda' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚠️ Morosos ({socios.filter(s => s.cuota_al_dia === 'no' && s.telefono).length})
              </button>
              <button
                onClick={() => setFiltroWp('todos')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase transition-all cursor-pointer ${
                  filtroWp === 'todos' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                📢 Todos con Teléfono ({socios.filter(s => s.telefono && s.telefono.trim() !== '').length})
              </button>
            </div>
          </div>

          {sociosParaWp.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs uppercase tracking-wider font-bold">
              No hay socios en esta categoría con teléfono registrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-2">
              {sociosParaWp.map((socio) => {
                const esDeudor = socio.cuota_al_dia === 'no';
                const mensajeWp = esDeudor
                  ? `¡Hola ${socio.nombre}! ⚠️ Desde la Filial Trelew "Chanchi Estévez" te informamos que registrás cuotas pendientes con la filial (${socio.fecha_deuda ? `desde el ${socio.fecha_deuda}` : 'meses anteriores'}). Te recordamos que al mantener deuda se suspenden temporalmente los beneficios y descuentos institucionales. Podés regularizar respondiendo a este mensaje para ponernos al día. ¡Racing Club! 🔵⚪🔵`
                  : `¡Hola ${socio.nombre}! 💙 Te recordamos desde la Filial Trelew "Chanchi Estévez" que hasta el día 15 recibimos el aporte de la cuota societaria para estar al día y mantener activos todos tus beneficios. ¡Académico! ⚽`;

                return (
                  <div key={socio.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs uppercase text-slate-200 truncate max-w-[150px]">
                          {socio.nombre} {socio.apellido}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          esDeudor ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {esDeudor ? 'Deudor' : 'Al Día'}
                        </span>
                      </div>
                      <p className="text-[11px] text-sky-400 font-mono">Tel: {socio.telefono}</p>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <a
                        href={`https://wa.me/${socio.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all shadow cursor-pointer ${
                          esDeudor ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'
                        }`}
                      >
                        💬 Enviar WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Listado de Socios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socios.map((socio) => (
            <div 
              key={socio.id} 
              className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-sky-500/50 transition-all flex flex-col"
            >
              <div className="flex items-start p-5 gap-4">
                <div className="w-20 h-24 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-800">
                  <img 
                    src={socio.foto_url || '/logos/Logo1.png'} 
                    alt={`Foto de ${socio.nombre}`} 
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-base leading-tight uppercase text-slate-100">
                    {socio.nombre} {socio.apellido}
                  </h3>
                  <p className="text-sky-400 text-xs font-semibold mt-1">DNI: {socio.dni}</p>
                  
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    <p className="text-sky-200 font-mono font-bold">
                      N° Filial: {socio.numero_socio_filial ? `#${socio.numero_socio_filial}` : 'Sin asignar'}
                    </p>
                    <p className={`font-bold ${socio.cuota_al_dia === 'si' ? 'text-emerald-400' : 'text-orange-400'}`}>
                      Cuota: {socio.cuota_al_dia === 'si' ? '🟢 Al día' : '🟠 En deuda'}
                    </p>
                    {socio.socio_racing && socio.socio_racing !== 'No es socio' && (
                      <p className="text-yellow-400 text-[11px]">Racing N° {socio.socio_racing}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 border-t border-slate-800 flex justify-between items-center mt-auto">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  socio.estado === 'pendiente' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  socio.estado === 'aprobado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {socio.estado || 'pendiente'}
                </span>
                
                <Link 
                  href={`/admin/${socio.id}`}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors uppercase cursor-pointer bg-sky-950/60 border border-sky-500/30 px-3 py-1.5 rounded-lg"
                >
                  Gestionar →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL DE ALTA MANUAL DE SOCIO */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-sky-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-sky-400 uppercase tracking-wide">
                  ➕ Alta Manual de Socio
                </h2>
                <button 
                  onClick={() => setModalAbierto(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕ Cerrar
                </button>
              </div>

              <form onSubmit={handleAltaManualSubmit} className="space-y-4">
                
                {/* Selector de Foto */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-24 bg-slate-950 border border-dashed border-sky-500/40 rounded-xl overflow-hidden flex items-center justify-center">
                    {previewFoto ? (
                      <img src={previewFoto} alt="Preview" className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-[10px] text-slate-500 text-center px-1">Sin foto (Usa logo)</span>
                    )}
                  </div>
                  <label className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] px-3 py-1 rounded-lg cursor-pointer font-bold uppercase transition-all">
                    Subir / Cambiar Foto
                    <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={nuevoSocio.nombre}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={nuevoSocio.apellido}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, apellido: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">DNI *</label>
                    <input
                      type="text"
                      required
                      value={nuevoSocio.dni}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, dni: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-400 uppercase mb-1">N° Socio Filial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 0015"
                      value={nuevoSocio.numero_socio_filial}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, numero_socio_filial: e.target.value })}
                      className="w-full bg-slate-950 border border-sky-500/50 rounded-lg p-2.5 text-sm font-mono text-sky-300 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={nuevoSocio.telefono}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Localidad</label>
                    <select
                      value={nuevoSocio.localidad}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, localidad: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-yellow-400 uppercase mb-1">N° Socio Racing</label>
                    <input
                      type="text"
                      placeholder="Opcional"
                      value={nuevoSocio.socio_racing}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, socio_racing: e.target.value })}
                      className="w-full bg-slate-950 border border-yellow-500/30 rounded-lg p-2.5 text-sm text-yellow-200 focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">Estado de Cuota</label>
                    <select
                      value={nuevoSocio.cuota_al_dia}
                      onChange={(e) => setNuevoSocio({ ...nuevoSocio, cuota_al_dia: e.target.value })}
                      className="w-full bg-slate-950 border border-emerald-500/30 rounded-lg p-2.5 text-sm text-emerald-300 focus:border-emerald-400 focus:outline-none"
                    >
                      <option value="si">Al día (🟢)</option>
                      <option value="no">En deuda (🟠)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Fecha de Ingreso / Antigüedad</label>
                  <input
                    type="date"
                    value={nuevoSocio.fecha_inscripcion}
                    onChange={(e) => setNuevoSocio({ ...nuevoSocio, fecha_inscripcion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoManual}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs transition-colors shadow-lg cursor-pointer disabled:opacity-50 mt-4"
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