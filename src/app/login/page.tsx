'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { buscarSocioPorDni, type SocioPortal } from '@/lib/socios';
import { Oswald } from 'next/font/google';
import CarnetSocio from '@/components/CarnetSocio';
import SocioSkeleton from '@/components/SocioSkeleton';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'] });
const WHATSAPP_FILIAL = '5492804588309';

function describirErrorAuth(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return { message: 'Error desconocido' };
  }

  const authError = error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    code?: unknown;
  };

  return {
    ...(typeof authError.name === 'string' && { name: authError.name }),
    ...(typeof authError.status === 'number' && { status: authError.status }),
    ...(typeof authError.code === 'string' && { code: authError.code }),
    ...(typeof authError.message === 'string' && { message: authError.message }),
  };
}

export default function LoginPage() {
  const [modo, setModo] = useState<'socio' | 'admin'>('socio');

  // Estados para Socio (Búsqueda por DNI)
  const [dniConsulta, setDniConsulta] = useState('');
  const [socioEncontrado, setSocioEncontrado] = useState<SocioPortal | null>(null);
  const [buscandoSocio, setBuscandoSocio] = useState(false);
  const [errorSocio, setErrorSocio] = useState<string | null>(null);

  // Estados para Administrador (Login Supabase Auth)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorAdmin, setErrorAdmin] = useState<string | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const router = useRouter();

  // Buscar socio por DNI
  const handleBuscarSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSocio(null);
    setBuscandoSocio(true);
    setSocioEncontrado(null);

    try {
      const resultado = await buscarSocioPorDni(dniConsulta);
      switch (resultado.tipo) {
        case 'encontrado':
          setSocioEncontrado(resultado.socio);
          break;
        case 'pendiente':
          setErrorSocio(
            `Tu solicitud se encuentra en estado: “${resultado.estado}”. Aún no está aprobada por la comisión.`,
          );
          break;
        case 'dni-invalido':
          setErrorSocio('Ingresá un DNI válido de 7 u 8 números.');
          break;
        case 'padron-vacio':
          setErrorSocio(
            'No hay registros del padrón visibles para esta consulta. Si el DNI está correcto, contactá a la comisión.',
          );
          break;
        case 'sin-coincidencia':
          setErrorSocio(
            'No encontramos un socio con ese DNI. Revisá el número o solicitá tu carnet si todavía no estás registrado.',
          );
          break;
        case 'error':
          setErrorSocio(resultado.mensaje);
      }
    } finally {
      setBuscandoSocio(false);
    }
  };

  // Login de Administrador
  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAdmin(null);
    setLoadingAdmin(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('[Supabase Auth] signInWithPassword falló', describirErrorAuth(authError));
        setErrorAdmin(
          authError.status === 429
            ? 'Se realizaron demasiados intentos. Esperá un momento y volvé a probar.'
            : authError.code === 'email_not_confirmed'
              ? 'El correo todavía no está confirmado. Revisá tu casilla de email.'
              : authError.code === 'user_banned'
                ? 'La cuenta está deshabilitada. Contactá a la administración.'
                : 'No se pudo iniciar sesión. Verificá las credenciales; si persiste, contactá a la administración.',
        );
        return;
      }

      if (!data.session) {
        console.error('[Supabase Auth] inicio de sesión sin error pero sin sesión');
        setErrorAdmin('La autenticación no devolvió una sesión. Intentá nuevamente.');
        return;
      }

      console.info('[Supabase Auth] inicio de sesión exitoso');
      router.refresh();
      router.push('/admin');
    } catch (error) {
      console.error('[Supabase Auth] error inesperado al iniciar sesión', describirErrorAuth(error));
      setErrorAdmin('No se pudo conectar con el servicio de autenticación. Intentá nuevamente.');
    } finally {
      setLoadingAdmin(false);
    }
  };

  return (
    <main className={`min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 ${oswald.className}`}>
      
      {/* Contenedor Principal */}
      <div className="max-w-md w-full bg-slate-900 border border-sky-500/40 rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(56,189,248,0.2)] font-sans">
        
        {/* Encabezado Institucional */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <img src="/logos/Logo2.png" alt="Filial Trelew" className="w-10 h-10 object-contain" />
          </div>
          <h1 className={`text-2xl font-bold uppercase text-sky-400 tracking-wider ${oswald.className}`}>
            Portal Filial Trelew
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Racing Club “Chanchi Estévez”
          </p>
        </div>

        {/* Pestañas de Selección de Modo */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            onClick={() => { setModo('socio'); setSocioEncontrado(null); setErrorSocio(null); }}
            className={`py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
              modo === 'socio' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🪪 Consultar Carnet
          </button>
          <button
            onClick={() => { setModo('admin'); setErrorAdmin(null); }}
            className={`py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
              modo === 'admin' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔐 Admin
          </button>
        </div>

        {/* MODO SOCIO: Buscar carnet por DNI */}
        {modo === 'socio' && (
          <div>
            {!socioEncontrado ? (
              <form onSubmit={handleBuscarSocio} className="space-y-4">
                <div>
                  <label className="block text-xs text-sky-200 font-bold uppercase tracking-wider mb-1">
                    Ingresá tu DNI de Socio
                  </label>
                  <input
                    type="text"
                    required
                    value={dniConsulta}
                    onChange={(e) => setDniConsulta(e.target.value)}
                    placeholder="Ej: 35123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors font-mono"
                  />
                </div>

                {errorSocio && (
                  <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs p-3 rounded-lg text-center">
                    {errorSocio}
                  </div>
                )}

                {buscandoSocio && <SocioSkeleton />}

                <button
                  type="submit"
                  disabled={buscandoSocio}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3.5 rounded-xl uppercase tracking-wider text-sm transition-all shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50"
                >
                  {buscandoSocio ? 'Buscando Credencial...' : 'Ver Mi Carnet Digital'}
                </button>
              </form>
            ) : (
              /* VISTA DE CREDENCIAL ENCONTRADA Y AVISO DE BENEFICIOS */
              <div className="space-y-4 text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs py-1.5 px-3 rounded-lg font-bold">
                  ¡Socio Validado Correctamente!
                </div>

                {socioEncontrado.cuota_al_dia === 'si' ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl font-bold">
                    Cuota al día · Beneficios habilitados
                  </div>
                ) : (
                  <div className="motion-safe:animate-pulse space-y-3 rounded-xl border border-orange-400/60 bg-gradient-to-br from-orange-950/70 to-red-950/50 p-4 text-left shadow-[0_0_24px_rgba(249,115,22,0.18)]">
                    <h3 className="text-xs font-black uppercase text-orange-300">
                      Beneficios temporalmente suspendidos
                    </h3>
                    <p className="text-[11px] leading-relaxed text-orange-100">
                      {socioEncontrado.fecha_deuda
                        ? `Registramos una cuota pendiente desde ${socioEncontrado.fecha_deuda}.`
                        : 'Contactanos para regularizar o consultar el estado de tu cuota.'}
                    </p>
                    <a
                      href={`https://wa.me/${WHATSAPP_FILIAL}?text=${encodeURIComponent(
                        `Hola, soy ${socioEncontrado.nombre} ${socioEncontrado.apellido} (DNI: ${socioEncontrado.dni}). Quisiera regularizar mi cuota de la Filial Trelew.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl bg-orange-400 px-4 py-3 text-center text-xs font-black uppercase text-slate-950 transition hover:bg-orange-300"
                    >
                      Regularizar por WhatsApp
                    </a>
                  </div>
                )}

                <div className="flex justify-center scale-95 origin-top">
                  <CarnetSocio
                    socio={socioEncontrado}
                    allowPrint={socioEncontrado.cuota_al_dia === 'si'}
                    allowFlip={socioEncontrado.cuota_al_dia === 'si'}
                  />
                </div>

                {socioEncontrado.cuota_al_dia === 'si' && (
                  <div className="space-y-1 rounded-xl border border-sky-500/30 bg-sky-950/40 p-4 text-left">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase text-sky-400">
                      🎁 Beneficios para Socios
                    </h3>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Próximamente habilitaremos descuentos, sorteos y beneficios exclusivos presentando este carnet para socios con cuota al día de la Filial Trelew.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setSocioEncontrado(null)}
                  className="text-xs text-slate-400 hover:text-sky-300 underline cursor-pointer pt-2"
                >
                  ← Consultar otro DNI
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODO ADMIN: Login clásico */}
        {modo === 'admin' && (
          <form onSubmit={handleLoginAdmin} className="space-y-4">
            <div>
              <label className="block text-xs text-sky-200 font-bold uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@filialtrelew.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-sky-200 font-bold uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {errorAdmin && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-400 text-xs p-3 rounded-lg text-center">
                {errorAdmin}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingAdmin}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3.5 rounded-xl uppercase tracking-wider text-sm transition-all shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loadingAdmin ? 'Ingresando...' : 'Acceder al Panel'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center border-t border-slate-800 pt-4">
          <Link href="/" className="text-xs text-slate-400 hover:text-sky-300 transition-colors">
            ← Volver a la web principal
          </Link>
        </div>

      </div>
    </main>
  );
}