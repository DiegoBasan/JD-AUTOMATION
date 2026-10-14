/* =====================================================================
   FALLAS Y PROCESOS DE LÍNEA (todo lo que no es Kasalis)
   ---------------------------------------------------------------------
   MAQ: color por línea / máquina (franja de arriba en cada tarjeta).
   FALLAS: {id, linea, lineas?, maquina, titulo, corto, flujo:[{p,d,si,no,proc}], causas:[[causa,solución]], tips:[]}
   PROCESOS: {id: {titulo, linea, lineas?, maquina, permisos, cuando,
                   pasos:[{texto, valor?, ojo?, foto?, marcas?:[{x,y,t}]}],   // foto relativa a fallas-linea/
                   sabemos:[], necesito:[]}}
   Valores que cambian de modelo a modelo se toman de la hoja / receta, no se dejan fijos aquí.
   ===================================================================== */
export const MAQ = {
  kasalis:  {n:'Kasalis',  c:'#FF7F66', d:'Active alignment (app aparte)', href:'../buscador-kasalis/'},
  gecko:    {n:'Gecko',    c:'#8B5CF6', d:'Estaciones de la línea Gecko'},
  moose:    {n:'Moose',    c:'#F08C00', d:'Estaciones de la línea Moose'},
  scorpion: {n:'Scorpion', c:'#2F6BFF', d:'Estaciones de la línea Scorpion'},
  horno:    {n:'Hornos',   c:'#8A8A90', d:'Hornos y curado'},
  general:  {n:'General',  c:'#5E6B78', d:'MES, materiales y lo que aplica a todas'},
};

export const FALLAS = [];

export const PROCESOS = {
  'horno-housing': {
    titulo:'Hornear housing (cargar parámetros en el programa del horno)', linea:'horno', lineas:['scorpion','moose','gecko'], maquina:'Horno', permisos:'Operador / técnico',
    cuando:'Cuando piden hornear housing (Scorpion, Moose…) y el horno tiene otro programa.',
    pasos:[
      {texto:'Tomar la hoja de parámetros del horno y buscar el ensamble: ahí vienen la temperatura de curado, el mínimo / máximo y el tiempo.', ojo:'Siempre usar la hoja del ensamble que vas a hornear: los valores cambian de ensamble a ensamble.'},
      {texto:'Detener el programa con el botón Detener.'},
      {texto:'Ir a la pestaña Parámetros y picar "Modificar parámetros".'},
      {texto:'Capturar los parámetros de la hoja: temperatura de curado, mínimo, máximo y tiempo.', valor:'Ejemplo de la hoja (housing Scorpion): 160 °C · mín 155 · máx 165 · 1 h 30 min'},
      {texto:'Picar "Cargar cambios". Pide contraseña.', valor:'Contraseña: admin'},
      {texto:'Iniciar el programa.'},
    ],
    sabemos:['Confirmar en pantalla que quedaron los valores de la hoja antes de cargar piezas.'],
    necesito:['Fotos de cada pantalla (Detener, pestaña Parámetros, Modificar parámetros, Cargar cambios, Iniciar)'],
  },
  'horno-manual': {
    titulo:'Configurar el horno directo en el horno (manual)', linea:'horno', maquina:'Horno', permisos:'Técnico',
    cuando:'Cuando hay que poner los parámetros directamente en el control del horno.',
    pasos:[], sabemos:['Los parámetros salen de la hoja de parámetros del horno por ensamble.'],
    necesito:['Pasos y fotos del control del horno'],
  },
  'cambio-delo': {
    titulo:'Cambio de cartucho de DELO', linea:'general', lineas:['gecko','moose','scorpion'], maquina:'Dispensadores', permisos:'Operador / técnico',
    cuando:'DELO acabado, pot life vencido o cambio de material.',
    pasos:[
      {texto:'Cerrar el aire y validar que el manómetro marque 0 PSI.'},
      {texto:'Cambiar el cartucho y asegurar las conexiones.'},
      {texto:'Apretar el opresor.', ojo:'Saltarse el aire o el opresor ya tiró DELO dos veces.'},
      {texto:'Encender el aire de forma gradual y revisar que no haya fugas.'},
      {texto:'Purgar, pesar 3 dispensados y tomar foto.'},
    ],
    sabemos:['El DELO se ambienta 1.5 h antes de usarlo (el de MRO llega congelado).','Si cambia de cuarto: 30 min de refri y luego ambientar.','Registrar cada DELO en la base de datos; la caducidad corre desde que se abre.','No reusar envases.'],
    necesito:['Fotos del dispensador de cada estación (dónde está el opresor y la válvula de aire)'],
  },
  'receta-lens-adapter': {
    titulo:'Cambio de receta en lens adapter', linea:'general', lineas:['gecko','moose','scorpion'], maquina:'Lens adapter', permisos:'Técnico',
    cuando:'Cambio de modelo en la estación de lens adapter.',
    pasos:[], sabemos:[], necesito:['Pasos y fotos del cambio de receta'],
  },
  'cambio-fixtura': {
    titulo:'Cambio de fixtura', linea:'general', lineas:['gecko','moose','scorpion'], maquina:'Estaciones', permisos:'Técnico',
    cuando:'Cambio de modelo o fixtura dañada.',
    pasos:[], sabemos:[], necesito:['Pasos y fotos del cambio de fixtura por estación'],
  },
};
