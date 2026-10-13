# JD-AUTOMATION

Repositorio de proyectos de automatización / troubleshooting de las líneas de cámaras John Deere.
`index.html` es el **hub de apps** (GitHub Pages), con el mismo diseño que Diapps: en celular resumen del día + carpetas + barra de vidrio; en escritorio (≥1100 px) un tablero con un widget por app. Las apps se registran en `PROJECTS` y los cambios en `LOG` dentro de `index.html`; íconos en `assets/icons/`. Cada app vive en su carpeta; lo compartido está en `shared/`
(tema claro/oscuro `theme.js`, estilos `ui.css`, conocimiento Kasalis `kasalis.js` + `kasalis-codes.js`).

## Proyectos
| Proyecto | Ruta | Estado |
|---|---|---|
| Simulador de flujo de líneas 3D | `simulador-lineas/` | activo |
| Fallas Kasalis (app instalable en celular) | `buscador-kasalis/` | activo |
| Kasalis 3D (ciclo de la máquina) | `kasalis-3d/` | activo |
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

## Fallas Kasalis (`buscador-kasalis/`)
- App web instalable (iPhone: Safari → Compartir → Agregar a pantalla de inicio). Funciona sin red (`sw.js`).
- `data/fallas.js` — **modos de falla con flujo de resolución** (paso a paso con ramas SÍ/NO), causas vistas → solución y tips; cada modo lista sus códigos y aparece al buscar cualquiera de ellos.
- Busca por código (`105`, `161`, `-350`) o palabra (`gripper`, `DELLO`): significado traducido, estación/fase de la Kasalis,
  guía rápida, notas, procedimientos con fotos, páginas del manual y archivos del repo, códigos relacionados.
- `data/notas.js` — **aquí se agregan tus notas por falla y procedimientos paso a paso** (fotos en `buscador-kasalis/fotos/<id>/`),
  y la frecuencia de fallas cuando se procese el log de corridas.
- `data/docs.js` — texto extraído del manual Pixid 500 y archivos del repo (generado).

## Kasalis 3D (`kasalis-3d/`)
- `models/kasalis.glb` — modelo minimalista dividido en piezas móviles (`<grupo>__<color>`: rotary, plate, piston, disp_x/z/head, align_z/x/head, finger_a/b, lens, spare, base); mm, origen en el centro del rotary.
  Se regenera con `python3 kasalis-3d/tools/split_kasalis.py <export.glb> kasalis-3d/models/kasalis.glb kasalis-3d/tools` (separa cada color en piezas y las asigna por posición).
- `js/cycle.js` — secuencia BUILD / RETEST paso a paso con los parámetros reales (pistón 1.18 s, línea ARC/PRE/PRT/VIS del archivo de dispensado, UVCureTime) y los códigos de falla de cada paso.
- `js/scene.js` — Three.js: jerarquía de ejes, cordón de DELO sobre el lens adapter, luces UV/domo, resaltado por estación.
- `js/vision.js` — cámaras simuladas: cámara de dispensado con la inspección VIS (SM, ST, ROI, AMN/AMX, BMN/BMX, PMN/PMX, LL, LD, EXP del archivo)
  y cámara del sensor en AA (5 targets, curvas through-focus SFR @ Ny/4, picos, tilt y lock como en el Tutorial Active Alignment).
- `js/app.js` — cámara ortográfica que sigue la pieza, línea de tiempo, parámetros editables (se guardan en el navegador),
  cámara PiP / vista ampliada y fallas: cada código salta a su paso, se ve en la máquina y en las cámaras, con su flujo de resolución de Fallas Kasalis.
