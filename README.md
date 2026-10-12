# JD-AUTOMATION

Repositorio de proyectos de automatización / troubleshooting de las líneas de cámaras John Deere.
`index.html` es el **hub de apps** (GitHub Pages). Cada app vive en su carpeta; lo compartido está en `shared/`
(tema claro/oscuro `theme.js`, estilos `ui.css`, conocimiento Kasalis `kasalis.js` + `kasalis-codes.js`).

## Proyectos
| Proyecto | Ruta | Estado |
|---|---|---|
| Simulador de flujo de líneas 3D | `simulador-lineas/` | activo |
| Buscador de fallas Kasalis | `buscador-kasalis/` | activo |
| Tutorial Active Alignment | `Tutorial Active Alignment (1).html` | activo |
| Monitor de línea en tiempo real (logs) | — | próximamente |

## Simulador de líneas (`simulador-lineas/`)
- `js/data.js` — layout (coordenadas del plano), estaciones, PCs, rutas por producto, **tiempos ciclo por defecto (OPS)**.
- `js/engine.js` — motor de simulación sin 3D: piezas, colas, lotes de transferencia, hornos por lote,
  Kasalis con BUILD/RETEST excluyentes (campaña + cambio de modo). Pensado para alimentarse después con logs reales.
- `js/world.js` — escena Three.js: estaciones automáticas (celda Gecko / mesa de atornillado Moose-Scorpion),
  equipos (EOL, leak, ASELEC/Fisnar, hornos), mesas, pistas tipo PCB, piezas y resaltados.
- `js/app.js` — UI: barra superior, menú retráctil (Ruta / Estaciones / Vista), seguimiento de pieza, modo ajuste, códigos.

Los tiempos ciclo marcados como supuestos se ajustan en **⚙ Ajustes** (se guardan en el navegador).
Se sirve como módulos ES: abrir por GitHub Pages o un servidor local (`python -m http.server`), no con doble clic.

## Buscador de fallas Kasalis (`buscador-kasalis/`)
- Busca por código (`105`, `161`, `-350`) o palabra (`gripper`, `DELLO`): significado traducido, estación/fase de la Kasalis,
  guía rápida, notas, procedimientos con fotos, páginas del manual y archivos del repo, códigos relacionados.
- `data/notas.js` — **aquí se agregan tus notas por falla y procedimientos paso a paso** (fotos en `buscador-kasalis/fotos/<id>/`),
  y la frecuencia de fallas cuando se procese el log de corridas.
- `data/docs.js` — texto extraído del manual Pixid 500 y archivos del repo (generado).
