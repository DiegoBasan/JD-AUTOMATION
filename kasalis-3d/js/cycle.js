/* Ciclo de la Kasalis (Pixid 500) paso a paso, sin 3D.
   Cada paso lleva la máquina a una "pose" (posiciones de ejes). La escena interpola entre poses.
   Parámetros reales: pistón 1.18 s y la línea ARC / PRE / PRT / VIS del archivo de dispensado.
   Lo marcado como supuesto se ajusta en Parámetros (se guarda en el navegador). */

export const DEFAULTS = {
  piston: 1.18,        // s, sube o baja (medido)
  load: 10,            // s, operador carga sensor + lente y escanea (supuesto)
  index: 1.5,          // s, giro de 90° del rotary (supuesto)
  vmax: 50,            // mm/s, velocidad máxima de la mesa XY de dispensado (supuesto; VS es % de esto)
  // ARC HD=1, ID=1, IN=1, DV=0, X=9.2, Y=-6.4, XR=8.9, YR=8.9, SA=0, IA=449, VS=20, VA=10, LI=1.0, LO=20.0, DR=42, SW=0, SR=50, ST=300, ZO=0, ZR=1.0
  arcX: 9.2, arcY: -6.4, XR: 8.9, YR: 8.9, SA: 0, IA: 449, VS: 20, VA: 10, LI: 1.0, LO: 20, DR: 42, SR: 50, ST: 300, ZO: 0, ZR: 1.0,
  // PRE IN=1, LW=100, LL=100, EXP=300, XA=41.165, YA=96.784, ZA=48.750
  preLW: 100, preEXP: 300,
  prt1: 2.0,           // s, PRT STN=1 (NS=71 imágenes, supuesto)
  visEXP: 80,          // ms, VIS post-inspección
  prefocus: 4,         // s (supuesto)
  scan: 35,            // s, scan Z / tilt hasta pico MTF (supuesto)
  uv: 15,              // s, UVCureTime 15000–19500 ms
  prt3: 3.0,           // s, PRT STN=3 en spare (NS=131, supuesto)
  retest: 20,          // s, prueba final RETEST (supuesto)
  mode: 'build',
};
export const ASSUMED = new Set(['load','index','vmax','prt1','prefocus','scan','prt3','retest']);
export const LABELS = {
  piston:'Pistón (s)', load:'Carga del operador (s)', index:'Giro 90° rotary (s)', vmax:'Vel. máx. mesa XY (mm/s)',
  XR:'Radio ARC XR (mm)', IA:'Ángulo incluido IA (°)', VS:'Velocidad VS (%)', LI:'Lead in LI (mm)', LO:'Lead out LO (°)', DR:'Dispense rate DR (%)', ST:'Suck back ST (ms)', ZR:'Retract ZR (mm)',
  prt1:'Partículas dispensado (s)', prefocus:'Prefocus + centrado (s)', scan:'Scan Z / pico MTF (s)', uv:'Curado UV (s)', prt3:'Partículas spare (s)', retest:'Prueba RETEST (s)',
};

export const STATIONS = {
  load:  {name:'Carga',      color:'#E5484D'},
  disp:  {name:'Dispensado', color:'#E8913A'},
  align: {name:'Alineación', color:'#9B59D0'},
  spare: {name:'Spare',      color:'#3E63DD'},
  rotary:{name:'Rotary',     color:'#C9B400'},
};

/* Pose: estado de todos los ejes. Unidades mm / grados. */
export const POSE0 = {
  rot: 0,            // ángulo del rotary (° CCW visto desde arriba)
  piston: 1,         // 0 = arriba (plato elevado), 1 = abajo
  piece: 1,          // visibilidad de la pieza (sensor + lente)
  disp: [0,0,0],     // offset de los ejes de dispensado (x, y, z)
  dispTool: 'home',  // 'home' | 'cam' | 'needle'
  align: [0,0,0],    // offset de los ejes de alineación (x, y, z)
  grip: 0,           // 0 abierto, 1 cerrado
  lens: 'plate',     // 'plate' | 'grip' | 'placed'
  bead: 0,           // 0..1 cordón de DELO dispensado
  uv: 0, dome: 0, cam: 0,   // luces: UV, domo de spare, cámara/visión
};

export function arcLength(p){ return 2*Math.PI*((p.XR+p.YR)/2)*p.IA/360; }
export function arcTime(p){ return arcLength(p) / Math.max(0.1, p.VS/100*p.vmax); }

/* Lista de pasos. 'to' = pose al terminar (parcial). 'fx' = movimiento especial dentro del paso.
   geo = posiciones calculadas por la escena (centros de sensor, lente, aguja, etc.). */
export function buildCycle(p, geo){
  const S = [];
  const add = (st, id, title, dur, to, extra={}) => S.push({st, id, title, dur, to, ...extra});
  const retest = p.mode === 'retest';
  const arcT = arcTime(p), arcL = arcLength(p);

  add('load','load_up','Pistón sube', p.piston, {piston:0},
    {desc:'Sube el pistón y eleva el plato sobre el rotary para cargar.', params:[`${p.piston} s`]});
  add('load','load','Operador cambia la pieza', p.load, {piece:1, lens: retest?'placed':'plate', bead: retest?1:0},
    {desc: retest ? 'Retira la pieza anterior y carga una pieza curada (después de horno) para RETEST.' : 'Retira la pieza anterior y carga el sensor (PCBA + lens adapter + interposer) al centro y el lente al lado. Se escanea el serial.',
     codes:['10','12'], swap:true, params:['MES valida el serial']});
  add('load','load_down','Pistón baja', p.piston, {piston:1},
    {desc:'Baja el pistón: el plato queda asentado en el rotary.', params:[`${p.piston} s`]});
  add('rotary','idx1','Rotary gira a dispensado', p.index, {rot:90},
    {desc:'Giro de 90° en sentido antihorario.', codes:['403','426']});

  if(!retest){
    add('disp','disp_open','Contacto pogo · abre cámara', 0.6, {cam:1},
      {desc:'Los pogo pins hacen contacto con el interposer y se abre la cámara del sensor.', codes:['231']});
    add('disp','disp_pre','Pre-inspección', 0.8 + (p.preLW+p.preEXP)/1000, {dispTool:'cam', disp:geo.dispCam},
      {desc:'La cámara de arriba se pone sobre la pieza y busca el patrón para ubicar el lens adapter.', codes:['222','-222'], params:['PRE XA 41.165 · YA 96.784 · ZA 48.75', `EXP ${p.preEXP} ms · LL 100`]});
    add('disp','disp_prt','Prueba de partículas', p.prt1, {},
      {desc:'PRT STN=1: el sensor toma imágenes para detectar partículas antes de dispensar.', codes:['242'], params:['PRT STN=1 · NS 71 · LP 25']});
    add('disp','disp_go','Aguja al inicio del arco', 0.9, {dispTool:'needle', disp:geo.dispArcStart},
      {desc:'La aguja baja al inicio del arco, junto al lens adapter.', params:[`ARC X ${p.arcX} · Y ${p.arcY}`, `ZO ${p.ZO}`]});
    const arcEnd = geo.arcAt(p.SA + p.IA, p);
    add('disp','disp_arc','Dispensa el arco (ARC)', arcT, {bead:1, disp:arcEnd},
      {desc:`Recorre ${p.IA}° con radio ${p.XR} mm (${arcL.toFixed(1)} mm). El DELO se enciende después de LI ${p.LI} mm y se apaga ${p.LO}° antes del final.`,
       codes:['230','235','236','277'], params:[`XR ${p.XR} · YR ${p.YR} · SA ${p.SA}° · IA ${p.IA}°`, `VS ${p.VS} % · VA ${p.VA} %`, `DR ${p.DR} % · LI ${p.LI} · LO ${p.LO}°`],
       fx:'arc'});
    add('disp','disp_sb','Suck back y retracción', 0.3 + p.ST/1000, {disp:[arcEnd[0], arcEnd[1] + p.ZR + 10, arcEnd[2]]},
      {desc:`Succión ${p.ST} ms (SR ${p.SR} %) para cortar el hilo y la aguja sube ZR ${p.ZR} mm.`, params:[`ST ${p.ST} ms · SR ${p.SR} %`, `ZR ${p.ZR} mm`]});
    add('disp','disp_vis','Post-inspección (VIS)', 0.9 + p.visEXP/1000, {dispTool:'cam', disp:geo.dispCam},
      {desc:'La cámara revisa que el cordón esté completo y centrado. Si el círculo no cierra o está desfasado: 233.', codes:['233'], params:[`EXP ${p.visEXP} ms · LL 100`]});
    add('disp','disp_home','Dispensado a home', 0.8, {dispTool:'home', disp:[0,0,0], cam:0});
  } else {
    add('disp','disp_skip','Pasa sin dispensar', 0.4, {}, {desc:'En RETEST la pieza ya está pegada y curada: no se dispensa.'});
  }

  add('rotary','idx2','Rotary gira a alineación', p.index, {rot:180}, {codes:['403']});
  add('align','align_open','Contacto pogo · abre cámara', 1.0, {cam:1},
    {desc:'Pogo pins al interposer y se abre la cámara del sensor. Si falla aquí: 102 (primero pasar la golden).', codes:['102','175']});

  if(!retest){
    add('align','align_to_lens','Gripper va al lente', 1.2, {align:geo.alignAboveLens},
      {desc:'Los ejes X, Z llevan el gripper encima del lente que está al lado del sensor.', codes:['104']});
    add('align','align_grip','Baja y toma el lente', 0.9, {align:geo.alignGripLens, grip:1, lens:'grip'},
      {desc:'Baja, cierra el gripper y detecta el lente.', codes:['104','113']});
    add('align','align_to_sensor','Lleva el lente al sensor', 1.6, {align:geo.alignOverSensor},
      {desc:'Pick and place del lente sobre el lens adapter con DELO fresco.'});
    add('align','align_insert','Baja el lente al DELO', 0.8, {align:geo.alignPlace},
      {desc:'El lente entra al lens adapter hasta la altura de inicio del scan.'});
    add('align','align_prefocus','Prefocus y centrado', p.prefocus, {},
      {desc:'Busca el foco aproximado y centra el eje óptico.', codes:['105','107','195'], fx:'prefocus'});
    add('align','align_scan','Scan Z / tilt · pico MTF', p.scan, {},
      {desc:'Barrido en Z y tilt hasta el pico de MTF (movimiento exagerado para que se vea). Lente malo o sucio: 108 / 131.', codes:['108','170','131','137'], fx:'scan',
       params:['95: alinea ~31.8 · inicio programado 31.9']});
    add('align','align_uv','Curado UV', p.uv, {uv:1},
      {desc:'Al final de la alineación, con el lente todavía en el gripper, se prenden las luces UV de abajo del gripper y curan el DELO (15–19 s).', codes:['143','149'], params:[`UVCureTime ${Math.round(p.uv*1000)} ms`, '15000–19500 ms']});
    add('align','align_ungrip','Suelta el lente y mide', 1.0, {uv:0, grip:0, lens:'placed'},
      {desc:'Abre el gripper y vuelve a medir MTF. Si cae al soltar: 155.', codes:['155']});
    add('align','align_home','Gripper a home', 1.0, {align:[0,0,0], cam:0});
  } else {
    add('align','align_retest','Prueba final RETEST', p.retest, {},
      {desc:'Mide MTF de la pieza curada contra los límites de RETEST.', codes:['161','162','163','165'], fx:'test'});
    add('align','align_done','Cierra cámara', 0.4, {cam:0});
  }

  add('rotary','idx3','Rotary gira a spare', p.index, {rot:270});
  add('spare','spare_prt', retest?'Spare (sin operación)':'Prueba de partículas spare', retest?0.4:p.prt3, retest?{}:{dome:1},
    {desc: retest?'En RETEST la estación spare no hace nada.':'PRT STN=3: imágenes del sensor con la pieza ya ensamblada.', codes: retest?[]:['606','604'], params: retest?[]:['PRT STN=3 · NS 131 · LP 100']});
  add('rotary','idx4','Rotary regresa a carga', p.index, {rot:360, dome:0});

  // tiempos acumulados y poses de inicio
  let t = 0, pose = {...POSE0, lens: retest?'placed':'plate', bead: retest?1:0};
  for(const s of S){ s.t0 = t; s.from = {...pose}; pose = {...pose, ...s.to}; s.toPose = {...pose}; t += s.dur; s.t1 = t; }
  return {steps:S, total:t, arcT, arcL};
}
