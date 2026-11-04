# Repaso

Plataforma de estudio con IA para universitarios en Venezuela. El estudiante sube su clase (PDF, láminas de PowerPoint, Word, fotos del cuaderno, audio o video de Zoom/Meet) y Repaso le prepara:

- **Resumen** por secciones, conceptos clave y «lo que más pueden preguntar».
- **Fichas** para memorizar (repaso espaciado por cajas).
- **Quiz** de opción múltiple con explicación de cada respuesta.
- **Preguntas de desarrollo** con guía de respuesta y corrección del tutor.
- **Tutor** que responde preguntas sobre esa clase.
- **Pide una explicación**: el estudiante te manda (al administrador) la clase o el tema que no entendió, y tú respondes desde el panel con texto y archivos.

Cobro pensado para Venezuela: precios en dólares, pago por **Pago Móvil** (en bolívares a la tasa BCV que tú cargas), **Binance** o **Zelle**, verificado a mano desde el panel. No hay cobros automáticos.

## Stack

| Pieza | Para qué |
| --- | --- |
| Next.js 16 (App Router) + Tailwind 4 | Web y API, desplegada en Vercel |
| Supabase | Login, base de datos Postgres con seguridad por usuario (RLS) y almacenamiento de archivos |
| Claude (Anthropic) | Genera el kit de estudio y responde en el tutor |
| ElevenLabs Speech-to-Text | Transcribe las clases grabadas |

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta todo [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Crea las tablas, las reglas de seguridad y los buckets de archivos.
3. En **Authentication → URL Configuration**:
   - *Site URL*: tu dominio (por ejemplo `https://repaso.vercel.app`).
   - *Redirect URLs*: añade `https://TU-DOMINIO/auth/callback`.
4. En **Authentication → Emails**, traduce al español las plantillas de confirmación y de recuperación de contraseña.
5. Copia de **Project Settings → API**: la URL, la `anon key` y la `service_role key`.

### 2. Claves de IA

- **Anthropic**: crea una API key en [console.anthropic.com](https://console.anthropic.com).
- **ElevenLabs** (solo para clases grabadas): crea una API key en tu cuenta de ElevenLabs.

### 3. Vercel

1. Importa este repositorio en [vercel.com](https://vercel.com/new).
2. En **Settings → Environment Variables**, carga las variables de [`.env.example`](.env.example).
3. Pon tu correo en `REPASO_ADMIN_EMAILS`: al entrar con ese correo tendrás el panel **Administración**.
4. Despliega. Luego entra a **Administración → Tasa y datos de pago**, carga la tasa BCV del día y tus datos de Pago Móvil, Binance y Zelle.

> **Importante:** el plan Hobby (gratis) de Vercel es solo para uso no comercial. Para cobrar necesitas el plan Pro. Pro también permite funciones más largas, útil para clases grabadas largas.

### Desarrollo local

```bash
npm install
```

```bash
npx supabase start
```

Copia las claves que imprime ese comando en `.env.local` (usa `.env.example` como guía) y luego:

```bash
npm run dev
```

## Costos de la IA (léelo antes de fijar precios)

El modelo se elige con `REPASO_AI_MODEL`. Por defecto es `claude-opus-5-5`, el más capaz. Precios por millón de tokens (entrada / salida), según la tabla de Anthropic de octubre de 2026:

| Modelo | Entrada | Salida | Costo aproximado por kit* |
| --- | --- | --- | --- |
| `claude-opus-5-5` | $4 | $20 | $0,15 – $0,30 |
| `claude-sonnet-5-5` | $2 | $10 | $0,08 – $0,15 |
| `claude-haiku-5-5` | $0,10 | $0,50 | menos de $0,01 |

\* Estimado para una clase de unas 20 páginas. Varía con la extensión del material.

Con Opus, un estudiante del plan Repaso ($3) que use sus 30 clases al mes te costaría más de lo que paga. Te recomiendo empezar con Opus para comparar la calidad y luego medir con Sonnet o Haiku. El panel **Administración → Resumen** muestra cuánto vas gastando en IA y el costo promedio por kit. La transcripción de ElevenLabs se cobra por hora de audio: revisa la tarifa vigente en tu cuenta.

Los precios y cupos de cada plan están en [`src/lib/plans.ts`](src/lib/plans.ts).

## Antes de cobrar

- [ ] Completa los datos marcados con `[COMPLETAR]` en [`src/app/(legal)/terminos/page.tsx`](src/app/(legal)/terminos/page.tsx) y [`privacidad`](src/app/(legal)/privacidad/page.tsx): nombre o razón social, RIF y domicilio.
- [ ] Haz revisar los términos y la política de privacidad por un abogado venezolano. Son una base sólida, no asesoría legal.
- [ ] Define cómo vas a facturar si te piden factura fiscal.
- [ ] Configura `NEXT_PUBLIC_CONTACT_EMAIL` y `NEXT_PUBLIC_CONTACT_WHATSAPP`.

## Estructura

```
src/app/page.tsx                 Landing
src/app/(auth)/                  Entrar, registro, recuperar contraseña
src/app/(legal)/                 Términos y privacidad
src/app/app/                     App del estudiante (inicio, subir, materias, material, ayuda, plan, perfil)
src/app/admin/                   Panel de administración (pagos, solicitudes, usuarios, ajustes)
src/app/api/materials/process    Lee el archivo, transcribe si hace falta y genera el kit con Claude
src/app/api/tutor                Tutor por material, con respuesta en streaming
src/lib/plans.ts                 Planes, precios y cupos
supabase/migrations/             Esquema de la base de datos
```

## Para escalar

- Cada usuario solo puede ver sus propios datos: lo garantizan las reglas RLS de Postgres, no solo el código.
- Los archivos van directo del navegador a Supabase Storage, sin pasar por Vercel.
- Con muchos usuarios, mueve el procesamiento de clases a una cola (por ejemplo Supabase Queues o Inngest), para no depender del tiempo máximo de las funciones.
- Supabase Pro sube el límite de 50 MB por archivo, útil para videos largos.

## Créditos de las fotos

Fotos de la Universidad Central de Venezuela y del Metro de Caracas tomadas de Wikimedia Commons, con licencias CC0 y CC BY-SA 3.0. Los créditos aparecen en el pie de la landing y en [`src/lib/credits.ts`](src/lib/credits.ts).
