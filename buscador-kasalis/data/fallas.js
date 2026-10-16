/* =====================================================================
   FALLAS KASALIS — modos de falla con flujo de resolución
   Consolidado de experiencia en piso (jul–oct 2026) + notas de troubleshooting.
   ---------------------------------------------------------------------
   {
     id, titulo, corto,               // corto = 1 línea para la tarjeta
     codigos: ['102','231'],          // PLC como '102', KSvision como '-222'
     flujo: [                         // en orden: primero checar esto, luego esto…
       {p:'Qué hacer', d:'detalle corto (opcional)', proc:'id de una guía del programa (opcional)',
        si:'si se cumple / pasa → …', no:'si no → …'}   // si/no opcionales
     ],
     causas: [['Causa encontrada', 'Lo que lo resolvió'], …],
     tips: ['dato a recordar', …]
   }
   Sin nombres, contraseñas ni rutas de red (repo público).
   ===================================================================== */
export const FALLAS = [
{
  id:'comunicacion', titulo:'Cámara no abre / comunicación', corto:'La pieza no conecta: pogo, interposer, MIU… o la pieza misma',
  codigos:['102','231','604','175','13'],
  flujo:[
    {p:'Pasar la golden', d:'Es lo primero, antes de mover nada.',
     si:'Pasa → la máquina está bien. Son las PIEZAS (pueden salir hasta ~8 seguidas). Segrega y sigue corriendo.',
     no:'Falla → es la máquina. Sigue con el paso 2.'},
    {p:'Ver en qué estación falla', d:'102 = alineación · 231 = dispensado · 604 = spare. Solo cambia lo de esa estación.'},
    {p:'Acomodar o cambiar el interposer', d:'Los pines no deben tocar la orilla del círculo. Interposer quebrado → usar uno impreso de respaldo.',
     si:'Ya pasa → listo.', no:'Paso 4.'},
    {p:'Revisar asiento del nido', d:'Recorrer el nido hacia adentro si la pieza queda descentrada.'},
    {p:'Pogo pins', d:'Limpiar dura poco: cambiar TODOS los pogos de la estación. En dispensado se pueden subir un poco.',
     si:'Ya pasa → listo.', no:'Paso 6.'},
    {p:'Módulo de pines del plato', d:'Cambiar módulo (revisar tornillos de la placa de pines).'},
    {proc:'inicializar', p:'Cable MIU → pogos e inicializar', d:'Reiniciar MIU / inicializar el equipo.',
     no:'Sigue fallando → cambiar la MIU (fue la causa raíz del paro largo de julio).'},
  ],
  causas:[
    ['Piezas malas (conector dañado / llegan así)', 'Golden pasa → segregar piezas'],
    ['MIU dañada (intermitente 45 min – 4 h)', 'Reemplazar MIU'],
    ['Interposer mal asentado, quebrado o sin espacio para componentes', 'Acomodar / cambiar; interposer más justo = menos juego'],
    ['Pogo con pin roto o sucio', 'Cambiar todos los pogos; se usó el bloque de la estación spare'],
    ['Módulo de pines / tornillos faltantes en placa', 'Cambiar módulo, completar tornillos'],
  ],
  tips:[
    'Queda 1 solo bloque de pogos de spare: pedir más.',
    'Tener 3 interposers impresos de respaldo.',
    'Plato con gancho bajo → la pieza no toca los pogos (por eso se canceló el 2º plato Moose).',
  ],
},
{
  id:'alineacion', titulo:'Alineación / MTF en BUILD', corto:'No alinea, no llega a MTF o se acaban los intentos',
  codigos:['108','131','137','195','105','107','125','170','101'],
  flujo:[
    {p:'Pasar la golden / master',
     si:'Pasa → es el LENTE o la pieza. Paso 2.', no:'Falla → es la máquina. Paso 4.'},
    {p:'Limpiar lente y re-intentar', d:'Lentes sucios fallan mucho en 108/131.',
     si:'Pasa → listo.', no:'Paso 3.'},
    {proc:'segregar-lente', p:'Segregar el lente', d:'Scorpion 95: programa de segregación en la Kasalis (solo existe para el 95). Otros modelos: separar e identificar los lentes que fallan. Lente malo = 131 seguro.'},
    {p:'Limpiar targets', d:'Targets sucios o desenfocados también dan 105/108.'},
    {proc:'ajustar-place', p:'Ajustar place X, Y, Z del plato', d:'De las 3 posiciones; si no basta, también theta X/Y. Regla: con 5 fallas seguidas ya se ajusta.',
     no:'Sigue → correr con 1 plato mientras se ajusta el otro.'},
    {proc:'teach-z', p:'Teach Z / punto de inicio', d:'Si el scan arranca abajo del foco real de la pieza.'},
    {proc:'aeo-roi', p:'Ajuste fino', d:'ROI / Align Extra Offset (los valores dependen del modelo). Solo con autorización.'},
  ],
  causas:[
    ['Lente malo (lote)', 'Segregación: de 500 lentes 95, 234 malos'],
    ['Lentes sucios', 'Limpiar → dejó de fallar'],
    ['Place X/Y/Z desajustado (sobre todo ELK plato 4)', 'Ajustar 3 posiciones + theta'],
    ['Z de inicio del scan bajo', 'Teach Z'],
    ['Pieza chueca (la Kasalis Scorpion ve los targets muy cerca)', 'Revisar asiento de la pieza'],
  ],
  tips:[
    '108 ≈ falla con DELO fresco · 155 ≈ con DELO curado.',
    'Candado 3-5-10 trabado → cerrar sesión. Desbloquear requiere cuenta con permisos.',
    'Cada cambio en la Kasalis = serial number break.',
  ],
},
{
  id:'retest', titulo:'Retest después de horno', corto:'161: MTF fuera en retest — muchas pasan EOL',
  codigos:['161','162','163','164','165','166','194'],
  flujo:[
    {p:'¿Esperó 20 min de enfriamiento?', d:'Después del horno, 20 min de enfriamiento antes del retest.',
     no:'Esperar y re-testear.'},
    {p:'Limpiar lente y re-testear', si:'Pasa → listo.', no:'Paso 3.'},
    {p:'Probar en EOL', d:'Si está cerca del límite de RETEST suele pasar EOL.',
     si:'Pasa EOL → empacar.', no:'Paso 4.'},
    {p:'2º retest', si:'Pasa → listo.', no:'Falla 2 veces → desarmar.'},
    {p:'162 (centro movido)', d:'No se rescata → papeleta.'},
  ],
  causas:[
    ['Límite Kasalis más estricto que EOL (MTF 80–85 % vs SFR 0.26)', 'Alinear límites Kasalis ↔ EOL'],
    ['Pieza caliente', 'Esperar 20 min'],
    ['Exceso de DELO (Moose salía 14 % arriba)', 'Ajustar % de glue'],
    ['Lente/target sucio o desenfocado', 'Limpiar'],
  ],
  tips:['No desarmar 161 en el primer fallo.','Porta-interposer impreso era sospechoso → usar el original.'],
},
{
  id:'despega', titulo:'Lente se mueve o despega', corto:'155/149: el MTF cae al soltar o el DELO no pega',
  codigos:['155','149','143'],
  flujo:[
    {proc:'uv-cure-time', p:'Revisar UVCureTime', d:'Está en ms: debe ser 15000–19500 (estuvo en 1950).',
     si:'Estaba bajo → corregir.', no:'Paso 2.'},
    {p:'Revisar gripper', d:'Presión / si arrastra el lente al abrir.'},
    {p:'Altura de pick del lente', d:'Si toma el lente muy arriba no cura.'},
    {p:'Peso y trazo de DELO', d:'Pesar y foto del dispensado (ver specs en DELO).'},
    {p:'¿El DELO se queda en el lente y el lens adapter sale limpio?',
     si:'Sospechar plasma del lens adapter → cambiar charola de lens adapter.'},
  ],
  causas:[
    ['UVCureTime en 1950 ms', 'Subir a 15000–19500'],
    ['Gripper mueve el lente al soltar', 'Ajustar presión'],
    ['Pick muy alto', 'Ajustar altura de pick/place'],
    ['Lens adapter mal plasmeado', 'Cambiar charola → salieron OK'],
  ],
  tips:['Lens adapter Moose con DELO no se re-plasmea → MRB.'],
},
{
  id:'vis233', titulo:'233 · Falla de visión post-dispensado', corto:'Primero validar el dispensado; si está bien, es la cámara de inspección',
  link:{t:'Probar parámetros con fotos reales (Laboratorio VIS)', href:'../kasalis-3d/vis.html'},
  codigos:['233'],
  flujo:[
    {p:'Revisar el dispensado de la pieza fallada', d:'Ver la pieza o la imagen de la VIS: círculo completo, cerrado y centrado en el lens adapter, sin bola ni burbujas.',
     si:'Está bien → el dispensado no es el problema. Paso 4.', no:'Está mal → paso 2.'},
    {proc:'offset-dispensado', p:'Si está descentrado: mover X / Y del ARC', d:'Mover X / Y poco a poco hacia donde falta DELO (los valores dependen del modelo).'},
    {proc:'editar-arc', p:'Si está incompleto, con bola o poco DELO: ajustar el ARC', d:'IA (ángulo), LO (lead out), DR (rate) y altura. Comentar la línea anterior, no borrarla. Pesar 3 dispensados + foto.',
     si:'Queda bien y pasa la VIS → listo.'},
    {proc:'enfoque-vis', p:'Dispensado bien pero la VIS da 233: enfocar la cámara de inspección', d:'Comparar contra la foto de referencia de logs pasados (pieza buena que pasó). Enfocar hasta que el cordón se vea igual de nítido.'},
    {proc:'enfoque-vis', p:'Ajustar el brillo', d:'Line lights apuntando al lens adapter y brillo igual que la foto de referencia: el cordón claro, lo demás oscuro.'},
    {p:'Validar', d:'Correr piezas buenas (deben pasar) y una con dispensado incompleto (debe fallar).',
     no:'Sigue fallando con dispensado bueno → revisar con ingeniería los parámetros de la VIS (ST, área, perímetro).'},
  ],
  causas:[
    ['Dispensado desfasado', 'Mover X / Y del ARC'],
    ['Círculo incompleto o bola', 'Ajustar ARC (IA, LO, DR)'],
    ['Cámara de inspección desenfocada (al cambiar Moose ↔ ELK cambia la altura)', 'Re-enfocar con la foto de referencia'],
    ['Line lights sin apuntar al lens adapter', 'Ajustar tornillos de las barras LED'],
    ['Brillo distinto a la referencia', 'Ajustar brillo / exposición'],
    ['DOAL (LD) encendida: el sensor y la fixtura brillan y se detectan como material', 'Bajar LD (se cambió de 30 a 0 y el sensor quedó oscuro)'],
    ['Círculo incompleto con rebaba que pasaba por perímetro amplio', 'Cerrar PMN / PMX (ej. 1000–9000 → 2000–5000): la mala falla y la buena sigue pasando'],
  ],
  tips:[
    'Contención: primero el dispensado, después la cámara. No mover las dos cosas a la vez.',
    'Tener una foto de referencia de la VIS de una pieza buena por modelo (de los logs).',
    'Una VIS desenfocada puede pasar un círculo incompleto: validar siempre con una pieza mala.',
    'Antes de cambiar parámetros en la máquina, probarlos con fotos reales (buenas y malas) en el Laboratorio VIS de Kasalis 3D.',
  ],
},
{
  id:'dispensado', titulo:'Dispensado', corto:'Círculo incompleto, no dispensa, bola, desfasado',
  codigos:['233','222','-222','230','277'],
  flujo:[
    {proc:'activar-dispense', p:'¿Sale DELO?', no:'Revisar: cartucho vacío → opción "dispense" activada → acople motor-dispensador → motor.'},
    {proc:'purga', p:'Purgar', d:'Burbujas o trazo bajo se arreglan purgando.', si:'Queda bien → paso 3.'},
    {proc:'altura-aguja', p:'Revisar altura de aguja', d:'Baja = raspa el lens adapter; alta = trazo malo.'},
    {proc:'offset-dispensado', p:'Centrar offset X/Y', d:'Si el trazo sale desfasado.'},
    {proc:'editar-arc', p:'"Bola" al inicio o final del arco', d:'Ajustar DR.'},
    {proc:'enfoque-vis', p:'Círculo incompleto y la visión no lo detecta', d:'Enfocar el lente de la cámara de inspección y apuntar las line lights al lens adapter. Validar con una pieza incompleta.'},
    {p:'Pesar 3 dispensados + foto', d:'Siempre al terminar el ajuste o cambiar de modelo.'},
  ],
  causas:[
    ['DELO acabado', 'Cambiar cartucho'],
    ['Motor dañado (rotor del tornillo sin fin)', 'Motor de spare — pedir otro'],
    ['Acople motor–dispensador suelto', 'Reinstalar'],
    ['Tornillo flojo → fuga', 'Apretar'],
    ['Opción dispense desactivada', 'Activar'],
    ['Cambio Moose ↔ ELK cambia altura', 'Re-enfocar cámara de inspección'],
  ],
  tips:['Cambio de modelo (76→131, 95→133) = re-probar dispensado.','En el archivo de dispensado comentar líneas, no borrarlas.'],
},
{
  id:'delo', titulo:'DELO: cambio y manejo', corto:'Nivel, pot life, cambio de cartucho y pesos',
  codigos:['235','236'],
  flujo:[
    {proc:'cambio-delo', p:'Cerrar aire y validar 0 PSI'},
    {p:'Cambiar cartucho y asegurar conexiones'},
    {p:'Apretar el opresor', d:'Saltarse esto o el aire tiró DELO dos veces.'},
    {p:'Encender aire gradual y revisar fugas'},
    {proc:'purga', p:'Purgar, pesar 3 dispensados y foto'},
  ],
  causas:[
    ['Nivel bajo (235)', 'Cambiar cartucho'],
    ['Pot life vencido (236)', 'Reemplazar; caduca desde que se abre'],
    ['Envase reusado roto', 'Usar envase / jeringa nueva'],
  ],
  tips:[
    'Ambientar 1.5 h (el de MRO llega congelado).',
    'Cambio de cuarto: 30 min de refri + ambientar.',
    'Registrar cada DELO en la base de datos.',
    'Peso Gecko OB786: 0.093 g (0.0837–0.1023).',
    'Peso Moose OB787: 0.090 g (0.081–0.099).',
    'Peso Scorpion 95 OB786: 0.0384 g (0.0345–0.0422).',
  ],
},
{
  id:'gripper', titulo:'Gripper / lente no detectado', corto:'104: sostiene el lente pero no ensambla',
  codigos:['104','113'],
  flujo:[
    {p:'Limpiar el gripper', d:'DELO en el gripper.', si:'Pasa → listo.'},
    {p:'Ajustar sensor del gripper', d:'Si está recorrido (rojo), moverlo a la derecha.'},
    {proc:'inicializar', p:'Gripper ladeado → inicializar'},
  ],
  causas:[['DELO en el gripper','Limpiar'],['Sensor recorrido','Ajustar'],['Gripper ladeado','Inicializar']],
  tips:[],
},
{
  id:'particulas', titulo:'Partículas', corto:'242 / 606: partícula en el sensor',
  codigos:['242','606'],
  flujo:[
    {p:'Sopletear y repasar', si:'Pasa → listo (casi todas pasan).', no:'Paso 2.'},
    {p:'Segunda limpieza', no:'2 limpiezas sin pasar → desarmar.'},
    {p:'¿Se repite en muchas?', d:'Revisar el material: tablillas picadas o sensores retrabajados no son de la Kasalis.'},
  ],
  causas:[['Partícula suelta','Sopletear'],['Material (tablilla picada, sensor retrabajado)','Segregar'],['Partícula dentro del lente','Scrap']],
  tips:[],
},
{
  id:'software', titulo:'Software / MES', corto:'Popup, programa equivocado, steps faltantes',
  codigos:['10','12','9'],
  flujo:[
    {proc:'login-popup', p:'Popup al iniciar el programa', d:'Iniciar sesión con credenciales de ingeniería. Ctrl+Shift+Esc abre el Administrador de tareas.'},
    {p:'Pieza no entra', d:'Revisar revisión del serial (MOGC vs MOHC).'},
    {p:'Falla en Front por "ensamble Kasalis" / sin step BUILD', d:'Ver el flujo de Progresión: primero revisar logs de segregación en D:\\TARS\\Valid.'},
    {proc:'cargar-programa', p:'Revisar programa cargado', d:'Se cambió solo a ELK de madrugada → piezas sin step de horno. Re-ingresar desde la carpeta de respaldo de seriales.'},
  ],
  causas:[['Certificación al reiniciar','Login'],['Serial de revisión anterior','Revisar MES'],['Programa cambiado','Recargar el correcto']],
  tips:['La ELK no tiene VNC.'],
},
{
  id:'progresion', titulo:'Progresión / MES: no da step BUILD', corto:'La pieza pasó la Kasalis pero no progresa en MES',
  codigos:[],
  flujo:[
    {p:'Confirmar el síntoma', d:'Varias piezas pasaron BUILD en la Kasalis pero en MES no tienen el step BUILD y no progresan (falla en Front por "ensamble Kasalis").'},
    {proc:'logs-segregacion', p:'Revisar la carpeta D:\\TARS\\Valid', d:'Si quedaron logs de segregación ahí, el preparser no puede mover los logs buenos y ninguna pieza progresa.',
     si:'Hay logs de segregación → borrar solo esos. Las demás piezas progresan solas.', no:'Está vacía → paso 3.'},
    {p:'Esperar y revisar en MES', d:'Después de borrar, confirmar en MES que las piezas ya tienen el step BUILD.'},
    {proc:'segregar-lente', p:'Revisar la ruta de datos del programa', d:'Después de segregar, la ruta debe regresar a "valid" (la de segregación termina en "valid1") y cargar el programa de BUILD. Pasar una pieza y validar en MES.'},
    {proc:'cargar-programa', p:'Revisar el programa cargado', d:'Si el programa se cambió de modelo, las piezas no tienen la ruta correcta. Re-ingresar desde la carpeta de respaldo de seriales.'},
    {p:'Revisar el serial', d:'Revisión del número de serie / ensamble (ej. serial de revisión anterior o número de lens adapter en vez del de la Kasalis).'},
    {p:'Último recurso: BUILD manual', d:'Solo como excepción y con autorización.'},
  ],
  causas:[
    ['Logs de segregación olvidados en D:\\TARS\\Valid (Scorpion 95)', 'Borrarlos: el preparser vuelve a mover los logs buenos'],
    ['Programa de otro modelo cargado', 'Cargar el correcto y re-ingresar seriales'],
    ['Serial de revisión anterior / número de ensamble equivocado', 'Corregir en MES'],
  ],
  tips:['El programa de segregación solo existe para Scorpion 95: después de usarlo, revisar que no queden sus logs en D:\\TARS\\Valid.'],
},
{
  id:'mecanico', titulo:'Mecánico / seguridad', corto:'Sensores, home, cortinas, rotary',
  codigos:['3','403','426'],
  flujo:[
    {p:'Load no detecta retracción', d:'Ajustar sensor.'},
    {p:'Dispensado choca / no llega a home', d:'Ajustar tope del riel (sensor de límite).'},
    {p:'Cortinas de seguridad se activan', d:'Revisar altura del lente.'},
  ],
  causas:[],
  tips:['Rate acordado: 20 UPH con un plato.','Horno: ~2 h de producción por carga.'],
},
];
