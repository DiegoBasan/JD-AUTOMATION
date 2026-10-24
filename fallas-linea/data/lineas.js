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

/* Fallas recopiladas de los chats de soporte (jul–oct 2026). */
export const FALLAS = [
 {
  "id": "moose-final-assy-atornillado",
  "linea": "moose",
  "maquina": "Final Assy (atornillado)",
  "titulo": "Final Assy (atornillado)",
  "corto": "Tornillos elevados que el equipo pasa como buenos, o tornillos que bajan completo pero el…",
  "sintoma": "Tornillos elevados que el equipo pasa como buenos, o tornillos que bajan completo pero el equipo los falla por ángulo; reintentos (hasta 3) por tornillo; housings barridos.",
  "flujo": [
   {
    "p": "Tomar foto del tornillo elevado para dimensionar"
   },
   {
    "p": "Bajar el tornillo manualmente para sentir si el barreno está duro"
   },
   {
    "p": "Revisar historial del housing (nuevo vs reutilizado) y segregar"
   },
   {
    "p": "Verificar que esté cargado el programa correcto (no retrabajo)"
   },
   {
    "p": "En el controlador abrir el programa activo, ir a la última etapa y revisar límites de ángulo y el mensaje de falla"
   },
   {
    "p": "Ajustar velocidad/ángulo de forma controlada y validar con housing nuevo"
   },
   {
    "p": "Si es material, entregar evidencia a Calidad y no asumir el Andon"
   },
   {
    "p": "Ver el proceso",
    "proc": "limites-atornillado"
   }
  ],
  "causas": [
   [
    "Velocidad/torque de atornillado insuficiente (tornillo no asienta)",
    "Subir un poco la velocidad del torque y/o el torque; subir el ángulo mínimo si salen elevados aprobados"
   ],
   [
    "Housing reutilizado/retrabajado con rosca dañada (cambia el ángulo final)",
    "Segregar nuevo vs reutilizado; correr lo nuevo con el programa normal y lo reutilizado con su programa propio; revisar historial del housing"
   ],
   [
    "Housing nuevo con barreno cerrado o incompleto",
    "Bajar el tornillo manual: si cuesta mucho, entregar housing a Calidad (revisión en microscopio); no es falla del equipo, no cerrar Andon como Auto"
   ],
   [
    "Operador presiona/se recarga en el segundo intento y barre los barrenos",
    "Detener, re-entrenar al operador (no apalancar); involucrar a Entrenamiento y tomar video de la operación"
   ],
   [
    "Programa de retrabajo cargado en lugar del original",
    "Regresar al programa original; el de retrabajo requiere credenciales de Calidad"
   ],
   [
    "Bujes de la fixtura descentrados / esquina del buje golpea la pieza",
    "Acomodar/centrar o girar el buje y validar con piezas"
   ],
   [
    "Límite de ángulo mínimo del paso 3 demasiado alto para el material actual (ej. 2300 con piezas buenas en ~1600-1980)",
    "Hacer prueba bajando el mínimo con aviso a Calidad, vigilando que no pasen elevados; el mínimo de la etapa final de apriete es 1050"
   ]
  ],
  "tips": [
   "Frecuencia: {{Muy recurrente (casi diario en julio; repuntes en septiembre al mezclar housing reutilizado o con personal nuevo).}}",
   "Visto en chats: 2026-07-08 a 2026-09-26"
  ]
 },
 {
  "id": "moose-bracket-atornillado",
  "linea": "moose",
  "maquina": "Bracket (atornillado)",
  "titulo": "Bracket (atornillado)",
  "corto": "Tornillos que no bajan o quedan elevados",
  "sintoma": "Tornillos que no bajan o quedan elevados; muy duros al bajarlos manualmente; pasan al segundo o tercer intento.",
  "flujo": [
   {
    "p": "Lote de tornillos con exceso de fijador (locktite) en la bolsa",
    "d": "Revisar/segregar la bolsa de tornillos"
   },
   {
    "p": "Velocidad de atornillado alta",
    "d": "Disminuir la velocidad del torque"
   },
   {
    "p": "Atornillador con calibración vencida",
    "d": "Programar calibración del atornillador y cambiar etiqueta (entrada al cuarto limpio con protocolo)"
   },
   {
    "p": "Pieza mal puesta (falla de visión)",
    "d": "Recolocar pieza y repetir"
   }
  ],
  "causas": [
   [
    "Lote de tornillos con exceso de fijador (locktite) en la bolsa",
    "Revisar/segregar la bolsa de tornillos"
   ],
   [
    "Velocidad de atornillado alta",
    "Disminuir la velocidad del torque"
   ],
   [
    "Atornillador con calibración vencida",
    "Programar calibración del atornillador y cambiar etiqueta (entrada al cuarto limpio con protocolo)"
   ],
   [
    "Pieza mal puesta (falla de visión)",
    "Recolocar pieza y repetir"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente en julio; luego esporádico.}}",
   "Visto en chats: 2026-07-08 a 2026-08-06"
  ]
 },
 {
  "id": "moose-front-assy-atornillado-sensores",
  "linea": "moose",
  "maquina": "Front Assy (atornillado/sensores)",
  "titulo": "Front Assy (atornillado/sensores)",
  "corto": "El tornillo baja bien pero la estación lo marca malo por ángulo",
  "sintoma": "El tornillo baja bien pero la estación lo marca malo por ángulo; se salta un tornillo; tornillo 1 no agarra torque; tornillo atorado en la fixtura.",
  "flujo": [
   {
    "p": "Ángulo mínimo demasiado alto",
    "d": "Ajustar ángulo mínimo (ej. de 3750° a 3700°; bajar mínimo del step 3)"
   },
   {
    "p": "Sensor de presencia se queda sensado: al terminar tornillo 1 el 2 ya aparece sensado y salta al 3",
    "d": "Ajustar/reparar el sensor de tornillo"
   },
   {
    "p": "Programa trabado (no toma torque en tornillo 1)",
    "d": "Cerrar y abrir el programa; si persiste, avisar a Auto"
   },
   {
    "p": "Tornillo atorado en el imán inferior de la fixtura (tope para la foto de visión)",
    "d": "Retirar el tornillo y limpiar el imán"
   },
   {
    "p": "Pieza no detectada en fixtura (Front Scorpion)",
    "d": "Bajar un poco el sensor de presencia"
   }
  ],
  "causas": [
   [
    "Ángulo mínimo demasiado alto",
    "Ajustar ángulo mínimo (ej. de 3750° a 3700°; bajar mínimo del step 3)"
   ],
   [
    "Sensor de presencia se queda sensado: al terminar tornillo 1 el 2 ya aparece sensado y salta al 3",
    "Ajustar/reparar el sensor de tornillo"
   ],
   [
    "Programa trabado (no toma torque en tornillo 1)",
    "Cerrar y abrir el programa; si persiste, avisar a Auto"
   ],
   [
    "Tornillo atorado en el imán inferior de la fixtura (tope para la foto de visión)",
    "Retirar el tornillo y limpiar el imán"
   ],
   [
    "Pieza no detectada en fixtura (Front Scorpion)",
    "Bajar un poco el sensor de presencia"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-14 a 2026-09-22"
  ]
 },
 {
  "id": "scorpion-final-assy-atornillado",
  "linea": "scorpion",
  "maquina": "Final Assy (atornillado)",
  "titulo": "Final Assy (atornillado)",
  "corto": "Tornillos no bajan por completo / quedan elevados",
  "sintoma": "Tornillos no bajan por completo / quedan elevados; Andon por torque.",
  "flujo": [
   {
    "p": "Punta del atornillador mal colocada (no gira)",
    "d": "Asentar bien la punta en el adaptador y probar"
   },
   {
    "p": "Housing defectuoso o reutilizado (algunos con más de 5 vueltas de retrabajo) / barrenos cerrados",
    "d": "Segregar y entregar a Calidad; usar material en buen estado; no es de Auto"
   },
   {
    "p": "Velocidad de atornillado baja",
    "d": "Aumentar un poco la velocidad"
   },
   {
    "p": "Torques sin soporte al arranque",
    "d": "Validar torques al inicio del turno"
   }
  ],
  "causas": [
   [
    "Punta del atornillador mal colocada (no gira)",
    "Asentar bien la punta en el adaptador y probar"
   ],
   [
    "Housing defectuoso o reutilizado (algunos con más de 5 vueltas de retrabajo) / barrenos cerrados",
    "Segregar y entregar a Calidad; usar material en buen estado; no es de Auto"
   ],
   [
    "Velocidad de atornillado baja",
    "Aumentar un poco la velocidad"
   ],
   [
    "Torques sin soporte al arranque",
    "Validar torques al inicio del turno"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente.}}",
   "Visto en chats: 2026-07-13 a 2026-09-17"
  ]
 },
 {
  "id": "scorpion-final-assy-vision-acura",
  "linea": "scorpion",
  "maquina": "Final Assy (visión / Acura)",
  "titulo": "Final Assy (visión / Acura)",
  "corto": "La visión no hace trigger de la primera inspección (manual sí pasa)",
  "sintoma": "La visión no hace trigger de la primera inspección (manual sí pasa); falla visión de etiquetas regulatorias; falla visión del O-ring.",
  "flujo": [
   {
    "p": "Comunicación de la app Acura con la cámara VS",
    "d": "Reabrir la app/reiniciar; pendiente optimizar la clase de comunicación de la cámara"
   },
   {
    "p": "La visión no cambió de receta al cambiar de modelo",
    "d": "Forzar el cambio de receta de visión y validar con primera pieza"
   },
   {
    "p": "Cuadros de búsqueda desajustados (O-ring/etiqueta)",
    "d": "Ajustar cuadros de búsqueda"
   }
  ],
  "causas": [
   [
    "Comunicación de la app Acura con la cámara VS",
    "Reabrir la app/reiniciar; pendiente optimizar la clase de comunicación de la cámara"
   ],
   [
    "La visión no cambió de receta al cambiar de modelo",
    "Forzar el cambio de receta de visión y validar con primera pieza"
   ],
   [
    "Cuadros de búsqueda desajustados (O-ring/etiqueta)",
    "Ajustar cuadros de búsqueda"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente (llegaron a cargar 1 h de tiempo muerto por visión).}}",
   "Visto en chats: 2026-07-13 a 2026-09-15"
  ]
 },
 {
  "id": "general-impresion-de-etiquetas-contador-",
  "linea": "general",
  "maquina": "Impresión de etiquetas / contador de seriales",
  "titulo": "Impresión de etiquetas / contador de seriales",
  "corto": "No salen etiquetas en Final",
  "sintoma": "No salen etiquetas en Final; la estación se detiene por error de 'ligado' que en realidad es de etiqueta; etiquetas sin nombre de modelo o con formato distinto.",
  "flujo": [
   {
    "p": "Imprimir una etiqueta manual para ver el error exacto"
   },
   {
    "p": "Confirmar con Calidad/MES si es contador o programa"
   },
   {
    "p": "No cambiar código de la app sin acuerdo"
   },
   {
    "p": "Redireccionar el Andon a MES si no es de Auto"
   }
  ],
  "causas": [
   [
    "Programa configurado con número de impresora anterior",
    "Cambiar en el programa a la impresora en uso (ej. 66 → 178)"
   ],
   [
    "Contador de etiquetas de MES desfasado o detenido (genera seriales ya usados o se agota el rango)",
    "Escalar a MES/Calidad; validar rango disponible; se requirió solicitar apertura de rango al funcional"
   ],
   [
    "Cambio de etiqueta/serial en MES no reflejado en el programa",
    "Actualizar programa de la estación (campo del modelo) y reimprimir; segregar lo impreso mal"
   ],
   [
    "Impresora de FVT sin red",
    "Conectar el cable de internet"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional pero con paros largos (hasta varias horas).}}",
   "Visto en chats: 2026-07-20 a 2026-10-09"
  ]
 },
 {
  "id": "general-mes-ligado-y-progresion",
  "linea": "general",
  "maquina": "MES – ligado y progresión",
  "titulo": "MES – ligado y progresión",
  "corto": "La estación no deja pasar la pieza: 'no encuentra que el serial padre tenga ligado el…",
  "sintoma": "La estación no deja pasar la pieza: 'no encuentra que el serial padre tenga ligado el housing/serializer', 'pieza ya ligada', error de número de ensamble, falta step de Build, progresión de otro modelo.",
  "flujo": [
   {
    "p": "Escanear la pieza y leer el mensaje exacto"
   },
   {
    "p": "Revisar historial en MES (Build, retest, ligados)"
   },
   {
    "p": "Si es tema de Calidad (ligado/mutación), apartar y entregar; no cerrar Andon como Auto"
   },
   {
    "p": "Si es programa, documentar y corregir"
   }
  ],
  "causas": [
   [
    "Serial capturado sin sufijo -SUB",
    "Corregir el serial; validar formulario MES"
   ],
   [
    "Diferencia mayúsculas/minúsculas en el serial",
    "Programa modificado para no distinguir mayúsculas/minúsculas"
   ],
   [
    "Pieza no desligada por Calidad tras desarme (lens adapter / tablilla)",
    "Calidad debe desligar el lens adapter del sensor; apartar la pieza para revisión con MES"
   ],
   [
    "Pieza construida en modo manual sin step de Build, o con número de ensamble del lens adapter en vez del de Kasalis",
    "Dar Build manual para que cambie al ensamble correcto"
   ],
   [
    "Calidad no mutó / no dio su proceso a piezas devueltas (queda progresión de otro modelo)",
    "Regresar a Calidad para mutar; es manejo de material, no del equipo"
   ],
   [
    "Pieza con revisión anterior (serial MOGC en vez de MOHC)",
    "Separar; no procesar"
   ],
   [
    "Nodo de red ethernet de la estación (no da el step aunque los seriales estén bien)",
    "Revisar conexión/nodo con IT"
   ]
  ],
  "tips": [
   "Frecuencia: {{Frecuente.}}",
   "Visto en chats: 2026-07-08 a 2026-10-08"
  ]
 },
 {
  "id": "general-lens-adapter-estacion",
  "linea": "general",
  "maquina": "Lens Adapter (estación)",
  "titulo": "Lens Adapter (estación)",
  "corto": "El programa se traba al terminar la pieza, pantalla en blanco o se queda esperando retiro",
  "sintoma": "El programa se traba al terminar la pieza, pantalla en blanco o se queda esperando retiro; no marca como atornillado y sigue pidiendo atornillar; no da progresión; el flujo de inicialización no avanza.",
  "flujo": [
   {
    "p": "Sensor intermitente o fibra óptica mal colocada",
    "d": "Revisar/reinstalar fibra y ajustar sensores (incluye sensor del pisador en Gecko y sensor del tornillo 3)"
   },
   {
    "p": "Programa/PLC trabado tras tiempo sin piezas",
    "d": "Cerrar y abrir el programa; si no, reiniciar programa y PLC"
   },
   {
    "p": "Punta del atornillador rota o barrida (barre el tornillo al final)",
    "d": "Revisar y cambiar la punta (la de Back Assy comparte la misma punta)"
   },
   {
    "p": "Checkpoint de vida de plasma: el lens adapter vencido no avanza; límite de horas fijo en código",
    "d": "Replasmear material vencido; el límite de horas se hizo configurable (12 → 16 h de ventana)"
   },
   {
    "p": "Ver el proceso",
    "proc": "receta-lens-adapter"
   }
  ],
  "causas": [
   [
    "Sensor intermitente o fibra óptica mal colocada",
    "Revisar/reinstalar fibra y ajustar sensores (incluye sensor del pisador en Gecko y sensor del tornillo 3)"
   ],
   [
    "Programa/PLC trabado tras tiempo sin piezas",
    "Cerrar y abrir el programa; si no, reiniciar programa y PLC"
   ],
   [
    "Punta del atornillador rota o barrida (barre el tornillo al final)",
    "Revisar y cambiar la punta (la de Back Assy comparte la misma punta)"
   ],
   [
    "Checkpoint de vida de plasma: el lens adapter vencido no avanza; límite de horas fijo en código",
    "Replasmear material vencido; el límite de horas se hizo configurable (12 → 16 h de ventana)"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente (varias veces por semana en julio-agosto).}}",
   "Visto en chats: 2026-07-15 a 2026-10-07"
  ]
 },
 {
  "id": "general-back-assy",
  "linea": "general",
  "maquina": "Back Assy",
  "titulo": "Back Assy",
  "corto": "Cilindros/clamps entran y salen antes del atornillado o no cierran bien",
  "sintoma": "Cilindros/clamps entran y salen antes del atornillado o no cierran bien; la fixtura se atora al girarla; punta quebrada.",
  "flujo": [
   {
    "p": "Ajuste mecánico del cilindro / nivel de la fixtura",
    "d": "Ajustar el tornillo que nivela la fixtura para que bloquee bien"
   },
   {
    "p": "Altura del tornillo tope incorrecta (no clampea bien al girar)",
    "d": "Ajustar la altura del tornillo tope"
   },
   {
    "p": "Operador cierra el cilindro antes de bajar la tapa por completo",
    "d": "Re-entrenar"
   },
   {
    "p": "Punta del atornillador quebrada",
    "d": "Reponer punta desde la gaveta y descontar en inventario"
   }
  ],
  "causas": [
   [
    "Ajuste mecánico del cilindro / nivel de la fixtura",
    "Ajustar el tornillo que nivela la fixtura para que bloquee bien"
   ],
   [
    "Altura del tornillo tope incorrecta (no clampea bien al girar)",
    "Ajustar la altura del tornillo tope"
   ],
   [
    "Operador cierra el cilindro antes de bajar la tapa por completo",
    "Re-entrenar"
   ],
   [
    "Punta del atornillador quebrada",
    "Reponer punta desde la gaveta y descontar en inventario"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-08-06 a 2026-09-15"
  ]
 },
 {
  "id": "general-leak-test",
  "linea": "general",
  "maquina": "Leak Test",
  "titulo": "Leak Test",
  "corto": "Fallas de fuga que detienen la línea por regla 3-5-10 (candado que solo libera Pruebas).",
  "sintoma": "Fallas de fuga que detienen la línea por regla 3-5-10 (candado que solo libera Pruebas).",
  "flujo": [
   {
    "p": "Diagnóstico de la primera falla en ≤15 min (si es otro modo de falla, otros 15)"
   },
   {
    "p": "Revisar valor de delta P: falla por O-ring normalmente <50; fuga gruesa suele ser cristal"
   },
   {
    "p": "Cambiar O-ring / front y reprobar"
   },
   {
    "p": "Si apunta a O-ring, escalar a Calidad para O-ring validado"
   },
   {
    "p": "Pruebas retira el candado; continuar en batches de 10 con pantallazo de yield"
   },
   {
    "p": "Ver el proceso",
    "proc": "contencion-leak"
   }
  ],
  "causas": [
   [
    "O-ring con bajo peso, poros o craqueleado (principal contribuyente)",
    "Usar O-ring certificado; Calidad pesa y segrega (usar >0.38-0.39 g); correr bolsita por bolsita y regresar los malos a su bolsa para RTV"
   ],
   [
    "O-ring estirado/dañado por manipulación",
    "Revisar método de ensamble"
   ],
   [
    "Porosidad del back housing",
    "Segregar back housing (inspección en microscopio) y validar lote"
   ],
   [
    "Fuga por el cristal del front housing (fuga gruesa)",
    "Entregar a Calidad; validar curado del front window (ASSELEC) y pesos/altura de dispensado"
   ],
   [
    "Película de desecante obstruyendo el tornillo",
    "Limpiar/retirar la película"
   ],
   [
    "Mal armado de la pieza (falso)",
    "Desarmar, rearmar y reprobar; si pasa, se descarta el equipo"
   ],
   [
    "Lente suelto detectado en leak",
    "Abrir QRQC; revisar plasma del lote y buscar piezas hermanas; bloquear embarque"
   ]
  ],
  "tips": [
   "Frecuencia: {{Muy frecuente (agosto-septiembre), ligado a lotes de O-ring y housing.}}",
   "Visto en chats: 2026-08-04 a 2026-09-24"
  ]
 },
 {
  "id": "general-eol-fallas-de-sfr",
  "linea": "general",
  "maquina": "EOL – fallas de SFR",
  "titulo": "EOL – fallas de SFR",
  "corto": "Piezas que pasan Build y Retest en Kasalis fallan SFR en EOL (valores cerca del límite…",
  "sintoma": "Piezas que pasan Build y Retest en Kasalis fallan SFR en EOL (valores cerca del límite inferior); acumulación de scrap.",
  "flujo": [
   {
    "p": "Verificar golden en EOL"
   },
   {
    "p": "Revisar tendencia del modo de falla en Test Performance (descontar retesteadas)"
   },
   {
    "p": "Comparar con logs de Kasalis"
   },
   {
    "p": "Retestear piezas al borde; no desarmar sin dirección"
   },
   {
    "p": "Abrir QRQC si se acumulan"
   }
  ],
  "causas": [
   [
    "Límites de Kasalis más holgados que EOL (MTF 80-85% vs límite SFR ~0.26); piezas al borde pasan Kasalis y fallan en EOL",
    "Evaluar alinear límites; probar en EOL piezas falladas en retest para definir hasta dónde se puede ajustar"
   ],
   [
    "Lote de lente malo",
    "Segregar lente con programa de verificación; cambiar de lote"
   ],
   [
    "Exceso de DELO dispensado",
    "Pesar y ajustar % de glue dentro del rango del modelo"
   ],
   [
    "Porta-interposer impreso en 3D ligeramente levantado",
    "Regresar al porta-interposer original"
   ],
   [
    "Parámetro AEO (95°): mejor desempeño en -15 que en -17",
    "Correr lote de 10, validar en EOL y fijar el valor"
   ],
   [
    "Tornillos del front sin apretar bien (rearmado recupera piezas)",
    "Reapretar ligeramente y reprobar antes de desarmar"
   ],
   [
    "Cambio en la EOL (todas las piezas fallaban)",
    "Revertir/validar el cambio con Pruebas"
   ]
  ],
  "tips": [
   "Frecuencia: {{Muy frecuente (decenas por turno en picos).}}",
   "Visto en chats: 2026-07-15 a 2026-10-07"
  ]
 },
 {
  "id": "general-eol-fvt-robot-de-calibracion-com",
  "linea": "general",
  "maquina": "EOL / FVT / Robot de calibración (comunicación y sistema)",
  "titulo": "EOL / FVT / Robot de calibración (comunicación y sistema)",
  "corto": "Fallas de comunicación en EOL",
  "sintoma": "Fallas de comunicación en EOL; error en EOL; FVT no funciona; robot sin programa abierto; no se da step de calibración.",
  "flujo": [
   {
    "p": "Mala conexión entre tablillas (abrir y cerrar la cámara la hace pasar)",
    "d": "Revisar método de ensamble y fixtura; punto limpio con Auto, MFG, Calidad y Pruebas"
   },
   {
    "p": "Cable dañado/suelto",
    "d": "Cambiar o reconectar el cable"
   },
   {
    "p": "Programa de EOL (candado por script de revisión de sensor)",
    "d": "Pruebas modifica el programa"
   },
   {
    "p": "Monos probadas sin dogbone",
    "d": "Probar monos a nivel dogbone con sus 3 tornillos y después retirarlos"
   },
   {
    "p": "Step de calibración administrado por el funcional no se refleja",
    "d": "Restablecer con el funcional y recalibrar"
   }
  ],
  "causas": [
   [
    "Mala conexión entre tablillas (abrir y cerrar la cámara la hace pasar)",
    "Revisar método de ensamble y fixtura; punto limpio con Auto, MFG, Calidad y Pruebas"
   ],
   [
    "Cable dañado/suelto",
    "Cambiar o reconectar el cable"
   ],
   [
    "Programa de EOL (candado por script de revisión de sensor)",
    "Pruebas modifica el programa"
   ],
   [
    "Monos probadas sin dogbone",
    "Probar monos a nivel dogbone con sus 3 tornillos y después retirarlos"
   ],
   [
    "Step de calibración administrado por el funcional no se refleja",
    "Restablecer con el funcional y recalibrar"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-08-18 a 2026-10-06"
  ]
 },
 {
  "id": "horno-hornos-curado-post-kasalis-dogbone",
  "linea": "horno",
  "maquina": "Hornos (curado post-Kasalis, dogbone, housing, lente)",
  "titulo": "Hornos (curado post-Kasalis, dogbone, housing, lente)",
  "corto": "App del horno se traba",
  "sintoma": "App del horno se traba; tiempo en 1 min y temperaturas incorrectas; horno no conecta con la PC; proceso abortado por temperatura; ASSELEC no baja temperatura; housing sin proceso entra al horno.",
  "flujo": [
   {
    "p": "Verificar que esté abierto el shortcut/app correcto del modelo"
   },
   {
    "p": "Revisar receta, tiempo y temperatura antes de iniciar"
   },
   {
    "p": "Meter carga completa e identificada"
   },
   {
    "p": "Al salir esperar enfriamiento (~20 min) y luego retest"
   },
   {
    "p": "Ver el proceso",
    "proc": "horno-housing"
   },
   {
    "p": "Cargas y tiempos",
    "proc": "horno-cargas"
   }
  ],
  "causas": [
   [
    "App del horno trabada",
    "Cerrar y volver a abrir la aplicación"
   ],
   [
    "Abierta una aplicación/shortcut de otro modelo (ej. Moose en el horno de dogbone)",
    "Cerrar la app incorrecta y abrir el shortcut correcto del horno; eliminar el duplicado"
   ],
   [
    "Receta del horno incorrecta",
    "Seleccionar la receta del modelo antes de meter la carga"
   ],
   [
    "Horno apagado físicamente tras apagado general ('no configurado para leer y escribir comando')",
    "Encender el horno desde su display y reiniciar la app"
   ],
   [
    "Temperatura inestable del horno ASSELEC",
    "Esperar estabilización; escalar a ME si no baja"
   ],
   [
    "Horno de housing sin checkpoint de proceso ASSELEC",
    "Detener y agregar validación de proceso"
   ],
   [
    "Tablilla con conector dañado al caerse al sacar las charolas",
    "Mejorar la charola para fijar las piezas; manipular con cuidado"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente.}}",
   "Visto en chats: 2026-07-09 a 2026-09-30"
  ]
 },
 {
  "id": "general-dispensador-de-desecante",
  "linea": "general",
  "maquina": "Dispensador de desecante",
  "titulo": "Dispensador de desecante",
  "corto": "No deja recargar desecante (indica que aún tiene) o no funciona tras mudanza de cuarto.",
  "sintoma": "No deja recargar desecante (indica que aún tiene) o no funciona tras mudanza de cuarto.",
  "flujo": [
   {
    "p": "Sensor de nivel desajustado",
    "d": "Ajustar el sensor"
   },
   {
    "p": "Cables desconectados al mover el equipo",
    "d": "Identificar y reconectar cables (mandar foto); mientras tanto, cortar manual"
   }
  ],
  "causas": [
   [
    "Sensor de nivel desajustado",
    "Ajustar el sensor"
   ],
   [
    "Cables desconectados al mover el equipo",
    "Identificar y reconectar cables (mandar foto); mientras tanto, cortar manual"
   ]
  ],
  "tips": [
   "Frecuencia: {{Esporádico.}}",
   "Visto en chats: 2026-07-13 a 2026-08-24"
  ]
 },
 {
  "id": "scorpion-dogbone-estacion-vision-y-recet",
  "linea": "scorpion",
  "maquina": "Dogbone (estación, visión y receta)",
  "titulo": "Dogbone (estación, visión y receta)",
  "corto": "Falla la visión al colocar la cámara derecha",
  "sintoma": "Falla la visión al colocar la cámara derecha; programa pide girar el nido pero marca 'nido fuera de posición'; checkpoint truena con nuevo número de parte; zoom movido.",
  "flujo": [
   {
    "p": "Cuadro de búsqueda desajustado",
    "d": "Mover/ajustar el cuadro de búsqueda"
   },
   {
    "p": "No se cargó el programa del modelo (ej. 133.4)",
    "d": "Cargar el programa correspondiente al modelo"
   },
   {
    "p": "Falso en conector rápido del sensor de posición del nido",
    "d": "Revisar y reasentar el conector rápido"
   },
   {
    "p": "Nuevo ensamble/número de parte requiere otro checkpoint (variable de serial monocular izquierdo); material progresado a final para empaque en vez de dogbone",
    "d": "Crear receta desde cero con datos de MES; Calidad muta el material a la progresión correcta; plan B ligar manual"
   },
   {
    "p": "Fórmula de validación de serial no aceptaba H/V",
    "d": "Modificar la validación para aceptar H y V"
   },
   {
    "p": "Placas de fixtura de 100 mm rotuladas al revés (horizontal/vertical)",
    "d": "Guiarse por la información de MES o el dibujo, no por la etiqueta de la fixtura"
   },
   {
    "p": "Ver el proceso",
    "proc": "receta-dogbone"
   }
  ],
  "causas": [
   [
    "Cuadro de búsqueda desajustado",
    "Mover/ajustar el cuadro de búsqueda"
   ],
   [
    "No se cargó el programa del modelo (ej. 133.4)",
    "Cargar el programa correspondiente al modelo"
   ],
   [
    "Falso en conector rápido del sensor de posición del nido",
    "Revisar y reasentar el conector rápido"
   ],
   [
    "Nuevo ensamble/número de parte requiere otro checkpoint (variable de serial monocular izquierdo); material progresado a final para empaque en vez de dogbone",
    "Crear receta desde cero con datos de MES; Calidad muta el material a la progresión correcta; plan B ligar manual"
   ],
   [
    "Fórmula de validación de serial no aceptaba H/V",
    "Modificar la validación para aceptar H y V"
   ],
   [
    "Placas de fixtura de 100 mm rotuladas al revés (horizontal/vertical)",
    "Guiarse por la información de MES o el dibujo, no por la etiqueta de la fixtura"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-23 a 2026-10-04"
  ]
 },
 {
  "id": "general-estaciones-elk-final-front",
  "linea": "general",
  "maquina": "Estaciones ELK (Final/Front)",
  "titulo": "Estaciones ELK (Final/Front)",
  "corto": "Sensor de posición de atornillado no detecta",
  "sintoma": "Sensor de posición de atornillado no detecta; fixtura dura en el riel; piezas golpeadas por un tornillo; riel bloqueado; falla de red.",
  "flujo": [
   {
    "p": "Sensor de posición/clamp desajustado",
    "d": "Ajustar sensor y reiniciar programa trabado"
   },
   {
    "p": "Guías lineales secas / mesa con movimiento",
    "d": "Pasar trapo con WD-40 por las guías lineales"
   },
   {
    "p": "Buje golpea la pieza",
    "d": "Girar el buje"
   },
   {
    "p": "Tornillo inferior del riel aflojado",
    "d": "Reapretar (espacio reducido)"
   },
   {
    "p": "Cable ethernet movido por el movimiento de la estación",
    "d": "Reacomodar y asegurar el ethernet"
   },
   {
    "p": "Retest no actualizado (6%) para el modelo",
    "d": "Actualizar el decremento de retest para todos los modelos"
   }
  ],
  "causas": [
   [
    "Sensor de posición/clamp desajustado",
    "Ajustar sensor y reiniciar programa trabado"
   ],
   [
    "Guías lineales secas / mesa con movimiento",
    "Pasar trapo con WD-40 por las guías lineales"
   ],
   [
    "Buje golpea la pieza",
    "Girar el buje"
   ],
   [
    "Tornillo inferior del riel aflojado",
    "Reapretar (espacio reducido)"
   ],
   [
    "Cable ethernet movido por el movimiento de la estación",
    "Reacomodar y asegurar el ethernet"
   ],
   [
    "Retest no actualizado (6%) para el modelo",
    "Actualizar el decremento de retest para todos los modelos"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-17 a 2026-10-01"
  ]
 },
 {
  "id": "gecko-celda-gecko-st-03-04-leds-final-mo",
  "linea": "gecko",
  "maquina": "Celda Gecko (St 03/04, Leds, Final, Moisture, Lens adapter)",
  "titulo": "Celda Gecko (St 03/04, Leds, Final, Moisture, Lens adapter)",
  "corto": "Tornillos elevados/capados",
  "sintoma": "Tornillos elevados/capados; visión falla tras retirar tornillo; Final Gecko con Acura que se cierra cada ~2 piezas; Leds sale de secuencia tras reintento; torques con calibración vencida.",
  "flujo": [
   {
    "p": "Barreno del housing malo",
    "d": "Separar housing y desligar sensor/serializer para volver a pasar"
   },
   {
    "p": "Leds: al fallar atornillado y reintentar, la visión sale de secuencia e inspecciona con otro programa",
    "d": "Debug de la secuencia de reintento"
   },
   {
    "p": "Leds: visión del conector del serializer por comunicación con la cámara",
    "d": "Volver a abrir el Acura"
   },
   {
    "p": "Final Gecko: interacción con servidor/dominio fuera de try cierra la app",
    "d": "Correr desde el código para ver la línea; revisar campos MES (serial vacío); verificar licencia; reiniciar"
   },
   {
    "p": "Moisture: etiqueta mal puesta",
    "d": "Recolocar etiqueta"
   },
   {
    "p": "Torques 5, 6 y 7 con calibración vencida",
    "d": "Calibrar o correr con desviación firmada (se puede armar pero no embarcar sin desviación)"
   },
   {
    "p": "Alarma típica de Gecko al inicializar",
    "d": "Presionar reset (se puede desactivar)"
   },
   {
    "p": "St 04 sin opción de skip",
    "d": "Agregar opción de skip en debug"
   }
  ],
  "causas": [
   [
    "Barreno del housing malo",
    "Separar housing y desligar sensor/serializer para volver a pasar"
   ],
   [
    "Leds: al fallar atornillado y reintentar, la visión sale de secuencia e inspecciona con otro programa",
    "Debug de la secuencia de reintento"
   ],
   [
    "Leds: visión del conector del serializer por comunicación con la cámara",
    "Volver a abrir el Acura"
   ],
   [
    "Final Gecko: interacción con servidor/dominio fuera de try cierra la app",
    "Correr desde el código para ver la línea; revisar campos MES (serial vacío); verificar licencia; reiniciar"
   ],
   [
    "Moisture: etiqueta mal puesta",
    "Recolocar etiqueta"
   ],
   [
    "Torques 5, 6 y 7 con calibración vencida",
    "Calibrar o correr con desviación firmada (se puede armar pero no embarcar sin desviación)"
   ],
   [
    "Alarma típica de Gecko al inicializar",
    "Presionar reset (se puede desactivar)"
   ],
   [
    "St 04 sin opción de skip",
    "Agregar opción de skip en debug"
   ]
  ],
  "tips": [
   "Frecuencia: {{En cada corrida de Gecko.}}",
   "Visto en chats: 2026-07-28 a 2026-09-24"
  ]
 },
 {
  "id": "moose-final-assy-software-app",
  "linea": "moose",
  "maquina": "Final Assy (software/app)",
  "titulo": "Final Assy (software/app)",
  "corto": "App de final congelada",
  "sintoma": "App de final congelada; error de vacío y de paro de emergencia; estaciones reportan en MES la misma hora de inicio y fin.",
  "flujo": [
   {
    "p": "Errores retenidos en la PC",
    "d": "Reiniciar la PC"
   },
   {
    "p": "App de atornillado trabada",
    "d": "Cerrar y abrir la app"
   },
   {
    "p": "Registro de tiempos en MES",
    "d": "Revisar el reporte de hora inicio/fin con MES"
   }
  ],
  "causas": [
   [
    "Errores retenidos en la PC",
    "Reiniciar la PC"
   ],
   [
    "App de atornillado trabada",
    "Cerrar y abrir la app"
   ],
   [
    "Registro de tiempos en MES",
    "Revisar el reporte de hora inicio/fin con MES"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-07-30 a 2026-09-18"
  ]
 },
 {
  "id": "general-plasma-lavado-de-lens-adapter-is",
  "linea": "general",
  "maquina": "Plasma / lavado de Lens Adapter (ISO5)",
  "titulo": "Plasma / lavado de Lens Adapter (ISO5)",
  "corto": "Lens adapter sin step de plasma en sistema",
  "sintoma": "Lens adapter sin step de plasma en sistema; charolas validadas sin historial; lentes despegados (DELO queda en el lente, lens adapter limpio); plasma vencido.",
  "flujo": [
   {
    "p": "No se cerró el ciclo en la app de plasma (no permite dar OK)",
    "d": "Cerrar el ciclo/dar OK en la app de plasma"
   },
   {
    "p": "Error del servidor de la app de plasma",
    "d": "Esperar restablecimiento del servidor y reintentar"
   },
   {
    "p": "Charola puesta boca abajo / no plasmeada",
    "d": "Volver a plasmear la charola"
   },
   {
    "p": "Plasma deficiente (despegue)",
    "d": "Validar charolas con dyne pen, push test de muestras, bloquear embarque hasta liberación"
   },
   {
    "p": "Plasma vencido",
    "d": "Lavar y replasmear según proceso definido; respetar horarios de plasma"
   }
  ],
  "causas": [
   [
    "No se cerró el ciclo en la app de plasma (no permite dar OK)",
    "Cerrar el ciclo/dar OK en la app de plasma"
   ],
   [
    "Error del servidor de la app de plasma",
    "Esperar restablecimiento del servidor y reintentar"
   ],
   [
    "Charola puesta boca abajo / no plasmeada",
    "Volver a plasmear la charola"
   ],
   [
    "Plasma deficiente (despegue)",
    "Validar charolas con dyne pen, push test de muestras, bloquear embarque hasta liberación"
   ],
   [
    "Plasma vencido",
    "Lavar y replasmear según proceso definido; respetar horarios de plasma"
   ]
  ],
  "tips": [
   "Frecuencia: {{Recurrente.}}",
   "Visto en chats: 2026-08-18 a 2026-10-08"
  ]
 },
 {
  "id": "general-asselec-dispensado-horneado-fron",
  "linea": "general",
  "maquina": "ASSELEC (dispensado/horneado front window)",
  "titulo": "ASSELEC (dispensado/horneado front window)",
  "corto": "Dispensado incompleto (falta glue)",
  "sintoma": "Dispensado incompleto (falta glue); dispensando mal; fugas por cristal en leak test; el glue expira si no se consume.",
  "flujo": [
   {
    "p": "Dispensado sin validar tras setup largo",
    "d": "Revisar pieza por pieza que no falte glue; liberar con pesos y altura de dispensado"
   },
   {
    "p": "Piezas no curadas el día que se dispensaron",
    "d": "Verificar curado por serial antes de ensamble"
   },
   {
    "p": "Glue (2 tubos) por expirar en fin de semana",
    "d": "Correr full para consumirlo"
   },
   {
    "p": "DELO del equipo no identificado",
    "d": "El número de DELO está en el check list de la ASSELEC"
   }
  ],
  "causas": [
   [
    "Dispensado sin validar tras setup largo",
    "Revisar pieza por pieza que no falte glue; liberar con pesos y altura de dispensado"
   ],
   [
    "Piezas no curadas el día que se dispensaron",
    "Verificar curado por serial antes de ensamble"
   ],
   [
    "Glue (2 tubos) por expirar en fin de semana",
    "Correr full para consumirlo"
   ],
   [
    "DELO del equipo no identificado",
    "El número de DELO está en el check list de la ASSELEC"
   ]
  ],
  "tips": [
   "Frecuencia: {{Ocasional.}}",
   "Visto en chats: 2026-08-20 a 2026-09-21"
  ]
 },
 {
  "id": "general-cuarto-limpio-temperatura-humeda",
  "linea": "general",
  "maquina": "Cuarto limpio (temperatura, humedad, partículas)",
  "titulo": "Cuarto limpio (temperatura, humedad, partículas)",
  "corto": "Paro por temperatura o humedad fuera de rango, goteras, alarma de condensación, liberación…",
  "sintoma": "Paro por temperatura o humedad fuera de rango, goteras, alarma de condensación, liberación tardía por partículas.",
  "flujo": [
   {
    "p": "Climatización fuera de parámetros (rango: 18-25 °C, 40-60% HR)",
    "d": "Escalar a Facilities/climas; enviar fotos de lecturas cada 15 min"
   },
   {
    "p": "Medidor equivocado",
    "d": "Usar el medidor blanco (el azul es obsoleto/no calibrado)"
   },
   {
    "p": "Gotera en el cuarto",
    "d": "Desconectar y cubrir equipos con plástico; segregar material mojado a MRB; esperar estabilización y medir partículas"
   },
   {
    "p": "Liberación de partículas tardía (un solo medidor)",
    "d": "Programar soporte de Calidad antes del arranque"
   }
  ],
  "causas": [
   [
    "Climatización fuera de parámetros (rango: 18-25 °C, 40-60% HR)",
    "Escalar a Facilities/climas; enviar fotos de lecturas cada 15 min"
   ],
   [
    "Medidor equivocado",
    "Usar el medidor blanco (el azul es obsoleto/no calibrado)"
   ],
   [
    "Gotera en el cuarto",
    "Desconectar y cubrir equipos con plástico; segregar material mojado a MRB; esperar estabilización y medir partículas"
   ],
   [
    "Liberación de partículas tardía (un solo medidor)",
    "Programar soporte de Calidad antes del arranque"
   ]
  ],
  "tips": [
   "Frecuencia: {{Frecuente en temporada de lluvia.}}",
   "Visto en chats: 2026-08-11 a 2026-09-10"
  ]
 },
 {
  "id": "general-router-depanelizado-de-pcb",
  "linea": "general",
  "maquina": "Router (depanelizado de PCB)",
  "titulo": "Router (depanelizado de PCB)",
  "corto": "Tablillas con cobre expuesto tras el corte",
  "sintoma": "Tablillas con cobre expuesto tras el corte; scrap.",
  "flujo": [
   {
    "p": "Pallet/plato de router no sujeta la PCB",
    "d": "Contención: poner dots en la tablilla y validar cada hora; acción sistémica pendiente con ME"
   }
  ],
  "causas": [
   [
    "Pallet/plato de router no sujeta la PCB",
    "Contención: poner dots en la tablilla y validar cada hora; acción sistémica pendiente con ME"
   ]
  ],
  "tips": [
   "Frecuencia: 4 eventos en el mes.",
   "Visto en chats: 2026-10-08 a 2026-10-10"
  ]
 }
];

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
    sabemos:['{{Confirmar en pantalla que quedaron los valores de la hoja antes de cargar piezas.}}'],
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
    sabemos:['El DELO se ambienta 1.5 h antes de usarlo (el de MRO llega congelado).','Si cambia de cuarto: 30 min de refri y luego ambientar.','Registrar cada DELO en la base de datos; la caducidad corre desde que se abre.','{{No reusar envases.}}'],
    necesito:['Fotos del dispensador de cada estación (dónde está el opresor y la válvula de aire)'],
  },
  'cambio-fixtura': {
    titulo:'Cambio de fixtura', linea:'general', lineas:['gecko','moose','scorpion'], maquina:'Estaciones', permisos:'Técnico',
    cuando:'Cambio de modelo{{ o fixtura dañada}}.',
    pasos:[], sabemos:[], necesito:['Pasos y fotos del cambio de fixtura por estación'],
  },
  "receta-dogbone": {"titulo": "Cambio de receta / nuevo número de parte en Dogbone", "linea": "scorpion", "maquina": "Dogbone", "permisos": "Técnico", "cuando": "Nuevo número de parte o cambio de receta en Dogbone.", "pasos": [{"texto": "Confirmar con Producción y Calidad el modelo y PFA a correr (revisar en MES, no por el nombre de la fixtura)"}, {"texto": "Buscar en el apartado de MES de las recetas la que corresponde al PFA del campo 'camera s/n'"}, {"texto": "Si no existe, crear la receta con los campos que pase Calidad/MES (incluido el número de etiqueta en el apartado de impresión/pruebas)"}, {"texto": "Ajustar visiones y flujo para el nuevo modelo"}, {"texto": "Imprimir una etiqueta de prueba y verificar el PFA impreso; que Calidad la libere"}, {"texto": "Si truena el checkpoint de ligado, revisar la variable del serial de la cámara y que el material tenga la progresión correcta (Calidad muta)"}, {"texto": "No dejar el checkpoint bypasseado: reactivarlo al terminar"}], "sabemos": ["Las placas de fixtura de 100 mm horizontal/vertical están invertidas", "Plan B: ligado manual por Calidad"], "necesito": ["Fotos de cada paso"]},
  "receta-lens-adapter": {"titulo": "Cambio de fixtura y receta en Lens Adapter", "linea": "general", "maquina": "Lens adapter", "permisos": "Técnico", "cuando": "Cambio de modelo en la estación de lens adapter.", "pasos": [{"texto": "Cambiar la fixtura del modelo en la estación de Lens Adapter"}, {"texto": "Seleccionar la receta correcta del modelo"}, {"texto": "Al cambiar revisión de lens adapter (ej. Rev A→B), cerrar y abrir la app (también en ISO5) para que tome el cambio"}, {"texto": "Validar con primera pieza el ligado y la progresión"}], "sabemos": ["No mezclar revisiones de lens adapter; la nueva revisión requiere alta previa en MES (BOM)", "Lens adapter de Scorpion no se liga"], "necesito": ["Fotos de cada paso"]},
  "contencion-leak": {"titulo": "Contención por fallas de fuga en Leak Test", "linea": "general", "maquina": "Leak test", "permisos": "Técnico", "cuando": "Fallas de fuga seguidas (regla 3-5-10).", "pasos": [{"texto": "Detener por regla 3-5-10; abrir Andon y QRQC"}, {"texto": "Diagnosticar en ≤15 min la primera pieza"}, {"texto": "Validar el equipo: leak test limpio y pasar golden good y bad (Pruebas)"}, {"texto": "Verificar que los torques funcionen correctamente (Automatización)"}, {"texto": "Auditar que el método de ensamble sea el documentado (Manufactura/Calidad)"}, {"texto": "Calidad pesa y segrega O-ring {{(>0.38 g)}} y valida front/back housing"}, {"texto": "Reanudar con validación de 20 piezas y luego batches de 10 con pantallazo de yield"}], "sabemos": ["Falla por O-ring suele dar delta P <50; fuga gruesa suele ser cristal", "No acumular material sin diagnóstico"], "necesito": ["Fotos de cada paso"]},
  "limites-atornillado": {"titulo": "Ajuste de límites de atornillado en Final", "linea": "moose", "maquina": "Final Assy", "permisos": "Técnico", "cuando": "Tornillos elevados que pasan o buenos que fallan por ángulo.", "pasos": [{"texto": "Abrir en el controlador el programa activo (el primero, en azul)"}, {"texto": "Ir a la última etapa (etapa 3 / apriete final)"}, {"texto": "Revisar límites de ángulo y el mensaje de falla (flecha a la izquierda)"}, {"texto": "Comparar el ángulo de una pieza buena vs una fallada"}, {"texto": "Ajustar velocidad o ángulo mínimo de forma controlada e informar a Calidad"}, {"texto": "Validar con housing nuevo; para housing reutilizado usar su programa"}], "sabemos": ["Bajar demasiado el ángulo puede dejar pasar elevados"], "necesito": ["Fotos de cada paso"]},
  "apagado-encendido": {"titulo": "Apagado y encendido de equipos (corte eléctrico / fin de semana)", "linea": "general", "maquina": "Todas", "permisos": "Técnico", "cuando": "Corte eléctrico o fin de semana.", "pasos": [{"texto": "Apagar primero las computadoras"}, {"texto": "Apagar el switch principal (main switch) de cada máquina y gabinete"}, {"texto": "Incluir hornos, refrigeradores, impresora 3D y equipos fuera del cuarto limpio; desconectar si se requiere"}, {"texto": "No dejar material productivo dentro del cuarto limpio"}, {"texto": "Al encender: prender gabinetes y máquinas, luego PCs; encender el horno desde su display y abrir su app"}, {"texto": "Iniciar sesión con credenciales; si una app se traba usar el administrador de tareas (Ctrl+Shift+Esc) para cerrarla"}, {"texto": "Liberar partículas, temperatura y humedad antes de arrancar"}, {"texto": "Validar primera pieza con Calidad; Pruebas enciende Leak Test/EOL y retira candados"}], "sabemos": ["Arrancar en batches pequeños (5-10 piezas) tras un paro largo"], "necesito": ["Fotos de cada paso"]},
  "horno-cargas": {"titulo": "Cargas y tiempos del horno de curado (post-Kasalis)", "linea": "horno", "maquina": "Horno", "permisos": "Técnico", "cuando": "Curado después de la Kasalis.", "pasos": [{"texto": "Abrir el shortcut/app del horno correspondiente al modelo"}, {"texto": "Meter cargas completas (estándar 30 piezas; Moose se llegó a definir en 60 o lo construido en 2 horas)"}, {"texto": "Registrar hora de entrada; el ciclo dura aprox. 1.5-2 h (varía ~8 min)"}, {"texto": "Al salir, dejar enfriar ~20 min"}, {"texto": "Dar retest en Kasalis y entregar a Front"}], "sabemos": ["Evitar cargas parciales salvo orden de Producción", "Contemplar horno + enfriamiento + retest en la planeación de material"], "necesito": ["Fotos de cada paso"]},
  "andones": {"titulo": "Cierre y reporte de Andones", "linea": "general", "maquina": "Todas", "permisos": "Técnico", "cuando": "Al cerrar un andon.", "pasos": [{"texto": "Reportar en el grupo cada Andon cerrado con formato: Línea / Estación / Descripción / causa / tiempo"}, {"texto": "Cerrar el Andon solo cuando se conozca la causa raíz y corresponda a Auto"}, {"texto": "No cerrar Andones por falta de material, material defectuoso, MES o Calidad: redireccionar"}, {"texto": "Por incumplimiento de rate, cerrar por hora y proporcional (~2 min por unidad faltante)"}, {"texto": "Registrar paros y microparos en la app de paros de línea"}], "sabemos": ["Se auditan semanalmente"], "necesito": ["Fotos de cada paso"]},
};
