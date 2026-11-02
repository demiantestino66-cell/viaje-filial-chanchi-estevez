import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ success: false, error: 'Los datos enviados no son válidos.' }, { status: 400 });
    }

    const { nombre, apellido, dni, telefono, localidad, socioRacing, fotoBase64 } = body;
    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      typeof apellido !== 'string' ||
      !apellido.trim() ||
      typeof dni !== 'string' ||
      !dni.trim() ||
      typeof telefono !== 'string' ||
      !telefono.trim() ||
      typeof localidad !== 'string' ||
      !localidad.trim() ||
      (socioRacing !== undefined && typeof socioRacing !== 'string')
    ) {
      return NextResponse.json({ success: false, error: 'Completá todos los campos obligatorios.' }, { status: 400 });
    }

    if (fotoBase64 !== undefined && typeof fotoBase64 !== 'string') {
      return NextResponse.json({ success: false, error: 'El archivo de foto no es válido.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Falta la configuración de Supabase para registrar socios.');
      return NextResponse.json(
        { success: false, error: 'El servicio no está disponible en este momento.' },
        { status: 500 },
      );
    }

    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    let fotoUrl = '/logos/Logo1.png';

    if (fotoBase64) {
      const base64Parts = fotoBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!base64Parts) {
        return NextResponse.json({ success: false, error: 'La foto debe ser JPG, PNG o WebP.' }, { status: 400 });
      }

      const contentType = base64Parts[1];
      const fileBuffer = Buffer.from(base64Parts[2], 'base64');
      if (fileBuffer.length === 0 || fileBuffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'La foto debe pesar menos de 5 MB.' }, { status: 400 });
      }

      const fileExt = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
      const fileName = `${dni.replace(/\D/g, '')}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabaseServer.storage
        .from('fotos-socios')
        .upload(fileName, fileBuffer, {
          contentType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error al subir foto del socio:', uploadError);
        return NextResponse.json(
          { success: false, error: 'No se pudo subir la foto. Intentá nuevamente.' },
          { status: 502 },
        );
      }

      const { data: publicUrlData } = supabaseServer.storage
        .from('fotos-socios')
        .getPublicUrl(fileName);
      fotoUrl = publicUrlData.publicUrl;
    }

    const { data, error: dbError } = await supabaseServer
      .from('socios')
      .insert([
        {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          dni: dni.trim(),
          telefono: telefono.trim(),
          localidad,
          socio_racing: socioRacing?.trim() || 'No es socio',
          foto_url: fotoUrl,
          estado: 'pendiente',
        },
      ])
      .select();

    if (dbError) {
      console.error('Error DB Supabase:', dbError);
      return NextResponse.json(
        { success: false, error: 'No se pudo registrar la solicitud. Revisá los datos e intentá nuevamente.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error al registrar socio:', error);
    return NextResponse.json(
      { success: false, error: 'Ocurrió un error interno. Intentá nuevamente más tarde.' },
      { status: 500 },
    );
  }
}
