/* =====================================================================
   APP — UI del simulador (barra superior, menú retráctil, panel derecho,
   modo ajuste, códigos). Conecta Engine (simulación) + World (3D).
   ===================================================================== */
import {Engine, fmt} from './engine.js';
import {createWorld, UNITS_PER_M} from './world.js';
import {ROUTES, OPS, BRANCH_NAMES, PCS, CHECKS, HINTS, FAILS, STEP_FAIL_LABEL, KBUILD, LINE_COL} from './data.js';
import {CODES} from './codes.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hex = c => '#'+c.toString(16).padStart(6,'0');

const world = createWorld($('stage'));
const engine = new Engine();
const ui = {prod:'scorpion', variant:null, playing:false, speed:60, selected:null, info:null, follow:false, traces:true};
engine.on(onEngineEvent);

/* ---------------- producto / reinicio ---------------- */
function setProduct(p){
  ui.prod = p;
  document.querySelectorAll('#prodSeg button').forEach(b=>b.classList.toggle('on', b.dataset.p===p));
  const R = ROUTES[p];
  $('variant').innerHTML = R.variants.map(([k,t])=>`<option value="${k}">${esc(t)}</option>`).join('');
  ui.variant = R.variants[0][0];
  resetSim();
}
function resetSim(){
  engine.reset(ui.prod, ui.variant, (a,b)=> world.pathLen(a,b) / (UNITS_PER_M * Math.max(.1, +engine.params.g.walkSpeed||1)));
  world.clearPieces(); world.setRoute(ui.prod, engine.route, engine.failBin);
  ui.selected = null; world.setSelected(null); world.setHighlight(null);
  renderRoute(); renderStations(); renderFailSel(); renderRight(); setPlaying(false);
  if($('adjModal').classList.contains('on')) renderAdjust();
}
function setPlaying(on){
  ui.playing = on;
  $('playIco').textContent = on ? '❚❚' : '▶'; $('playTxt').textContent = on ? 'Pausa' : 'Correr';
}
$('prodSeg').onclick = e=>{ const b=e.target.closest('button'); if(b) setProduct(b.dataset.p); };
$('variant').onchange = e=>{ ui.variant = e.target.value; resetSim(); };
$('playBtn').onclick = ()=>setPlaying(!ui.playing);
$('resetBtn').onclick = ()=>resetSim();
$('speed').onchange = e=>ui.speed = +e.target.value;
$('sideBtn').onclick = ()=>{ document.body.classList.toggle('sideClosed'); };
if(innerWidth < 900) document.body.classList.add('sideClosed');
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on', p.id==='p-'+b.dataset.t));
});

/* ---------------- vista ---------------- */
$('vIso').onclick = ()=>world.viewIso(); $('vTop').onclick = ()=>world.viewTop();
$('follow').onchange = e=>ui.follow = e.target.checked;
$('optLabels').onchange = e=>world.setLabels(e.target.checked);
$('optTraces').onchange = e=>ui.traces = e.target.checked;
$('optShadows').onchange = e=>world.setShadows(e.target.checked);
$('sunAz').oninput = $('sunEl').oninput = ()=>world.setSun(+$('sunAz').value, +$('sunEl').value);

/* ---------------- fallas ---------------- */
function renderFailSel(){
  const avail = new Set(Object.values(engine.route).flat().flatMap(s=>s.fails||[]));
  $('failSel').innerHTML = FAILS.filter(([k])=>k && avail.has(k)).map(([k,t])=>`<option value="${k}">${esc(t)}</option>`).join('');
}
$('injectBtn').onclick = ()=>{ engine.inject = $('failSel').value; toast(`Falla ${engine.inject} armada: se aplicará a la próxima pieza en esa operación`, 'info'); };

/* ---------------- ruta (menú izq) ---------------- */
function renderRoute(){
  let h = '';
  for(const b of Object.keys(engine.route)){
    h += `<div class="h">${esc(BRANCH_NAMES[b])}</div>`;
    for(const s of engine.route[b]){
      h += `<div class="step" data-st="${s.st}" data-key="${b}:${s.idx}"><div class="n">${s._n}</div><div><div class="t">${esc(s.name)}</div><div class="d">${esc(world.ST[s.st].name.replace(/ · Nodo \d/,''))} · CT ${fmt(engine.op(s.op).ct)}${engine.op(s.op).lot>1?' · lote '+engine.op(s.op).lot:''}${s.merge?' · ⇢ une '+s.merge.join(' + '):''}</div></div><div class="c"></div></div>`;
    }
  }
  $('p-ruta').innerHTML = h;
  $('p-ruta').querySelectorAll('.step').forEach(el=>el.onclick=()=>{ world.focusStation(el.dataset.st); showStation(el.dataset.st); });
}
function updateRouteCounts(){
  const cnt = {};
  for(const p of engine.alive.values()){ const k=p.branch+':'+p.idx; const c=cnt[k]||(cnt[k]={q:0,p:0,o:0,t:0}); c[p.state==='queue'?'q':p.state==='proc'?'p':p.state==='out'?'o':'t']++; }
  const sel = selectedPiece();
  $('p-ruta').querySelectorAll('.step').forEach(el=>{
    const c = cnt[el.dataset.key]; const txt = c ? [c.p?`▶${c.p}`:'', c.q?`cola ${c.q}`:'', c.o?`lote ${c.o}`:'', c.t?`→${c.t}`:''].filter(Boolean).join(' · ') : '';
    const ce = el.querySelector('.c'); if(ce.textContent!==txt) ce.textContent = txt;
    el.classList.toggle('hl', !!sel && sel.state!=='done' && el.dataset.key===sel.branch+':'+sel.idx);
  });
}

/* ---------------- estaciones (menú izq) ---------------- */
function routeStationIds(){ const ids=[]; for(const b of Object.keys(engine.route)) for(const s of engine.route[b]) if(!ids.includes(s.st)) ids.push(s.st); ids.push(engine.failBin); return ids; }
function renderStations(){
  $('p-est').innerHTML = '<div class="h">Estado en vivo</div>' + routeStationIds().map(id=>`<div class="stRow" data-st="${id}"><span class="dot"></span><div><div style="font-weight:600">${esc(world.ST[id].name.replace(/ · Nodo \d/,''))}</div><small class="s"></small><div class="bar"><i></i></div></div><small class="u"></small></div>`).join('');
  $('p-est').querySelectorAll('.stRow').forEach(el=>el.onclick=()=>{ world.focusStation(el.dataset.st); showStation(el.dataset.st); });
}
function updateStations(){
  $('p-est').querySelectorAll('.stRow').forEach(el=>{
    const c = engine.counts(el.dataset.st); if(!c) return;
    const run = c.inp>0 || !!c.batch; const co = c.state==='cambio de modo';
    el.querySelector('.dot').className = 'dot ' + (co?'co': run?'run': (c.q||c.kit)?'wait':'');
    const parts = [c.batch?`horno ${c.batch.pieces.length} pzs · ${fmt(c.batch.tEnd-engine.t)}`:c.state, c.q?`cola ${c.q}`:'', c.out?`lote ${c.out}`:'', c.kit?`kit ${c.kit}`:'', `✓${c.done}`, c.fail?`✗${c.fail}`:''].filter(Boolean);
    if(el.dataset.st==='kas') parts.unshift(c.mode==='build'?'BUILD':'RETEST');
    el.querySelector('.s').textContent = parts.join(' · ');
    el.querySelector('.u').textContent = Math.round(c.util*100)+'%';
    el.querySelector('.bar i').style.width = Math.round(c.util*100)+'%';
  });
}

/* ---------------- panel derecho: pieza / estación ---------------- */
function selectedPiece(){ return ui.selected ? engine.pieces.find(p=>p.id===ui.selected) : null; }
function selectPiece(id){
  let p = engine.pieces.find(x=>x.id===id); if(!p) return;
  if(p.state==='merged' && p.mergedInto) p = engine.pieces.find(x=>x.id===p.mergedInto) || p;
  ui.selected = p.id; ui.info = {type:'piece'}; world.setSelected(p.id); renderRight();
}
function showStation(id){ ui.info = {type:'station', id}; renderRight(); }
world.onPick(e=>{ if(e.type==='piece') selectPiece(e.id); else showStation(e.id); });

function stateText(p){
  const st = id=>world.ST[id] ? world.ST[id].name.replace(/ · Nodo \d/,'') : id;
  switch(p.state){
    case 'queue': return `En cola en ${st(p.at)}`;
    case 'proc': return `En proceso en ${st(p.at)}`;
    case 'out': { const lot = engine.op(p.route[p.idx].op).lot||1; const S=engine.st[p.at]; const n=(S.out[p.branch+':'+p.idx]||[]).length; return `Esperando lote (${n}/${lot}) en ${st(p.at)}`; }
    case 'transit': return p.tr && p.tr.fail ? `Rechazada → ${st(p.tr.to)}` : `En tránsito → ${st(p.tr.to)}`;
    case 'kit': return `Esperando ensamble en ${st(p.at)}`;
    case 'merged': return `Integrada en pieza #${p.mergedInto}`;
    case 'done': return 'Terminada · empacada';
    case 'failed': return `FALLA ${p.failCode} · en ${st(p.at)}`;
  }
  return p.state;
}
function flowIds(p){
  if(!p) return null;
  const r = p.route; const prevStep = r[p.idx-1], nextStep = r[p.idx+1];
  const nextSt = nextStep ? nextStep.st : (p.branch!=='main' && engine.mergeAt[p.branch] ? engine.mergeAt[p.branch].st : null);
  if(p.state==='transit' && p.tr) return {prev:p.tr.from, cur:null, next:p.tr.to};
  if(p.state==='done') return {prev:p.at, cur:null, next:null};
  if(p.state==='failed') return {prev:p.failStep?p.failStep.st:null, cur:p.at, next:null};
  return {prev: p.state==='queue' ? (prevStep&&prevStep.st) : (prevStep&&prevStep.st), cur:p.at, next: p.state==='kit'?null:nextSt};
}
function renderRight(){
  const R = $('right'); const info = ui.info;
  if(!info){ R.classList.remove('on'); document.body.classList.remove('rightOpen'); return; }
  R.classList.add('on'); document.body.classList.add('rightOpen');
  if(info.type==='piece') renderPiece(); else renderStationInfo(info.id);
}
function renderPiece(){
  const p = selectedPiece(); const R = $('right');
  if(!p){ R.innerHTML = `<button class="close" data-x>✕</button><h2>Seguimiento de pieza</h2><p style="color:var(--ink2)">Haz clic en una pieza en el 3D para ver de dónde viene, dónde está y a dónde va.</p>`; bindClose(); return; }
  const ids = flowIds(p); const nm = id=> id&&world.ST[id] ? esc(world.ST[id].name.replace(/ · Nodo \d/,'')) : '—';
  const col = hex(LINE_COL[ROUTES[p.prod].line]);
  let h = `<button class="close" data-x>✕</button><h2>Pieza #${p.unit} <span style="color:var(--ink3);font-weight:500">· id ${p.id}</span></h2>
    <span class="tag" style="background:${col}">${ROUTES[p.prod].name}</span><span class="tag" style="background:#64748b">${esc(BRANCH_NAMES[p.branch])}</span>${p.result==='FAIL'?'<span class="tag" style="background:var(--fail)">FALLA '+esc(p.failCode)+'</span>':''}
    <div style="margin-top:10px;font-weight:600" id="pState">${esc(stateText(p))}</div>
    <div class="flow3"><div><small>Anterior</small><b>${nm(ids.prev)}</b></div><div class="${ids.cur?'cur':''}"><small>Actual</small><b>${ids.cur?nm(ids.cur):(p.state==='transit'?'en tránsito':'—')}</b></div><div><small>Siguiente</small><b>${nm(ids.next)}</b></div></div>
    <div class="btnrow" style="margin:0 0 6px"><button class="pill" id="pFocus">Ir a la pieza</button><button class="pill" id="pPrev">◀</button><button class="pill" id="pNext">▶</button></div>
    <div class="h" style="margin-left:0">Recorrido</div><div class="tl">`;
  const hist = p.hist;
  p.route.forEach((s,i)=>{
    const hi = hist.find(x=>x.op===s.op && x.name===s.name);
    const done = hi && hi.te!=null; const cur = i===p.idx && !done && p.state!=='done';
    const fail = hi && hi.res && hi.res.startsWith('FALLA');
    let meta = '';
    if(hi){ const wait = (hi.ts??engine.t)-hi.tq; meta = `llegó ${fmt(hi.tq)} · espera ${fmt(wait)}`; if(hi.ts!=null) meta += ` · proceso ${fmt((hi.te??engine.t)-hi.ts)}`; if(hi.res) meta += ` · ${hi.res}`; }
    else meta = `CT ${fmt(engine.op(s.op).ct)}`;
    h += `<div class="it ${fail?'fail':done?'done':cur?'cur':''}"><b>${s._n}. ${esc(s.name)}</b><small>${nm(s.st)} · ${meta}</small></div>`;
  });
  h += `</div><div style="color:var(--ink2);font-size:12px;margin-top:8px">Edad en línea: ${fmt((p.state==='done'||p.state==='failed'? (p.hist[p.hist.length-1].te||engine.t) : engine.t) - p.born)}</div>`;
  R.innerHTML = h; bindClose();
  $('pFocus').onclick = ()=>{ const id=ids.cur||ids.next||ids.prev; if(id) world.focusStation(id); };
  const mains = ()=>engine.pieces.filter(x=>x.branch===p.branch && x.state!=='merged');
  $('pPrev').onclick = ()=>{ const L=mains(); const i=L.indexOf(p); if(i>0) selectPiece(L[i-1].id); };
  $('pNext').onclick = ()=>{ const L=mains(); const i=L.indexOf(p); if(i<L.length-1) selectPiece(L[i+1].id); };
}
function renderStationInfo(id){
  const W = world.ST[id]; const c = engine.counts(id); const R = $('right');
  const lineName = {scorpion:'Scorpion',moose:'Moose',gecko:'Gecko',shared:'Compartido',fail:'Fallas'}[W.line];
  const kind = W.type==='auto' ? 'Estación automática' : W.type==='kasalis' ? 'Máquina Kasalis' : ['table','printer','bin'].includes(W.type) ? 'Mesa / soporte' : 'Equipo';
  const steps = Object.values(engine.route).flat().filter(s=>s.st===id);
  let h = `<button class="close" data-x>✕</button><h2>${esc(W.name)}</h2><span class="tag" style="background:${hex(LINE_COL[W.line])}">${lineName}</span><span class="tag" style="background:#64748b">${kind}</span>${W.approx?'<span class="tag" style="background:#9aa7c0">ubicación aprox.</span>':''}`;
  if(c && steps.length){
    h += `<div class="h" style="margin-left:0">En vivo</div><table class="kv">
      <tr><td>Estado</td><td><b>${esc(id==='kas'?(c.mode==='build'?'BUILD':'RETEST')+' · '+c.state:c.state)}</b></td></tr>
      <tr><td>En proceso</td><td>${c.batch?`${c.batch.pieces.length} pzs · faltan ${fmt(c.batch.tEnd-engine.t)}`:c.inp}</td></tr>
      <tr><td>Cola / lote / kit</td><td>${c.q} / ${c.out} / ${c.kit}</td></tr>
      <tr><td>OK · falla</td><td>${c.done} · ${c.fail}</td></tr>
      <tr><td>Utilización</td><td>${Math.round(c.util*100)}%</td></tr></table>
      <div class="h" style="margin-left:0">Operaciones aquí</div><ul class="tight">${steps.map(s=>`<li>${s._n}. ${esc(s.name)} — CT ${fmt(engine.op(s.op).ct)}${engine.op(s.op).lot>1?', lote '+engine.op(s.op).lot:''}</li>`).join('')}</ul>`;
  }
  const pcs = (PCS[id]||[]).map(([n,pc,sw])=>`<tr><td>${esc(n)}</td><td><b>${esc(pc)}</b><br><span style="color:var(--ink2)">${esc(sw)}</span></td></tr>`).join('');
  if(pcs) h += `<div class="h" style="margin-left:0">PC / software</div><table class="kv">${pcs}</table>`;
  if(CHECKS[id]) h += `<div class="h" style="margin-left:0">Qué revisar</div><ul class="tight">${CHECKS[id].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  const fails = [...new Set(steps.flatMap(s=>s.fails||[]))];
  if(fails.length) h += `<div class="h" style="margin-left:0">Fallas asociadas</div>${fails.map(f=>`<button class="chip" data-code="${f}">${f} ${esc(codeName(f))}</button>`).join('')}`;
  if(id==='kas') h += `<div class="h" style="margin-left:0">Cómo trabaja</div><div style="font-size:12px;color:var(--ink2)">Mesa rotatoria de 4 fixtures: <b>Carga</b> (frente al operador) → gira <b>antihorario</b> → <b>Dispensado</b> → <b>Alineación</b> (+UV) → <b>Spare</b>.<br><b>BUILD</b> (~1:40/pza) y <b>RETEST</b> (sólo prueba final MTF) son steps de MES distintos en la misma máquina: mientras corre uno, el otro espera. Flujo típico: WIP de ~30 BUILD → horno 1.5 h → WIP de RETEST → resto de la línea.</div>
    <div class="h" style="margin-left:0">Parámetros dispense</div><table class="kv"><tr><td>DR</td><td>42 %</td></tr><tr><td>SR / ST</td><td>50 % / 300 ms</td></tr><tr><td>PRT LP</td><td>25 % (spare 100 %)</td></tr><tr><td>Pot life / volumen</td><td>72 h / 18 ml</td></tr></table>`;
  R.innerHTML = h; bindClose();
  R.querySelectorAll('.chip').forEach(b=>b.onclick=()=>openCodes(b.dataset.code));
}
function bindClose(){ const x=$('right').querySelector('[data-x]'); if(x) x.onclick=()=>{ ui.info=null; if(ui.selected){ ui.selected=null; world.setSelected(null); world.setHighlight(null); } renderRight(); }; }
function codeName(c){ const r=CODES.plc.find(x=>String(x[0])===String(c)); return r? r[1] : (STEP_FAIL_LABEL[c]||''); }

/* ---------------- Kasalis card ---------------- */
function updateKas(){
  const usesKas = Object.values(engine.route).flat().some(s=>s.st==='kas');
  $('kas').style.display = usesKas ? '' : 'none'; if(!usesKas) return;
  const c = engine.counts('kas'); const S = engine.st.kas;
  $('mBuild').classList.toggle('on', c.mode==='build'); $('mRetest').classList.toggle('on', c.mode==='retest');
  $('kasState').textContent = c.state==='cambio de modo' ? `cambio de modo · ${fmt(c.coEnd-engine.t)}` : c.state + (c.mode==='build'?` · campaña ${c.campaign}/${engine.params.g.kasCampaign}`:'');
  const sub = world.kasSub();
  $('kasSub').innerHTML = sub ? `<b>${esc(sub.name)}</b> · estación ${['CARGA (frente)','DISPENSADO','ALINEACIÓN','SPARE'][sub.mod]} · pieza #${engine.pieces.find(p=>p.id===sub.piece)?.unit??''}<br>${esc(sub.detail)}` : (c.state==='cambio de modo'?'Cambiando de programa / step MES…':'Sin pieza en proceso');
  $('kasBar').style.width = sub ? Math.round(sub.prog*100)+'%' : '0';
  $('kQb').textContent = (S.q.kas_build||[]).length; $('kQr').textContent = (S.q.kas_retest||[]).length;
  const outOf = i=>{ const k=Object.keys(S.out).find(k=>k.endsWith(':'+i)); return k? S.out[k].length:0; };
  const ib = engine.route.main.findIndex(s=>s.op==='kas_build'), ir = engine.route.main.findIndex(s=>s.op==='kas_retest');
  $('kOb').textContent = outOf(ib); $('kOr').textContent = outOf(ir);
  const o = engine.counts('oven3');
  $('ovenLine').textContent = o && o.batch ? `🔥 Horno sensor: ${o.batch.pieces.length} pzs · faltan ${fmt(o.batch.tEnd-engine.t)}` : (o&&o.q? `Horno sensor: ${o.q} pzs cargando` : 'Horno sensor: vacío');
}

/* ---------------- KPIs ---------------- */
function updateKpis(){
  const k = engine.kpis();
  $('clock').textContent = fmt(k.t); $('kRel').textContent = k.released; $('kWip').textContent = k.wip; $('kOk').textContent = k.done; $('kFail').textContent = k.failed; $('kThr').textContent = k.thr.toFixed(1);
}

/* ---------------- eventos ---------------- */
function onEngineEvent(type, d){
  if(type==='fail'){ toast(`✖ Pieza #${d.p.unit} falla en ${d.step.name} — ${STEP_FAIL_LABEL[d.code]||('código '+d.code+' '+codeName(d.code))}`, 'fail');
    if(ui.selected===d.p.id || !ui.info){ selectPiece(d.p.id); } }
  if(type==='kas_switch') toast(`Kasalis cambia a ${d.mode==='build'?'BUILD':'RETEST'} (BUILD y RETEST no pueden correr a la vez)`, 'info');
  if(type==='oven_start' && d.n>1) toast(`🔥 ${world.ST[d.st].name.replace(/ · Nodo \d/,'')}: entra lote de ${d.n} piezas`, 'info');
  if(type==='oven_end' && d.n>1) toast(`✓ ${world.ST[d.st].name.replace(/ · Nodo \d/,'')}: sale lote de ${d.n} piezas`, 'info');
  if(type==='release' && !ui.selected && d.unit===1){ selectPiece(d.id); }
}
function toast(msg, cls=''){ const t=document.createElement('div'); t.className='toast '+cls; t.textContent=msg; $('toasts').appendChild(t); setTimeout(()=>t.remove(), 4200); while($('toasts').children.length>3) $('toasts').firstChild.remove(); }

/* ---------------- modo ajuste ---------------- */
function renderAdjust(){
  const g = engine.params.g;
  const fields = [['releaseInterval','Intervalo de liberación (s)'],['totalPieces','Piezas a correr (0 = infinito)'],['walkSpeed','Velocidad de transporte (m/s)'],['handling','Manejo por transferencia (s)'],['kasChangeover','Kasalis: cambio BUILD⇄RETEST (s)'],['kasCampaign','Kasalis: piezas BUILD por campaña']];
  $('gParams').innerHTML = fields.map(([k,l])=>`<label>${l}<input type="number" min="0" step="any" data-g="${k}" value="${g[k]}"></label>`).join('') +
    `<label>Kasalis: prioridad<select data-g="kasPriority"><option value="lote"${g.kasPriority==='lote'?' selected':''}>Termina campaña de BUILD y luego RETEST</option><option value="retest"${g.kasPriority==='retest'?' selected':''}>RETEST primero apenas haya piezas</option></select></label>`;
  const ops = []; for(const b of Object.keys(engine.route)) for(const s of engine.route[b]) if(!ops.includes(s.op)) ops.push(s.op);
  $('adjBody').innerHTML = ops.map(o=>{ const O=engine.op(o); return `<tr><td><b>${esc(O.name)}</b>${O.batch?' <span style="color:var(--warn);font-size:11px">horno · lote</span>':''}</td><td style="color:var(--ink2)">${esc(world.ST[O.st].name.replace(/ · Nodo \d/,''))}</td>
    <td><input type="number" min="1" step="any" data-o="${o}" data-k="ct" value="${O.ct}"> <small style="color:var(--ink3)">${fmt(O.ct)}</small></td>
    <td><input type="number" min="1" step="1" data-o="${o}" data-k="cap" value="${O.cap||1}"></td>
    <td><input type="number" min="1" step="1" data-o="${o}" data-k="lot" value="${O.lot||1}"></td>
    <td><input type="number" min="0" max="100" step="any" data-o="${o}" data-k="fail" value="${O.fail||0}"></td></tr>`; }).join('');
  $('adjModal').querySelectorAll('input,select').forEach(inp=>inp.onchange=()=>{
    if(inp.dataset.g){ engine.params.g[inp.dataset.g] = inp.tagName==='SELECT' ? inp.value : +inp.value; }
    else { engine.params.ops[inp.dataset.o][inp.dataset.k] = +inp.value; const sm=inp.parentNode.querySelector('small'); if(sm) sm.textContent=fmt(+inp.value); }
    engine.saveParams(); renderRoute();
  });
}
$('adjBtn').onclick = ()=>{ renderAdjust(); $('adjModal').classList.add('on'); };
$('adjReset').onclick = ()=>{ engine.resetParams(); renderAdjust(); renderRoute(); toast('Valores restablecidos','info'); };

/* ---------------- códigos ---------------- */
function renderCodes(){
  const q=$('codeQ').value.trim().toLowerCase(), src=$('codeSrc').value; let rows=[];
  if(src==='hint') rows=Object.keys(HINTS).map(k=>{ const r=CODES.plc.find(x=>String(x[0])===k); return [k, r?r[1]:(STEP_FAIL_LABEL[k]||k), r?r[2]:'proceso', HINTS[k]]; });
  else if(src==='plc') rows=CODES.plc.map(r=>[String(r[0]).padStart(3,'0'),r[1],r[2],HINTS[String(r[0])]]);
  else rows=CODES.ksv.map(r=>[String(r[0]),r[1],r[2],r[3]]);
  if(q) rows=rows.filter(r=>r.join(' ').toLowerCase().includes(q) || String(+r[0])===q);
  $('codeList').innerHTML = rows.slice(0,600).map(r=>`<div class="code"><b>${esc(r[0])}</b><div>${esc(r[1])}<div class="g">${esc(r[2]||'')}</div></div>${r[3]?`<div class="hh">${esc(r[3])}</div>`:''}</div>`).join('') || '<p style="color:var(--ink2)">Sin resultados</p>';
}
function openCodes(q=''){ $('codesModal').classList.add('on'); $('codeSrc').value = HINTS[q] && !CODES.plc.find(x=>String(x[0])===q) ? 'hint' : 'plc'; $('codeQ').value=q; renderCodes(); }
$('codesBtn').onclick = ()=>openCodes(''); $('codeQ').oninput = renderCodes; $('codeSrc').onchange = renderCodes;
document.querySelectorAll('.modal').forEach(m=>{ m.addEventListener('click',e=>{ if(e.target===m || e.target.closest('[data-close]')) m.classList.remove('on'); }); });
addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('.modal').forEach(m=>m.classList.remove('on')); if(e.code==='Space' && !['INPUT','SELECT'].includes(e.target.tagName)){ e.preventDefault(); setPlaying(!ui.playing); } });

/* ---------------- loop ---------------- */
let last = performance.now(), uiT = 0;
function loop(now){
  const rdt = Math.min(.1, (now-last)/1000); last = now;
  if(ui.playing){
    engine.update(rdt*ui.speed);
    if(engine.releaseDone() && engine.done+engine.failed>=engine.total && !(engine.failMoving&&engine.failMoving.size)){ setPlaying(false); toast(`Corrida terminada: ${engine.done} OK · ${engine.failed} falla · ${fmt(engine.t)}`,'info'); }
  }
  const p = selectedPiece();
  world.setHighlight(flowIds(p));
  world.frame(engine, rdt, fmt, {traces:ui.traces, follow:ui.follow});
  uiT -= rdt;
  if(uiT<=0){ uiT=.25; updateKpis(); updateRouteCounts(); updateStations(); updateKas();
    if(ui.info && ui.info.type==='piece'){ if(p && p.state==='merged') selectPiece(p.id); else renderPiece(); }
    else if(ui.info && ui.info.type==='station' && document.activeElement?.tagName!=='BUTTON') renderStationInfo(ui.info.id); }
  requestAnimationFrame(loop);
}

/* arranque */
setProduct('scorpion');
if(new URLSearchParams(location.search).has('codes')) openCodes('');
requestAnimationFrame(loop);
window.__app = {engine, world, ui, selectPiece};
