# JD-AUTOMATION

Repositorio de proyectos de automatización / troubleshooting de las líneas de cámaras John Deere.
`index.html` es el **hub de proyectos** (GitHub Pages). Cada proyecto vive en su carpeta.

## Proyectos
| Proyecto | Ruta | Estado |
|---|---|---|
| Simulador de flujo de líneas 3D | `simulador-lineas/` | activo |
| Códigos de falla Kasalis | `simulador-lineas/?codes=1` | activo |
| Tutorial Active Alignment | `Tutorial Active Alignment (1).html` | activo |
| Monitor de línea en tiempo real (logs) | — | próximamente |

## Simulador de líneas (`simulador-lineas/`)
- `js/data.js` — layout (coordenadas del plano), estaciones, PCs, rutas por producto, **tiempos ciclo por defecto (OPS)**.
- `js/engine.js` — motor de simulación sin 3D: piezas, colas, lotes de transferencia, hornos por lote,
  Kasalis con BUILD/RETEST excluyentes (campaña + cambio de modo). Pensado para alimentarse después con logs reales.
- `js/world.js` — escena Three.js: estaciones automáticas (celda Gecko / mesa de atornillado Moose-Scorpion),
  equipos (EOL, leak, ASELEC/Fisnar, hornos), mesas, pistas tipo PCB, piezas y resaltados.
- `js/app.js` — UI: barra superior, menú retráctil (Ruta / Estaciones / Vista), seguimiento de pieza, modo ajuste, códigos.
- `js/codes.js` — códigos Kasalis (KSmessage PLC y KSvision).

Los tiempos ciclo marcados como supuestos se ajustan en **⚙ Ajustes** (se guardan en el navegador).
Se sirve como módulos ES: abrir por GitHub Pages o un servidor local (`python -m http.server`), no con doble clic.
