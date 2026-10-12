/* Buscador de fallas Kasalis — junta todo lo relacionado a un código o palabra */
import {CODES, HINTS} from '../shared/kasalis.js';
import {DOCS} from './data/docs.js';
import {NOTAS, PROCEDIMIENTOS, FRECUENCIA, FRECUENCIA_FUENTE} from './data/notas.js';

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PLC = new Map(CODES.plc.map(r=>[r[0], {code:r[0], name:r[1], group:r[2]}]));
const KSV = new Map(); CODES.ksv.forEach(r=>{ if(!KSV.has(r[0])) KSV.set(r[0], {code:r[0], name:r[1], group:r[2], comment:r[3]}); });
const PROCESS = {screws:'Tornillos elevados (Final Assy)', leak:'Leak test FAIL', eol:'EOL FAIL'};

/* ---------- traducción de nombres de código ---------- */
const WORDS = {
  ALIGN:'alineación', ALIGN2:'alineación 2', DISP:'dispensado', ROTARY:'mesa rotatoria', TARGET:'target', SPARE:'estación spare', ROBOT:'robot', ENCLO:'gabinete',
  FT:'prueba final', PEAK:'en el pico de foco', EXTRA:'extra', EXTRA2:'extra 2', CURE:'durante curado UV', POSTCURE:'después del curado UV', UNGRIP:'al soltar el lente', RETEST:'en RETEST (post-horno)',
  MTF:'MTF', CTR:'centro óptico', SYM:'simetría', FC:'esquinas (field corners)', UT:'uniformidad / tilt', OTHER:'otra prueba', NOISE:'ruido', SAT:'saturación', DZ:'delta Z',
  GENERAL:'general', ERROR:'error', CAM:'cámara', OPEN:'abrir', CLOSE:'cerrar', DETECT:'detectar', LENS:'lente', GRIP:'gripper', PREFOCUS:'prefocus', REPEAT:'repetibilidad',
  TEST:'prueba', FAIL:'falla', CENTER:'centrado', SCAN:'barrido de foco', CLEAR:'limpiar', DEL:'borrar', FRAMES:'frames', Z:'Z', NOT:'no', MOVED:'se movió', PICKPOS:'posición de pick',
  INVALID:'inválida', HOME:'home', TIMEOUT:'tiempo excedido', GRAB:'capturar', VISIMG:'imagen de visión', PAT:'patrón de visión', LOAD:'cargar', SEARCH:'búsqueda', SAVE:'guardar',
  RESULTS:'resultados', INSP:'inspección', MAX:'máximo', ITER:'iteraciones', FOCAL:'focal', PLANE:'plano', NUM:'número', TEACH:'enseñar', CLOSED:'cerrado', POS:'posición', UVMEASURE:'medición UV',
  UPCAL:'calibración superior', DOWNCAL:'calibración inferior', ARRAY:'arreglo', PARS:'parámetros', INVAL:'inválidos', TZ:'θZ', TIME:'tiempo', HDOWN:'hold-down', CLAMP:'clamp',
  NO:'sin', UV:'UV', STEPS:'pasos', SAFETY:'seguridad', TGTZ:'Z del target', FORCE:'fuerza', REACH:'alcanzada', GAP:'gap', CAL:'calibración', FAILED:'falló', OFFSET:'offset',
  FINAL:'final', TRYS:'intentos', GET:'obtener', PICK:'pick', VACUUM:'vacío', ON:'encender', OFF:'apagar', STAB:'estabilidad', TF:'tip find', X:'X', Y:'Y', ACTIVE:'activo', BROKEN:'roto',
  FIND:'encontrar', LEFT:'izquierdo', RIGHT:'derecho', FID:'fiducial', SEQ:'secuencia', STEP:'paso', UNK:'desconocido', CYCLIC:'cíclico', MOVE:'movimiento', TIPFIND:'tip find', EXTEND:'extender', RETRACT:'retraer',
  HEAD1:'cabezal 1', HEAD2:'cabezal 2', DISPENSER:'dispensador', FAULT:'falla', POST:'post', FOCUS:'foco', LEVEL:'nivel de adhesivo', POTLIFE:'pot life (vida del adhesivo)', ST:'prueba de sensor',
  PART:'partículas', REG:'registro', PIXEL:'pixeles', DSTN:'distancia', DARK:'señal oscura', TIP:'punta', VIS:'visión', SENS:'sensor', TGT:'target', CUP:'copa de purga', VOL:'volumen', EXCEEDED:'excedido',
  BADPARAMS:'parámetros malos', USERTEST:'prueba de usuario', EXTLIB:'librería externa', LASER:'láser', AUTO:'auto', WEIGH:'pesado', DOME:'domo', LOWER:'bajar', RAISE:'subir', PRT:'partículas', OP:'operación',
  TOLERANCE:'tolerancia', DOT:'punto', PARAMS:'parámetros', BOTH:'ambos', PRESSURE:'presión', LOW:'baja', HIGH:'alta', PLACE:'colocación', LIN:'línea', ZERO:'cero', DLI:'DLI',
  LOCK:'bloqueo', ACCESS:'acceso', DOOR:'puerta', STN:'estación', UP:'arriba', MOTION:'movimiento', IN:'en', ALN:'alineación', DSP:'dispensado', DISABLED:'deshabilitada', NODEVICE:'sin dispositivo',
  PUSHER:'pusher', VAC:'vacío', DETECTED:'detectado', PREPICK:'pre-pick', NA:'n/a', SAFE:'seguro', POGOS:'pogo pins', LIFT:'lift', AXIS:'eje', FXT:'fixture', TBL:'mesa', COUNTR:'contrapeso',
  CYL:'cilindro', RETR:'retraer', EXT:'extender', CAMERA:'cámara', PROBE:'probe', GS:'golden sample', LCOS:'LCOS', DOMELIGHT:'luz de domo', ENABLED:'habilitada', LC:'LC', DURING:'durante', EXTERNAL:'externo',
  INVALID_POSITION:'posición inválida', ESTOP:'paro de emergencia', MAIN:'principal', AIR:'aire', MES:'MES', SEND:'enviar', DEVICE:'dispositivo', DATA:'datos', WAIT:'esperar', NEW:'nuevo', VALIDATION:'validación',
  CFG:'configuración', CONFIG:'configuración', IPC:'comunicación IPC', CONNECT:'conectar', LOST:'perdida', RESP:'respuesta', MP:'MasterProcess', WRITE:'escribir', INIT:'inicializar', PROCESSING:'proceso', ABORTED:'abortado',
  BACKLASH:'backlash', VPP:'VPP', EOT:'fin de carrera', LIVE:'live', VIEW:'vista', ENABLE:'habilitar', DISABLE:'deshabilitar', TONGUE:'lengüeta', MOTION_LIMIT:'límite de movimiento', LIMIT:'límite', SDCAL:'calibración SD',
};
function translate(name){ return name.split('_').map(t=>WORDS[t]||t.toLowerCase()).join(' '); }

/* ---------- dónde ocurre en la Kasalis ---------- */
function where(code, name){
  const n = name||''; let st = 'General / sistema';
  if(code>=101&&code<=199 || code>=1101&&code<=1199) st='Estación de ALINEACIÓN (+UV)';
  else if(code>=201&&code<=299) st='Estación de DISPENSADO';
  else if(code>=301&&code<=399) st='Gabinete / puertas';
  else if(code>=401&&code<=499) st='Mesa rotatoria';
  else if(code>=501&&code<=599) st='Módulo de target';
  else if(code>=601&&code<=699) st='Estación SPARE';
  else if(code>=701&&code<=799) st='Alineación 2';
  else if(code>=801&&code<=899) st='Robot';
  else if(code>=901&&code<=1099) st='Estaciones de prueba';
  else if(code>=31&&code<=99) st='Software / configuración / comunicación';
  let ph = 'BUILD y RETEST';
  if(/RETEST/.test(n)) ph='RETEST (prueba final después del horno)';
  else if(/UNGRIP/.test(n)) ph='BUILD · al soltar el lente (antes del horno)';
  else if(/POSTCURE|_CURE|UVCURE|UVMEASURE|NO_UV/.test(n)) ph='BUILD · curado UV';
  else if(/PEAK|SCAN|PREFOCUS|CENTER|GRDCTR|FOCAL/.test(n)) ph='BUILD · búsqueda de alineación';
  else if(/^DISP|ST_PART|ST_PIXEL|ST_DARK|ST_NOISE/.test(n)) ph='BUILD · dispensado / pruebas de sensor';
  else if(/GRIP|PICK|LENS/.test(n)) ph='BUILD · pick del lente';
  return {st, ph};
}

/* ---------- términos de búsqueda en documentos ---------- */
const TERMS = {PREFOCUS:['prefocus'],MTF:['MTF'],UV:['UV cure','UV'],UVMEASURE:['UV'],CURE:['cure'],GRIP:['gripper','grip'],CAM:['camera'],PAT:['pattern'],POTLIFE:['pot life','PotLife'],LEVEL:['Volume','volume'],
  PART:['particle'],PRT:['particle'],DARK:['dark signal'],NOISE:['noise'],PIXEL:['pixel'],TF:['tipfind','tip find'],TIPFIND:['tipfind'],CAL:['calibration'],HOME:['home'],VAC:['vacuum'],VACUUM:['vacuum'],
  POGOS:['pogo'],ROTARY:['rotary'],TARGET:['target'],CENTER:['center','centration'],CTR:['center'],SCAN:['scan','focus'],ESTOP:['emergency'],AIR:['air'],MES:['MES'],DOME:['dome'],LENS:['lens'],
  CLAMP:['clamp'],BACKLASH:['backlash'],VPP:['VPP','AlignVPPOffsetZ'],LASER:['laser'],DISPENSER:['dispense'],DISP:['dispense'],VIS:['post dispense','post-dispense'],INSP:['inspection'],SAFE:['safety'],
  RETEST:['retest','final test'],UNGRIP:['ungrip'],PEAK:['peak'],SYM:['symmetry'],FC:['corner'],TIP:['tip'],FID:['fiducial'],PRESSURE:['pressure'],WEIGH:['weigh'],DOOR:['door'],LIMIT:['limit switch'],PICK:['pick'],FOCUS:['focus'],SAT:['saturat'],PICKPOS:['pick position'],TEACH:['teach']};
const GENERIC = new Set(['ALIGN','DISP','FT','GENERAL','ERROR','FAIL','NOT','TEST','INVALID','OPEN','CLOSE','SAVE','RESULTS','MAX','ITER','OTHER','NO','ON','OFF','X','Y','Z','STN','ST','SEARCH','LOAD','GET','POS','IN','UP','EXTEND','RETRACT','TIMEOUT']);
function termsFor(name){
  const t = new Set();
  for(const tok of name.split('_')){ if(TERMS[tok]) TERMS[tok].forEach(x=>t.add(x)); else if(!GENERIC.has(tok) && tok.length>=4) t.add(tok.toLowerCase()); }
  return [...t];
}
function searchDocs(terms, codeNum){
  const res = [];
  const reCode = codeNum!=null ? new RegExp('(?<![\\w-])'+String(codeNum).replace('-','\\-')+'(?![\\w])') : null;
  for(const d of DOCS) d.pages.forEach((txt,i)=>{
    const low = txt.toLowerCase(); let score=0, first=-1, hit=null;
    for(const term of terms){ const tl=term.toLowerCase(); let k=low.indexOf(tl), c=0; while(k>=0 && c<20){ c++; if(first<0||k<first){ first=k; hit=term; } k=low.indexOf(tl,k+tl.length); } score += c*(term.length>4?2:1); }
    if(reCode && d.id!=='manual'){ const m = txt.match(reCode); if(m){ score += 12; if(first<0||m.index<first){ first=m.index; hit=String(codeNum); } } }
    if(score>0 && (txt.match(/\.{8,}/g)||[]).length>4) score *= .25;   // páginas de índice
    if(score>0) res.push({d, i, score, first, hit});
  });
  res.sort((a,b)=>b.score-a.score);
  return res.slice(0,8);
}
function snippet(txt, pos, terms){
  const a = Math.max(0,pos-160), b = Math.min(txt.length,pos+260);
  let s = (a?'…':'')+txt.slice(a,b).replace(/\s+/g,' ')+(b<txt.length?'…':'');
  s = esc(s);
  for(const t of terms.sort((x,y)=>y.length-x.length)){ if(t.length<2) continue; s = s.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark>$1</mark>'); }
  return s;
}
function docLink(d,i){ const f = '../'+encodeURI(d.file).replace(/#/g,'%23'); return d.kind==='pdf' ? `${f}#page=${i+1}` : f; }

/* ---------- vista de un código ---------- */
function codeView(code, src){
  const c = src==='ksv' ? KSV.get(code) : PLC.get(code);
  const key = String(code);
  const tr = translate(c.name);
  const w = src==='ksv' ? {st:'KSvision (visión / cámara del dispositivo)', ph:'reportado por la librería de visión'} : where(code, c.name);
  const terms = termsFor(c.name);
  const docs = searchDocs(terms, src==='plc'?code:null);
  const notas = NOTAS.filter(n=>(n.codigos||[]).map(String).includes(key));
  const procs = PROCEDIMIENTOS.filter(p=>(p.codigos||[]).map(String).includes(key) || notas.some(n=>n.procedimiento===p.id));
  const freq = FRECUENCIA[key];
  const other = src==='plc' ? KSV.get(-code) : PLC.get(-code);
  // relacionados: mismo grupo y comparten tokens significativos
  const toks = new Set(c.name.split('_').filter(t=>!GENERIC.has(t)));
  const pool = src==='ksv' ? [...KSV.values()] : [...PLC.values()];
  const rel = pool.filter(x=>x.code!==code && x.group===c.group).map(x=>({x, s:x.name.split('_').filter(t=>toks.has(t)).length + (Math.abs(x.code-code)<=2?.5:0)})).filter(o=>o.s>=1).sort((a,b)=>b.s-a.s).slice(0,10);
  let h = `<div class="hero"><div class="tab">${src==='ksv'?'KSvision':'PLC Pixid'} · ${esc(c.group||'—')}</div>
    <div class="body"><div class="code">${code}</div><div><h2>${esc(c.name)}</h2><p>${esc(tr.charAt(0).toUpperCase()+tr.slice(1))}${c.comment?' — '+esc(c.comment):''}</p>
    <div class="meta"><span>${esc(w.st)}</span><span>${esc(w.ph)}</span>${freq?`<span>${freq}× en logs</span>`:''}<span>Fuente: ${src==='ksv'?'Error Extra Codes (KSerror.h)':'Error Codes (KSmessage)'}</span></div></div></div></div>`;
  h += `<div class="sec grid2">`;
  h += `<div class="card"><h4>Guía rápida</h4>${HINTS[key]?`<div class="hint">${esc(HINTS[key])}</div>`:`<div class="muted">Aún no hay guía específica para este código. ${terms.length?'Revisa las referencias del manual abajo.':''}</div>`}
        ${key==='161'||key==='155'||key==='108'?`<div class="note" style="margin-top:10px">El documento de flujos describía este código distinto a la tabla oficial de Kasalis. Aquí se usa la tabla oficial.</div>`:''}</div>`;
  h += `<div class="card"><h4>Tus notas</h4>${notas.length? notas.map(n=>`<div style="margin-bottom:10px"><b>${esc(n.titulo)}</b>${n.causa?`<div class="muted">Causa: ${esc(n.causa)}</div>`:''}<ul>${(n.acciones||[]).map(a=>`<li>${esc(a)}</li>`).join('')}</ul>${n.resultado?`<div class="faint">${esc(n.resultado)}</div>`:''}${n.autor?`<div class="faint">${esc(n.autor)} ${esc(n.fecha||'')}</div>`:''}</div>`).join('')
        : `<div class="empty">Todavía no hay notas para ${code}. Se agregan en <code>buscador-kasalis/data/notas.js</code> (qué hiciste, causa, resultado) y aparecen aquí automáticamente.</div>`}</div>`;
  h += `</div>`;
  if(procs.length) h += `<div class="sec"><h3>Procedimientos con fotos</h3>${procs.map(p=>`<div class="card" style="margin-bottom:10px"><h4>${esc(p.titulo)}</h4><div class="steps">${p.pasos.map((s,i)=>`<div class="st"><div class="n">${i+1}</div><div>${esc(s.texto)}${s.foto?`<img loading="lazy" src="${esc(s.foto)}" alt="Paso ${i+1}">`:''}</div></div>`).join('')}</div></div>`).join('')}</div>`;
  if(other) h += `<div class="sec"><div class="card"><h4>También existe ${other.code} en ${src==='plc'?'KSvision':'PLC'}</h4><div class="muted">${esc(other.name)} · ${esc(other.group||'')}</div><div class="rel" style="margin-top:8px"><button data-q="${other.code}" data-src="${src==='plc'?'ksv':'plc'}">Ver ${other.code}</button></div></div></div>`;
  h += `<div class="sec"><h3>En los documentos ${terms.length?'· busca: '+terms.map(esc).join(', '):''}</h3><div class="card">${docs.length? docs.map(r=>`<div class="doc"><div class="t"><span>${esc(r.d.title)} · ${r.d.kind==='pdf'?'pág. '+(r.i+1):'sección '+(r.i+1)}</span><a href="${docLink(r.d,r.i)}" target="_blank">Abrir ↗</a></div><div class="s">${snippet(r.d.pages[r.i], r.first, [...terms, String(code)])}</div></div>`).join('') : '<div class="muted">Sin coincidencias en el manual ni en los archivos.</div>'}</div></div>`;
  if(rel.length) h += `<div class="sec"><h3>Códigos relacionados</h3><div class="rel">${rel.map(o=>`<button data-q="${o.x.code}" data-src="${src}">${o.x.code} · ${esc(o.x.name)}</button>`).join('')}</div></div>`;
  return h;
}
function processView(key){
  return `<div class="hero"><div class="tab">Falla de proceso</div><div class="body"><div class="code" style="font-size:16px">${esc(key)}</div><div><h2>${esc(PROCESS[key])}</h2><p>No es código Kasalis: es una falla de estación posterior.</p></div></div></div>
    <div class="sec card"><h4>Guía rápida</h4><div class="hint">${esc(HINTS[key]||'')}</div></div>`;
}

/* ---------- búsqueda ---------- */
function run(qRaw, srcHint){
  const q = qRaw.trim(); location.hash = q ? encodeURIComponent(q)+(srcHint?'|'+srcHint:'') : '';
  if(!q){ $('out').innerHTML = home(); bind(); return; }
  if(PROCESS[q.toLowerCase()]){ $('out').innerHTML = processView(q.toLowerCase()); bind(); return; }
  const n = /^-?\d+$/.test(q) ? parseInt(q,10) : null;
  if(n!=null){
    if(srcHint==='ksv' && KSV.has(n)) return show(codeView(n,'ksv'));
    if(n>=0 && PLC.has(n)) return show(codeView(n,'plc'));
    if(KSV.has(n)) return show(codeView(n,'ksv'));
    if(KSV.has(-n)) return show(codeView(-n,'ksv'));
  }
  // texto libre: códigos que coinciden + documentos
  const ql = q.toLowerCase(), qu = q.toUpperCase().replace(/\s+/g,'_');
  const hits = [];
  for(const c of PLC.values()) if(c.name.includes(qu) || translate(c.name).includes(ql) || (HINTS[c.code]||'').toLowerCase().includes(ql)) hits.push({...c,src:'plc'});
  for(const c of KSV.values()) if(c.name.includes(qu) || (c.comment||'').toLowerCase().includes(ql)) hits.push({...c,src:'ksv'});
  const docs = searchDocs([q], null);
  let h = `<div class="sec"><h3>Códigos (${hits.length})</h3><div class="card list">${hits.slice(0,60).map(c=>`<div class="row" data-q="${c.code}" data-src="${c.src}"><b>${c.code}</b><div>${esc(c.name)}<div class="faint" style="font-size:12px">${esc(translate(c.name))}</div></div><span class="faint" style="font-size:12px">${c.src==='plc'?'PLC':'KSvision'}</span></div>`).join('') || '<div class="muted">Ningún código coincide.</div>'}</div></div>`;
  h += `<div class="sec"><h3>En los documentos</h3><div class="card">${docs.length? docs.map(r=>`<div class="doc"><div class="t"><span>${esc(r.d.title)} · ${r.d.kind==='pdf'?'pág. '+(r.i+1):'sección '+(r.i+1)}</span><a href="${docLink(r.d,r.i)}" target="_blank">Abrir ↗</a></div><div class="s">${snippet(r.d.pages[r.i], r.first, [q])}</div></div>`).join('') : '<div class="muted">Sin coincidencias.</div>'}</div></div>`;
  show(h);
}
function show(h){ $('out').innerHTML = h; bind(); window.scrollTo({top:0,behavior:'smooth'}); }
function bind(){ $('out').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{ $('q').value=b.dataset.q; run(b.dataset.q, b.dataset.src); }); }

function home(){
  const fr = Object.entries(FRECUENCIA).sort((a,b)=>b[1]-a[1]).slice(0,12); const max = fr.length? fr[0][1] : 1;
  let h = `<div class="sec grid2">
    <div class="card"><h4>Más frecuentes en tus corridas</h4>${fr.length? `<div class="freq">${fr.map(([k,v])=>`<div class="f" data-q="${k}"><b>${k}</b><div class="bar"><i style="width:${v/max*100}%"></i></div><span class="muted">${v}</span></div>`).join('')}</div><div class="faint" style="margin-top:8px;font-size:12px">${esc(FRECUENCIA_FUENTE)}</div>`
      : `<div class="empty">Cuando subas el log de las últimas corridas, aquí aparecerá el ranking de fallas más repetidas.</div>`}</div>
    <div class="card"><h4>Qué encuentras aquí</h4><ul class="muted">
      <li>Significado del código traducido y en qué estación / fase de la Kasalis ocurre</li>
      <li>Guía rápida de troubleshooting</li>
      <li>Tus notas y procedimientos paso a paso con fotos</li>
      <li>Páginas del manual Pixid 500 y archivos del repo relacionados</li>
      <li>Códigos relacionados del mismo módulo</li></ul></div></div>
    <div class="sec"><h3>Guías disponibles</h3><div class="rel">${Object.keys(HINTS).map(k=>`<button data-q="${k}">${k}${PLC.get(+k)?' · '+esc(PLC.get(+k).name):''}</button>`).join('')}</div></div>`;
  return h;
}

/* ---------- arranque ---------- */
const QUICK = ['161','155','108','131','105','242','233','236'];
$('chips').innerHTML = QUICK.map(c=>`<button class="pill" data-c="${c}">${c}</button>`).join('');
$('chips').querySelectorAll('button').forEach(b=>b.onclick=()=>{ $('q').value=b.dataset.c; run(b.dataset.c); });
$('go').onclick = ()=>run($('q').value);
$('q').addEventListener('keydown', e=>{ if(e.key==='Enter') run($('q').value); });
const [hq, hs] = decodeURIComponent(location.hash.slice(1)).split('|');
$('q').value = hq||''; run(hq||'', hs);
