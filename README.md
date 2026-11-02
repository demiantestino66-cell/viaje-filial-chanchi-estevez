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
