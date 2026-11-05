# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Estudiantes venezolanos de bachillerato y universidad** que tienen una tarea por entregar (ejercicios, informe, ensayo, presentación) y no tienen tiempo o no la entienden. Llegan casi siempre desde un enlace compartido en un grupo de WhatsApp, abren la web en el teléfono y quieren saber en segundos qué es, cuánto cuesta y cómo mandar la tarea.
- **Representantes** de estudiantes de bachillerato, que a menudo son quienes pagan.
- **El dueño (administrador) y su equipo de colaboradores**, que reciben las tareas, las resuelven a mano y las entregan por la web.

## Product Purpose

TareaYa es un servicio de ayuda con tareas hecho por personas. El estudiante envía la tarea con sus instrucciones, archivos y fecha de entrega; el equipo la resuelve y entrega los archivos y la explicación en la misma web. Éxito: el estudiante recibe su tarea antes de la hora que pidió, la entiende y renueva el mes.

## Positioning

Personas reales, no un bot, resolviendo la tarea con la fecha y hora que el estudiante necesita, a un precio pensado para Venezuela (desde $5,99 al mes por 10 tareas) y pagable en bolívares a la tasa BCV por Pago Móvil.

## Operating Context

- Promoción por grupos de WhatsApp: el primer contacto es un enlace abierto en el teléfono, a menudo con datos móviles y señal irregular.
- Las tareas llegan como fotos del enunciado tomadas con el teléfono, PDF, Word o texto pegado.
- Pagos manuales: Pago Móvil (bolívares a tasa BCV del día), Binance (USDT) o Zelle; el administrador verifica la referencia y activa el plan.
- El equipo trabaja desde el panel: cola de tareas ordenada por hora de entrega, mensajes con el estudiante, entrega de archivos.

## Capabilities and Constraints

- Planes mensuales: Básico $5,99 (10 tareas), Pro $9,99 (25 tareas), Full $16,99 (60 tareas). Tarea suelta a $1,49 sin plan. 1 tarea gratis al registrarse.
- Precios fijados en USD; en bolívares a la tasa BCV que el administrador carga cada día.
- No hay cobros automáticos ni pasarela de tarjeta: pago manual con referencia.
- Sin IA: todas las tareas las resuelven personas.
- Stack existente: Next.js 16 + Tailwind 4 en Vercel, Supabase (auth, Postgres con RLS, storage).
- Nombre configurable con una variable; nombre de lanzamiento: TareaYa.

## Brand Commitments

- Nombre: TareaYa (elegido por el dueño).
- Idioma: español de Venezuela, cercano y directo.
- El diseño anterior (rosa chicle y lima de «Repaso») fue rechazado por el dueño: no reutilizarlo.

## Evidence on Hand

No hay testimonios, clientes, cifras de uso ni capturas reales todavía. No inventar reseñas, número de estudiantes, universidades aliadas ni tiempos de entrega garantizados.

## Product Principles

1. El teléfono primero: todo se entiende y se usa con el pulgar, desde un enlace de WhatsApp.
2. El precio en bolívares siempre visible: es la objeción número uno.
3. Mandar una tarea debe tomar menos de un minuto.
4. Transparencia del estado: el estudiante siempre sabe en qué va su tarea y a qué hora llega.
5. Personas reales: el servicio se presenta como trabajo humano, sin prometer lo que el equipo no puede cumplir.

## Accessibility & Inclusion

Teléfonos de gama baja y conexiones lentas: páginas ligeras, imágenes comprimidas, texto legible a 16 px o más, objetivos táctiles de 44 px.
