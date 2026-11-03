'use client';

import { useEffect, useRef, useState } from 'react';
import { Oswald } from 'next/font/google';
import Link from 'next/link';
import { buscarSocioPorDni, type SocioPortal } from '@/lib/socios';
import CarnetSocio from '@/components/CarnetSocio';
import SocioSkeleton from '@/components/SocioSkeleton';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'] });
const WHATSAPP_FILIAL = '5492804588309';

const AUDIOS = [
  '/audio/Audio.mp3',
  '/audio/Audio1.mp3',
  '/audio/Audio2.mp3',
  '/audio/Audio3.mp3',
];

const NOTICIAS = [
  {
    categoria: 'Actualidad',
    titulo: 'Noticias de Racing Club',
    descripcion:
      'Novedades y comunicados confirmados del club, en un espacio preparado para su actualización semanal.',
    href: 'https://www.racingclub.com.ar/',
    enlace: 'Ver canal oficial',
  },
  {
    categoria: 'Socios',
    titulo: 'Información para socios',
    descripcion:
      'Consultá la información vigente sobre servicios, beneficios y gestiones para socios.',
    href: 'https://racingpass.racingclub.com.ar/',
    enlace: 'Ir a Racing Pass',
  },
  {
    categoria: 'Filial Trelew',
    titulo: 'Novedades de la comunidad',
    descripcion:
      'Este espacio permite compartir cada semana las actividades y novedades de la filial.',
    href: 'https://racing-filial-trelew-chanchi.vercel.app',
    enlace: 'Web de la filial',
  },
];

const CANALES_OFICIALES = [
  {
    titulo: 'Sitio oficial de Racing Club',
    descripcion: 'Noticias y comunicados institucionales.',
    href: 'https://www.racingclub.com.ar/',
  },
  {
    titulo: 'Racing Pass',
    descripcion: 'Gestiones e información para socios.',
    href: 'https://racingpass.racingclub.com.ar/',
  },
  {
    titulo: 'Tienda oficial Locademia',
    descripcion: 'Productos oficiales de Racing Club.',
    href: 'https://locademia.racingclub.com.ar/',
  },
];

const glassCard =
  'rounded-3xl border border-sky-400/25 bg-slate-900/65 shadow-[0_0_35px_rgba(14,165,233,0.12)] backdrop-blur-xl';

export default function HomePage() {
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [dniConsulta, setDniConsulta] = useState('');
  const [socioEncontrado, setSocioEncontrado] = useState<SocioPortal | null>(null);
  const [buscandoSocio, setBuscandoSocio] = useState(false);
  const [errorSocio, setErrorSocio] = useState<string | null>(null);
  const [consultaEnviada, setConsultaEnviada] = useState<string | null>(null);
  const [consulta, setConsulta] = useState({
    nombre: '',
    tema: 'Información general',
    mensaje: '',
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    audio.volume = 0.5;
    audio.play().then(
      () => setAudioError(null),
      () => {
        setIsPlaying(false);
        setAudioError('No se pudo reproducir el audio. Intentá nuevamente.');
      },
    );
  }, [currentAudioIndex, isPlaying]);

  const handleBuscarSocio = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorSocio(null);
    setSocioEncontrado(null);
    setBuscandoSocio(true);

    try {
      const resultado = await buscarSocioPorDni(dniConsulta);
      switch (resultado.tipo) {
        case 'encontrado':
          setSocioEncontrado(resultado.socio);
          break;
        case 'pendiente':
          setErrorSocio(
            `Tu solicitud se encuentra en estado: "${resultado.estado}". Aún no ha sido aprobada.`,
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
          break;
      }
    } catch (error) {
      console.error('[Supabase socios] error inesperado al buscar socio', error);
      setErrorSocio('No se pudo completar la consulta. Revisá tu conexión e intentá nuevamente.');
    } finally {
      setBuscandoSocio(false);
    }
  };

  const handleEnviarConsulta = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mensaje = [
      'Hola, Filial Racing Club Trelew. Quisiera realizar una consulta general.',
      '',
      `Nombre: ${consulta.nombre.trim()}`,
      `Tema: ${consulta.tema}`,
      `Consulta: ${consulta.mensaje.trim()}`,
    ].join('\n');
    const url = `https://wa.me/${WHATSAPP_FILIAL}?text=${encodeURIComponent(mensaje)}`;
    setConsultaEnviada(url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const abrirModal = () => {
    setModalClosing(false);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setModalClosing(true);
  };

  return (
    <main className={`relative min-h-screen overflow-x-hidden bg-slate-950 text-white ${oswald.className}`}>
      <audio
        ref={audioRef}
        src={AUDIOS[currentAudioIndex]}
        preload="none"
        onEnded={() => setCurrentAudioIndex((index) => (index + 1) % AUDIOS.length)}
      />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-sky-500/15 blur-[120px]" />
        <div className="absolute -right-32 top-[38%] h-96 w-96 rounded-full bg-blue-700/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-[60] border-b border-sky-400/25 bg-slate-950/85 shadow-[0_4px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#inicio" aria-label="Filial Trelew, inicio">
              <img
                src="/logos/Logo2.png"
                alt="Escudo Filial Trelew"
                className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.65)]"
              />
            </a>
            <button
              type="button"
              onClick={() => {
                setAudioError(null);
                setIsPlaying((playing) => !playing);
              }}
              aria-pressed={isPlaying}
              className="rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.15)] transition hover:bg-sky-500/30 sm:text-xs"
            >
              {isPlaying ? 'Pausar música' : 'Reproducir música'}
            </button>
            <a
              href="https://www.lared.am/racing-a115934"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-200 transition hover:bg-red-500/20 sm:inline-flex"
            >
              Radio
            </a>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="menu-principal"
            className="flex items-center gap-2 rounded-xl border border-sky-400/25 bg-slate-900/80 p-2 text-sky-100 transition hover:border-sky-300"
          >
            <span className="hidden text-xs font-bold uppercase tracking-widest sm:block">Menú</span>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        <nav
          id="menu-principal"
          aria-label="Navegación principal"
          className={`overflow-hidden border-t border-sky-400/15 bg-slate-950/95 transition-all duration-300 ${
            isMenuOpen ? 'max-h-96 py-4' : 'max-h-0'
          }`}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 text-center text-sm font-bold uppercase tracking-wider sm:flex-row sm:justify-center">
            {[
              ['#actualidad', 'Actualidad'],
              ['#fixture', 'Fixture'],
              ['#comunicados', 'Comunicados'],
              ['#consultas', 'Consultas'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl border border-white/5 bg-slate-800/50 px-4 py-3 text-slate-200 transition hover:border-sky-400/30 hover:text-sky-300"
              >
                {label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                abrirModal();
              }}
              className="rounded-xl bg-sky-400 px-4 py-3 text-slate-950 transition hover:bg-sky-300"
            >
              Socios y credenciales
            </button>
          </div>
        </nav>
      </header>

      {showModal && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md ${
            modalClosing ? 'portal-backdrop-exit' : 'portal-backdrop-enter'
          }`}
          onClick={cerrarModal}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget || !modalClosing) return;
            setShowModal(false);
            setModalClosing(false);
            setSocioEncontrado(null);
            setDniConsulta('');
            setErrorSocio(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-portal-socios"
            className={`${glassCard} relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6 text-center font-sans ${
              modalClosing ? 'portal-dialog-exit' : 'portal-dialog-enter'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={cerrarModal}
              aria-label="Cerrar portal de socios"
              className="absolute right-4 top-4 rounded-full px-2 text-slate-400 transition hover:text-white"
            >
              ✕
            </button>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/15 text-2xl text-sky-300">
              🪪
            </div>
            <h2 id="titulo-portal-socios" className="text-2xl font-black uppercase tracking-wider">
              Portal de socios
            </h2>
            <p className="mb-5 mt-1 text-xs text-slate-300">Filial Trelew “Chanchi Estévez”</p>

            {!socioEncontrado ? (
              <div className="space-y-4">
                <form
                  onSubmit={handleBuscarSocio}
                  className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-left"
                >
                  <label htmlFor="dni-socio" className="block text-xs font-bold uppercase tracking-wider text-sky-200">
                    Consultar credencial por DNI
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="dni-socio"
                      type="text"
                      required
                      value={dniConsulta}
                      onChange={(event) => setDniConsulta(event.target.value)}
                      placeholder="Ingresá tu DNI"
                      className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white focus:border-sky-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={buscandoSocio}
                      className="rounded-xl bg-sky-400 px-4 text-xs font-black uppercase text-slate-950 transition hover:bg-sky-300 disabled:opacity-50"
                    >
                      {buscandoSocio ? 'Buscando' : 'Ver'}
                    </button>
                  </div>
                  {errorSocio && (
                    <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
                      {errorSocio}
                    </p>
                  )}
                </form>
                {buscandoSocio && <SocioSkeleton />}

                <Link
                  href="/registro-socio"
                  onClick={cerrarModal}
                  className="block rounded-xl border border-sky-400/30 bg-slate-800/70 px-4 py-3 text-xs font-bold uppercase tracking-wider text-sky-200 transition hover:border-sky-300"
                >
                  Solicitar carnet de socio
                </Link>
                <Link
                  href="/login"
                  onClick={cerrarModal}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:text-sky-300"
                >
                  Acceso de administración
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-2 text-xs font-bold uppercase text-emerald-300">
                  Socio validado
                </p>
                {socioEncontrado.cuota_al_dia === 'si' ? (
                  <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
                    Cuota al día · Beneficios habilitados
                  </p>
                ) : (
                  <div className="motion-safe:animate-pulse space-y-3 rounded-2xl border border-orange-400/60 bg-gradient-to-br from-orange-950/70 to-red-950/50 p-4 shadow-[0_0_24px_rgba(249,115,22,0.18)]">
                    <p className="text-xs font-black uppercase text-orange-300">
                      Beneficios temporalmente suspendidos
                    </p>
                    <p className="text-xs text-orange-100">
                      {socioEncontrado.fecha_deuda
                        ? `Registramos una cuota pendiente desde ${socioEncontrado.fecha_deuda}.`
                        : 'Contactanos para consultar el estado de tu cuota.'}
                    </p>
                    <a
                      href={`https://wa.me/${WHATSAPP_FILIAL}?text=${encodeURIComponent(
                        `Hola, soy ${socioEncontrado.nombre} ${socioEncontrado.apellido} (DNI: ${socioEncontrado.dni}). Quisiera consultar el estado de mi cuota.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl bg-orange-400 px-4 py-3 text-xs font-black uppercase text-slate-950 transition hover:bg-orange-300"
                    >
                      Consultar por WhatsApp
                    </a>
                  </div>
                )}
                <div className="flex justify-center">
                  <CarnetSocio
                    socio={socioEncontrado}
                    allowPrint={socioEncontrado.cuota_al_dia === 'si'}
                    allowFlip={socioEncontrado.cuota_al_dia === 'si'}
                  />
                </div>
                {socioEncontrado.cuota_al_dia !== 'si' && (
                  <p className="text-xs font-semibold text-orange-200">
                    La vista básica se mantiene; el dorso y la impresión se habilitan al regularizar la cuota.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSocioEncontrado(null);
                    setDniConsulta('');
                    setErrorSocio(null);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold uppercase text-sky-200 transition hover:border-sky-400/40"
                >
                  Consultar otro DNI
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={cerrarModal}
              className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-bold uppercase text-slate-400 transition hover:text-white"
            >
              Cerrar
            </button>
          </section>
        </div>
      )}

      <div className="relative z-10 pt-16">
        <section
          id="inicio"
          className="mx-auto flex min-h-[72svh] max-w-7xl flex-col items-center justify-center px-5 py-20 text-center"
        >
          <img
            src="/logos/Logo1.png"
            alt="Escudo de la Filial Racing Club Trelew"
            className="mb-6 h-24 w-24 rounded-full border border-sky-300/40 bg-white/5 object-contain p-2 shadow-[0_0_35px_rgba(56,189,248,0.25)]"
          />
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-sky-300">
            Racing Club · Chubut
          </p>
          <h1 className="max-w-4xl text-4xl font-black uppercase leading-tight tracking-wide text-white drop-shadow-[0_0_25px_rgba(56,189,248,0.25)] sm:text-6xl md:text-7xl">
            Filial Trelew
            <span className="mt-2 block text-sky-300">“Chanchi Estévez”</span>
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-base leading-relaxed text-slate-200 sm:text-lg">
            Actualidad de Racing, información oficial y novedades de nuestra comunidad académica en Trelew.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#actualidad"
              className="rounded-xl bg-sky-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.25)] transition hover:bg-sky-300"
            >
              Ver actualidad
            </a>
            <button
              type="button"
              onClick={abrirModal}
              className="rounded-xl border border-sky-300/40 bg-slate-900/60 px-6 py-3 text-xs font-black uppercase tracking-wider text-sky-100 transition hover:border-sky-200"
            >
              Portal de socios
            </button>
          </div>
          {audioError && (
            <p role="status" className="mt-4 text-xs text-amber-200">
              {audioError}
            </p>
          )}
        </section>

        <section id="actualidad" className="scroll-mt-24 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Racing Club</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-wide sm:text-4xl">
                Actualidad <span className="text-sky-300">&amp; Noticias</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl font-sans text-sm text-slate-300">
                Un espacio listo para renovar semanalmente con información confirmada por los canales oficiales.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {NOTICIAS.map((noticia) => (
                <article key={noticia.titulo} className={`${glassCard} flex flex-col p-6 transition hover:border-sky-300/50`}>
                  <span className="w-fit rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                    {noticia.categoria}
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-white">{noticia.titulo}</h3>
                  <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-slate-300">
                    {noticia.descripcion}
                  </p>
                  <a
                    href={noticia.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-300 transition hover:text-white"
                  >
                    {noticia.enlace} <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="fixture" className="scroll-mt-24 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className={`${glassCard} overflow-hidden`}>
              <div className="border-b border-sky-400/20 bg-sky-500/10 px-6 py-5 sm:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-200">Agenda académica</p>
                <h2 className="mt-2 text-3xl font-black uppercase">Fixture y próximo partido</h2>
              </div>
              <div className="grid gap-8 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-sky-300">Próximo encuentro</p>
                  <p className="mt-3 text-2xl font-black sm:text-3xl">Programación a confirmar</p>
                  <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-slate-300">
                    La fecha, el horario y el rival se publicarán cuando Racing Club los confirme oficialmente.
                    Consultá el fixture actualizado en los canales del club.
                  </p>
                </div>
                <a
                  href="https://www.racingclub.com.ar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-sky-300/40 bg-sky-500/15 px-5 py-3 text-center text-xs font-black uppercase tracking-wider text-sky-100 transition hover:bg-sky-500/25"
                >
                  Consultar fixture oficial ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="comunicados" className="scroll-mt-24 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Información verificada</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-wide sm:text-4xl">
                Comunicados <span className="text-sky-300">oficiales</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl font-sans text-sm text-slate-300">
                Consultá cada novedad directamente en las plataformas oficiales de Racing Club.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {CANALES_OFICIALES.map((canal) => (
                <a
                  key={canal.titulo}
                  href={canal.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${glassCard} group p-6 transition hover:-translate-y-1 hover:border-sky-300/50`}
                >
                  <span className="text-2xl text-sky-300" aria-hidden="true">✦</span>
                  <h3 className="mt-4 text-lg font-bold group-hover:text-sky-200">{canal.titulo}</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-slate-300">{canal.descripcion}</p>
                  <span className="mt-5 inline-block text-xs font-black uppercase tracking-wider text-sky-300">
                    Visitar canal ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="consultas" className="scroll-mt-24 px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Estamos para ayudarte</p>
              <h2 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-4xl">
                Preguntas y consultas <span className="text-sky-300">generales</span>
              </h2>
              <p className="mt-4 font-sans text-sm leading-relaxed text-slate-300">
                Completá el formulario y enviaremos tu consulta a la Filial Trelew por WhatsApp.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_FILIAL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-bold text-sky-200 transition hover:text-white"
              >
                Contactar a la filial por WhatsApp ↗
              </a>
            </div>

            <form onSubmit={handleEnviarConsulta} className={`${glassCard} space-y-4 p-6 sm:p-8`}>
              <div>
                <label htmlFor="consulta-nombre" className="mb-1 block text-xs font-bold uppercase tracking-wider text-sky-200">
                  Nombre
                </label>
                <input
                  id="consulta-nombre"
                  type="text"
                  autoComplete="name"
                  required
                  value={consulta.nombre}
                  onChange={(event) => setConsulta({ ...consulta, nombre: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 font-sans text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="consulta-tema" className="mb-1 block text-xs font-bold uppercase tracking-wider text-sky-200">
                  Tema
                </label>
                <select
                  id="consulta-tema"
                  value={consulta.tema}
                  onChange={(event) => setConsulta({ ...consulta, tema: event.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 font-sans text-sm text-white focus:border-sky-400 focus:outline-none"
                >
                  <option>Información general</option>
                  <option>Socios y credenciales</option>
                  <option>Actividades de la filial</option>
                  <option>Fixture y entradas</option>
                  <option>Otro tema</option>
                </select>
              </div>
              <div>
                <label htmlFor="consulta-mensaje" className="mb-1 block text-xs font-bold uppercase tracking-wider text-sky-200">
                  Tu consulta
                </label>
                <textarea
                  id="consulta-mensaje"
                  required
                  rows={5}
                  maxLength={1000}
                  value={consulta.mensaje}
                  onChange={(event) => setConsulta({ ...consulta, mensaje: event.target.value })}
                  className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/80 p-3 font-sans text-sm text-white focus:border-sky-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.2)] transition hover:bg-sky-300"
              >
                Enviar consulta por WhatsApp
              </button>
              {consultaEnviada && (
                <p role="status" className="text-center font-sans text-xs text-slate-300">
                  Si WhatsApp no se abrió,{' '}
                  <a
                    href={consultaEnviada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sky-300 underline"
                  >
                    continuá desde este enlace
                  </a>
                  .
                </p>
              )}
            </form>
          </div>
        </section>

        <footer className="border-t border-sky-400/20 bg-slate-950/75 px-4 py-8 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Filial Racing Club Trelew “Chanchi Estévez”
          </p>
          <p className="mt-2 font-sans text-xs text-slate-400">
            Comunidad académica de Trelew y el Valle del Chubut
          </p>
          <button
            type="button"
            onClick={abrirModal}
            className="mt-4 text-xs font-bold uppercase tracking-wider text-sky-300 transition hover:text-white"
          >
            Portal de socios
          </button>
        </footer>
      </div>
    </main>
  );
}
