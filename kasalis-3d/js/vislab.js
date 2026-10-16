/* Laboratorio VIS: sube imágenes reales de la inspección post-dispensado y prueba los parámetros
   (mismo algoritmo que el simulador: componentes conectados, área, caja y perímetro). */
import {analyze, drawResult, luminance, parseVIS, formatVIS, VIS_KEYS} from './visalgo.js';
import {renderDispCam, VIS_DEFAULTS} from './vision.js';

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FILE_LINE = 'VIS LD=00,LL=100.0,EXP=80,RL=10,RT=1,RR=90,RB=99,SM=1,ST=50,SH=5,AMN=10,AMX=25,BMN=60,BMX=80,PMN=3000,PMX=8000';
const KEY = 'jd_vislab';
let saved = {}; try{ saved = JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
let base = saved.base || FILE_LINE;
const fromLine = l => { const o = parseVIS(l), V = {}; VIS_KEYS.forEach(k=>V[k] = o[k] ?? VIS_DEFAULTS[k] ?? 0); return V; };
let V = {...fromLine(base), GAIN:1, ...(saved.V||{})};
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify({V, base})); }catch(e){} };

const CTRLS = [
  ['ST','Umbral ST (−1 = auto)',-1,100,1],['SH','Histograma SH (si ST = −1)',0,100,1],
  ['RL','ROI izquierda RL %',0,100,1],['RR','ROI derecha RR %',0,100,1],['RT','ROI arriba RT %',0,100,1],['RB','ROI abajo RB %',0,100,1],
  ['AMN','Área mín. AMN %',0,100,.5],['AMX','Área máx. AMX %',0,100,.5],['BMN','Caja mín. BMN %',0,100,.5],['BMX','Caja máx. BMX %',0,100,.5],
  ['PMN','Perímetro mín. PMN px',0,30000,50],['PMX','Perímetro máx. PMX px',0,30000,50],['GAIN','Ganancia virtual (aprox. EXP)',.3,3,.05],
];
const imgs = []; let sel = 0;

/* ---------- carga de imágenes ---------- */
function addImage(name, src, ps){
  const lum = luminance(src, 1600, 1); const item = {name, src, lum, ps: ps ?? lum.ps, expected:null, R:null};
  imgs.push(item); sel = imgs.length-1; reanalyze(true);
}
function loadFiles(files){
  [...files].filter(f=>f.type.startsWith('image/')).forEach(f=>{
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => addImage(f.name, im); im.onerror = () => alert('No se pudo abrir '+f.name+' (formato no soportado por el navegador).'); im.src = url; });
}
$('file').onchange = e => { loadFiles(e.target.files); e.target.value = ''; };
const drop = $('drop');
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev, e=>{ e.preventDefault(); drop.classList.add('on'); }));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev, e=>{ e.preventDefault(); drop.classList.remove('on'); }));
drop.addEventListener('drop', e=>loadFiles(e.dataTransfer.files));
document.querySelectorAll('[data-demo]').forEach(b=>b.onclick=()=>{
  const k = b.dataset.demo, c = document.createElement('canvas');
  const light = {...VIS_DEFAULTS, LD: k==='ld' ? 30 : 0};
  renderDispCam(c, {bead:1, variant: k==='ld' ? 'ok' : k, pattern:true, grab:true}, light);
  addImage({ok:'Ejemplo · buena', gap:'Ejemplo · incompleta', thin:'Ejemplo · poco DELO', ld:'Ejemplo · LD 30'}[k], c, 4);
  imgs[imgs.length-1].expected = k==='ok' ? 'g' : 'm'; reanalyze(true);
});

/* ---------- análisis ---------- */
function runOne(it){
  let L = it.lum.L;
  if(V.GAIN !== 1){ L = new Float32Array(L.length); for(let i=0;i<L.length;i++) L[i] = Math.min(1, it.lum.L[i]*V.GAIN); }
  it.L = L; it.R = analyze(L, it.lum.w, it.lum.h, V, it.ps);
}
let tm;
function reanalyze(now){
  clearTimeout(tm);
  const go = () => { imgs.forEach(runOne); renderAll(); };
  if(now) go(); else { if(imgs[sel]){ runOne(imgs[sel]); renderViewer(); } tm = setTimeout(go, 120); }
}

/* ---------- vistas ---------- */
const fmtV = c => c.u==='%' ? c.v.toFixed(1)+' %' : Math.round(c.v)+' px';
function renderViewer(){
  const it = imgs[sel];
  if(!it){ $('vname').textContent = '2 · Resultado'; $('verdict').innerHTML = '<small>Sube una imagen o usa un ejemplo.</small>'; $('meter').innerHTML = ''; $('facts').innerHTML = '';
    ['cOrig','cDet'].forEach(id=>{ const c = $(id); c.width = 320; c.height = 256; c.getContext('2d').clearRect(0,0,320,256); }); return; }
  const R = it.R, {w, h} = it.lum;
  $('vname').textContent = '2 · ' + it.name;
  const co = $('cOrig'); co.width = w; co.height = h; const g = co.getContext('2d'), im = g.createImageData(w, h);
  for(let i=0;i<w*h;i++){ const v = it.L[i]*255; im.data[i*4] = im.data[i*4+1] = im.data[i*4+2] = v; im.data[i*4+3] = 255; }
  g.putImageData(im, 0, 0);
  drawResult($('cDet'), it.L, R, {box:true});
  const why = R.best ? R.checks.filter(c=>!c.ok).map(c=>`${c.n} ${fmtV(c)} fuera de ${c.a}–${c.b}${c.u==='%'?' %':''}`).join(' · ') : 'No se detectó material';
  $('verdict').innerHTML = `<span style="color:${R.pass?'var(--ok)':'var(--bad)'}">${R.pass?'PASS':'FAIL'}</span><small>${R.pass?'Dentro de todos los rangos':esc(why)}</small>`;
  $('meter').innerHTML = R.checks.map(c=>{ const mx = c.u==='%' ? 100 : Math.max(c.b*1.5, c.v*1.2, 1000), p = v=>Math.max(0, Math.min(100, v/mx*100));
    return `<div><small>${c.n} (${c.a}–${c.b}${c.u==='%'?' %':''})</small><b class="${c.ok?'ok':'bad'}">${fmtV(c)}</b><div class="bar"><i style="left:${p(c.a)}%;right:${100-p(c.b)}%"></i><u style="left:${p(c.v)}%"></u></div></div>`; }).join('');
  $('facts').innerHTML = [`Umbral usado ${Math.round(R.th*100)} %`, `${R.regions} regiones detectadas (solo se mide la más grande)`, `Imagen ${it.lum.native[0]}×${it.lum.native[1]} px`, it.ps!==1?`perímetro ×${it.ps.toFixed(2)} a resolución original`:''].filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('');
}
function renderThumbs(){
  $('thumbs').innerHTML = imgs.map((it,i)=>`<div class="th ${i===sel?'on':''}" data-sel="${i}"><canvas id="tc${i}"></canvas><button class="x" data-del="${i}" aria-label="Quitar">✕</button><div class="meta"><span>${esc(it.name)}</span>${it.R?`<i class="pill ${it.R.pass?'ok':'bad'}">${it.R.pass?'PASS':'FAIL'}</i>`:''}</div></div>`).join('');
  imgs.forEach((it,i)=>{ const c = $('tc'+i), k = 118/it.lum.w; c.width = 118; c.height = Math.round(it.lum.h*k); c.getContext('2d').drawImage(it.src, 0, 0, c.width, c.height); });
}
function renderTable(){
  if(!imgs.length){ $('tbl').innerHTML = ''; $('sum').textContent = ''; return; }
  $('tbl').innerHTML = `<tr><th>Imagen</th><th>Es</th><th>Resultado</th><th>Área</th><th>Caja</th><th>Perímetro</th><th></th></tr>` + imgs.map((it,i)=>{ const R = it.R, ok = it.expected ? (it.expected==='g') === R.pass : null;
    return `<tr><td class="n">${esc(it.name)}</td><td><span class="exp"><button class="g" data-exp="${i}|g" aria-pressed="${it.expected==='g'}">Buena</button><button class="m" data-exp="${i}|m" aria-pressed="${it.expected==='m'}">Mala</button></span></td>
      <td><i class="pill ${R.pass?'ok':'bad'}">${R.pass?'PASS':'FAIL'}</i></td>${R.checks.map(c=>`<td class="${c.ok?'':'bad'}">${fmtV(c)}</td>`).join('')}<td>${ok===null?'':ok?'✓':'<b style="color:var(--bad)">✗</b>'}</td></tr>`; }).join('');
  const marked = imgs.filter(i=>i.expected), good = marked.filter(it=>(it.expected==='g')===it.R.pass).length;
  $('sum').innerHTML = marked.length ? `${good} de ${marked.length} imágenes marcadas quedan bien clasificadas${good===marked.length?' ✓':''}` : '';
}
function renderParams(){
  const B = fromLine(base);
  document.querySelectorAll('#sm button').forEach(b=>b.setAttribute('aria-pressed', +b.dataset.sm===V.SM));
  $('ctrls').innerHTML = CTRLS.map(([k,n,a,b,st])=>`<label class="${k!=='GAIN' && B[k]!==V[k]?'ch':''}"><span>${n}<input type="number" step="${st}" min="${a}" max="${b}" value="${V[k]}" data-k="${k}"></span><input type="range" min="${a}" max="${b}" step="${st}" value="${V[k]}" data-k="${k}"></label>`).join('');
  renderOut();
}
function renderOut(){
  const B = fromLine(base), line = formatVIS(base, V);
  $('outLine').textContent = line;
  const ch = VIS_KEYS.filter(k=>B[k]!==V[k]).map(k=>`${k} ${B[k]} → ${V[k]}`);
  $('chg').innerHTML = ch.length ? ch.map(t=>`<span>${esc(t)}</span>`).join('') : '<span style="background:var(--bg)">Sin cambios contra tu línea actual</span>';
}
function renderAll(){ renderViewer(); renderThumbs(); renderTable(); }

/* ---------- sugerir rangos ---------- */
$('suggest').onclick = () => {
  const goods = imgs.filter(i=>i.expected==='g' && i.R.best), bads = imgs.filter(i=>i.expected==='m' && i.R.best);
  if(!goods.length){ $('sugnote').innerHTML = 'Marca al menos una imagen como <b>Buena</b>.'; return; }
  const metric = {A:r=>r.areaPct, B:r=>r.boxPct, P:r=>r.perim}, keys = {A:['AMN','AMX',.5], B:['BMN','BMX',.5], P:['PMN','PMX',50]}, notes = [];
  for(const m of ['A','B','P']){
    const gv = goods.map(i=>metric[m](i.R)), lo = Math.min(...gv), hi = Math.max(...gv), bv = bads.map(i=>metric[m](i.R));
    const below = bv.filter(v=>v<lo), above = bv.filter(v=>v>hi), [kmn, kmx, step] = keys[m], q = v=>Math.round(v/step)*step;
    // límite a la mitad entre la buena más extrema y la mala más cercana; si no hay malas de ese lado, 15 % de margen
    V[kmn] = Math.max(0, q(below.length ? (lo + Math.max(...below))/2 : lo*0.85));
    V[kmx] = q(above.length ? (hi + Math.min(...above))/2 : hi*1.15);
    if(below.length || above.length) notes.push(`${kmn}/${kmx} separa ${below.length+above.length} mala(s)`);
  }
  save(); renderParams(); reanalyze(true);
  const left = imgs.filter(i=>i.expected==='m' && i.R.pass).length;
  $('sugnote').innerHTML = `Rangos ajustados a las buenas${notes.length?' ('+esc(notes.join(' · '))+')':''}. ${left ? `<b>${left} mala(s) siguen pasando</b>: con área, caja y perímetro no se separan; prueba otro umbral (ST) o la ROI.` : bads.length ? '<b>Todas las malas fallan y las buenas pasan.</b>' : 'Sube también imágenes malas para comprobar que fallen.'}`;
};

/* ---------- eventos ---------- */
document.addEventListener('input', e=>{ const k = e.target.dataset.k; if(!k) return; const v = parseFloat(e.target.value); if(!isFinite(v)) return; V[k] = v;
  document.querySelectorAll(`[data-k="${k}"]`).forEach(x=>{ if(x!==e.target) x.value = v; }); save(); renderOut(); reanalyze(false);
  const B = fromLine(base); e.target.closest('label')?.classList.toggle('ch', k!=='GAIN' && B[k]!==V[k]); });
document.addEventListener('click', e=>{ const g = s=>e.target.closest(s); let x;
  if(x = g('[data-del]')){ e.stopPropagation(); imgs.splice(+x.dataset.del, 1); sel = Math.max(0, Math.min(sel, imgs.length-1)); renderAll(); return; }
  if(x = g('[data-sel]')){ sel = +x.dataset.sel; renderAll(); return; }
  if(x = g('[data-exp]')){ const [i, v] = x.dataset.exp.split('|'); imgs[i].expected = imgs[i].expected===v ? null : v; renderTable(); return; }
  if(x = g('[data-sm]')){ V.SM = +x.dataset.sm; save(); renderParams(); reanalyze(true); }
});
$('base').value = base;
$('base').addEventListener('input', ()=>{ base = $('base').value; save(); renderParams(); });
$('loadBase').onclick = () => { base = $('base').value.trim() || FILE_LINE; V = {...fromLine(base), GAIN:1}; save(); renderParams(); reanalyze(true); };
$('copy').onclick = async () => { const t = $('outLine').textContent; try{ await navigator.clipboard.writeText(t); $('copy').textContent = 'Copiada ✓'; }catch(e){ const r = document.createRange(); r.selectNodeContents($('outLine')); getSelection().removeAllRanges(); getSelection().addRange(r); $('copy').textContent = 'Selecciónala y copia'; } setTimeout(()=>$('copy').textContent = 'Copiar línea VIS', 1600); };
renderParams(); renderAll();
