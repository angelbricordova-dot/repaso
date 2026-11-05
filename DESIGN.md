# Diseño de TareaYa

El mundo visual es el **uniforme escolar venezolano**. Quien conoce un liceo en Venezuela reconoce los colores sin leer nada: la camisa azul celeste de 1ero a 3er año, la beige de 4to y 5to, el azul marino del pantalón y la falda, el hilo dorado de los escudos bordados y el rojo del bolígrafo del profesor.

## Color

| Token | Hex | Uso |
| --- | --- | --- |
| `--celeste` | `#a9d2f0` | Campo de 1ero a 3er año; superficies destacadas de la app |
| `--beige` | `#e8d6b0` | Campo de 4to y 5to año; sección «qué resolvemos», invitar |
| `--marino` | `#14234a` | Tinta principal, campo de universidad, botones de la app |
| `--hilo` | `#f5b82e` | Solo la acción principal (Mandar tarea, Ya pagué) y contadores |
| `--rojo` | `#b8312a` | Vencidas, errores, borrar |
| `--verde` | `#1f7a4c` | Tarea entregada |
| `--papel` | `#fbfcfe` | Fondo, como la camisa blanca de primaria |
| `--ink-soft` | `#3f4c6e` | Texto secundario (8,6:1 sobre papel) |

El nivel elegido en la portada cambia `data-uniform` en la raíz y todos los campos `.field-bg` se visten con ese uniforme.

## Tipografía

- **Bricolage Grotesque** (display): titulares, precios y números de tarea. Peso 700, tracking −0,03 em.
- **Figtree** (texto y controles): 16–18 px en la landing, 14–16 px en la app.
- Ambas se sirven desde el propio sitio con `next/font`.

## Componentes del mundo

- **Parche bordado** (`.patch`): el logo, una píldora azul marino con costura punteada de hilo dorado. Sobre fondos oscuros se invierte (`.patch-light`).
- **Cinta de nombre** (`.tape`): etiquetas de materia y número de tarea, como la cinta cosida en el cuello del uniforme.
- **Ticket de tarea** (`TaskRow`): número a la izquierda separado por una línea punteada de «troquel», título, materia y hora de entrega siempre visible.
- **Selector segmentado** (`.seg`): la opción activa es una copia recortada con `clip-path`, así el cambio de color es una sola transición.

## Movimiento

- Curvas: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`.
- Botones: `scale(0.97)` al presionar, 140–160 ms.
- Momento propio: el ticket de ejemplo avanza de Recibida a Entregada al entrar en pantalla.
- Hojas inferiores entran con `@starting-style` desde abajo.
- `prefers-reduced-motion` quita los desplazamientos y conserva las opacidades.

## Navegación

- Teléfono: barra inferior con Inicio, Nueva, Tareas y Cuenta (hoja inferior con Plan, Invitar, Perfil y Cerrar sesión). Respeta `safe-area-inset-bottom`.
- Escritorio: barra lateral de 248 px.
- Objetivos táctiles de 44 px como mínimo en controles principales.
