/* Kasalis 3D — UI: reproducción del ciclo, cámara que sigue la pieza, cámaras simuladas (VIS de dispensado y AA),
   fallas ligadas a su flujo de resolución (Fallas Kasalis) y parámetros. */
import {createScene} from './scene.js';
import {DEFAULTS, ASSUMED, LABELS, STATIONS, buildCycle} from './cycle.js';
import {VIS_DEFAULTS, renderDispCam, analyzeVIS, drawVISOverlay, drawPattern, aaState, values, tilt, renderSensorCam, renderTF, ZONES, ZNAME, ZCOL, LIMIT} from './vision.js';
import {FALLAS} from '../../buscador-kasalis/data/fallas.js';
import {CODES} from '../../shared/kasalis-codes.js';
import {englishName, originalName} from '../../shared/kasalis.js';
import {procBtn, openProc} from '../../shared/procs.js';

const $ = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const load = (k, d) => { try{ return {...d, ...JSON.parse(localStorage.getItem(k)||'{}')}; }catch(e){ return {...d}; } };
const store = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
let P = load('jd_k3d_params', DEFAULTS), V = load('jd_k3d_vis', VIS_DEFAULTS);
const CODE_NAME = Object.fromEntries([...CODES.plc.map(r=>[String(r[0]), r[1]]), ...CODES.ksv.map(r=>[String(r[0]), r[1]])]);
const theme = () => document.documentElement.dataset.theme;

const S = await createScene($('stage'), 'models/kasalis.glb');
S.setTheme(theme());
addEventListener('jdtheme', e=>{ S.setTheme(e.detail); document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(); camKey = ''; });
$('loading').classList.add('out');

/* ---------- qué hace cada falla en la simulación ---------- */
const FX = {
  '233':{bead:'gap', note:'El cordón no cierra el círculo. Ojo: la VIS lo puede pasar como bueno porque el área y la caja quedan en rango (así pasó en piso). Revisa el enfoque de la cámara y las line lights.'},
  '230':{bead:'none', note:'No sale DELO: la VIS falla por área.'},
  '235':{bead:'thin', note:'Nivel bajo de DELO: el cordón sale delgado y la VIS falla por área.'},
  '277':{bead:'thin', note:'Presión de dispensado baja: cordón delgado.'},
  '236':{note:'Pot life vencido: la máquina no deja seguir hasta cambiar el DELO.'},
  '222':{pattern:false, note:'La pre-inspección no encuentra el patrón del lens adapter (pieza mal asentada, luz o patrón equivocado).'},
  '-222':{grab:false, note:'La cámara de dispensado no entrega imagen (timeout).'},
  '231':{note:'No abre la cámara del sensor en dispensado: pogo / interposer. Primero pasar la golden.'},
  '242':{particles:true, note:'El sensor detecta partículas antes de dispensar.'},
  '606':{note:'Partículas en la estación spare con la pieza ya ensamblada.'}, '604':{note:'No abre la cámara en spare.'},
  '403':{note:'El rotary no llegó a posición.'}, '426':{note:'No detecta vacío en la fixtura.'},
  '10':{note:'MES no da el siguiente dispositivo.'}, '12':{note:'El serial no pasa la validación de MES (revisión, paso anterior).'},
};
const RETEST_CODES = ['161','162','163','165','175'];
const fx = () => FX[fault] || {};

/* ---------- ciclo ---------- */
let C, t = 0, playing = true, speed = 1, fault = null, tab = 'steps', lastStep = -1, pauseAt = null, cardOpen = false, camMin = false, camView = 'chart', big = null, camKey = '';
const SPEEDS = [1, 2, 5, 10];
const fmt = s => s>=60 ? `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')} min` : `${s.toFixed(s<10?1:0)} s`;
function rebuild(keepT){
  S.buildBead(P);
  const frac = C ? t / C.total : 0;
  C = buildCycle(P, S.geo);
  t = keepT ? frac * C.total : 0; lastStep = -1;
  $('sub').textContent = `${P.mode==='retest'?'RETEST':'BUILD'} · ${fmt(C.total)} · ${(3600/C.total).toFixed(0)} UPH`;
  document.querySelectorAll('#mode button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.m===P.mode));
  $('tl').innerHTML = C.steps.map(s=>`<i style="flex:${s.dur};--c:${STATIONS[s.st].color}" class="${fault && (s.codes||[]).includes(fault)?'f':''}"></i>`).join('') + '<span class="ph" id="ph"></span>';
  renderPane();
}
const ease = x => x<.5 ? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
const lerp = (a,b,k) => a + (b-a)*k;
function poseAt(time){
  let i = C.steps.findIndex(s=>time < s.t1); if(i < 0) i = C.steps.length - 1;
  const s = C.steps[i], p = Math.min(1, Math.max(0, (time - s.t0) / s.dur)), k = ease(p);
  const a = s.from, b = s.toPose, o = {};
  for(const key in a){
    if(Array.isArray(a[key])) o[key] = a[key].map((x,j)=>lerp(x, b[key][j], k));
    else if(typeof a[key]==='number') o[key] = lerp(a[key], b[key], k);
    else o[key] = p < 1 ? a[key] : b[key];
  }
  if(s.swap){ const src = p < .5 ? a : b; Object.assign(o, {lens:src.lens, bead:src.bead, piece: p<.5 ? 1-2*p : 2*p-1}); }
  if(s.fx==='arc'){
    const acc = .08, u = p<acc ? p*p/(2*acc) : p>1-acc ? (1-acc) - (1-p)*(1-p)/(2*acc) : p - acc/2, prog = Math.min(1, u/(1-acc));
    o.disp = S.geo.arcAt(P.SA + P.IA*prog, P);
    const deg = P.IA*prog, on0 = P.LI/(Math.PI*P.XR)*180, on1 = P.IA - P.LO;
    o.bead = Math.min(1, Math.max(0, (deg - on0)/(on1 - on0)));
  }
  if(s.fx==='prefocus') o.align = o.align.map((x,j)=> j===1 ? x + 2.5*Math.sin(p*Math.PI*2) : j===0 ? x + .6*Math.sin(p*Math.PI*4) : x);
  if(s.fx==='scan') o.align = o.align.map((x,j)=> j===1 ? x + 5*Math.sin(p*Math.PI*6)*(1-p) : x);
  return {pose:o, step:s, idx:i, p};
}

/* ---------- tarjeta del paso (una línea) ---------- */
function renderCard(s, idx){
  const st = STATIONS[s.st];
  const chips = [...(s.params||[]).map(x=>`<span>${esc(x)}</span>`), ...(s.codes||[]).map(c=>`<a href="#" data-code="${c}" class="${fault==c?'on':''}">${c}</a>`)];
  $('card').className = 'step-pill glass' + (cardOpen ? ' open' : '');
  $('card').style.setProperty('--c', st.color);
  $('card').innerHTML = `<div class="row"><i></i><b>${esc(s.title)}</b>${fault && (s.codes||[]).includes(fault) ? `<em>${fault}</em>` : ''}<span id="clock"></span></div>
    <div class="more">${s.desc?`<p>${esc(s.desc)}</p>`:''}${chips.length?`<div class="chips">${chips.join('')}</div>`:''}</div>`;
}

/* ---------- cámara PiP ---------- */
const CAM_DISP = new Set(['disp_pre','disp_prt','disp_go','disp_arc','disp_sb','disp_vis']);
const camCtx = s => CAM_DISP.has(s.id) ? 'disp' : (s.st==='align' && s.id!=='align_done') ? 'aa' : null;
const ICO = {min:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 12h12"/></svg>', open:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>', big:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>'};
let visVariant = 'ok';
function dispState(step, pose){
  const f = fx();
  return {bead: step.id==='disp_vis' || step.id==='disp_sb' ? 1 : pose.bead, variant: f.bead || visVariant, pattern: f.pattern!==false, grab: f.grab!==false, particles: !!f.particles};
}
function updateCam(step, pose, p){
  const ctx = camCtx(step), el = $('cam');
  if(!ctx){ el.hidden = true; camKey = ''; return; }
  el.hidden = false;
  if(ctx==='disp'){
    const ds = dispState(step, pose), key = `d|${step.id}|${ds.bead.toFixed(2)}|${ds.variant}|${ds.pattern}|${ds.grab}|${ds.particles}|${camMin}|${JSON.stringify(V)}|${theme()}`;
    if(key===camKey) return; camKey = key;
    const title = step.id==='disp_vis' ? 'VIS · post-inspección' : step.id==='disp_pre' ? 'Pre-inspección · patrón' : step.id==='disp_prt' ? 'Prueba de partículas' : 'Cámara de dispensado';
    el.className = 'cam glass' + (camMin?' min':'');
    el.innerHTML = `<div class="hd"><span>${title}</span><button data-cam="big" aria-label="Ampliar">${ICO.big}</button><button data-cam="min" aria-label="Plegar">${camMin?ICO.open:ICO.min}</button></div><div class="bd"><canvas id="cv1"></canvas><div class="res" id="cres"></div></div>`;
    if(camMin) return;
    const cv = $('cv1'), R0 = renderDispCam(cv, ds, V);
    let res = '';
    if(!R0.L){ res = `<span class="bad">${esc(R0.fail)}</span>`; }
    else if(step.id==='disp_vis'){ const R = analyzeVIS(R0.L, V); drawVISOverlay(cv, R0.L, R, 'overlay');
      res = `<span class="${R.pass?'ok':'bad'}">${R.pass?'PASS':'FAIL'}</span>` + R.checks.map(c=>`<span class="${c.ok?'':'bad'}">${c.n} ${c.u==='%'?c.v.toFixed(1)+' %':Math.round(c.v)+' px'}</span>`).join(''); }
    else if(step.id==='disp_pre'){ drawPattern(cv, ds.pattern); res = `<span class="${ds.pattern?'ok':'bad'}">${ds.pattern?'Patrón OK':'Patrón no encontrado'}</span><span>EXP ${P.preEXP} ms · LL 100</span>`; }
    else if(step.id==='disp_prt'){ res = `<span class="${ds.particles?'bad':'ok'}">${ds.particles?'Partículas (242)':'Sin partículas'}</span><span>PRT STN=1</span>`; }
    else res = `<span>DR ${P.DR} %</span><span>${Math.round(ds.bead*100)} % del arco</span>`;
    $('cres').innerHTML = res;
  } else {
    const a = aaState(step.id, p, fault); if(!a){ el.hidden = true; return; }
    const key = `a|${step.id}|${p.toFixed(3)}|${fault}|${camMin}|${camView}|${theme()}`; if(key===camKey) return; camKey = key;
    const mob = innerWidth < 700;
    el.className = 'cam glass' + (camMin?' min':'');
    el.innerHTML = `<div class="hd"><span>Cámara del sensor · AA</span><button data-cam="big" aria-label="Ampliar">${ICO.big}</button><button data-cam="min" aria-label="Plegar">${camMin?ICO.open:ICO.min}</button></div>
      <div class="bd">${mob?`<div class="sw"><button data-cv="img" aria-pressed="${camView==='img'}">Targets</button><button data-cv="chart" aria-pressed="${camView==='chart'}">Gráfica</button></div>`:''}
      ${!mob||camView==='img'?'<canvas id="cv1"></canvas>':''}${!mob||camView==='chart'?'<canvas id="cv2" class="tf"></canvas>':''}<div class="res" id="cres"></div><div class="msg">${esc(a.msg)}</div></div>`;
    if(camMin) return;
    if($('cv1')) renderSensorCam($('cv1'), a);
    if($('cv2')) renderTF($('cv2'), a, theme());
    if(a.curves && a.phase!=='scan'){ const v = values(a); $('cres').innerHTML = ZONES.map(k=>`<span style="color:${ZCOL[k]}" class="${v[k]<LIMIT?'bad':''}">${k==='C'?'C':k} ${Math.round(v[k]*100)} %</span>`).join(''); }
    else if(a.phase==='scan') $('cres').innerHTML = `<span>Z ${a.z>0?'+':''}${a.z.toFixed(1)} µm</span>`;
  }
  if(big) renderBig();
}

/* ---------- vista ampliada ---------- */
const SLIDERS = [['ST','Umbral ST (−1 auto)',-1,100,1],['SH','Histograma SH (auto)',0,100,1],['LL','Line light LL',0,100,1],['LD','DOAL LD',0,100,1],['EXP','Exposición EXP',10,300,1],['RL','ROI izq. RL',0,50,1],['RT','ROI arriba RT',0,50,1],['RR','ROI der. RR',50,100,1],['RB','ROI abajo RB',50,100,1],
  ['AMN','Área mín. AMN',0,50,.5],['AMX','Área máx. AMX',0,60,.5],['BMN','Caja mín. BMN',0,100,1],['BMX','Caja máx. BMX',0,100,1],['PMN','Perím. mín. PMN',0,15000,100],['PMX','Perím. máx. PMX',0,20000,100]];
let bigKey = '';
function renderBig(){
  const {step, pose, p} = poseAt(t), el = $('big');
  if(big==='vis'){
    const ds = {...dispState(step, pose), bead: CAM_DISP.has(step.id) && step.id!=='disp_vis' && step.id!=='disp_sb' ? pose.bead : 1};
    const key = `v|${ds.bead.toFixed(2)}|${ds.variant}|${ds.pattern}|${ds.grab}|${JSON.stringify(V)}`; if(key===bigKey && !el.hidden) return; bigKey = key;
    const first = el.hidden || !el.querySelector('#bv1'); el.hidden = false;
    if(first) el.innerHTML = `<div class="bh"><b>VIS · simulador de la inspección post-dispensado</b><a class="btn dark" href="vis.html" style="width:auto;margin:0;padding:0 14px;height:36px">Probar con imagen real ↗</a><button data-big="close" aria-label="Cerrar">✕</button></div><div class="bb">
      <div><div class="imgs"><div><small>Imagen original</small><canvas id="bv1"></canvas></div><div><small>Detección (verde = PASS · rojo = FAIL o no cuenta)</small><canvas id="bv2"></canvas></div></div>
        <div class="verdict" id="bverd" style="margin-top:12px"></div><div class="meter" id="bmeter" style="margin-top:10px"></div></div>
      <div><div class="lb" style="margin-top:0">Cordón</div><div class="var" id="bvar"></div>
        <div class="lb">Parámetros VIS (del archivo)</div><div class="ctrls">${SLIDERS.map(([k,n,a,b,st])=>`<label><span>${n}<b id="vv_${k}">${V[k]}</b></span><input type="range" min="${a}" max="${b}" step="${st}" value="${V[k]}" data-vis="${k}"></label>`).join('')}</div>
        <button class="btn" data-big="visreset">Regresar a los valores del archivo</button>
        <div class="simnote">Verde = material detectado y PASS; rojo = FAIL o regiones que no cuentan. Solo se mide la región conectada más grande. SM=1 detecta objetos claros: el DELO brilla con la line light (LL) y lo demás queda oscuro. Si subes la DOAL (LD) o bajas el umbral (ST), también se detectan el sensor y la fixtura y el perímetro se dispara, como en tu captura con ST=13.</div></div></div>`;
    $('bvar').innerHTML = [['ok','Normal'],['gap','Incompleto'],['thin','Poco DELO'],['offset','Desfasado'],['none','Sin DELO']].map(([k,n])=>`<button data-var="${k}" aria-pressed="${ds.variant===k}">${n}</button>`).join('');
    const R0 = renderDispCam($('bv1'), ds, V);
    if(!R0.L){ $('bverd').innerHTML = `<span style="color:var(--bad)">FAIL</span><small>${esc(R0.fail)}</small>`; $('bmeter').innerHTML = ''; return; }
    const R = analyzeVIS(R0.L, V); $('bv2').width = 320; $('bv2').height = 256; drawVISOverlay($('bv2'), R0.L, R, 'mask');
    $('bverd').innerHTML = `<span style="color:${R.pass?'var(--ok)':'var(--bad)'}">${R.pass?'PASS':'FAIL'}</span><small>${R.pass?(ds.variant==='gap'?'Pasa aunque el círculo está incompleto: área y caja siguen en rango':'Dentro de todos los rangos'):R.checks.filter(c=>!c.ok).map(c=>`${c.n} fuera de ${c.a}–${c.b}${c.u==='%'?' %':' px'}`).join(' · ')}</small>`;
    $('bmeter').innerHTML = R.checks.map(c=>{ const mx = c.u==='%' ? 100 : 20000, pos = v=>Math.min(100, v/mx*100);
      return `<div><small>${c.n} (${c.a}–${c.b}${c.u==='%'?' %':' px'})</small><b class="${c.ok?'ok':'bad'}">${c.u==='%'?c.v.toFixed(1)+' %':Math.round(c.v)}</b><div class="bar"><i style="left:${pos(c.a)}%;right:${100-pos(c.b)}%"></i><u style="left:${pos(c.v)}%"></u></div></div>`; }).join('');
  } else if(big==='aa'){
    const a = aaState(step.id, p, fault) || aaState('align_home', 1, fault), v = values(a), T = tilt(a.zpk0);
    const key = `a|${step.id}|${p.toFixed(3)}|${fault}|${theme()}`; if(key===bigKey && !el.hidden) return; bigKey = key;
    const first = el.hidden || !el.querySelector('#bz'); el.hidden = false;
    if(first) el.innerHTML = `<div class="bh"><b>Active Alignment · lo que ve la Kasalis</b><button data-big="close" aria-label="Cerrar">✕</button></div><div class="bb">
      <div><div class="imgs"><div><small>Imagen del sensor (5 targets, ROI en el borde inclinado)</small><canvas id="bv1"></canvas></div><div><small>SFR @ Ny/4 vs Z (through-focus)</small><canvas id="bv2" class="tf"></canvas></div></div>
        <div class="simnote" id="bmsg"></div>
        <div class="lb">Cómo calcula la SFR</div><div class="pipe"><span>Imagen del sensor</span><i>→</i><span>ROI con borde inclinado</span><i>→</i><span>ESF → LSF → FFT</span><i>→</i><span>SFR(f)</span></div>
        <p style="font-size:13px;color:var(--ink2);margin:8px 2px 0">La AA toma la SFR a una frecuencia (Ny/4) en 5 zonas mientras barre Z. El pico de cada curva es donde esa zona está enfocada; con la diferencia entre picos calcula el tilt y la Z, mueve el lente y hace lock. La EOL mide lo mismo pero solo compara contra spec, sin mover nada.</p></div>
      <div><div class="lb" style="margin-top:0" id="bzt"></div><table class="ztab" id="bz"></table>
        <div class="lb">Tilt y Z (de los picos del scan)</div><div class="tiltx" id="btilt"></div>
        <div class="simnote">Límite de ${Math.round(LIMIT*100)} % y ancho de curva supuestos. Los valores son de ejemplo, como en el Tutorial Active Alignment; con datos reales de tu AA se ajustan.</div></div></div>`;
    $('bmsg').textContent = a.msg; $('bzt').textContent = a.phase==='scan' ? 'Zonas (en este Z)' : 'Zonas (en lock)';
    $('bz').innerHTML = ZONES.map(k=>`<tr><td><i style="background:${ZCOL[k]}"></i>${ZNAME[k]}</td><td style="color:${v[k]<LIMIT?'var(--bad)':'inherit'}">${Math.round(v[k]*100)} %</td></tr>`).join('');
    $('btilt').innerHTML = `<span style="color:#f472b6">Z<sub>pico</sub> der − izq = ${T.rl>0?'+':''}${T.rl.toFixed(1)} µm → θY ≈ ${T.ty>0?'+':''}${T.ty.toFixed(2)}°</span><br><span style="color:#d4a90a">Z<sub>pico</sub> arriba − abajo = ${T.tb>0?'+':''}${T.tb.toFixed(1)} µm → θX ≈ ${T.tx>0?'+':''}${T.tx.toFixed(2)}°</span><br>Z pico medio ${T.zm>0?'+':''}${T.zm.toFixed(1)} µm`;
    renderSensorCam($('bv1'), a); renderTF($('bv2'), a, theme());
  }
}
function closeBig(){ big = null; bigKey = ''; $('big').hidden = true; }

/* ---------- panel: pasos, fallas, parámetros ---------- */
function flowHTML(f){
  return `<div class="flow">${f.flujo.map((s,i)=>`<div class="fs"><div class="n">${i+1}</div><div><b>${esc(s.p)}</b>${s.d?`<div class="d">${esc(s.d)}</div>`:''}${s.si?`<div class="br si"><em>SÍ</em><span>${esc(s.si)}</span></div>`:''}${s.no?`<div class="br no"><em>NO</em><span>${esc(s.no)}</span></div>`:''}${s.proc?procBtn(s.proc):''}</div></div>`).join('')}</div>`;
}
function faultHTML(code){
  const f = FALLAS.find(x=>x.codigos.includes(String(code))), step = C.steps.find(s=>(s.codes||[]).includes(String(code)));
  const aa = step && step.st==='align' ? aaState(step.id, step.fx==='scan' ? .9 : 1, code) : null;
  const note = (FX[code]||{}).note || (aa && aa.msg) || '';
  let h = `<div class="fhead"><small>${step?STATIONS[step.st].name+' · '+esc(step.title):'Fuera de este ciclo'}</small><h3>${esc(code)} · ${esc(CODE_NAME[code]||'')}</h3><div style="font:11px ui-monospace,Menlo,monospace;opacity:.7;margin:-2px 0 6px">${esc(originalName(CODE_NAME[code]||'', +code<0?'ksv':'plc'))} · ${esc(englishName(CODE_NAME[code]||''))}</div>${f?`<p>${esc(f.titulo)} — ${esc(f.corto)}</p>`:''}</div>`;
  if(note) h += `<div class="simnote"><b>En la simulación:</b> ${esc(note)}</div>`;
  if(f){ h += `<div class="lb">Qué hacer, en orden</div>${flowHTML(f)}`;
    if(f.causas.length) h += `<div class="lb">Causas vistas → solución</div><div class="ca">${f.causas.map(([a,b])=>`<div><span>${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div>`;
    if(f.tips.length) h += `<div class="lb">Para recordar</div><div class="tips">${f.tips.map(x=>`<div>${esc(x)}</div>`).join('')}</div>`; }
  h += `<a class="link" href="../buscador-kasalis/#c/${code}${+code<0?'|ksv':''}"><span>Abrir ${code} en Fallas Kasalis</span><span>↗</span></a>`;
  h += `<button class="btn dark" data-replay="1">Ver otra vez en la simulación</button><button class="btn" id="clearFault">Quitar falla</button>`;
  return h;
}
function renderPane(){
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.t===tab));
  let h = '';
  if(tab==='steps'){
    h += `<div class="sum"><div><small>Ciclo</small><b>${fmt(C.total)}</b></div><div><small>UPH (1 plato)</small><b>${(3600/C.total).toFixed(1)}</b></div><div><small>Arco ARC</small><b>${C.arcL.toFixed(0)} mm</b></div></div>`;
    h += C.steps.map((s,i)=>`<button class="stepbtn" data-i="${i}" style="--c:${STATIONS[s.st].color}"><i></i><span><b>${esc(s.title)}</b><small>${STATIONS[s.st].name}${(s.codes||[]).length?' · '+s.codes.join(', '):''}</small></span><em>${fmt(s.dur)}</em></button>`).join('');
    h += `<div class="lb">Vista</div><div class="views">${[['follow','Seguir la pieza'],['iso','Toda la máquina'],['top','Arriba'],['load','Carga'],['disp','Dispensado'],['align','Alineación'],['spare','Spare']].map(([k,n])=>`<button data-view="${k}">${n}</button>`).join('')}</div>`;
    h += `<div class="lb">Cámaras</div><div class="views"><button data-big="vis">Simulador VIS</button><button data-big="aa">Gráfica AA y targets</button><button onclick="location.href='vis.html'">Laboratorio VIS (imagen real) ↗</button></div>`;
  } else if(tab==='params'){
    h += Object.keys(LABELS).map(k=>`<label class="prm"><span>${LABELS[k]}${ASSUMED.has(k)?'<small>supuesto</small>':''}</span><input type="number" step="any" data-k="${k}" value="${P[k]}"></label>`).join('');
    h += `<div class="lb">Línea ARC del archivo</div><div class="chips" style="margin-top:0">${['arcX','arcY','XR','YR','SA','IA','VS','VA','LI','LO','DR','SR','ST','ZR'].map(k=>`<span>${k.replace('arc','')} ${P[k]}</span>`).join('')}</div>`;
    h += `<button class="btn" id="reset">Regresar a los valores del archivo</button>`;
  } else {
    if(fault) h += faultHTML(fault) + `<div class="lb">Otra falla</div>`;
    else h += `<p style="margin:2px 2px 6px;color:var(--ink2);font-size:13.5px">Elige un código: la simulación va al paso donde ocurre, lo muestra en la máquina y en las cámaras, y aquí ves qué hacer en orden.</p>`;
    const groups = {}; const add = (st,c)=>{ (groups[st] ||= new Set()).add(c); };
    for(const m of ['build','retest']) buildCycle({...P, mode:m}, S.geo).steps.forEach(s=>(s.codes||[]).forEach(c=>add(s.st,c)));
    h += Object.entries(groups).map(([st,cs])=>`<div class="lb">${STATIONS[st].name}</div><div class="codes">${[...cs].map(c=>`<button data-fault="${c}" class="${fault==c?'on':''}" title="${esc(CODE_NAME[c]||'')}">${c}</button>`).join('')}</div>`).join('');
  }
  $('pane').innerHTML = h;
  if(tab==='fault' && fault) $('pane').scrollTop = 0;
}

/* ---------- acciones ---------- */
const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>', ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
const setPlay = v => { playing = v; $('play').innerHTML = v ? ICON_PAUSE : ICON_PLAY; };
function seekStep(i){ i = (i + C.steps.length) % C.steps.length; t = C.steps[i].t0 + 0.0001; lastStep = -1; pauseAt = null; jumped = true; }
let jumped = true;
function setFollow(on){ S.setFollow(on); $('followBtn').setAttribute('aria-pressed', on); $('followPill').hidden = on; }
S.onUnfollow = () => { $('followBtn').setAttribute('aria-pressed', false); $('followPill').hidden = false; };
/* Elegir una falla: va al paso (uno antes en alineación para ver el contexto), reproduce y se detiene al final del paso. */
function setFault(code){
  fault = code ? String(code) : null;
  if(fault && RETEST_CODES.includes(fault) && P.mode!=='retest'){ P.mode = 'retest'; store('jd_k3d_params', P); }
  tab = 'fault'; rebuild(false);
  const s = fault ? C.steps.find(x=>(x.codes||[]).includes(fault)) : null;
  S.highlight(s ? s.st : null);
  if(s){ const i = C.steps.indexOf(s); seekStep(Math.max(0, i - (s.st==='align' && i>0 ? 1 : 0))); pauseAt = s.t1 - 0.02; setPlay(true); setFollow(true); }
  camKey = ''; bigKey = ''; lastStep = -1;
}
$('play').onclick = ()=>{ pauseAt = null; setPlay(!playing); };
$('prev').onclick = ()=>{ const {idx, p} = poseAt(t); seekStep(p > .15 ? idx : idx-1); };
$('next').onclick = ()=>{ const {idx} = poseAt(t); seekStep(idx+1); };
$('spd').onclick = ()=>{ speed = SPEEDS[(SPEEDS.indexOf(speed)+1) % SPEEDS.length]; $('spd').textContent = speed+'×'; };
$('followBtn').onclick = ()=> setFollow($('followBtn').getAttribute('aria-pressed')!=='true');
$('followPill').onclick = ()=> setFollow(true);
document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>{ P.mode = b.dataset.m; store('jd_k3d_params', P); fault = null; S.highlight(null); rebuild(false); });
$('tabs').onclick = e=>{ const b = e.target.closest('[data-t]'); if(b){ tab = b.dataset.t; renderPane(); } };
document.addEventListener('click', e=>{
  const g = s => e.target.closest(s); let x;
  if(x = g('[data-proc]')){ e.preventDefault(); openProc(x.dataset.proc); return; }
  if(x = g('[data-code]')){ e.preventDefault(); setFault(fault==x.dataset.code ? null : x.dataset.code); if(fault) openSheet(); return; }
  if(g('#card')){ cardOpen = !cardOpen; $('card').classList.toggle('open', cardOpen); return; }
  if(x = g('[data-cam]')){ if(x.dataset.cam==='min'){ camMin = !camMin; } else { const {step} = poseAt(t); big = camCtx(step)==='disp' ? 'vis' : 'aa'; bigKey = ''; $('big').innerHTML = ''; renderBig(); } camKey = ''; return; }
  if(x = g('[data-cv]')){ camView = x.dataset.cv; camKey = ''; return; }
  if(x = g('[data-big]')){ const k = x.dataset.big;
    if(k==='close') closeBig();
    else if(k==='visreset'){ V = {...VIS_DEFAULTS}; store('jd_k3d_vis', V); visVariant = 'ok'; $('big').innerHTML = ''; bigKey = ''; renderBig(); camKey = ''; }
    else { big = k; bigKey = ''; $('big').innerHTML = ''; closeSheet(); renderBig(); } return; }
  if(x = g('[data-var]')){ visVariant = x.dataset.var; bigKey = ''; renderBig(); camKey = ''; return; }
  if(x = g('[data-i]')){ seekStep(+x.dataset.i); closeSheet(); return; }
  if(x = g('[data-view]')){ x.dataset.view==='follow' ? setFollow(true) : S.view(x.dataset.view); closeSheet(); return; }
  if(x = g('[data-fault]')){ setFault(fault==x.dataset.fault ? null : x.dataset.fault); return; }
  if(g('[data-replay]')){ setFault(fault); closeSheet(); return; }
  if(g('#clearFault')){ setFault(null); return; }
  if(g('#reset')){ const m = P.mode; P = {...DEFAULTS, mode:m}; store('jd_k3d_params', P); rebuild(true); return; }
  if(x = g('.st-label')){ const k = [...x.classList].find(c=>STATIONS[c]); if(k) S.view(k); }
});
document.addEventListener('input', e=>{ const k = e.target.dataset.vis; if(!k) return; V[k] = parseFloat(e.target.value); store('jd_k3d_vis', V); const o = $('vv_'+k); if(o) o.textContent = V[k]; renderBig(); camKey = ''; });
$('pane').addEventListener('change', e=>{ const k = e.target.dataset.k; if(!k) return; const v = parseFloat(e.target.value); if(isFinite(v) && v>=0){ P[k] = v; store('jd_k3d_params', P); rebuild(true); } });
const tlSeek = e => { const r = $('tl').getBoundingClientRect(); t = Math.min(.9999, Math.max(0, (e.clientX - r.left)/r.width)) * C.total; lastStep = -1; pauseAt = null; jumped = true; };
$('tl').addEventListener('pointerdown', e=>{ tlSeek(e); $('tl').setPointerCapture(e.pointerId); $('tl').onpointermove = tlSeek; });
$('tl').addEventListener('pointerup', ()=>{ $('tl').onpointermove = null; });
function openSheet(){ if(innerWidth >= 1100) return; const s = $('sheet'), c = $('scrim'); c.hidden = false; requestAnimationFrame(()=>{ s.classList.add('on'); c.classList.add('on'); }); }
function closeSheet(){ const s = $('sheet'), c = $('scrim'); s.classList.remove('on'); c.classList.remove('on'); setTimeout(()=>c.hidden = true, 300); }
$('menu').onclick = openSheet; $('scrim').onclick = closeSheet;
addEventListener('keydown', e=>{ if(e.target.matches('input')) return; if(e.code==='Space'){ e.preventDefault(); $('play').click(); } if(e.key==='ArrowRight') $('next').click(); if(e.key==='ArrowLeft') $('prev').click(); if(e.key==='Escape'){ closeSheet(); closeBig(); } });

/* ---------- loop ---------- */
rebuild(false); setPlay(true);
let last = performance.now();
function loop(now){
  const dt = Math.min(.1, Math.max(0, (now - last)/1000)); last = now;
  if(playing){ t = (t + dt*speed) % C.total; if(pauseAt!==null && t >= pauseAt){ t = pauseAt; setPlay(false); pauseAt = null; } }
  const {pose, step, idx, p} = poseAt(t);
  S.apply(pose, {bead: fx().bead});
  if(idx !== lastStep){ lastStep = idx; renderCard(step, idx); S.followStation(step.st); if(jumped){ S.snapFollow(); jumped = false; }
    document.querySelectorAll('#tl i').forEach((el,i)=>el.classList.toggle('done', i<=idx));
    document.querySelectorAll('.stepbtn').forEach((el,i)=>el.classList.toggle('on', i===idx));
    document.querySelectorAll('.st-label').forEach(el=>el.classList.toggle('now', el.classList.contains(step.st))); }
  updateCam(step, pose, p);
  $('ph').style.left = (t/C.total*100)+'%';
  const ck = $('clock'); if(ck) ck.textContent = `${fmt(t)} / ${fmt(C.total)}`;
  S.render(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__k3d = {S, get C(){ return C; }, get t(){ return t; }, set t(v){ t = v; lastStep = -1; jumped = true; }, setPlay, setFault, P, V};
