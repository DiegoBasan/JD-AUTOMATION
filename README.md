# JD-AUTOMATION

**Simulador 3D isométrico del flujo de ensamble** (`index.html`, servido por GitHub Pages).

- Layout real (`layout moose scorpion gecko.png`): Moose, Scorpion, Gecko, celda Kasalis (Pixid 500-S) + horno + refri, Fisnar / Gecko Dispensing, plasma, EOLs.
- Flujos por producto según *NPI Product Data* y *FLUJOS_COMPLETOS_CONTEXTO*: ruta principal (sensor) y rutas paralelas (housing/ventana, back assy) que convergen.
- Animación interna de la Kasalis (mesa rotatoria Load → Dispense → Align → Spare) en BUILD y RETEST, con los parámetros del archivo de dispense.
- Simulación de fallas (242, 233, 108, 131, 155, 161, tornillos elevados, leak, EOL): la pieza se manda a su caja de *Fallas* y se muestra qué revisar.
- Buscador de códigos Kasalis (PLC KSmessage 001–1152 y KSvision negativos) con guías de troubleshooting.
- Clic en cualquier estación: PC, software (ACURA/ARMI/KASALIS), en qué pasos se usa y qué revisar.

Estaciones marcadas con `*` no aparecen en el plano y su ubicación es aproximada.
