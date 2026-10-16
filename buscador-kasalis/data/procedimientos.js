/* =====================================================================
   GUÍAS DEL PROGRAMA KASALIS (paso a paso con fotos de pantalla)
   ---------------------------------------------------------------------
   Se abren desde el flujo de resolución ("Cómo hacerlo en el programa").
   {
     titulo, estacion, cuando,           // cuándo se usa
     permisos: 'Operador' | 'Ingeniería', // quién puede hacerlo
     codigos: ['108','131'],
     sabemos: ['regla o valor ya conocido', …],   // de experiencia en piso (sin pantallas)
     pasos: [                                       // vacío = faltan fotos
       { foto: 'fotos/ajustar-place/01.jpg',        // relativa a buscador-kasalis/
         texto: 'Pica en Setup',                     // qué hacer en esta pantalla
         marcas: [{x:42, y:18, t:'Setup'}],          // dónde picar: % del ancho/alto de la foto
         valor: 'valor a escribir',                  // opcional: valor a escribir / revisar
         ojo: 'No cierres sin guardar' },            // opcional: advertencia
     ],
     necesito: ['captura que falta', …],            // lo que hay que fotografiar para completar la guía
   }
   Sin contraseñas, usuarios ni rutas de red en las fotos (repo público).
   ===================================================================== */
export const PROCS = {
  'ajustar-place': {
    titulo:'Ajustar place X, Y, Z del plato', estacion:'Alineación', permisos:'Ingeniería', codigos:['108','131','137','195'],
    cuando:'Fallas de alineación seguidas en un plato y la golden también falla en ese plato.',
    sabemos:['Con 5 fallas de alineación seguidas ya se ajusta.','Se ajustan las 3 posiciones del plato; si no basta, también theta X / Y.','Se ajusta por plato (ELK plato 4 ha sido el más frecuente).','Mientras se ajusta, se puede correr con el otro plato.','Cada cambio en la Kasalis genera serial number break.'],
    pasos:[], necesito:['Pantalla principal con el botón para entrar a setup / teach','Selección de estación (Alineación) y de plato / fixtura','Pantalla de posiciones place X, Y, Z (y theta)','Cómo se mueve el eje (jog) y cómo se guarda','Cómo se prueba el cambio y se regresa a producción'],
  },
  'teach-z': {
    titulo:'Teach Z / punto de inicio del scan', estacion:'Alineación', permisos:'Ingeniería', codigos:['108','131'],
    cuando:'El scan arranca abajo del foco real o la Z de alineación varía entre piezas.',
    sabemos:['La Z de inicio depende del modelo de lente.','Cambiar interposer no lo corrige.'],
    pasos:[], necesito:['Dónde está el parámetro de Z de inicio / teach','Cómo se enseña la Z con una pieza buena','Cómo se guarda y se valida'],
  },
  'aeo-roi': {
    titulo:'Align Extra Offset (AEO) y ROI', estacion:'Alineación', permisos:'Ingeniería (con autorización)', codigos:['131','161'],
    cuando:'Ajuste fino de SFR cuando la máquina y el lente están bien.',
    sabemos:['El valor de AEO depende del modelo: probar primero con pocas piezas.','El cambio de ROI lo hace ingeniería por SFR.','Requiere autorización.'],
    pasos:[], necesito:['Dónde está el AEO','Dónde se editan las ROI','Cómo se guarda'],
  },
  'uv-cure-time': {
    titulo:'Revisar UVCureTime', estacion:'Alineación (UV)', permisos:'Ingeniería', codigos:['155','143','149'],
    cuando:'El lente se mueve al soltarlo o el DELO no cura.',
    sabemos:['El valor está en milisegundos: 15000–19500.','Estuvo en 1950 (≈2 s) y causaba 155.'],
    pasos:[], necesito:['Dónde está UVCureTime en el programa','Cómo se edita y guarda'],
  },
  'activar-dispense': {
    titulo:'Activar la opción "dispense"', estacion:'Dispensado', permisos:'Ingeniería', codigos:['230','233'],
    cuando:'La máquina hace el ciclo pero no sale DELO.',
    sabemos:['Pasó que la opción de dispensar estaba desactivada.'],
    pasos:[], necesito:['Dónde está la opción dispense','Cómo se activa y se guarda'],
  },
  'purga': {
    titulo:'Purga / prime del dispensador', estacion:'Dispensado', permisos:'Operador', codigos:['233','230'],
    cuando:'Burbujas, trazo bajo, después de cambiar cartucho de DELO o motor.',
    sabemos:['PurgeTimeDispenseHead1 = 10000 ms al 50 %.','Prime: 5 ciclos de 10000 ms al 50 %, suck back 50 ms.','Después: pesar 3 dispensados y foto.'],
    pasos:[], necesito:['Botón de purga / prime','A dónde va el cabezal (copa de purga)','Cómo se confirma'],
  },
  'altura-aguja': {
    titulo:'Ajustar altura de la aguja (Z de dispensado)', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233'],
    cuando:'La aguja raspa el lens adapter o el trazo sale mal al inicio.',
    sabemos:['Baja = raspa el lens adapter; alta = trazo malo o DELO mal puesto al inicio.','En la línea ARC: ZO = offset de Z y ZR = retracción al final.'],
    pasos:[], necesito:['Dónde se enseña la Z de dispensado / tip find','Cómo se cambia ZO','Cómo se valida con una pieza'],
  },
  'offset-dispensado': {
    titulo:'Centrar offset X / Y del dispensado', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233'],
    cuando:'El círculo sale desfasado respecto al lens adapter.',
    sabemos:['Los valores de X / Y dependen del modelo: mover poco a poco y validar.'],
    pasos:[], necesito:['Dónde se cambian X / Y del arco o el offset','Cómo se prueba'],
  },
  'enfoque-vis': {
    titulo:'Enfocar y ajustar brillo de la cámara de inspección (VIS)', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233'],
    cuando:'El dispensado está bien (centrado y completo) pero la VIS sigue dando 233.',
    sabemos:['Comparar contra la foto de referencia de logs pasados: pieza buena del mismo modelo.','Al cambiar Moose ↔ ELK el lens queda más bajo: hay que re-enfocar.','Las line lights (barras LED) deben apuntar al lens adapter (se ajustan con tornillos).','Validar con una pieza incompleta: debe fallar.','LD (DOAL) rebota en lo plano: con LD alto el sensor se ve blanco y se detecta como material. Se bajó de 30 a 0.','Probar umbral y rangos con fotos reales en el Laboratorio VIS (Kasalis 3D) antes de tocar la máquina.'],
    pasos:[], necesito:['Dónde se guardan / abren las imágenes de la VIS en los logs','Foto de referencia buena por modelo (Moose, Scorpion, Gecko)','Cómo ver la imagen en vivo para enfocar','Dónde se ajusta el brillo / exposición (si es por programa)'],
  },
  'editar-arc': {
    titulo:'Editar la línea ARC (DR, LI, LO, cambio de modelo)', estacion:'Dispensado', permisos:'Ingeniería', codigos:['233','235'],
    cuando:'"Bola" al inicio o final del arco, poco o mucho DELO, o cambio de modelo (95 ↔ 133).',
    sabemos:['Comentar la línea anterior con #, no borrarla.','Al cambiar a 133 se cambia una línea comentada; al regresar al 95 se regresa.','Guardar con "save and close" y revisar que sea la carpeta correcta.','Después: pesar 3 dispensados y foto.'],
    pasos:[], necesito:['Dónde está el archivo de dispensado / cómo se abre','Cómo se guarda y se recarga en el programa'],
  },
  'inicializar': {
    titulo:'Inicializar la estación / equipo', estacion:'General', permisos:'Operador', codigos:['102','231','104'],
    cuando:'Comunicación intermitente, gripper ladeado, estación que no llega a home.',
    sabemos:['Reiniciar MIU / inicializar el equipo ayudó en comunicación de dispensado.'],
    pasos:[], necesito:['Botón de inicializar (equipo y por estación)','Qué esperar en pantalla mientras inicializa'],
  },
  'login-popup': {
    titulo:'Popup al iniciar el programa (certificación)', estacion:'Software', permisos:'Ingeniería', codigos:[],
    cuando:'Después de un apagado sale un popup y no deja entrar.',
    sabemos:['Se inicia sesión con credenciales de ingeniería.','Ctrl+Shift+Esc abre el Administrador de tareas.','La ELK no tiene VNC.'],
    pasos:[], necesito:['El popup','Dónde se inicia sesión (tapar usuario y contraseña en la foto)'],
  },
  'cargar-programa': {
    titulo:'Revisar / cargar el programa del modelo', estacion:'Software', permisos:'Ingeniería', codigos:['10','12'],
    cuando:'Cambio de modelo o el programa se cambió solo (piezas sin step de horno).',
    sabemos:['Moose / ELK / Scorpion usan plato, dispensador, ejecutable y archivo TARS build/retest propios.','Si se cambió solo: re-ingresar las piezas desde la carpeta de respaldo de seriales.','Hacer respaldo antes de cargar un programa nuevo.'],
    pasos:[], necesito:['Dónde se ve el programa cargado','Cómo se cambia de modelo','Dónde está el respaldo'],
  },
  'segregar-lente': {
    titulo:'Programa de segregación de lente (Scorpion 95)', estacion:'Alineación', permisos:'Ingeniería', codigos:['131','108'],
    cuando:'Scorpion 95: muchas fallas de lente seguidas y la golden pasa.',
    sabemos:['Solo existe para Scorpion 95.','Escanea el ID del lente y prueba si alinea.','Un lente segregado como malo da 131.','Al terminar, revisar que no queden logs de segregación en D:\\TARS\\Valid (si quedan, las piezas no progresan en MES).','Durante la segregación no se mandan datos a MES (solo se escanea el lente).','Para regresar a producción: quitar el "1" de la ruta "valid1" para que apunte a "valid", cambiar al programa de BUILD, pasar una pieza y validar el historial en MES.'],
    pasos:[], necesito:['Cómo se entra al modo de segregación','Qué se escanea y qué resultado muestra','Cómo se regresa a producción'],
  },
  'logs-segregacion': {
    titulo:'Borrar logs de segregación atorados', estacion:'Software / MES', permisos:'Ingeniería', codigos:[],
    cuando:'Las piezas pasan la Kasalis pero no progresan en MES (sin step BUILD), sobre todo después de usar el programa de segregación del 95.',
    sabemos:['Si quedan logs de segregación en la carpeta, el preparser no puede mover los logs buenos.','Al borrarlos, las demás piezas progresan solas.','Borrar solo los logs de segregación, no los de producción.'],
    pasos:[
      {foto:'fotos/progresion/01-ruta-valid.png', texto:'Abrir el Explorador y entrar a This PC › Data (D:) › TARS › Valid', marcas:[{x:38,y:5,t:'D:\\TARS\\Valid'}], valor:'D:\\TARS\\Valid', ojo:'Así se ve ya limpia (vacía). Si hay logs de segregación, borrar solo esos.'},
    ],
    necesito:['Cómo se ve la carpeta con logs de segregación atorados (para distinguirlos)','Confirmación en MES de que ya progresaron'],
  },
  'cambio-delo': {
    titulo:'Cambio de DELO en la Kasalis', estacion:'Dispensado', permisos:'Operador / técnico', codigos:['235','236'],
    cuando:'DELO acabado (235), pot life vencido (236) o cambio de material.',
    sabemos:['Ambientar 1.5 h antes de usarlo (el de MRO llega congelado).','Si cambia de cuarto: 30 min de refri y luego ambientar.','Registrar cada DELO en la base de datos.'],
    pasos:[
      {texto:'Cerrar el aire y validar 0 PSI.'},
      {texto:'Cambiar el cartucho y asegurar las conexiones.'},
      {texto:'Apretar el opresor.', ojo:'Saltarse el aire o el opresor ya tiró DELO dos veces.'},
      {texto:'Encender el aire gradual y revisar fugas.'},
      {texto:'Purgar, pesar 3 dispensados y tomar foto.'},
    ],
    necesito:['Fotos del dispensador (opresor, válvula de aire) y de la pantalla de purga'],
  },
  'candado': {
    titulo:'Candado 3-5-10 (bloqueo por fallas)', estacion:'Alineación', permisos:'Ingeniería', codigos:[],
    cuando:'La máquina se bloquea por fallas de alineación seguidas.',
    sabemos:['Desbloquear requiere cuenta con permisos.','Si se traba, cerrar sesión lo soluciona.'],
    pasos:[], necesito:['La pantalla del bloqueo','Cómo se desbloquea / cierra sesión'],
  },
};
