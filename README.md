# TareaYa

Servicio de ayuda con tareas para estudiantes venezolanos de bachillerato y universidad, hecho por personas. El estudiante manda su tarea con una foto o un archivo y la hora en que la necesita; tú o tu equipo la resuelven y la entregan en la misma web.

- **Planes:** Básico $5,99 (10 tareas al mes), Pro $9,99 (25, con urgentes) y Full $16,99 (60). Tarea suelta $1,49. La primera tarea es gratis.
- **Pagos:** Pago Móvil en bolívares a la tasa BCV que cargas cada día, Binance o Zelle. Tú verificas la referencia y apruebas desde el panel.
- **Estudiante:** manda tareas, sigue su estado, chatea con quien la resuelve, descarga la entrega, pide correcciones, califica, e invita amigos para ganar tareas.
- **Equipo:** cola ordenada por hora de entrega y plan, tomar tareas, pedir información, entregar archivos y avisar por WhatsApp con un toque.

Cambia los precios y cupos en [`src/lib/plans.ts`](src/lib/plans.ts) y el nombre con `NEXT_PUBLIC_BRAND_NAME`.

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta todo [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. En **Authentication → URL Configuration**, pon tu dominio como *Site URL* y añade `https://TU-DOMINIO/auth/callback` en *Redirect URLs*.
4. En **Authentication → Emails**, traduce al español las plantillas de confirmación y recuperación.
5. Copia la URL, la `anon key` y la `service_role key` de **Project Settings → API**.

### 2. Vercel

1. Importa este repositorio en [vercel.com/new](https://vercel.com/new).
2. Carga las variables de [`.env.example`](.env.example) en **Settings → Environment Variables**. Pon tu correo en `REPASO_ADMIN_EMAILS`.
3. Despliega, regístrate con ese correo y entra a **Panel del equipo → Tasa y datos de pago**: carga la tasa BCV y tus datos de Pago Móvil, Binance y Zelle.

> El plan Hobby de Vercel es solo para uso no comercial. Para cobrar necesitas el plan Pro.

### 3. Tu equipo

En **Usuarios y equipo**, busca a la persona (debe registrarse primero) y toca **Sumar al equipo**. Verá la cola de tareas, pero no pagos ni usuarios.

## Día a día

1. Revisa **Pagos por verificar** y aprueba los que veas en tu banco. Aprobar activa el plan o suma las tareas sueltas, y da el premio de invitación si corresponde.
2. En **Cola de tareas**, toma una tarea. Si falta información, escríbele al estudiante marcando «Pausar la tarea hasta que responda».
3. Entrega con la explicación y los archivos, y toca **Avisar que está lista** para abrir WhatsApp con el mensaje escrito.
4. Actualiza la tasa BCV cada día hábil.

## Desarrollo local

```bash
npm install
```

```bash
npx supabase start
```

Copia las claves que imprime en `.env.local` y luego:

```bash
npm run dev
```

## Antes de cobrar

- [ ] Completa los `[COMPLETAR]` (titular, RIF, domicilio) en [`terminos`](src/app/(legal)/terminos/page.tsx) y [`privacidad`](src/app/(legal)/privacidad/page.tsx).
- [ ] Haz revisar ambos textos por un abogado venezolano.
- [ ] Revisa la política de plazos de los términos: si no entregan a tiempo, se devuelve la tarea al cupo. Cámbiala si no la quieres ofrecer. La devolución se hace a mano desde **Usuarios → Regalar tareas sueltas**.
- [ ] Configura `NEXT_PUBLIC_CONTACT_WHATSAPP` y `NEXT_PUBLIC_CONTACT_EMAIL`.

## Diseño

El sistema visual (uniforme escolar venezolano) está documentado en [`DESIGN.md`](DESIGN.md) y el producto en [`PRODUCT.md`](PRODUCT.md).
