// Datos de layout, estaciones, PCs y troubleshooting (extraído de los archivos del repo)
export const LINE_COL = {scorpion:0x2f6bff, moose:0x0ea5b7, gecko:0xf08c00, shared:0x6b7ea3, fail:0xe5484d, wip:0xc9d3e6};
export const PX = (x,y)=>[(x-860)/10,(y-560)/10];

// id, etiqueta, línea, rect [x1,y1,x2,y2], altura, tipo, extras
export const STATIONS = [
  // ---- MOOSE (cian en layout)
  {id:'m_fallas', name:'Fallas MOOSE', line:'fail', r:[192,317,246,350], h:.7, type:'bin'},
  {id:'m_cal', name:'CALIBRATION', line:'moose', r:[297,255,368,325], h:1.7, type:'auto'},
  {id:'m_leak', name:'LEAK TEST (Moose)', line:'moose', r:[405,280,472,350], h:1.9, type:'tester'},
  {id:'m_final', name:'FINAL ASSY (Moose)', line:'moose', r:[510,255,575,325], h:1.5, type:'auto'},
  {id:'m_front', name:'FRONT ASSY (Moose)', line:'moose', r:[612,255,678,325], h:1.5, type:'auto'},
  {id:'m_eol', name:'EOL (Moose) · Nodo 5', line:'moose', r:[228,444,334,600], h:2.3, type:'eol'},
  {id:'m_brk', name:'BRACKETS', line:'moose', r:[388,470,453,540], h:1.4, type:'auto'},
  {id:'m_bot', name:'BOT / BACK ASSY (Moose)*', line:'moose', r:[400,378,470,425], h:1.4, type:'auto', approx:true},
  // ---- Celda AA (nodo 3)
  {id:'kas', name:'Pixid 500-S KASALIS · Nodo 3', line:'shared', r:[553,470,661,559], h:1.2, type:'kasalis', fr:-1},
  {id:'oven3', name:'OVEN (sensor)', line:'shared', r:[661,457,709,509], h:2.2, type:'oven'},
  {id:'refri', name:'REFRI (DELLO)', line:'shared', r:[661,509,709,559], h:2.0, type:'fridge'},
  // ---- fila superior (nodo 2)
  {id:'printer', name:'PRINTER', line:'shared', r:[733,300,750,370], h:1.1, type:'printer'},
  {id:'s_la', name:'LENS ADAPTER · Nodo 2', line:'scorpion', r:[792,305,850,370], h:1.4, type:'auto'},
  {id:'g_s1', name:'S1 LENS ADAPTER (Gecko)', line:'gecko', r:[887,297,960,370], h:1.4, type:'auto'},
  {id:'clean', name:'LIMPIEZA DE SENSOR', line:'shared', r:[960,320,1015,370], h:1.4, type:'table'},
  {id:'rep', name:'REPARACIÓN', line:'shared', r:[1115,380,1182,427], h:1.0, type:'desk'},
  {id:'diag', name:'DIAGNÓSTICO', line:'shared', r:[1188,380,1255,427], h:1.0, type:'desk'},
  {id:'plasma', name:'PLASMA', line:'shared', r:[1358,365,1422,458], h:2.3, type:'plasma'},
  // ---- SCORPION (verde en layout) — nodo 1
  {id:'s_fallas', name:'Fallas SCORPION', line:'fail', r:[776,505,830,535], h:.7, type:'bin'},
  {id:'s_eol', name:'EOL (Scorpion) · Nodo 1', line:'scorpion', r:[870,503,941,585], h:2.3, type:'eol'},
  {id:'s_leak', name:'LEAK TEST (Scorpion)', line:'scorpion', r:[962,535,1028,585], h:1.9, type:'tester'},
  {id:'s_desic', name:'GABINETE DESICCANT', line:'scorpion', r:[1040,535,1098,585], h:2.0, type:'cabinet'},
  {id:'s_final', name:'FINAL ASSY (Scorpion)', line:'scorpion', r:[1100,535,1167,585], h:1.5, type:'auto'},
  {id:'s_front', name:'FRONT HOUSING / FRONT ASSY', line:'scorpion', r:[1185,535,1268,585], h:1.5, type:'auto'},
  {id:'s_back', name:'BACK HOUSING / BACK ASSY', line:'scorpion', r:[1278,535,1355,585], h:1.5, type:'auto'},
  // ---- GECKO (naranja en layout) — nodo 6
  {id:'g_fallas', name:'Fallas GECKO', line:'fail', r:[712,640,767,672], h:.7, type:'bin'},
  {id:'g_out', name:'Salida GECKO', line:'gecko', r:[774,640,828,672], h:.7, type:'bin'},
  {id:'g_s8', name:'S8 TOP GASKET', line:'gecko', r:[840,600,912,672], h:1.5, type:'auto'},
  {id:'g_eol', name:'EOL (Gecko) · Nodo 6', line:'gecko', r:[998,600,1066,672], h:2.3, type:'eol'},
  {id:'g_leak', name:'LEAK TEST (Gecko)', line:'gecko', r:[1068,600,1167,672], h:1.9, type:'tester'},
  {id:'g_s7', name:'S7 DESICCANT CARTRIDGE', line:'gecko', r:[1215,600,1282,668], h:1.5, type:'auto'},
  {id:'g_s6', name:'S6 FINAL ASSY (Gecko)', line:'gecko', r:[1323,600,1390,668], h:1.5, type:'auto'},
  {id:'g_st3', name:'ST03 BOT ASSY', line:'gecko', r:[1050,790,1122,860], h:1.5, type:'auto'},
  {id:'g_s4', name:'S4 LEDs ASSY', line:'gecko', r:[1168,790,1240,860], h:1.5, type:'auto'},
  {id:'g_s5', name:'S5 MOISTURE ABSORBER', line:'gecko', r:[1325,790,1390,860], h:1.5, type:'auto'},
  // ---- Fisnar / Front Window (nodo 4)
  {id:'kanban', name:'KANBAN FISNAR', line:'shared', r:[655,775,710,808], h:.9, type:'cabinet'},
  {id:'disp', name:'FISNAR / ASELEC · Front Window · Nodo 4', line:'shared', r:[752,775,836,860], h:1.7, type:'dispenser'},
  {id:'oven4', name:'OVEN (housing / front window)', line:'shared', r:[878,775,945,825], h:2.2, type:'oven'},
  // ---- Inspección / salida
  {id:'fni', name:'FNI (Final Inspection)', line:'shared', r:[455,745,497,820], h:1.3, type:'table'},
  {id:'out', name:'PACKOUT / SALIDA (OUT)', line:'shared', r:[455,700,497,740], h:.8, type:'bin'},
  // ---- Dogbone (no marcado en layout)
  {id:'dog', name:'DOGBONE ASSY*', line:'scorpion', r:[540,630,605,690], h:1.5, type:'auto', approx:true},
  {id:'dogoven', name:'HORNO DOGBONE*', line:'scorpion', r:[612,630,660,690], h:2.0, type:'oven', approx:true},
];
export const WIPS = [[260,300,297,352],[368,300,405,352],[472,300,510,352],[575,300,612,352],[678,300,715,352],
  [351,444,388,494],[453,444,490,494],[512,444,549,494],[690,440,709,457],
  [750,320,792,370],[850,320,887,370],[1015,320,1052,370],[1094,405,1115,427],[1255,405,1285,427],[1333,425,1358,458],[1422,425,1447,458],
  [941,535,960,555],[1167,535,1185,555],[1268,535,1278,555],[1355,535,1372,555],
  [914,640,950,692],[1175,640,1210,690],[1285,643,1322,693],[1395,643,1432,693],
  [712,775,750,825],[836,775,873,825],[1010,770,1045,825],[1128,770,1162,825],[1245,770,1280,825],[1287,770,1322,825],[1395,770,1430,825]];
export const ZONES = [
  {line:'moose', r:[180,245,720,612]},
  {line:'scorpion', r:[765,495,1405,590]},
  {line:'gecko', r:[700,592,1440,700]},
  {line:'gecko', r:[1000,762,1440,868]},
  {line:'shared', r:[640,765,950,868]},
  {line:'shared', r:[540,440,712,565]},
  {line:'shared', r:[725,290,1060,375]},
];
// paredes (polilíneas en px)
export const WALLS = [
  [[120,178],[1578,178],[1578,938],[120,938],[120,178]],
  [[705,178],[705,265],[1100,265],[1100,355],[1490,355],[1490,178]],
  [[140,685],[430,685],[430,935]],
];

/* PCs / software (de "Equipos John Deere.xlsx") */
export const PCS = {
  s_la:[['SCORPION Lens Adapter','MXCHIM2JDEAS01','ACURA'],['MOOSE Lens Adapter','MXCHIM2JDMO01','ACURA']],
  kas:[['SCORPION Kasalis','MXCHIM2JDEAA02','KASALIS (Pixid)']],
  oven3:[['SCORPION Horno/Refri','MXCHIM2JDEAS02','CUSTOM']],
  refri:[['SCORPION Horno/Refri','MXCHIM2JDEAS02','CUSTOM']],
  disp:[['SCORPION Fisnar','MXCHIM2PHO042','ARMI'],['SCORPION Front Window','MXCHIM2JDEAS03','ACURA']],
  s_front:[['SCORPION Front Assy','MXCHIM2JDEAS04','ACURA']],
  s_back:[['SCORPION Back Assy','MXCHIM2JDEAS05','ACURA']],
  s_final:[['SCORPION Final Assy','MXCHIM2JDEAS06','ACURA']],
  dog:[['SCORPION Dogbone','MXCHIM2JDEAS07','ACURA']],
  dogoven:[['SCORPION Horno Dogbone','MXCHIM2JDE075','CUSTOM']],
  m_front:[['MOOSE Front Assy','MXCHIM2JDMO02','ACURA']],
  m_bot:[['MOOSE Bot Assy','MXCHIM2JDMO03','ACURA']],
  m_final:[['MOOSE Final Assy','MXCHIM2JDMO04','ACURA']],
  m_brk:[['MOOSE Bracket','MXCHIM2JDMO05','ACURA']],
  g_s1:[['GECKO Lens Adapter','MXCHIM2JDGK02','ACURA']],
  g_st3:[['GECKO Bot Assy','MXCHIM2JDGK03','ACURA'],['GECKO Ampseal','MXCHIM2JDGK01','ACURA']],
  g_s4:[['GECKO LEDs Assy','MXCHIM2JDGK04','ACURA']],
  g_s5:[['GECKO Moisture Absorber','MXCHIM2JDGK05','ACURA']],
  g_s6:[['GECKO Final Assy','MXCHIM2JDGK06','ACURA']],
  g_s7:[['GECKO Cartridge','MXCHIM2JDGK07','ACURA']],
  g_s8:[['GECKO Top Gasket','MXCHIM2JDGK08','ACURA']],
  plasma:[['Plasma (etiqueta en layout)','MXCHI2PH023','—']],
};

/* Qué revisar por estación */
export const CHECKS = {
  plasma:['Ultrasónico + plasma del lens adapter: sin plasma el DELLO no adhiere (micro-textura).','Tanque Ar/O₂ con presión, tiempo y potencia de plasma según receta.','Piezas tratadas tienen ventana de uso: no dejarlas mucho tiempo en WIP.'],
  clean:['Limpieza de sensor (COB viene de ISO 5): partículas aquí = falla 242 (PRT) en Kasalis.','Revisar soplado ionizado / hisopos / ESD.'],
  s_la:['Ensamble sensor + lens adapter (tornillos).','Si el sensor queda mal asentado → fallas de centrado (107/195) o tilt en Kasalis.'],
  g_s1:['Ensamble sensor + lens adapter Gecko.','Mismo modo de falla que Scorpion: asiento/tilt → 107/195 en Kasalis.'],
  kas:['BUILD: PRT partículas → DELLO (ARC) → VIS → pick lente → prefocus → scan Z/tilt → centrado → offset Z → UV → ungrip → MTF.','RETEST: re-mide MTF después del horno (161 = RETEST_MTF).','DELLO: pot life 72 h (PotLifeHead1), volumen 18 ml; warning 10 % / error 3 % de volumen, warning 5 % / error 3 % de pot life.','Sacar el DELLO del refri 1.5 h antes; cambio de tubo con aire cerrado.','Limpiar targets/backlight y lente: causa #1 de MTF bajo.'],
  oven3:['Curado completo del DELLO del sensor/lens adapter (pasivo).','No compartir ciclo con housing (perfiles distintos).','Si el MTF cae entre BUILD y RETEST → revisar perfil de temperatura y manejo de piezas.'],
  refri:['Almacén de DELLO. 1.5 h a temperatura ambiente antes de usar.','Si se tira/derrama → reinicia las 1.5 h.'],
  disp:['Front Window: dispensado de DELLO en housing + colocación de vidrio (Fisnar / Gecko dispensing).','Revisar cordón continuo (fugas en Leak Test), presión y aguja.','En el documento de flujos esta función aparece como "ASELEC".'],
  oven4:['Curado de housing / front window (separado del horno de sensor).'],
  s_front:['Unión del sensor alineado con el front housing (convergencia).','No tocar ni presionar el lente: puede mover la alineación.'],
  s_back:['Back housing + PCBA serializer (JOHPBA1081583).','O-ring bien asentado para Leak Test.'],
  s_final:['Atornillado final — falla endémica: TORNILLOS ELEVADOS.','Revisar torque, velocidad del spindle y presión del cilindro (los 3 juntos).','Tipo/altura de tornillo correcto.'],
  m_final:['Atornillado final — tornillos elevados: torque / velocidad / presión de cilindro.'],
  g_s6:['Final Assy Gecko: Top housing link + Back housing link; tornillos, label, O-ring.','Tornillos elevados: torque / velocidad / presión.'],
  s_leak:['Fuga: O-ring, tornillos elevados, cordón de DELLO del window incompleto.'],
  m_leak:['Fuga: O-ring, tornillos elevados, cordón de DELLO del window incompleto.'],
  g_leak:['Fuga: O-ring de cartridge/desiccant, tornillos, window.'],
  s_eol:['EOL mide (no mueve): MTF/SFR del módulo terminado. Comparar con datos de AA (ver Tutorial AA).','Si EOL falla y Kasalis pasó: revisar targets EOL, distancia, ROIs, enfoque por variante de lente.'],
  m_eol:['EOL Moose: prueba funcional/óptica final antes de Bracket.'],
  g_eol:['EOL Gecko: después de Leak test, antes de Top Gasket.'],
  m_brk:['Bracket 1 y 2 + tornillos + empaque (PFA13297).'],
  dog:['Dos cámaras a 100/200/300 mm, orientación V/H según SKU.'],
  m_cal:['En el plano está en la zona Moose; el flujo NPI no la usa para Moose. Se usa aquí como "Robot Calibration" de Dogbone (por confirmar).'],
  g_st3:['Back assy Gecko: socket Ampseal + O-ring + PCBA serializada.'],
  g_s4:['LEDs assy.'], g_s5:['Front assy: moisture absorber + etiquetas de color.'],
  g_s7:['Desiccant cartridge + O-ring.'], g_s8:['Top gasket: foil, top gasket, absorber cover, compliance label.'],
  fni:['Final inspection / QA (Scorpion 76°: QA INSP).'],
  s_desic:['Gabinete de desecante (almacenaje) — no es paso de proceso.'],
};

export const KBUILD = [
  ['Load', 0, 'Operador carga sensor + lente en el fixture (finger switch).', .08],
  ['Dispense · PRT', 1, 'Prueba de partículas en sensor (LP=25 %, PT=1.0, ITC=100). Si falla → no dispensa (242).', .09],
  ['Dispense · PRE + ARC', 1, 'Pre-inspección de patrón y dispensado DELLO en arco (DR=42 %, SR=50 %, ST=300 ms, VS=20).', .12],
  ['Dispense · VIS', 1, 'Inspección post-dispense del cordón (ST=50, área 10–25 %). Si falla → 233.', .08],
  ['Align · pick + prefocus', 2, 'Grippers toman el lente, target sube/baja, prefocus (105).', .1],
  ['Align · scan Z / tilt / centrado', 2, 'Barrido through-focus, tip/tilt y centrado óptico (108 scan, 107 centro, 131 peak MTF).', .18],
  ['Align · offset Z + UV cure', 2, 'Sube el lente para compensar contracción y cura UV (Dymax). 130 = medición UV.', .14],
  ['Align · ungrip + MTF', 2, 'Suelta el lente y re-mide MTF (155 = UNGRIP_MTF).', .09],
  ['Spare · PRT STN=3', 3, 'Estación spare: prueba de partículas secundaria / UV secundario.', .06],
  ['Unload', 0, 'Pieza regresa a Load: PASS/FAIL en pantalla.', .06],
];
export const KRETEST = [
  ['Load', 0, 'Carga del sensor ya curado en horno.', .2],
  ['Align · MTF RETEST', 2, 'Engancha eléctricamente y mide MTF on/off-axis contra límites (161 = RETEST_MTF, 175 = RETEST_NOISE).', .6],
  ['Unload', 0, 'PASS → sigue a Front assy. FAIL → QRQC.', .2],
];

export const BRANCH_NAMES = {main:'Ruta principal · sensor', housing:'Ruta paralela · housing / ventana', back:'Ruta paralela · back assy'};

/* Fallas simulables */
export const FAILS = [
  ['', 'Ninguna (todo PASS)'],
  ['242','242 · Particle test fail (Kasalis Dispense)'],
  ['233','233 · Post-dispense inspection fail (cordón DELLO)'],
  ['108','108 · ALIGN_SCAN_FAIL (Build)'],
  ['131','131 · FT_PEAK_MTF — no llega a target en BUILD'],
  ['155','155 · FT_UNGRIP_MTF — cae al soltar lente'],
  ['161','161 · FT_RETEST_MTF — falla en RETEST post-horno'],
  ['screws','Tornillos elevados (Final Assy)'],
  ['leak','Leak test FAIL'],
  ['eol','EOL FAIL'],
];

/* Guías de troubleshooting (clave = código) */
export const HINTS = {
  '3':'E-STOP activo: revisar paros de emergencia, puertas/interlocks de enclosure y relevador de seguridad. Reset desde HMI.',
  '9':'MES: no pudo enviar datos del dispositivo. Revisar red/VLAN, servidor MES, puerto TCP del bridge.',
  '10':'MES: esperando nuevo dispositivo (serial no validado / ruta MES). Revisar que la pieza tenga el paso previo cerrado.',
  '12':'Validación de dispositivo falló: serial/receta no corresponde, o el paso anterior en MES no está completo.',
  '16':'Aire principal bajo: revisar suministro, regulador y manómetro de la máquina (también en cambio de DELLO).',
  '17':'Proceso abortado por el operador o por otra falla previa: revisar el log (Trace) para la causa raíz.',
  '101':'Error general de alineación: ver el log para el sub-código KSvision (negativo).',
  '102':'No abre la cámara del dispositivo: pogo pins / fixture / cable / proxy de cámara. Ver KSvision -1xx (device camera).',
  '104':'No detecta el lente en el gripper: lente no cargado, gripper sucio/desgastado, posición de pick mal enseñada.',
  '105':'Prefocus falló: target sucio, exposición, altura de target, lente muy fuera de rango Z.',
  '107':'Centrado falló: sensor/lens adapter mal asentado, target central sucio o mal configurado (wide vs narrow AoV).',
  '108':'SCAN_FAIL: el barrido Z/tilt no encontró pico de MTF. Revisar rango de búsqueda Z para la variante de lente (76/95/131/133.4°), targets limpios, iluminación, lente bien tomado. (El doc de flujos lo nombraba "contaminación".)',
  '111':'Eje Z no se movió: servo/driver, límite, backlash.',
  '113':'Gripper no cierra: presión de aire, sensor de gripper, mecánica.',
  '130':'Medición UV falló: lightguide Dymax dañada/sucia, intensidad baja, calibración UV.',
  '131':'PEAK_MTF: en el pico de alineación el MTF no llega al límite (= "no llega a target SFR" en BUILD). Limpiar lente y targets, checar comunicación de cámara, parámetros MTF por variante de lente.',
  '143':'MTF falla durante el curado UV: el lente se movió al curar (contracción). Revisar offset Z (UVCure offset) y patrón de DELLO.',
  '149':'MTF falla post-curado UV (aún en gripper). Igual que 143: contracción / offset.',
  '155':'UNGRIP_MTF: el MTF cae al ABRIR el gripper (antes del horno). Causas: curado UV insuficiente (intensidad/tiempo), gripper arrastra el lente, poco DELLO / cordón incompleto, offset de contracción. (El doc de flujos lo describía como post-horno.)',
  '161':'RETEST_MTF: el MTF del RETEST (después de horno) está fuera de límite. Causas: lente/target sucio, DELLO se movió en horno (perfil temp.), golpe/manejo entre horno y retest, límites RETEST en ksprocess, cámara/pogo pins (ver 175 RETEST_NOISE).',
  '170':'No encontró pico en scan Z: rango Z insuficiente o lente fuera de nominal.',
  '175':'Ruido en RETEST: conexión de cámara / pogo pins / exposición.',
  '193':'Saturación en PEAK: exposición/ganancia o backlight demasiado alto.',
  '195':'Máximo de intentos de centrado: asiento del sensor, tilt del lens adapter.',
  '199':'Prueba de estabilidad falló: vibración, gripper flojo, temperatura.',
  '222':'Patrón de visión no encontrado (pre-dispense): pieza mal colocada, iluminación (LD/LL/EXP) o patrón .hdb equivocado para el producto.',
  '230':'Falla del dispensador: bomba de desplazamiento positivo, cartucho DELLO, cable.',
  '233':'Inspección post-dispense falló: cordón discontinuo/delgado (DELLO frío, aire, aguja tapada). Purga/prime y revisar DR/VS.',
  '235':'Nivel de adhesivo bajo (VolumeErrorThreshold=3 %). Cambiar cartucho DELLO (18 ml).',
  '236':'Pot life de DELLO vencido (PotLifeHead1=72 h, error al 3 %). Reemplazar adhesivo.',
  '242':'Particle test (PRT) falló: partículas en el sensor. Limpiar sensor, revisar estación de limpieza, guantes/ESD, umbrales ITC/ILS/ITS.',
  '277':'Presión de dispensado baja: aire / regulador.',
  '402':'Movimiento de estación arriba con mesa rotatoria: interlock de seguridad.',
  '403':'Mesa rotatoria no en posición: home offset, sensor de posición, acoplamiento cinemático.',
  '411':'Timeout de home de la mesa rotatoria.',
  '418':'Falla en estación de alineación — ver sub-código.',
  '419':'Falla en estación de dispensado — ver sub-código.',
  '426':'Vacío no detectado en fixture.',
  'screws':'Tornillos elevados: revisar torque por tipo de tornillo, velocidad de spindle, presión del cilindro (empuja más allá del límite del material), altura/calibre del tornillo. Parámetros aún TBD por línea.',
  'leak':'Leak test: O-ring mal asentado o dañado, tornillo elevado, cordón de DELLO de la ventana incompleto (233 en Fisnar), housing con poro.',
  'eol':'EOL: comparar MTF de EOL vs datos de Kasalis RETEST; targets/ROIs de EOL, distancia de target por variante, conexión/serializer.',
};
export const STEP_FAIL_LABEL = {screws:'Tornillos elevados', leak:'Leak FAIL', eol:'EOL FAIL'};


/* =====================================================================
   OPERACIONES (tiempos ciclo por defecto — EDITABLES en "Ajustes")
   ct = tiempo ciclo en segundos · cap = piezas en paralelo · lot = lote de transferencia a la siguiente estación
   batch = proceso por lote (horno): todas las piezas cargadas salen juntas tras ct
   Valores supuestos salvo Kasalis BUILD (~1:40) y horno (1.5 h) que vienen de operación real.
   ===================================================================== */
export const OPS = {
  plasma:     {st:'plasma',  name:'Plasma lens adapter',      ct:40},
  clean:      {st:'clean',   name:'Limpieza de sensor',       ct:30},
  s_la:       {st:'s_la',    name:'Lens Adapter',             ct:60},
  g_s1:       {st:'g_s1',    name:'S1 Lens Adapter',          ct:60},
  kas_build:  {st:'kas',     name:'Kasalis · BUILD AA',       ct:100, lot:30},
  oven3:      {st:'oven3',   name:'Horno sensor (curado)',    ct:5400, batch:true, cap:60},
  kas_retest: {st:'kas',     name:'Kasalis · RETEST AA',      ct:35,  lot:30},
  disp:       {st:'disp',    name:'Front Window (Fisnar/ASELEC)', ct:60, lot:30},
  oven4:      {st:'oven4',   name:'Horno housing',            ct:3600, batch:true, cap:60},
  s_front:    {st:'s_front', name:'Scorpion Front Assy',      ct:60},
  s_back:     {st:'s_back',  name:'Scorpion Back Assy',       ct:60},
  s_final:    {st:'s_final', name:'Scorpion Final Assy',      ct:75},
  s_leak:     {st:'s_leak',  name:'Scorpion Leak test',       ct:45},
  s_eol:      {st:'s_eol',   name:'Scorpion EOL',             ct:60},
  dog:        {st:'dog',     name:'Dogbone Assy',             ct:90},
  dogoven:    {st:'dogoven', name:'Horno Dogbone',            ct:1800, batch:true, cap:40},
  m_cal:      {st:'m_cal',   name:'Robot Calibration',        ct:120},
  m_front:    {st:'m_front', name:'Moose Front Assy',         ct:60},
  m_bot:      {st:'m_bot',   name:'Moose Back Assy',          ct:60},
  m_final:    {st:'m_final', name:'Moose Final Assy',         ct:75},
  m_leak:     {st:'m_leak',  name:'Moose Leak test',          ct:45},
  m_eol:      {st:'m_eol',   name:'Moose EOL',                ct:60},
  m_brk:      {st:'m_brk',   name:'Moose Bracket',            ct:50},
  g_st3:      {st:'g_st3',   name:'Gecko ST03 Bot Assy',      ct:60},
  g_s4:       {st:'g_s4',    name:'Gecko S4 LEDs',            ct:55},
  g_s5:       {st:'g_s5',    name:'Gecko S5 Moisture Absorber', ct:50},
  g_s6:       {st:'g_s6',    name:'Gecko S6 Final Assy',      ct:75},
  g_s7:       {st:'g_s7',    name:'Gecko S7 Cartridge',       ct:50},
  g_leak:     {st:'g_leak',  name:'Gecko Leak test',          ct:45},
  g_eol:      {st:'g_eol',   name:'Gecko EOL',                ct:60},
  g_s8:       {st:'g_s8',    name:'Gecko S8 Top Gasket',      ct:50},
  fni:        {st:'fni',     name:'Final Inspection',         ct:30},
  out:        {st:'out',     name:'Packout',                  ct:20},
  g_out:      {st:'g_out',   name:'Packout Gecko',            ct:20},
};
export const GLOBAL_DEFAULTS = {
  releaseInterval: 100,   // s entre piezas liberadas (sensor + housing)
  totalPieces: 60,        // 0 = infinito
  walkSpeed: 1.0,         // m/s del operador / transporte
  handling: 5,            // s de manejo por transferencia
  kasChangeover: 60,      // s para cambiar la Kasalis entre BUILD y RETEST
  kasCampaign: 30,        // piezas de BUILD antes de ceder a RETEST si hay retest esperando
  kasPriority: 'lote',    // 'lote' = termina campaña de build; 'retest' = retest tiene prioridad apenas haya
};

/* =====================================================================
   RUTAS por producto (NPI Product Data + FLUJOS_COMPLETOS_CONTEXTO + layout)
   cada paso: op (clave de OPS), name, desc, add (partes que agrega a la pieza), merge (ramas que consume), fails (fallas posibles)
   ===================================================================== */
const P = (op,name,desc,o={})=>({op,st:OPS[op].st,name,desc,...o});
const SENSOR = (la)=>[
  P('plasma','Plasma lens adapter','Ultrasónico + plasma de la cara superior del lens adapter.',{add:['adapter']}),
  P('clean','Limpieza de sensor','Sensor PCBA (COB, viene de ISO 5) se limpia antes de ensamblar.',{add:['pcb']}),
  P(la,'Lens Adapter','Sensor + lens adapter (tornillos). Listo para Kasalis.',{add:['screws1']}),
  P('kas_build','Kasalis · BUILD AA','DELLO → alineación activa (SFR/MTF) → UV cure. Step MES: BUILD. WIP de lote antes de horno.',{k:'build',add:['glue','lens'],fails:['242','233','108','131','155']}),
  P('oven3','Horno curado sensor','Lote completo ~1.5 h.',{add:['cured']}),
  P('kas_retest','Kasalis · RETEST AA','Sólo prueba final de alineación (MTF). Step MES: RETEST. Misma máquina que BUILD: no pueden correr a la vez.',{k:'retest',fails:['161']}),
];
export const ROUTES = {
  scorpion:{
    name:'SCORPION', fail:'s_fallas', line:'scorpion',
    variants:[['mono76','76° Mono (PFA13514) — con QA INSP'],['mono95','95° Mono'],['mono131','131°/135° Mono (PFA13516)'],['mono133','133.4° Mono (PFA13743)'],['dog','Dogbone (100/200/300 mm, V/H)']],
    build(v){
      const main=[...SENSOR('s_la'),
        P('s_front','Front Assy','Sensor alineado + front housing con ventana (convergencia).',{merge:['housing']}),
        P('s_back','Back Assy','Back housing + PCBA serializer + O-ring.',{add:['serial','back']}),
        P('s_final','Final Assy','Atornillado final (torque / velocidad / presión).',{add:['screws'],fails:['screws']}),
        P('s_leak','Leak test','Prueba de hermeticidad.',{fails:['leak']}),
        P('s_eol','EOL','End of line: prueba óptica/funcional final.',{fails:['eol']}),
      ];
      if(v==='dog') main.push(P('dog','Dogbone Assy','2 cámaras a 100/200/300 mm (V/H).',{add:['dogbone']}), P('dogoven','Horno Dogbone','Curado dogbone.'),
        P('m_cal','Robot Calibration','Calibración (estación CALIBRATION, por confirmar).'), P('fni','Final Inspection','Inspección final.'), P('out','Packout','Empaque.',{add:['box']}));
      else main.push(P('fni', v==='mono76'?'QA INSP (76°)':'Final Inspection','Inspección final.'), P('out','Packout','Empaque / material de embarque (FERT).',{add:['box']}));
      return {main, housing:[
        P('disp','Front Window Assy','DELLO en housing + vidrio (Fisnar / ASELEC).',{add:['window']}),
        P('oven4','Horno housing','Curado del front window.'),
      ]};
    }
  },
  moose:{
    name:'MOOSE', fail:'m_fallas', line:'moose',
    variants:[['std','HLA PFA13297 (con Bracket)']],
    build(){ return {
      main:[...SENSOR('s_la'),
        P('m_front','Front Assy','Lens adapter alineado + front housing con ventana (000000-9522-634).',{merge:['housing']}),
        P('m_final','Final Assy','Front assy + Back assy, tornillos.',{merge:['back'],add:['screws'],fails:['screws']}),
        P('m_leak','Leak test','Prueba de hermeticidad.',{fails:['leak']}),
        P('m_eol','EOL','End of line.',{fails:['eol']}),
        P('m_brk','Bracket','Bracket 1 + 2, tornillos (PFA13297).',{add:['bracket']}),
        P('fni','Final Inspection','Inspección final.'),
        P('out','Packout','Empaque.',{add:['box']}),
      ],
      housing:[P('disp','Front Window Assy','Ventana + front housing + foil (000000-9522-983).',{add:['window']}), P('oven4','Horno housing','Curado del front window.')],
      back:[P('m_bot','Back Assy','Back housing + PCBA serializer + O-ring (000000-9521-390).',{add:['serial']})],
    };}
  },
  gecko:{
    name:'GECKO', fail:'g_fallas', line:'gecko',
    variants:[['std','HLA PFA13568']],
    build(){ return {
      main:[...SENSOR('g_s1'),
        P('g_st3','ST03 Bot Assy','Back assy: socket Ampseal + O-ring + PCBA serializada.',{add:['serial','back','ampseal']}),
        P('g_s4','S4 LEDs Assy','Ensamble de LEDs.',{add:['leds']}),
        P('g_s6','S6 Final Assy','Top housing link + back housing link, tornillos, label, O-ring.',{merge:['housing'],add:['screws'],fails:['screws']}),
        P('g_s7','S7 Cartridge Assy','Desiccant cartridge + O-ring.',{add:['desiccant']}),
        P('g_leak','Leak test','Prueba de hermeticidad.',{fails:['leak']}),
        P('g_eol','EOL','End of line.',{fails:['eol']}),
        P('g_s8','S8 Top Gasket','Foil, top gasket, absorber cover, compliance label.',{add:['gasket']}),
        P('fni','Final Inspection','Inspección final.'),
        P('g_out','Packout / Salida GECKO','Empaque.',{add:['box']}),
      ],
      housing:[P('disp','Front Window Assy','Gecko Dispensing: DELLO + ventana en front/top housing.',{add:['window']}), P('oven4','Horno housing','Curado del front window.'),
        P('g_s5','S5 Front Assy','Moisture absorber + etiquetas de color.',{add:['absorber']})],
    };}
  },
};
