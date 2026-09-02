'use client';

import { useState, useEffect, useRef } from 'react';
import { Oswald } from 'next/font/google';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'] });

const IMAGENES = [
  '/galeria/Foto1.jpg',
  '/galeria/Foto2.jpg',
  '/galeria/Foto3.jpg',
  '/galeria/Foto4.jpg',
  '/galeria/Foto5.jpg',
];

const AUDIOS = [
  '/audio/Audio.mp3',
  '/audio/Audio1.mp3',
  '/audio/Audio2.mp3',
  '/audio/Audio3.mp3',
];

const FECHA_SALIDA = new Date('2026-10-17T12:00:00');
const FECHA_PARTIDO = new Date('2026-10-18T17:30:00');

export default function ViajeFilialPage() {
  const [currentImg, setCurrentImg] = useState(0);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Estados para la nueva barra superior
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [timeLeftSalida, setTimeLeftSalida] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [timeLeftPartido, setTimeLeftPartido] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const [formData, setFormData] = useState({
    nombre: '',
    dniSocio: '',
    socioFilial: 'Soy Socio',
    socioRacing: 'Socio Racing Avellaneda',
    localidad: 'Trelew',
    pago: 'Efectivo',
    aclaraciones: '',
  });

  // Cuenta regresiva
  useEffect(() => {
    const calculateTime = (targetDate: Date) => {
      const diff = targetDate.getTime() - new Date().getTime();
      if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
      return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      };
    };

    const timer = setInterval(() => {
      setTimeLeftSalida(calculateTime(FECHA_SALIDA));
      setTimeLeftPartido(calculateTime(FECHA_PARTIDO));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Rotación de imágenes de fondo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % IMAGENES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Control estricto del reproductor cíclico
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleEnded = () => {
      setCurrentAudioIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % AUDIOS.length;
        return nextIndex;
      });
    };

    audioEl.addEventListener('ended', handleEnded);
    return () => {
      audioEl.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    audioEl.src = AUDIOS[currentAudioIndex];
    audioEl.load();
    if (isPlaying) {
      audioEl.volume = 0.5;
      audioEl.play().catch(() => {});
    }
  }, [currentAudioIndex, isPlaying]);

  const togglePlayAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.volume = 0.5;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const PHONE_JONY = "5492804588309";
    const mensaje = `¡Hola Filial! Quiero reservar mi lugar para el viaje:\n\n` +
      `*Nombre y Apellido:* ${formData.nombre}\n` +
      `*DNI / N° Socio:* ${formData.dniSocio}\n` +
      `*Socio Filial Trelew:* ${formData.socioFilial}\n` +
      `*Condición Racing:* ${formData.socioRacing}\n` +
      `*Localidad:* ${formData.localidad}\n` +
      `*Método de Pago:* ${formData.pago}\n` +
      `*Aclaraciones:* ${formData.aclaraciones || 'Sin aclaraciones'}`;

    window.open(`https://wa.me/${PHONE_JONY}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <main className={`relative w-full bg-slate-950 text-white overflow-x-hidden ${oswald.className} scroll-smooth`}>
      
      <audio ref={audioRef} src={AUDIOS[currentAudioIndex]} preload="auto" />

      {/* ENCABEZADO / NAVBAR SUPERIOR FIJO */}
      <header className="fixed top-0 left-0 w-full z-[60] bg-slate-950/80 backdrop-blur-md border-b border-sky-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Lado Izquierdo: Logo y Música Integrados */}
          <div className="flex items-center gap-3">
            <img src="/logos/Logo2.png" alt="Escudo Filial" className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            <button 
              onClick={togglePlayAudio}
              className="bg-sky-500/20 border border-sky-500/50 hover:bg-sky-500/40 text-sky-400 font-bold px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 text-[10px] uppercase tracking-wider"
            >
              <span>{isPlaying ? '🔊 Música ON' : '🔇 Play'}</span>
            </button>
          </div>

          {/* Lado Derecho: Botón Menú */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white hover:text-sky-400 p-2 transition-colors flex items-center gap-2 bg-slate-800/50 rounded-lg border border-white/10"
          >
            <span className="text-xs uppercase font-bold tracking-widest hidden sm:block text-sky-200">Menú</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
          </button>
        </div>

        {/* MENÚ DESPLEGABLE */}
        <div className={`absolute top-16 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-sky-500/30 transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-[420px] py-6' : 'max-h-0 py-0'} shadow-2xl`}>
          <nav className="flex flex-col items-center gap-2 text-sm uppercase tracking-widest font-sans font-bold px-4">
            
            {/* ENLACE A LA WEB PRINCIPAL DE LA FILIAL */}
            <a href="https://racing-filial-trelew-chanchi.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 transition-colors w-full py-3 bg-sky-500/10 border border-sky-500/40 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
              Web Oficial Filial Trelew
            </a>

            <a href="https://www.racingclub.com.ar/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-slate-200 hover:text-sky-400 transition-colors w-full py-3 bg-slate-800/30 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Sitio Oficial Racing
            </a>
            
            <a href="https://racingpass.racingclub.com.ar/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-slate-200 hover:text-sky-400 transition-colors w-full py-3 bg-slate-800/30 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              Racing Pass
            </a>

            <a href="https://locademia.racingclub.com.ar/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-slate-200 hover:text-sky-400 transition-colors w-full py-3 bg-slate-800/30 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Tienda Locademia
            </a>
            
            <div className="w-3/4 h-px bg-slate-700/50 my-2"></div>
            
            <button 
              onClick={() => { setShowModal(true); setIsMenuOpen(false); }}
              className="bg-sky-500 text-slate-950 px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)] w-full transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Ingreso Socios Filial
            </button>
          </nav>
        </div>
      </header>

      {/* MODAL EN CONSTRUCCIÓN (Z-Index alto para tapar todo) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-sky-500/50 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_40px_rgba(56,189,248,0.3)] animate-pulse" onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-16 h-16 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mb-4 border border-sky-500/50 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">Área en Construcción</h3>
            <p className="text-slate-300 text-sm font-sans mb-6 font-medium">Próximamente: Club de beneficios locales, credencial digital y autogestión exclusiva para Socios de la Filial Trelew.</p>
            <button 
              onClick={() => setShowModal(false)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black w-full py-3 rounded-lg uppercase tracking-widest text-sm transition-colors shadow-lg"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      )}

      {/* Slider de Fondo */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-slate-950">
        {IMAGENES.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentImg ? 'opacity-[0.80] scale-105' : 'opacity-0 scale-100'
            } transition-transform duration-[6000ms]`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/30 to-slate-950/50" />
      </div>

      <div className="relative z-10 pt-16">
        
        {/* PANTALLA 1: HERO & CONTADORES */}
        <section className="min-h-[100svh] flex flex-col items-center justify-center p-6 text-center space-y-8 pb-20">
          <div className="bg-slate-950/30 p-4 rounded-2xl backdrop-blur-[2px] border border-white/10 mt-8">
            <h1 className="text-4xl md:text-6xl font-bold text-sky-400 uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] mb-2">
              Nos vamos al Cilindro
            </h1>
            <h2 className="text-xl md:text-3xl text-white uppercase tracking-widest font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Y en esta página podés reservar tu lugar
            </h2>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-sky-500/30 p-6 rounded-2xl w-full max-w-2xl shadow-2xl">
            <h3 className="text-2xl text-sky-300 font-bold uppercase mb-6 animate-pulse">¡Ya falta menos!</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <p className="text-sm text-slate-200 uppercase mb-2 font-bold tracking-wider">Salida del Bondi</p>
                <div className="flex gap-3 text-2xl font-bold text-white drop-shadow-md">
                  <div className="flex flex-col items-center"><span className="text-4xl text-sky-400">{timeLeftSalida.d}</span><span className="text-xs font-normal">Días</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span className="text-4xl text-sky-400">{timeLeftSalida.h}</span><span className="text-xs font-normal">Hs</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span className="text-4xl text-sky-400">{timeLeftSalida.m}</span><span className="text-xs font-normal">Min</span></div>
                </div>
                <p className="text-xs text-slate-100 mt-2 max-w-[200px] font-sans font-medium drop-shadow">17 de Octubre, 12:00 PM<br/>La Anónima (Colombia y Av. Trabajadores)</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="text-sm text-slate-200 uppercase mb-2 font-bold tracking-wider">Inicio del Partido</p>
                <div className="flex gap-3 text-2xl font-bold text-white drop-shadow-md">
                  <div className="flex flex-col items-center"><span className="text-4xl text-white">{timeLeftPartido.d}</span><span className="text-xs font-normal">Días</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span className="text-4xl text-white">{timeLeftPartido.h}</span><span className="text-xs font-normal">Hs</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span className="text-4xl text-white">{timeLeftPartido.m}</span><span className="text-xs font-normal">Min</span></div>
                </div>
                <p className="text-xs text-slate-100 mt-2 font-sans font-medium drop-shadow">18 de Octubre, 17:30 HS (A confirmar)</p>
              </div>
            </div>
          </div>
        </section>

        {/* PANTALLA 2: BENEFICIOS Y PRECIOS */}
        <section className="min-h-[100svh] flex flex-col items-center justify-center p-6 text-center space-y-8">
          <div className="max-w-3xl w-full bg-slate-900/45 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-sky-500/35">
            <h2 className="text-3xl md:text-5xl font-bold text-white uppercase mb-4 leading-tight drop-shadow-md">
              Si sos socio de la Filial Chanchi Estévez de Trelew <span className="text-sky-400">tenés beneficios siempre</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-200 mb-10 font-sans font-medium drop-shadow">
              Completá el formulario abajo del todo y reservá tu lugar.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-6 mb-8 font-sans">
              <div className="bg-sky-950/60 border-2 border-sky-500/50 rounded-2xl p-6 flex-1 shadow-lg backdrop-blur-sm">
                <p className="text-sm uppercase text-sky-200 font-black mb-2 tracking-widest">Socios de la Filial</p>
                <p className="text-4xl md:text-5xl font-black text-white">$240.000</p>
              </div>
              <div className="bg-slate-900/60 border-2 border-slate-600/50 rounded-2xl p-6 flex-1 shadow-lg backdrop-blur-sm">
                <p className="text-sm uppercase text-slate-300 font-bold mb-2 tracking-widest">No Socios</p>
                <p className="text-4xl md:text-5xl font-black text-slate-300">$270.000</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-sky-200 uppercase tracking-widest font-sans font-bold drop-shadow">
              (Precios para Socios Avellaneda. ¿No sos socio? Comunicate vía formulario)
            </p>
          </div>
        </section>

        {/* PANTALLA 3: ITINERARIO */}
        <section className="min-h-[100svh] flex flex-col items-center justify-center p-6 w-full">
          <h2 className="text-4xl md:text-5xl font-bold text-sky-400 uppercase mb-10 text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] bg-slate-950/40 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            Itinerario del Viaje
          </h2>
          
          <div className="max-w-2xl w-full space-y-5 font-sans">
            <div className="flex gap-5 items-start bg-slate-900/50 backdrop-blur-md p-5 rounded-xl border-l-4 border-sky-500 shadow-xl">
              <div className="bg-sky-500/20 p-3 rounded-full border border-sky-500/40 text-sky-400 drop-shadow-md">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 16c0 .88.39 1.67 1 2.22v1.28c0 .83.67 1.5 1.5 1.5S8 20.33 8 19.5V19h8v.5c0 .82.67 1.5 1.5 1.5.82 0 1.5-.68 1.5-1.5v-1.28c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V7h12v4z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-lg uppercase">Salida desde Trelew</h4>
                <p className="text-slate-200 text-sm mt-1 font-medium drop-shadow-sm">Día 17 a las 12:00 PM. Bombos, canciones y mucho más para compartir una experiencia única.</p>
              </div>
            </div>
            
            <div className="flex gap-5 items-start bg-slate-900/50 backdrop-blur-md p-5 rounded-xl border-l-4 border-sky-500 shadow-xl">
              <div className="bg-sky-500/20 p-3 rounded-full border border-sky-500/40 text-sky-400 drop-shadow-md">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22,18H2V20H22V18M13.84,13C12.8,11.23 12,8.85 12,6C12,8.85 11.2,11.23 10.16,13C8.61,15.65 6,15.93 6,15.93H18C18,15.93 15.39,15.65 13.84,13M21,11V13H19C19,10.61 17.57,8.5 15.42,7.56C17.06,7.18 18.25,5.63 18.25,3.75V3H19.75V3.75C19.75,4.72 20.53,5.5 21.5,5.5V7C20.08,7 18.84,7.84 18.37,9.08C19.92,9.35 21,10.05 21,11M5.75,3H4.25V3.75C4.25,5.63 5.44,7.18 7.08,7.56C4.93,8.5 3.5,10.61 3.5,13V11C3.5,10.05 4.58,9.35 6.13,9.08C5.66,7.84 4.42,7 3,7V5.5C3.97,5.5 4.75,4.72 4.75,3.75V3H5.75Z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-lg uppercase">Predio Tita (A confirmar)</h4>
                <p className="text-slate-200 text-sm mt-1 font-medium drop-shadow-sm">Llegamos, comemos y compartimos en los fogones en la previa del partido.</p>
              </div>
            </div>

            <div className="flex gap-5 items-start bg-slate-900/50 backdrop-blur-md p-5 rounded-xl border-l-4 border-sky-500 shadow-xl">
              <div className="bg-sky-500/20 p-3 rounded-full border border-sky-500/40 text-sky-400 drop-shadow-md">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22,10V6A2,2 0 0,0 20,4H4A2,2 0 0,0 2,6V10C3.11,10 4,10.9 4,12C4,13.11 3.11,14 2,14V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V14C20.89,14 20,13.11 20,12C20,10.9 20.89,10 22,10M11,15H9V13H11V15M11,11H9V9H11V11M15,15H13V13H15V15M15,11H13V9H15V11Z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-lg uppercase">Entradas y Credenciales</h4>
                <p className="text-slate-200 text-sm mt-1 font-medium drop-shadow-sm">Entrega de entradas y organización. Caminata hasta el Cilindro en grupos consolidados.</p>
              </div>
            </div>

            <div className="flex gap-5 items-start bg-slate-900/50 backdrop-blur-md p-5 rounded-xl border-l-4 border-sky-500 shadow-xl">
              <div className="bg-sky-500/20 p-3 rounded-full border border-sky-500/40 text-sky-400 drop-shadow-md">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2C6.5 2 2 4.5 2 7v10c0 2.5 4.5 5 10 5s10-2.5 10-5V7c0-2.5-4.5-5-10-5zm0 18c-4.4 0-8-2.2-8-4V9.6c2.1 1.5 5 2.4 8 2.4s5.9-.9 8-2.4V16c0 1.8-3.6 4-8 4zm0-9c-4.4 0-8-1.8-8-4s3.6-4 8-4 8 1.8 8 4-3.6 4-8 4z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-lg uppercase">Post-Partido y Retorno</h4>
                <p className="text-slate-200 text-sm mt-1 font-medium drop-shadow-sm">Al término del partido hacemos un punto de encuentro cercano al Cilindro para esperar el colectivo y pegamos la vuelta.</p>
              </div>
            </div>
            
            <p className="text-center text-sm text-sky-300 font-bold pt-4 bg-slate-950/50 p-3 rounded-xl border border-white/10 shadow-md backdrop-blur-sm">
              📱 Grupo de WhatsApp activo durante todo el viaje para cualquier duda.
            </p>
          </div>
        </section>
{/* PANTALLA / SECCIÓN: RADIO EN VIVO */}
        <section className="min-h-[60svh] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 md:p-12 rounded-3xl border-2 border-sky-500/30 w-full max-w-3xl shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white uppercase mb-4">Radio & Transmisión en Vivo</h2>
            <p className="text-slate-200 text-sm md:text-base font-sans mb-8">
              Escuchá los partidos y seguí las transmisiones oficiales y partidarias durante el viaje.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <a 
                href="https://racingonline.com.ar/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-sky-500/20 border border-sky-500/50 hover:bg-sky-500/40 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group shadow-lg"
              >
                <span className="text-3xl">📻</span>
                <span className="font-bold text-white uppercase tracking-wider text-lg group-hover:text-sky-300">Racing Online</span>
                <span className="text-xs text-sky-200">Transmisión partidaria oficial</span>
              </a>

              <a 
                href="https://www.lared.am/racing-a115934" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-slate-800/60 border border-slate-600/50 hover:bg-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group shadow-lg"
              >
                <span className="text-3xl">🎙️</span>
                <span className="font-bold text-white uppercase tracking-wider text-lg group-hover:text-sky-300">Radio La Red (AM 910)</span>
                <span className="text-xs text-slate-300">Relatos en directo de AFA</span>
              </a>
            </div>
          </div>
        </section>
        {/* PANTALLA 4: MÉTODOS DE PAGO */}
        <section className="min-h-[70svh] flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900/50 backdrop-blur-md p-10 rounded-3xl border-2 border-sky-500/30 w-full max-w-3xl shadow-2xl">
            <h2 className="text-3xl font-bold text-white uppercase mb-10">Métodos de Pago</h2>
            
            <div className="flex flex-wrap justify-center items-center gap-10 mb-10">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-1 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                  <img src="/logos/Logomp.jfif" alt="Mercado Pago" className="h-14 md:h-16 rounded-lg object-cover" />
                </div>
                <span className="text-xs uppercase text-slate-200 font-bold tracking-widest font-sans">Mercado Pago</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 bg-slate-900/80 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)] border border-sky-500/40 text-sky-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m4 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className="text-xs uppercase text-slate-200 font-bold tracking-widest font-sans">Transferencias</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 bg-slate-900/80 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)] border border-sky-500/40 text-sky-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V11.75M3.75 5.25h16.5m-16.5 0a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25m16.5-15a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25m-12-7.5h.008v.008H8.25v-.008z" />
                  </svg>
                </div>
                <span className="text-xs uppercase text-slate-200 font-bold tracking-widest font-sans">Efectivo</span>
              </div>
            </div>

            <div className="bg-sky-950/60 p-6 rounded-xl border border-sky-500/40 inline-block backdrop-blur-sm shadow-lg max-w-md w-full">
              <p className="text-2xl md:text-3xl text-sky-400 font-black uppercase mb-4 drop-shadow-md">Hasta 2 cuotas</p>
              
              <div className="flex flex-col gap-3 mb-5 text-left bg-slate-900/50 p-4 rounded-xl border border-sky-500/20 shadow-inner">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p className="text-slate-200 text-sm font-sans font-bold tracking-wide">1ra Cuota: Hasta el 15 de Septiembre</p>
                </div>
                <div className="h-px w-full bg-sky-500/20"></div>
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p className="text-slate-200 text-sm font-sans font-bold tracking-wide">2da Cuota: Hasta el 14 de Octubre</p>
                </div>
              </div>
              
              <p className="text-slate-300 text-xs font-sans font-medium uppercase tracking-widest">Comunicate y resolvemos cualquier consulta sobre los pagos.</p>
            </div>
            
          </div>
        </section>

        {/* PANTALLA 5: COMUNICADOS OFICIALES ACTUALIZADOS */}
        <section className="min-h-[100svh] flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="bg-slate-950/40 backdrop-blur-sm p-3 rounded-xl border border-white/10 mb-2 shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-sky-400 uppercase drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] tracking-wider">
              Comunicados Oficiales
            </h2>
          </div>
          
          <div className="max-w-md w-full space-y-6">
            {/* Comunicado 1 (Racing Pass) */}
            <div className="bg-slate-900/50 backdrop-blur-xl p-4 rounded-3xl border-2 border-sky-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-transform hover:scale-[1.02] duration-300">
              <img 
                src="/galeria/Foto6.png" 
                alt="Comunicado Filial Trelew Racing Pass" 
                className="w-full h-auto rounded-2xl object-cover shadow-lg border border-sky-500/20" 
              />
            </div>

            {/* Comunicado 2 (Valores de Socios - Foto7.jpg) */}
            <div className="bg-slate-900/50 backdrop-blur-xl p-4 rounded-3xl border-2 border-sky-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-transform hover:scale-[1.02] duration-300">
              <img 
                src="/galeria/Foto7.jpg" 
                alt="Valores Vigentes para Asociarse a Racing Club" 
                className="w-full h-auto rounded-2xl object-cover shadow-lg border border-sky-500/20" 
              />
            </div>
          </div>
        </section>

        {/* PANTALLA 6: FORMULARIO FINAL REESTRUCTURADO */}
        <section className="min-h-[100svh] flex flex-col items-center justify-center p-4 pb-20">
          <div className="max-w-md w-full bg-slate-900/55 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-sky-500/40">
            
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="overflow-hidden rounded-full h-24 w-24 md:h-28 md:w-28 shadow-[0_0_20px_rgba(56,189,248,0.6)] mb-4 inline-block border-2 border-sky-400 bg-white">
                <img src="/logos/Logo1.png" alt="Logo Filial Oficial" className="h-full w-full object-cover scale-110" />
              </div>
              <h2 className="text-2xl font-black text-sky-400 uppercase tracking-wide drop-shadow-md">
                Reservá tu Pasaje
              </h2>
              <p className="text-sm text-slate-100 mt-1 font-sans font-semibold drop-shadow">
                Completá el Formulario y enviáselo a la filial
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs text-sky-200 mb-1 font-bold uppercase tracking-wider">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-950/70 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-white transition-all shadow-inner"
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              {/* DNI y Socio Filial en la misma fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-sky-200 mb-1 font-bold uppercase tracking-wider">DNI o N° Socio</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950/70 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-white transition-all shadow-inner"
                    onChange={(e) => setFormData({ ...formData, dniSocio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-sky-200 mb-1 font-bold uppercase tracking-wider">Socio Filial Trelew</label>
                  <select
                    className="w-full bg-slate-950/70 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-white transition-all shadow-inner"
                    onChange={(e) => setFormData({ ...formData, socioFilial: e.target.value })}
                  >
                    <option value="Soy Socio" className="bg-slate-900">Soy Socio</option>
                    <option value="No Soy Socio" className="bg-slate-900">No Soy Socio</option>
                  </select>
                </div>
              </div>

              {/* Condición Racing y Localidad en la misma fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-sky-200 mb-1 font-bold uppercase tracking-wider">Condición Racing</label>
                  <select
                    className="w-full bg-slate-950/70 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-white transition-all shadow-inner"
                    onChange={(e) => setFormData({ ...formData, socioRacing: e.target.value })}
                  >
                    <option value="Socio Racing Avellaneda" className="bg-slate-900">Socio Racing Avellaneda</option>
                    <option value="No soy Socio" className="bg-slate-900">No soy Socio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-sky-200 mb-1 font-bold uppercase tracking-wider">Localidad</label>
                  <select
                    className="w-full bg-slate-950/70 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-white transition-all shadow-inner"
                    onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
                  >
                    <option value="Trelew" className="bg-slate-900">Trelew</option>
                    <option value="Gaiman" className="bg-slate-900">Gaiman</option>
                    <option value="Dolavon" className="bg-slate-900">Dolavon</option>
                    <option value="Rawson" className="bg-slate-900">Rawson</option>
                    <option value="Puerto Madryn" className="bg-slate-900">Puerto Madryn</option>
                    <option value="Comodoro Rivadavia" className="bg-slate-900">Comodoro Rivadavia</option>
                    <option value="Otra provincia (Aclarar)" className="bg-slate-900">De otra provincia (Indicar abajo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-sky-200 mb-1 font-bold uppercase tracking-wider">Método de Pago</label>
                <select
                  className="w-full bg-slate-950/70 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-white transition-all shadow-inner"
                  onChange={(e) => setFormData({ ...formData, pago: e.target.value })}
                >
                  <option value="Efectivo" className="bg-slate-900">Efectivo</option>
                  <option value="Transferencia" className="bg-slate-900">Transferencia</option>
                  <option value="En 2 Cuotas" className="bg-slate-900">En 2 Cuotas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-sky-200 mb-1 font-bold uppercase tracking-wider">
                  Aclaraciones <span className="text-[10px] text-slate-400 font-normal normal-case">(Máx. 140 caracteres)</span>
                </label>
                <textarea
                  maxLength={140}
                  rows={3}
                  placeholder="Indicanos si viajás con alguien, tu provincia si no sos de Chubut..."
                  className="w-full bg-slate-950/70 border border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none text-white resize-none transition-all shadow-inner"
                  onChange={(e) => setFormData({ ...formData, aclaraciones: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-4 rounded-lg shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] transition duration-300 mt-4 uppercase tracking-widest text-lg cursor-pointer"
              >
                Enviar Reserva a Filial
              </button>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full bg-slate-950/90 backdrop-blur-md border-t-4 border-slate-900 p-8 text-center text-xs font-sans relative z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-xl mx-auto flex flex-col items-center gap-5">
            
            {/* BOTÓN WEB PRINCIPAL DE LA FILIAL */}
            <div className="w-full mb-2">
              <a 
                href="https://racing-filial-trelew-chanchi.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center gap-2 bg-sky-500/20 border border-sky-500/50 text-sky-400 hover:bg-sky-500/30 px-6 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all shadow-lg w-full max-w-sm mx-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                🌐 Visitar la Web Principal de la Filial
              </a>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="bg-transparent overflow-hidden rounded-full shadow-[0_0_25px_rgba(56,189,248,0.3)] border-4 border-sky-600/50 h-24 w-24 md:h-32 md:w-32 flex items-center justify-center transition-transform hover:scale-105 duration-300">
                <img src="/logos/Logo3.png" alt="Soberanía Editorial" className="h-full w-full object-cover drop-shadow-md" />
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <span className={`font-bold text-white tracking-[0.25em] text-lg md:text-xl uppercase drop-shadow-md ${oswald.className}`}>
                  Soberanía Editorial
                </span>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-sky-400 font-bold bg-sky-950/60 px-4 py-1.5 rounded-full border border-sky-800/50">
                  Desarrollo Web & Servicios Digitales
                </span>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-sm leading-relaxed font-medium drop-shadow">
              Desarrollamos soluciones digitales, plataformas y sistemas de gestión a medida.
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-slate-200 font-semibold text-xs mt-3">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                Soberanía Digital
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                edicionesdemiantestino@gmail.com
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                2804841846
              </span>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}