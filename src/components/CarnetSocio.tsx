'use client';

import { useState } from 'react';

export default function CarnetSocio({ socio }: { socio?: any }) {
  const [mostrarDorso, setMostrarDorso] = useState(false);

  const datosSocio = socio || {
    nombre: 'GUSTAVO',
    apellido: 'COSTAS',
    dni: '22.222.222',
    socio_racing: 'No es socio',
    numero_socio_filial: '22',
    foto_url: null,
  };

  const imagenCarnet = datosSocio.foto_url || '/logos/Logo1.png';

  const handleImprimirODescargar = () => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
      alert('Por favor permití las ventanas emergentes (pop-ups) en tu navegador para descargar el carnet.');
      return;
    }

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Carnet Digital - Filial Trelew Chanchi Estévez</title>
          <style>
            body {
              background-color: #020617;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: sans-serif;
              color: white;
            }
            .carnet-wrapper {
              display: flex;
              flex-direction: column;
              gap: 24px;
              align-items: center;
            }
            .card {
              width: 370px;
              height: 233px;
              border-radius: 16px;
              overflow: hidden;
              position: relative;
              box-shadow: 0 10px 25px rgba(0,0,0,0.5);
              border: 1px solid rgba(56, 189, 248, 0.4);
              background-size: 100% 100%;
              background-position: center;
              background-repeat: no-repeat;
            }
            .front { background-image: url('/carnet/carnetfrente.png'); }
            .back { background-image: url('/carnet/carnetdorso.png'); }
            
            .foto {
              position: absolute;
              top: 56%;
              left: 2.5%;
              width: 21%;
              height: 37%;
              object-fit: cover;
              object-position: top;
              border-radius: 4px;
            }
            .texto-nombre {
              position: absolute;
              top: 60%;
              left: 34.2%;
              font-weight: 900;
              text-transform: uppercase;
              font-size: 11px;
              color: white;
              text-shadow: 0 1.2px 1.2px #0ea5e9;
            }
            .texto-dni {
              position: absolute;
              top: 67.2%;
              left: 30.5%;
              font-family: monospace;
              font-weight: 900;
              font-size: 10px;
              color: white;
              text-shadow: 0 1.2px 1.2px #0ea5e9;
            }
            .texto-racing {
              position: absolute;
              top: 74.5%;
              left: 46.5%;
              font-family: monospace;
              font-weight: 900;
              font-size: 9.5px;
              color: white;
              text-shadow: 0 1.2px 1.2px #0ea5e9;
            }
            .texto-filial {
              position: absolute;
              top: 80.5%;
              left: 38.5%;
              font-family: monospace;
              font-weight: 900;
              font-size: 10px;
              color: white;
              text-shadow: 0 1.2px 1.2px #0ea5e9;
            }
            .no-print {
              margin-top: 25px;
              text-align: center;
            }
            button {
              background-color: #38bdf8;
              color: #020617;
              font-weight: 900;
              border: none;
              padding: 12px 24px;
              border-radius: 10px;
              cursor: pointer;
              text-transform: uppercase;
              font-size: 12px;
              box-shadow: 0 0 15px rgba(56,189,248,0.4);
            }
            @media print {
              .no-print { display: none; }
              body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; margin-bottom: 15px; text-align: center;">
            Credencial Oficial - Filial Trelew "Chanchi Estévez"
          </h2>
          <div class="carnet-wrapper">
            <div class="card front">
              <img src="${imagenCarnet}" class="foto" crossorigin="anonymous" />
              <div class="texto-nombre">${datosSocio.nombre} ${datosSocio.apellido}</div>
              <div class="texto-dni">${datosSocio.dni}</div>
              <div class="texto-racing">${datosSocio.socio_racing || 'No es socio'}</div>
              <div class="texto-filial">${datosSocio.numero_socio_filial ? `#${datosSocio.numero_socio_filial}` : 'Sin asignar'}</div>
            </div>
            <div class="card back"></div>
          </div>
          <div class="no-print">
            <button onclick="window.print()">🖨️ Imprimir o Guardar como PDF (HD)</button>
          </div>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-3 my-2 font-sans select-none">
      
      {/* Contenedor del Carnet con Efecto Glow y Sombra Premium */}
      <div 
        onClick={() => setMostrarDorso(!mostrarDorso)}
        className="w-[330px] h-[208px] sm:w-[370px] sm:h-[233px] rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(56,189,248,0.35)] relative border-2 border-sky-400/60 cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:border-sky-300"
        style={{
          backgroundImage: `url(${mostrarDorso ? '/carnet/carnetdorso.png' : '/carnet/carnetfrente.png'})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {!mostrarDorso && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            
            <img 
              src={imagenCarnet} 
              alt="Foto Socio" 
              className="absolute object-cover object-top rounded-lg border border-sky-500/40 shadow-md"
              style={{
                top: '56%',    
                left: '2.5%',   
                width: '21%',   
                height: '37%',  
              }}
            />

            <div className="absolute font-black uppercase text-[10px] sm:text-[11px] text-white drop-shadow-[0_1.5px_1.5px_rgba(14,165,233,1)] tracking-wide"
              style={{ 
                top: '60%',      
                left: '34.2%'    
              }}>
              {datosSocio.nombre} {datosSocio.apellido}
            </div>

            <div className="absolute font-mono font-black text-[10px] text-white drop-shadow-[0_1.5px_1.5px_rgba(14,165,233,1)]"
              style={{ 
                top: '67.2%',    
                left: '30.5%'    
              }}>
              {datosSocio.dni}
            </div>

            <div className="absolute font-mono font-black text-[9.5px] text-white drop-shadow-[0_1.5px_1.5px_rgba(14,165,233,1)]"
              style={{ 
                top: '74.5%',    
                left: '46.5%'    
              }}>
              {datosSocio.socio_racing || 'No es socio'}
            </div>

            <div className="absolute font-mono font-black text-[10px] text-white drop-shadow-[0_1.5px_1.5px_rgba(14,165,233,1)]"
              style={{ 
                top: '80.5%',    
                left: '38.5%'    
              }}>
              {datosSocio.numero_socio_filial ? `#${datosSocio.numero_socio_filial}`: 'Sin asignar'}
            </div>

          </div>
        )}
      </div>

      <p className="text-xs text-sky-300 font-bold tracking-wider animate-pulse bg-sky-950/60 px-3 py-1 rounded-full border border-sky-500/30">
        🔄 Hacé clic en la tarjeta para ver el dorso
      </p>

      <button
        onClick={handleImprimirODescargar}
        className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase py-2.5 px-5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all flex items-center gap-2 cursor-pointer mt-1 transform hover:scale-105"
      >
        <span>🖨️</span> Descargar / Imprimir Credencial (HD)
      </button>

    </div>
  );
}