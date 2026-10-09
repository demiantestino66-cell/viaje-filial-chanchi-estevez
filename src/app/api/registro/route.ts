import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// URL y KEY hardcodeadas con la 'w' correspondiente para evitar lecturas cacheadas
const SUPABASE_URL = 'https://dwjrwnwuktkvdggjnjrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3anJ3bnd1a3RrdmRnZ2puanJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0OTU3OTYsImV4cCI6MjEwNzA3MTc5Nn0.BKfjgodsmkKWrMYAXnuKOtgT_bitLKBcd1APM6AdnKI';

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, apellido, dni, telefono, localidad, socioRacing, fotoBase64, fotoType } = body;

    let fotoUrl = '/logos/Logo1.png';

    // 1. Subir foto a Storage con cliente server local
    if (fotoBase64) {
      try {
        const fileBuffer = Buffer.from(fotoBase64.split(',')[1], 'base64');
        const fileExt = (fotoType && fotoType.split('/')[1]) || 'jpg';
        const fileName = `${dni.trim()}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseServer.storage
          .from('fotos-socios')
          .upload(fileName, fileBuffer, {
            contentType: fotoType || 'image/jpeg',
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabaseServer.storage
            .from('fotos-socios')
            .getPublicUrl(fileName);
          fotoUrl = publicUrlData.publicUrl;
        } else {
          console.error('Error Storage:', uploadError);
        }
      } catch (errStorage) {
        console.error('Excepción Storage:', errStorage);
      }
    }

    // 2. Insertar socio en BD con cliente server local
    const { data, error: dbError } = await supabaseServer.from('socios').insert([
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        telefono: telefono.trim(),
        localidad: localidad,
        socio_racing: socioRacing?.trim() || 'No es socio',
        foto_url: fotoUrl,
        estado: 'pendiente',
      },
    ]).select();

    if (dbError) {
      console.error('Error DB Supabase:', dbError);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error Servidor:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Error interno del servidor' }, { status: 500 });
  }
}