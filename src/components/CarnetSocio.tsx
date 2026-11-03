'use client';

import { useRef, useState } from 'react';
import type { SocioPortal } from '@/lib/socios';

type CarnetSocioProps = {
  socio?: Partial<SocioPortal>;
  allowPrint?: boolean;
  allowFlip?: boolean;
};

export default function CarnetSocio({
  socio,
  allowPrint = true,
  allowFlip = true,
}: CarnetSocioProps) {
  const [mostrarDorso, setMostrarDorso] = useState(false);
  const tarjetaRef = useRef<HTMLDivElement>(null);

  const datosSocio: Partial<SocioPortal> = socio ?? {
    nombre: 'GUSTAVO',
    apellido: 'COSTAS',
    dni: '22.222.222',
    socio_racing: 'No es socio',
    numero_socio_filial: '22',
    foto_url: null,
  };
  const imagenCarnet = datosSocio.foto_url || '/logos/Logo1.png';
  const nombreCompleto = `${datosSocio.nombre ?? ''} ${datosSocio.apellido ?? ''}`.trim();
  const numeroFilial = datosSocio.numero_socio_filial
    ? `#${datosSocio.numero_socio_filial}`
    : 'Sin asignar';

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const tiltX = (0.5 - y) * 16;
    const tiltY = (x - 0.5) * 16;

    event.currentTarget.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    event.currentTarget.style.setProperty('--glare-x', `${x * 100}%`);
    event.currentTarget.style.setProperty('--glare-y', `${y * 100}%`);
    event.currentTarget.style.setProperty('--glare-opacity', '1');
  };

  const handlePointerLeave = () => {
    if (!tarjetaRef.current) return;
    tarjetaRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
    tarjetaRef.current.style.setProperty('--glare-opacity', '0');
  };

  const handleFlip = () => {
    if (allowFlip) setMostrarDorso((mostrar) => !mostrar);
  };

  const handleFlipKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (allowFlip && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleFlip();
    }
  };

  const handleImprimir = () => {
    const limpiarModoImpresion = () => document.body.classList.remove('printing-carnet');
    window.addEventListener('afterprint', limpiarModoImpresion, { once: true });
    document.body.classList.add('printing-carnet');

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  };

  const datosFrontales = (
    <>
      <img
        src={imagenCarnet}
        alt=""
        className="carnet-photo"
      />
      <div className="carnet-name">{nombreCompleto}</div>
      <div className="carnet-dni">{datosSocio.dni || 'Sin DNI'}</div>
      <div className="carnet-racing">{datosSocio.socio_racing || 'No es socio'}</div>
      <div className="carnet-filial">{numeroFilial}</div>
    </>
  );

  return (
    <div className="my-2 flex select-none flex-col items-center gap-3 font-sans">
      <div className="card-perspective">
        <div
          ref={tarjetaRef}
          role="button"
          tabIndex={allowFlip ? 0 : -1}
          aria-label="Credencial del socio"
          aria-disabled={!allowFlip}
          aria-pressed={allowFlip ? mostrarDorso : undefined}
          onClick={handleFlip}
          onKeyDown={handleFlipKeyDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className={`carnet-card relative aspect-[370/233] w-[min(330px,calc(100vw-2rem))] overflow-hidden rounded-3xl border-2 border-sky-400/60 shadow-[0_0_30px_rgba(56,189,248,0.35)] transition-[transform,border-color,box-shadow] duration-300 sm:aspect-auto sm:h-[233px] sm:w-[370px] ${
            allowFlip ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300' : ''
          }`}
          style={{
            backgroundImage: `url(${mostrarDorso ? '/carnet/carnetdorso.png' : '/carnet/carnetfrente.png'})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transformStyle: 'preserve-3d',
          }}
        >
          {!mostrarDorso && <div className="carnet-fields">{datosFrontales}</div>}
          <div aria-hidden="true" className="carnet-glare pointer-events-none absolute inset-0 z-20" />
        </div>
      </div>

      {allowFlip && (
        <p className="rounded-full border border-sky-500/30 bg-sky-950/60 px-3 py-1 text-xs font-bold tracking-wider text-sky-300">
          🔄 Hacé clic en la tarjeta para ver el dorso
        </p>
      )}

      {allowPrint && (
        <button
          type="button"
          onClick={handleImprimir}
          className="mt-1 flex cursor-pointer items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-black uppercase text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition hover:scale-105 hover:bg-sky-400 print:hidden"
        >
          <span aria-hidden="true">🖨️</span> Descargar / Imprimir credencial
        </button>
      )}

      <div aria-hidden="true" className="print-carnet-root">
        <div
          className="print-carnet-card"
          style={{ backgroundImage: "url('/carnet/carnetfrente.png')" }}
        >
          {datosFrontales}
        </div>
        <div
          className="print-carnet-card"
          style={{ backgroundImage: "url('/carnet/carnetdorso.png')" }}
        />
      </div>
    </div>
  );
}
