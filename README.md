# Filial Racing Club Trelew

Sitio oficial de la Filial Trelew “Chanchi Estévez”, con actualidad de Racing Club, fixture, comunicados, consultas por WhatsApp y gestión de socios.

## Desarrollo local

Requisitos: Node.js y npm.

1. Instalá las dependencias con `npm install`.
2. Configurá `.env.local` con las variables de Supabase:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Iniciá el servidor con `npm run dev` y abrí `http://localhost:3000`.

Antes de publicar, validá la compilación con `npm run build`.

## Actualización de contenido

- Actualizá las tarjetas semanales de actualidad en `src/app/page.tsx`, en el arreglo `NOTICIAS`.
- El fixture muestra “Programación a confirmar” hasta que Racing Club publique información oficial; no se deben completar fechas sin confirmar.
- El formulario de consultas abre WhatsApp al número de contacto configurado en `WHATSAPP_FILIAL`, en `src/app/page.tsx`.
- Los datos de acceso a Supabase se administran mediante variables de entorno; no guardes claves en el código fuente.

## Gestión de socios

- El portal consulta por DNI y recupera solo los datos necesarios para validar la solicitud y mostrar la credencial.
- El panel `/admin` usa una proyección explícita de columnas para reducir el tamaño de la respuesta; el filtro de padrón se aplica localmente sin nuevas consultas.
- La exportación genera CSV compatible con Excel (BOM UTF-8 y separador `;`), con valores escapados para conservar tildes y comillas.
- La impresión de la credencial usa el diálogo nativo del navegador y una hoja A4 con frente y dorso; en el navegador se puede elegir “Guardar como PDF”.
- Para padrones grandes, conviene indexar `socios.dni` y `socios.created_at` y evaluar paginación del padrón y una exportación por lotes. La disponibilidad de esos índices depende del esquema de Supabase desplegado.
- El login y la búsqueda de DNI se ejecutan en el navegador. Los errores técnicos de Auth y PostgREST se registran en la consola del navegador con código y mensaje, sin incluir contraseña, token, DNI ni datos del socio. En un conteo de cero filas, RLS puede ocultar registros; el cliente no puede confirmar si la tabla está realmente vacía.
- No hay migraciones SQL ni configuración local que permitan verificar las políticas RLS desplegadas. Revisalas en Supabase antes de cambiar permisos: exigí un rol administrativo confiable para las operaciones del panel y no habilites `SELECT` público irrestricto sobre datos personales. El portal público necesita un flujo limitado que verifique al socio y devuelva solo los campos de su credencial; no concedas lectura anónima general de `socios`.
- Para administrar la tabla `socios`, habilitá RLS y aplicá políticas separadas para cada operación. La autorización del panel debe basarse en un rol comprobable (por ejemplo, un claim protegido de `app_metadata`), no solo en que exista una sesión `authenticated`. Conservá el alta pública únicamente si está limitada y validada; revisá duplicados de DNI y permisos de `INSERT` en Storage por separado.
