/* Kasalis 3D — UI: reproducción del ciclo, línea de tiempo, parámetros y modo falla. */
import {createScene} from './scene.js';
import {DEFAULTS, ASSUMED, LABELS, STATIONS, buildCycle} from './cycle.js';
import {FALLAS} from '../../buscador-kasalis/data/fallas.js';

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY = 'jd_k3d_params';
let P = {...DEFAULTS}; try{ Object.assign(P, JSON.parse(localStorage.getItem(KEY)||'{}')); }catch(e){}
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(P)); }catch(e){} };

const S = await createScene($('stage'), 'models/kasalis.glb');
S.setTheme(document.documentElement.dataset.theme);
addEventListener('jdtheme', e=>{ S.setTheme(e.detail); document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); });
$('loading').classList.add('out');

let C, t = 0, playing = true, speed = 1, fault = null, tab = 'steps', lastStep = -1;
const SPEEDS = [1, 2, 5, 10];
function rebuild(keepT){
  S.buildBead(P);
  const frac = C ? t / C.total : 0;
  C = buildCycle(P, S.geo);
  t = keepT ? frac * C.total : 0; lastStep = -1;
  $('sub').textContent = `Ciclo ${P.mode==='retest'?'RETEST':'BUILD'} · ${fmt(C.total)}`;
  document.querySelectorAll('#mode button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m===P.mode));
  $('tl').innerHTML = C.steps.map(s=>`<i style="flex:${s.dur};--c:${STATIONS[s.st].color}" title="${esc(s.title)}"></i>`).join('') + '<span class="ph" id="ph"></span>';
  renderPane();
}
const fmt = s => s>=60 ? `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')} min` : `${s.toFixed(s<10?1:0)} s`;

/* ---------- pose en el tiempo t ---------- */
const ease = x => x<.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
const lerp = (a,b,k) => a + (b-a)*k;
function poseAt(time){
  let i = C.steps.findIndex(s=>time < s.t1); if(i < 0) i = C.steps.length - 1;
  const s = C.steps[i];
  const p = Math.min(1, Math.max(0, (time - s.t0) / s.dur)), k = ease(p);
  const a = s.from, b = s.toPose, o = {};
  for(const key in a){
    if(Array.isArray(a[key])) o[key] = a[key].map((x,j)=>lerp(x, b[key][j], k));
    else if(typeof a[key]==='number') o[key] = lerp(a[key], b[key], k);
    else o[key] = p < 1 ? a[key] : b[key];
  }
  if(s.swap){ const src = p < .5 ? a : b; Object.assign(o, {lens:src.lens, bead:src.bead, piece: p<.5 ? 1-2*p : 2*p-1}); }
  if(s.fx==='arc'){
    // velocidad casi constante con aceleración corta (VA): avance del ángulo
    const acc = .08, u = p<acc ? p*p/(2*acc) : p>1-acc ? (1-acc) - (1-p)*(1-p)/(2*acc) : p - acc/2;
    const prog = Math.min(1, u/(1-acc));
    o.disp = S.geo.arcAt(P.SA + P.IA*prog, P);
    const deg = P.IA*prog, on0 = P.LI/(Math.PI*P.XR)*180, on1 = P.IA - P.LO;
    o.bead = Math.min(1, Math.max(0, (deg - on0)/(on1 - on0)));
  }
  if(s.fx==='prefocus') o.align = o.align.map((x,j)=> j===1 ? x + 2.5*Math.sin(p*Math.PI*2) : j===0 ? x + .6*Math.sin(p*Math.PI*4) : x);
  if(s.fx==='scan') o.align = o.align.map((x,j)=> j===1 ? x + 5*Math.sin(p*Math.PI*6)*(1-p) : x);
  o.cam = s.fx==='test' ? 1 : o.cam;
  return {pose:o, step:s, idx:C.steps.indexOf(s), p};
}

/* ---------- tarjeta y panel ---------- */
const fallaDe = code => FALLAS.find(f=>f.codigos.includes(String(code)));
function renderCard(s, idx){
  const st = STATIONS[s.st];
  let h = `<div class="h" style="--c:${st.color}"><i></i><span>${st.name} · paso ${idx+1}/${C.steps.length}</span><span id="clock"></span></div>
    <h2>${esc(s.title)}</h2>${s.desc?`<p>${esc(s.desc)}</p>`:''}`;
  const chips = [...(s.params||[]).map(x=>`<span>${esc(x)}</span>`), ...(s.codes||[]).map(c=>`<a href="#" data-code="${c}" class="${fault==c?'on':''}">${c}</a>`)];
  if(chips.length) h += `<div class="chips">${chips.join('')}</div>`;
  if(fault && (s.codes||[]).includes(String(fault))){
    const f = fallaDe(fault);
    if(f) h += `<div class="flow">${f.flujo.slice(0,3).map((x,i)=>`<div><i>${i+1}</i><span>${esc(x.p)}${x.d?`<small>${esc(x.d)}</small>`:''}</span></div>`).join('')}</div>`;
    h += `<a class="more" href="../buscador-kasalis/#c/${fault}${+fault<0?'|ksv':''}">Flujo completo de ${fault} ↗</a>`;
  }
  $('card').innerHTML = h;
}
function renderPane(){
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.t===tab));
  let h = '';
  if(tab==='steps'){
    const by = {}; C.steps.forEach(s=>by[s.st]=(by[s.st]||0)+s.dur);
    h += `<div class="sum"><div><small>Ciclo</small><b>${fmt(C.total)}</b></div><div><small>UPH (1 plato)</small><b>${(3600/C.total).toFixed(1)}</b></div><div><small>Arco ARC</small><b>${C.arcL.toFixed(0)} mm</b></div></div>`;
    h += C.steps.map((s,i)=>`<button class="step" data-i="${i}" style="--c:${STATIONS[s.st].color}"><i></i><span><b>${esc(s.title)}</b><small>${STATIONS[s.st].name}${(s.codes||[]).length?' · '+s.codes.join(', '):''}</small></span><em>${fmt(s.dur)}</em></button>`).join('');
    h += `<div class="lb">Vista</div><div class="views">${[['iso','Isométrica'],['top','Arriba'],['load','Carga'],['disp','Dispensado'],['align','Alineación'],['spare','Spare']].map(([k,n])=>`<button data-view="${k}">${n}</button>`).join('')}</div>`;
  } else if(tab==='params'){
    h += `<div class="lb" style="margin-top:2px">Tiempos y dispensado</div>`;
    h += Object.keys(LABELS).map(k=>`<label class="prm"><span>${LABELS[k]}${ASSUMED.has(k)?'<small>supuesto</small>':''}</span><input type="number" step="any" data-k="${k}" value="${P[k]}"></label>`).join('');
    h += `<div class="lb">Línea ARC del archivo</div><div class="chips" style="margin-top:0"><span>X ${P.arcX}</span><span>Y ${P.arcY}</span><span>XR ${P.XR}</span><span>YR ${P.YR}</span><span>SA ${P.SA}</span><span>IA ${P.IA}</span><span>VS ${P.VS}</span><span>VA ${P.VA}</span><span>LI ${P.LI}</span><span>LO ${P.LO}</span><span>DR ${P.DR}</span><span>SR ${P.SR}</span><span>ST ${P.ST}</span><span>ZR ${P.ZR}</span></div>`;
    h += `<button class="btn" id="reset">Regresar a los valores del archivo</button>`;
  } else {
    const codes = [...new Set(C.steps.flatMap(s=>s.codes||[]))];
    h += `<p style="margin:2px 2px 10px;color:var(--ink2);font-size:13.5px">Elige un código: la simulación se detiene en el paso donde ocurre, marca la estación en rojo y te muestra cómo resolverlo.</p><div class="codes">${codes.map(c=>`<button data-fault="${c}" class="${fault==c?'on':''}">${c}</button>`).join('')}</div>`;
    if(fault) h += `<button class="btn" id="clearFault">Quitar falla</button>`;
    h += `<div class="lb">Fuera del ciclo BUILD</div><p style="margin:0 2px;color:var(--ink2);font-size:13.5px">161 / 162 salen en RETEST (después del horno): cambia a RETEST arriba.</p>`;
  }
  $('pane').innerHTML = h;
}

/* ---------- eventos ---------- */
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>', ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
const setPlay = v => { playing = v; $('play').innerHTML = v ? ICON_PAUSE : ICON_PLAY; };
function seekStep(i){ i = (i + C.steps.length) % C.steps.length; t = C.steps[i].t0 + 0.0001; lastStep = -1; }
function setFault(code){
  fault = code; const s = code ? C.steps.find(x=>(x.codes||[]).includes(String(code))) : null;
  S.highlight(s ? s.st : null);
  if(s){ seekStep(C.steps.indexOf(s)); t = s.t0 + s.dur*.6; setPlay(false); S.view(s.st==='rotary'?'iso':s.st); }
  lastStep = -1; renderPane();
}
$('play').onclick = ()=>setPlay(!playing);
$('prev').onclick = ()=>{ const {idx, p} = poseAt(t); seekStep(p > .15 ? idx : idx-1); };
$('next').onclick = ()=>{ const {idx} = poseAt(t); seekStep(idx+1); };
$('spd').onclick = ()=>{ speed = SPEEDS[(SPEEDS.indexOf(speed)+1) % SPEEDS.length]; $('spd').textContent = speed+'×'; };
document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>{ P.mode = b.dataset.m; save(); fault = null; S.highlight(null); rebuild(false); });
$('tabs').onclick = e=>{ const b = e.target.closest('[data-t]'); if(b){ tab = b.dataset.t; renderPane(); } };
$('pane').addEventListener('click', e=>{
  const g = s => e.target.closest(s); let x;
  if(x = g('[data-i]')){ seekStep(+x.dataset.i); closeSheet(); }
  else if(x = g('[data-view]')){ S.view(x.dataset.view); closeSheet(); }
  else if(x = g('[data-fault]')){ setFault(fault==x.dataset.fault ? null : x.dataset.fault); closeSheet(); }
  else if(g('#clearFault')) setFault(null);
  else if(g('#reset')){ const m = P.mode; P = {...DEFAULTS, mode:m}; save(); rebuild(true); }
});
$('pane').addEventListener('change', e=>{ const k = e.target.dataset.k; if(!k) return; const v = parseFloat(e.target.value); if(isFinite(v) && v>=0){ P[k] = v; save(); rebuild(true); } });
$('card').addEventListener('click', e=>{ const a = e.target.closest('[data-code]'); if(a){ e.preventDefault(); setFault(fault==a.dataset.code ? null : a.dataset.code); } });
document.addEventListener('click', e=>{ const l = e.target.closest('.st-label'); if(l){ const k = [...l.classList].find(c=>STATIONS[c]); if(k) S.view(k); } });
// línea de tiempo: tocar o arrastrar
const tlSeek = e => { const r = $('tl').getBoundingClientRect(); t = Math.min(.9999, Math.max(0, (e.clientX - r.left)/r.width)) * C.total; lastStep = -1; };
$('tl').addEventListener('pointerdown', e=>{ tlSeek(e); $('tl').setPointerCapture(e.pointerId); $('tl').onpointermove = tlSeek; });
$('tl').addEventListener('pointerup', ()=>{ $('tl').onpointermove = null; });
// hoja (celular)
function openSheet(){ const s = $('sheet'), c = $('scrim'); c.hidden = false; requestAnimationFrame(()=>{ s.classList.add('on'); c.classList.add('on'); }); }
function closeSheet(){ const s = $('sheet'), c = $('scrim'); s.classList.remove('on'); c.classList.remove('on'); setTimeout(()=>c.hidden = true, 300); }
$('menu').onclick = openSheet; $('scrim').onclick = closeSheet;
addEventListener('keydown', e=>{ if(e.target.matches('input')) return; if(e.code==='Space'){ e.preventDefault(); setPlay(!playing); } if(e.key==='ArrowRight') $('next').click(); if(e.key==='ArrowLeft') $('prev').click(); if(e.key==='Escape') closeSheet(); });

/* ---------- loop ---------- */
rebuild(false); setPlay(true);
let last = performance.now();
function loop(now){
  const dt = Math.min(.1, Math.max(0, (now - last)/1000)); last = now;
  if(playing) t = (t + dt*speed) % C.total;
  const {pose, step, idx, p} = poseAt(t);
  S.apply(pose);
  if(idx !== lastStep){ lastStep = idx; renderCard(step, idx);
    document.querySelectorAll('#tl i').forEach((el,i)=>el.classList.toggle('done', i<=idx));
    document.querySelectorAll('.step').forEach((el,i)=>el.classList.toggle('on', i===idx));
    document.querySelectorAll('.st-label').forEach(el=>el.classList.toggle('now', el.classList.contains(step.st))); }
  $('ph').style.left = (t/C.total*100)+'%';
  const ck = $('clock'); if(ck) ck.textContent = `${fmt(t)} / ${fmt(C.total)}`;
  S.render(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__k3d = {S, get C(){ return C; }, get t(){ return t; }, set t(v){ t = v; lastStep = -1; }, setPlay, P};
