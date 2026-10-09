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
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-sky-500/40 rounded-2xl p-6 md:p-8 shadow-2xl my-8">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-sky-400 uppercase tracking-wide">
            Asociate a la Filial Trelew
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Completá tus datos y cargá tu foto para generar tu credencial.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-24 h-28 bg-slate-950 border-2 border-dashed border-sky-500/50 rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner">
              {previewFoto ? (
                <img src={previewFoto} alt="Previsualización" className="w-full h-full object-cover object-top" />
              ) : (
                <span className="text-[10px] text-slate-400 text-center px-2">Subí tu foto de carnet</span>
              )}
            </div>
            <label className="bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 border border-sky-500/50 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all font-bold uppercase tracking-wider">
              {previewFoto ? 'Cambiar Foto' : 'Seleccionar Foto'}
              <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" required />
            </label>
          </div>

          <div>
            <label className="block text-xs text-sky-200 mb-1 font-bold uppercase">Nombre</label>
            <input
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs text-sky-200 mb-1 font-bold uppercase">Apellido</label>
            <input
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-sky-200 mb-1 font-bold uppercase">DNI</label>
              <input
                type="text"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-sky-200 mb-1 font-bold uppercase">Teléfono</label>
              <input
                type="text"
                required
                placeholder="280..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-sky-200 mb-1 font-bold uppercase">Localidad</label>
              <select
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
              <label className="block text-xs text-sky-200 mb-1 font-bold uppercase">N° Socio Racing</label>
              <input
                type="text"
                placeholder="Opcional"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                onChange={(e) => setFormData({ ...formData, socioRacing: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 rounded-lg uppercase tracking-wider text-sm transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {loading ? 'Cargando Solicitud...' : 'Enviar Solicitud de Socio'}
          </button>
        </form>
      </div>
    </main>
  );
}