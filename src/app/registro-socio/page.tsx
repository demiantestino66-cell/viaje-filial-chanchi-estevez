'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroSocioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    localidad: 'Trelew',
    socioRacing: '',
  });

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivoFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  // Convertir la imagen a Base64 para enviarla al endpoint del servidor
  const convertBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!archivoFoto) {
      alert('Por favor selecciona una foto para el carnet.');
      return;
    }

    setLoading(true);

    try {
      const fotoBase64 = await convertBase64(archivoFoto);

      // Enviamos la petición a nuestra API interna de Next.js
      const response = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fotoBase64,
          fotoType: archivoFoto.type,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fallo en el servidor al registrar');
      }

      alert('¡Solicitud registrada con éxito!');
      router.push('/');
    } catch (err: any) {
      console.error('Error al registrar:', err);
      alert(`Error al registrar: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050b16] p-4 font-sans text-white sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-sky-500/10 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />

      <div className="relative my-6 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:my-8 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-400/[0.07] blur-3xl" />

        <div className="relative mb-7 flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-300/10 text-2xl text-sky-200">
            <span aria-hidden="true">＋</span>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/65">
              Racing Club · Filial Trelew
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Asociate a la Filial
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
              Completá tus datos y cargá tu foto para generar tu credencial.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-semibold text-slate-300">Foto para el carnet</label>
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-600/80 bg-white/[0.03] p-5 text-center transition-all duration-300 hover:border-sky-400/50 hover:bg-sky-400/[0.04] sm:flex-row sm:text-left">
              {previewFoto ? (
                <img
                  src={previewFoto}
                  alt="Previsualización"
                  className="h-24 w-20 shrink-0 rounded-xl border border-white/10 object-cover object-top shadow-lg"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl text-sky-200 transition group-hover:border-sky-300/20 group-hover:bg-sky-300/10" aria-hidden="true">
                  ↑
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-100">
                  {previewFoto ? 'Foto seleccionada' : 'Subí tu foto de carnet'}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {previewFoto ? 'Elegí otra imagen para reemplazarla' : 'Seleccioná una imagen desde tu dispositivo'}
                </span>
              </span>
              <span className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-sky-200 transition-all duration-300 group-hover:bg-sky-300/20">
                {previewFoto ? 'Cambiar foto' : 'Seleccionar'}
              </span>
              <input type="file" accept="image/*" onChange={handleFotoChange} className="sr-only" required />
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Nombre</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Apellido</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">DNI</label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Teléfono</label>
            <input
              type="text"
              required
              placeholder="280..."
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Localidad</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
            >
              <option value="Trelew">Trelew</option>
              <option value="Rawson">Rawson</option>
              <option value="Gaiman">Gaiman</option>
              <option value="Dolavon">Dolavon</option>
              <option value="Puerto Madryn">Puerto Madryn</option>
              <option value="Otra">Otra</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">N° Socio Racing</label>
            <input
              type="text"
              placeholder="Opcional"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, socioRacing: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-300 to-sky-500 px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-sky-500/20 transition-all duration-300 hover:scale-105 hover:from-sky-200 hover:to-sky-400 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
          >
            {loading ? 'Cargando Solicitud...' : 'Enviar Solicitud de Socio'}
          </button>
        </form>
      </div>
    </main>
  );
}