import { supabase } from '@/lib/supabase';

export type SocioPortal = {
  nombre: string;
  apellido: string;
  dni: string;
  estado: string;
  cuota_al_dia?: string | null;
  fecha_deuda?: string | null;
  foto_url?: string | null;
  socio_racing?: string | null;
  numero_socio_filial?: string | null;
};

export type ResultadoBusquedaSocio =
  | { tipo: 'encontrado'; socio: SocioPortal }
  | { tipo: 'pendiente'; estado: string }
  | { tipo: 'dni-invalido' }
  | { tipo: 'padron-vacio' }
  | { tipo: 'sin-coincidencia' }
  | { tipo: 'error'; mensaje: string };

function variantesDni(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!/^\d{7,8}$/.test(digits)) return null;

  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return [...new Set([digits, formatted])];
}

function mensajeErrorBusqueda(error: { code?: string; message?: string }) {
  switch (error.code) {
    case '42P01':
    case 'PGRST205':
      return 'No se encontró la tabla de socios en Supabase. Verificá la configuración de la base de datos.';
    case '42703':
    case 'PGRST204':
      return 'Faltan columnas de socios en Supabase. Verificá el esquema de la tabla.';
    case '42501':
      return 'La base de datos no permite consultar socios. Revisá las políticas de acceso público.';
    case 'PGRST116':
      return 'Hay más de un registro para ese DNI. La comisión debe revisar el padrón.';
    default:
      return 'No se pudo consultar el padrón de socios. Intentá nuevamente más tarde.';
  }
}

function registrarErrorConsulta(
  operacion: 'buscar_por_dni' | 'contar_padron_visible',
  error: { code?: string; message?: string },
) {
  console.error('[Supabase socios] consulta fallida', {
    operacion,
    code: error.code ?? 'sin código',
    message: error.message ?? 'Sin detalle',
  });
}

function esSocioPortal(value: unknown): value is SocioPortal {
  if (typeof value !== 'object' || value === null) return false;
  const socio = value as Record<string, unknown>;

  return (
    typeof socio.nombre === 'string' &&
    typeof socio.apellido === 'string' &&
    typeof socio.dni === 'string' &&
    typeof socio.estado === 'string'
  );
}

export async function buscarSocioPorDni(value: string): Promise<ResultadoBusquedaSocio> {
  const dnis = variantesDni(value);
  if (!dnis) return { tipo: 'dni-invalido' };

  try {
    const { data, error } = await supabase
      .from('socios')
      .select(
        'nombre,apellido,dni,estado,cuota_al_dia,fecha_deuda,foto_url,socio_racing,numero_socio_filial',
      )
      .in('dni', dnis)
      .maybeSingle();

    if (error) {
      registrarErrorConsulta('buscar_por_dni', error);
      return { tipo: 'error', mensaje: mensajeErrorBusqueda(error) };
    }

    if (!data) {
      const { count, error: countError } = await supabase
        .from('socios')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        registrarErrorConsulta('contar_padron_visible', countError);
        return { tipo: 'error', mensaje: mensajeErrorBusqueda(countError) };
      }

      if (count === 0) {
        console.info('[Supabase socios] consulta completada', {
          resultado: 'sin registros visibles (el conteo puede estar limitado por RLS)',
        });
        return { tipo: 'padron-vacio' };
      }

      console.info('[Supabase socios] consulta completada', { resultado: 'sin coincidencia' });
      return { tipo: 'sin-coincidencia' };
    }

    if (!esSocioPortal(data)) {
      console.error('La consulta de socios devolvió datos con un formato inesperado.');
      return {
        tipo: 'error',
        mensaje: 'Los datos del socio no tienen el formato esperado. Contactá a la comisión.',
      };
    }

    if (data.estado !== 'aprobado') {
      console.info('[Supabase socios] consulta completada', { resultado: 'solicitud pendiente' });
      return { tipo: 'pendiente', estado: data.estado };
    }

    console.info('[Supabase socios] consulta completada', { resultado: 'socio aprobado' });
    return { tipo: 'encontrado', socio: data };
  } catch (error) {
    console.error('Error inesperado al consultar el padrón de socios:', error);
    return {
      tipo: 'error',
      mensaje: 'No se pudo conectar con el padrón de socios. Revisá tu conexión e intentá nuevamente.',
    };
  }
}
