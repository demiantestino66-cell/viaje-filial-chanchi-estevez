'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Oswald } from 'next/font/google';
import CarnetSocio from '@/components/CarnetSocio';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'] });

export default function LoginPage() {
  const [modo, setModo] = useState<'socio' | 'admin'>('socio');

  // Estados para Socio (Búsqueda por DNI)
  const [dniConsulta, setDniConsulta] = useState('');
  const [socioEncontrado, setSocioEncontrado] = useState<any>(null);
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
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('dni', dniConsulta.trim())
        .single();

      if (error || !data) {
        setErrorSocio('No se encontró ningún socio registrado con ese DNI.');
      } else if (data.estado !== 'aprobado') {
        setErrorSocio(`Tu solicitud se encuentra en estado: "${data.estado}". Aún no está aprobada por la comisión.`);
      } else {
        setSocioEncontrado(data);
      }
    } catch (err) {
      setErrorSocio('Ocurrió un error al buscar el DNI. Intentá nuevamente.');
    } finally {
      setBuscandoSocio(false);
    }
  };

  // Login de Administrador
  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAdmin(null);
    setLoadingAdmin(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setErrorAdmin('Credenciales incorrectas. Verificá tu correo y contraseña.');
      setLoadingAdmin(false);
      return;
    }

    if (data?.session) {
      router.refresh();
      window.location.href = '/admin';
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
            Racing Club "Chanchi Estévez"
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

                {/* Renderizamos el Carnet con los datos reales */}
                <div className="flex justify-center scale-95 origin-top">
                  <CarnetSocio socio={socioEncontrado} />
                </div>

                {/* BANNER DE BENEFICIOS PRÓXIMAMENTE */}
                <div className="bg-sky-950/40 border border-sky-500/30 p-4 rounded-xl text-left space-y-1">
                  <h3 className="text-xs font-bold uppercase text-sky-400 flex items-center gap-1.5">
                    🎁 Beneficios para Socios
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Próximamente habilitaremos descuentos, sorteos y beneficios exclusivos presentando este carnet para socios con cuota al día de la Filial Trelew.
                  </p>
                </div>

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
          <a href="/" className="text-xs text-slate-400 hover:text-sky-300 transition-colors">
            ← Volver a la web principal
          </a>
        </div>

      </div>
    </main>
  );
}