/* Cámaras simuladas de la Kasalis (sin 3D):
   1) Cámara de dispensado (downlooking): imagen sintética del lens adapter con el cordón de DELO y la inspección VIS
      con los parámetros del archivo (SM, ST, ROI RL/RT/RR/RB, AMN/AMX, BMN/BMX, PMN/PMX, LL, LD, EXP).
   2) Cámara del sensor en alineación: 5 targets (centro + 4 esquinas) y las curvas through-focus SFR @ Ny/4 vs Z,
      con picos, tilt y lock, como en el Tutorial Active Alignment. */

/* ======================= 1. Cámara de dispensado + VIS ======================= */
export const VIS_DEFAULTS = {LD:0, LL:100, EXP:80, SM:1, ST:50, RL:10, RT:1, RR:90, RB:99, AMN:10, AMX:25, BMN:60, BMX:80, PMN:3000, PMX:8000};
const W = 320, H = 256, PSCALE = 4;   // trabajo a 320×256; perímetro escalado a una cámara de 1280×1024
let rnd = mulberry(7);
function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const NOISE = (()=>{ const r = mulberry(11), n = new Float32Array(W*H); for(let i=0;i<n.length;i++) n[i] = (r()-.5)*0.06; return n; })();

/* s: {bead 0..1, variant:'ok'|'gap'|'thin'|'offset'|'none', pattern:true|false, grab:true|false} */
export function renderDispCam(canvas, s, V){
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d', {willReadFrequently:true});
  if(s.grab===false){ g.fillStyle = '#000'; g.fillRect(0,0,W,H); return {fail:'GRAB TIMEOUT (−222): la cámara no entregó imagen'}; }
  const flat = Math.min(1, V.EXP/80*(0.55 + 0.45*V.LL/100) + V.LD/100*0.45), spec = Math.min(1.25, V.EXP/80*V.LL/100);
  const gray = v => { const c = Math.round(Math.max(0,Math.min(1,v))*255); return `rgb(${c},${c},${c})`; };
  const cx = W/2 + (s.variant==='offset'? 26:0), cy = H/2 + (s.variant==='offset'? 14:0);
  g.fillStyle = gray(.08*flat); g.fillRect(0,0,W,H);
  // fixtura (esquinas metálicas)
  g.fillStyle = gray(.30*flat);
  [[0,0,70,40,40,0],[W,0,W-70,40,W-40,0],[0,H,70,H-36,30,H],[W,H,W-70,H-36,W-30,H]].forEach(([a,b,c,d,e,f])=>{ g.beginPath(); g.moveTo(a,b); g.lineTo(c,d); g.lineTo(e,f); g.fill(); });
  // cuerpo del lens adapter (anillo oscuro) y su borde
  g.fillStyle = gray(.16*flat); g.beginPath(); g.arc(W/2, H/2, 128, 0, 7); g.fill();
  g.strokeStyle = gray(.36*flat); g.lineWidth = 3; g.beginPath(); g.arc(W/2, H/2, 127, 0, 7); g.stroke();
  g.fillStyle = gray(.22*flat); g.beginPath(); g.arc(W/2, H/2, 110, 0, 7); g.fill();
  // hueco: se ve el sensor (die) y su área activa
  g.fillStyle = gray(.05*flat); g.beginPath(); g.arc(W/2, H/2, 92, 0, 7); g.fill();
  g.fillStyle = gray(.42*flat); g.fillRect(W/2-58, H/2-50, 116, 100);
  g.fillStyle = gray(.24*flat); g.fillRect(W/2-44, H/2-38, 88, 76);
  g.strokeStyle = gray(.47*flat); g.lineWidth = 2; g.strokeRect(W/2-58, H/2-50, 116, 100);
  // partículas sobre el sensor (242)
  if(s.particles){ g.fillStyle = gray(.95); [[-30,-18,3],[22,10,2.5],[-8,26,2],[35,-28,2]].forEach(([x,y,r])=>{ g.beginPath(); g.arc(W/2+x, H/2+y, r, 0, 7); g.fill(); }); }
  // cordón de DELO: brillante con la line light
  if(s.variant!=='none' && s.bead>0){
    const r = 112, w = s.variant==="thin" ? 7 : 16, a0 = -Math.PI/2, span = Math.PI*2*Math.min(1, s.bead) * (s.variant==='gap' ? 0.88 : 1);
    const grd = g.createRadialGradient(cx, cy, r-w/2, cx, cy, r+w/2);
    grd.addColorStop(0, gray(.45*spec)); grd.addColorStop(.5, gray(.92*spec)); grd.addColorStop(1, gray(.4*spec));
    g.strokeStyle = grd; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r, a0, a0+span); g.stroke();
  }
  // ruido del sensor
  const im = g.getImageData(0,0,W,H), d = im.data, L = new Float32Array(W*H);
  for(let i=0;i<W*H;i++){ const v = Math.max(0, Math.min(1, d[i*4]/255 + NOISE[i])); L[i] = v; const c = v*255; d[i*4]=d[i*4+1]=d[i*4+2]=c; }
  g.putImageData(im,0,0);
  return {L};
}

/* Segmentación + mediciones, igual que la VIS: área y perímetro del material, caja envolvente. */
export function analyzeVIS(L, V){
  const x0 = Math.floor(W*V.RL/100), x1 = Math.ceil(W*V.RR/100), y0 = Math.floor(H*V.RT/100), y1 = Math.ceil(H*V.RB/100), th = V.ST/100;
  const M = new Uint8Array(W*H); let area = 0, bx0=W, by0=H, bx1=-1, by1=-1;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ const i = y*W+x, v = L[i]; const on = V.SM===1 ? v > th : v < th;
    if(on){ M[i]=1; area++; if(x<bx0)bx0=x; if(x>bx1)bx1=x; if(y<by0)by0=y; if(y>by1)by1=y; } }
  let per = 0;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ const i = y*W+x; if(!M[i]) continue;
    if(x===x0||x===x1-1||y===y0||y===y1-1||!M[i-1]||!M[i+1]||!M[i-W]||!M[i+W]) per++; }
  const areaPct = area/(W*H)*100, boxPct = bx1<0 ? 0 : (bx1-bx0+1)*(by1-by0+1)/(W*H)*100, perim = per*PSCALE;
  const checks = [
    ['Área', areaPct, V.AMN, V.AMX, '%'],
    ['Caja', boxPct, V.BMN, V.BMX, '%'],
    ['Perímetro', perim, V.PMN, V.PMX, 'px'],
  ].map(([n,v,a,b,u])=>({n, v, a, b, u, ok: v>=a && v<=b}));
  return {M, areaPct, boxPct, perim, checks, pass: checks.every(c=>c.ok), roi:[x0,y0,x1,y1], box: bx1<0?null:[bx0,by0,bx1,by1]};
}
export function drawVISOverlay(canvas, L, R, mode){
  const g = canvas.getContext('2d'), im = g.createImageData(W,H), d = im.data;
  for(let i=0;i<W*H;i++){ const v = L[i]*255; if(mode==='mask'){ const on = R.M[i]; d[i*4]=on?200:v*.25; d[i*4+1]=on?20:v*.25; d[i*4+2]=on?20:v*.25; }
    else { const on = R.M[i]; d[i*4] = on ? Math.min(255, v*.55+120) : v; d[i*4+1] = on ? v*.45 : v; d[i*4+2] = on ? v*.45 : v; } d[i*4+3]=255; }
  g.putImageData(im,0,0);
  const [x0,y0,x1,y1] = R.roi; g.strokeStyle = '#22d3ee'; g.lineWidth = 1; g.setLineDash([4,3]); g.strokeRect(x0+.5,y0+.5,x1-x0-1,y1-y0-1); g.setLineDash([]);
  if(R.box){ const [a,b,c,e] = R.box; g.strokeStyle = R.pass ? '#22c55e' : '#ef4444'; g.lineWidth = 1.5; g.strokeRect(a+.5,b+.5,c-a,e-b); }
}
export function drawPattern(canvas, found){
  const g = canvas.getContext('2d'); g.strokeStyle = found ? '#22c55e' : '#ef4444'; g.lineWidth = 2;
  g.strokeRect(W/2-126, H/2-126, 252, 252);
  g.font = '700 12px Urbanist, system-ui'; g.fillStyle = found ? '#22c55e' : '#ef4444';
  g.fillText(found ? 'PATRÓN OK' : 'PATRÓN NO ENCONTRADO (222)', 8, 16);
}

/* ======================= 2. Cámara del sensor + through-focus ======================= */
export const ZONES = ['C','TL','TR','BL','BR'];
export const ZNAME = {C:'Centro', TL:'Arriba izq.', TR:'Arriba der.', BL:'Abajo izq.', BR:'Abajo der.'};
export const ZCOL = {C:'#22d3ee', TL:'#f472b6', TR:'#facc15', BL:'#a78bfa', BR:'#34d399'};
const POS = {C:[.5,.5], TL:[.2,.22], TR:[.8,.22], BL:[.2,.78], BR:[.8,.78]};
export const DOF = 22;            // µm, ancho de la curva through-focus
export const LIMIT = 0.45;        // límite de SFR (supuesto)
const ZPK0 = {C:-1.6, TL:-20, TR:12, BL:-7, BR:25};      // picos antes de corregir (tilt + Z)
const ZLOCK = {C:.4, TL:-1.1, TR:.8, BL:-.6, BR:1.2};    // residuo después de corregir
const PEAK = {C:.72, TL:.68, TR:.69, BL:.70, BR:.67};
export const sfr = (peak, dz) => peak*Math.exp(-Math.pow(dz/DOF, 2));
export function tilt(zpk){ const avg = ks => ks.reduce((s,k)=>s+zpk[k],0)/ks.length;
  const rl = avg(['TR','BR']) - avg(['TL','BL']), tb = avg(['TL','TR']) - avg(['BL','BR']);
  return {rl, tb, ty: -rl/80, tx: -tb/45, zm: avg(ZONES)}; }

/* Estado AA según el paso de la alineación (o RETEST), su progreso p y la falla elegida. */
export function aaState(id, p, fault){
  const f = String(fault||'');
  const peak = {...PEAK}, zpk0 = {...ZPK0};
  if(f==='131') ZONES.forEach(k=>peak[k] *= .55);
  if(f==='137') peak.BR = .32;
  if(f==='108') ZONES.forEach(k=>zpk0[k] += 70);
  const lerpZ = (a,b,k) => Object.fromEntries(ZONES.map(z=>[z, a[z]+(b[z]-a[z])*k]));
  const base = {peak, zpk0, zpk:zpk0, z:null, sweep:null, phase:'none', blur:0, shift:0, off:[0,0], msg:'', curves:false, fault:f};
  const camFail = ['102','175'].includes(f);
  if(camFail && id && id.startsWith('align')) return {...base, phase:'nocam', msg:'No abre la cámara del sensor (102). Primero pasar la golden.'};
  switch(id){
    case 'align_open': case 'align_to_lens': case 'align_grip': case 'align_to_sensor':
      return {...base, phase:'nolens', msg:'Cámara abierta · todavía sin lente: imagen sin enfoque.'};
    case 'align_insert': return {...base, phase:'img', blur:1, off:[.07,-.05], msg:'El lente entra al DELO: imagen muy desenfocada.'};
    case 'align_prefocus': {
      const k = f==='105' ? 0 : p, c = (f==='107'||f==='195') ? 0 : p;
      return {...base, phase:'img', blur: 1 - .7*k, off:[.07*(1-c), -.05*(1-c)], msg: f==='105' ? 'PREFOCUS FAIL (105): no encuentra foco aproximado.' : (f==='107'||f==='195') ? 'No logra centrar (107 / 195): revisar asiento del sensor.' : 'Prefocus y centrado: los targets se acomodan al centro.'};
    }
    case 'align_scan': {
      if(p < .7){ const z = -40 + 80*p/.7; return {...base, phase:'scan', z, sweep:z, curves:true, msg:'Barriendo Z: cada zona dibuja su curva; su pico es donde esa zona está enfocada.'}; }
      if(f==='108') return {...base, phase:'fail', z:40, sweep:40, curves:true, msg:'SCAN FAIL (108): ninguna zona hizo pico dentro del rango de Z.'};
      if(p < .85) return {...base, phase:'calc', z:0, sweep:40, curves:true, msg:'Calcula tilt y Z con los picos.'};
      const k = (p-.85)/.15; return {...base, phase:'corr', z:0, sweep:40, curves:true, zpk: lerpZ(zpk0, ZLOCK, k), msg:'Corrige tilt X/Y y Z: los picos se juntan.'};
    }
    case 'align_uv': { const sh = (f==='143'||f==='149') ? 16*p : 2*p; return {...base, phase:'lock', z:0, sweep:40, curves:true, zpk:ZLOCK, shift:sh, msg: sh>6 ? 'El MTF cae durante el curado (143 / 149).' : 'Curado UV en lock: el DELO encoge un poco.'}; }
    case 'align_ungrip': { const sh = f==='155' ? 2 + 18*p : 2 + .6*p; return {...base, phase:'lock', z:0, sweep:40, curves:true, zpk:ZLOCK, shift:sh, msg: f==='155' ? 'UNGRIP MTF (155): al soltar, el lente se mueve.' : 'Suelta el lente y vuelve a medir.'}; }
    case 'align_home': case 'align_done': { const sh = f==='155' ? 20 : 2.6; return {...base, phase:'lock', z:0, sweep:40, curves:true, zpk:ZLOCK, shift:sh, msg:'Valores finales del BUILD.'}; }
    case 'align_retest': { const sh = f==='161' ? 15 : 4, off = f==='162' ? [.05,.03] : [0,0];
      return {...base, phase:'lock', z:0, sweep:40, curves:true, zpk:ZLOCK, shift:sh, off, retest:true, msg: f==='161' ? 'RETEST MTF (161): después del horno el foco se movió.' : f==='162' ? 'RETEST CTR (162): el centro óptico se movió.' : 'RETEST: misma medición con la pieza curada.'}; }
  }
  return null;
}
export function values(s){ return Object.fromEntries(ZONES.map(k=>[k, sfr(s.peak[k], (s.z??0) + s.shift*(k==='C'?1:1.15) - s.zpk[k])])); }

/* Imagen del sensor: targets oscuros sobre fondo claro, desenfoque según la Z de cada zona. */
export function renderSensorCam(canvas, s){
  const w = canvas.width = 320, h = canvas.height = 220, g = canvas.getContext('2d');
  if(s.phase==='nocam'){ g.fillStyle = '#000'; g.fillRect(0,0,w,h); g.fillStyle = '#ef4444'; g.font = '700 13px Urbanist, system-ui'; g.fillText('CAM OPEN FAIL', 12, 22); return; }
  const lg = g.createRadialGradient(w/2,h/2,20,w/2,h/2,w*.7); lg.addColorStop(0,'#d6d6d6'); lg.addColorStop(1,'#8e8e8e');   // viñeteo
  g.fillStyle = lg; g.fillRect(0,0,w,h);
  if(s.phase==='nolens'){ g.fillStyle = 'rgba(160,160,160,.85)'; g.fillRect(0,0,w,h); return; }
  const sz = 30;
  for(const k of ZONES){
    const dz = s.blur ? 0 : (s.z??0) + s.shift - s.zpk[k];
    const sigma = s.blur ? 4 + 14*s.blur : Math.min(16, .6 + Math.abs(dz)/3.2);
    const [rx, ry] = POS[k], x = (rx + s.off[0])*w, y = (ry + s.off[1])*h;
    // desenfoque con sombra (funciona también en Safari): se dibuja fuera del lienzo y solo se ve la sombra
    const c = Math.cos(.14), sn = Math.sin(.14), pts = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>[x + (u*c - v*sn)*sz/2 - 2000, y + (u*sn + v*c)*sz/2]);
    g.save(); g.shadowColor = `rgba(15,15,15,${Math.max(.3, 1 - sigma/24)})`; g.shadowBlur = sigma*2; g.shadowOffsetX = 2000;
    g.fillStyle = '#000'; g.beginPath(); pts.forEach(([px,py],i)=> i ? g.lineTo(px,py) : g.moveTo(px,py)); g.closePath(); g.fill(); g.restore();
    if(!s.blur){ g.strokeStyle = ZCOL[k]; g.lineWidth = 1.4; g.strokeRect(x + sz*.38, y - sz*.3, 9, sz*.6); }   // ROI en el borde inclinado
  }
}

/* Curvas through-focus SFR @ Ny/4 vs Z. */
export function renderTF(canvas, s, theme){
  const w = canvas.width = 360, h = canvas.height = 220, g = canvas.getContext('2d');
  const dark = theme==='dark', ink = dark ? '#cfcfd4' : '#3a3a40', grid = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  g.clearRect(0,0,w,h);
  const L = 36, T = 14, R = w - 10, B = h - 30, X = z => L + (z+40)/80*(R-L), Y = v => B - v/.8*(B-T);
  g.font = '11px Urbanist, system-ui'; g.fillStyle = ink; g.strokeStyle = grid; g.lineWidth = 1;
  [-40,-20,0,20,40].forEach(z=>{ g.beginPath(); g.moveTo(X(z),T); g.lineTo(X(z),B); g.stroke(); g.textAlign='center'; g.fillText(z, X(z), B+14); });
  [0,.2,.4,.6,.8].forEach(v=>{ g.beginPath(); g.moveTo(L,Y(v)); g.lineTo(R,Y(v)); g.stroke(); g.textAlign='right'; g.fillText(Math.round(v*100), L-5, Y(v)+4); });
  g.textAlign = 'center'; g.fillText('posición Z del lente (µm)', (L+R)/2, h-3);
  g.textAlign = 'left'; g.fillText('SFR @ Ny/4 (%)', L+4, T+10);
  // límite
  g.strokeStyle = '#ef4444'; g.setLineDash([5,4]); g.beginPath(); g.moveTo(L, Y(LIMIT)); g.lineTo(R, Y(LIMIT)); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#ef4444'; g.textAlign = 'right'; g.fillText(`límite ${Math.round(LIMIT*100)} %`, R-2, Y(LIMIT)-4);
  if(!s || !s.curves) return;
  const until = s.sweep ?? 40, zp = s.phase==='scan' || s.phase==='calc' || s.phase==='fail' ? s.zpk0 : s.zpk;
  for(const k of ZONES){
    g.strokeStyle = ZCOL[k]; g.lineWidth = 2; g.beginPath(); let first = true;
    for(let z=-40; z<=until+.01; z+=1){ const v = sfr(s.peak[k], z + s.shift*(k==='C'?1:1.15) - zp[k]); const px = X(z), py = Y(v); first ? g.moveTo(px,py) : g.lineTo(px,py); first = false; }
    g.stroke();
    // pico
    if(zp[k] >= -40 && zp[k] <= 40 && until >= zp[k]){ const pz = zp[k] - s.shift*(k==='C'?1:1.15);
      g.fillStyle = ZCOL[k]; g.beginPath(); g.arc(X(pz), Y(s.peak[k]), 3.5, 0, 7); g.fill();
      if(s.phase==='calc'){ g.strokeStyle = ZCOL[k]; g.setLineDash([2,3]); g.beginPath(); g.moveTo(X(pz), Y(s.peak[k])); g.lineTo(X(pz), B); g.stroke(); g.setLineDash([]); } }
  }
  if(s.phase==='scan'){ g.strokeStyle = dark ? '#fff' : '#141416'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(s.z),T); g.lineTo(X(s.z),B); g.stroke(); }
  if(s.phase==='lock' || s.phase==='corr'){ g.strokeStyle = '#22c55e'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(0),T); g.lineTo(X(0),B); g.stroke(); g.fillStyle = '#22c55e'; g.textAlign='left'; g.font = '700 11px Urbanist, system-ui'; g.fillText('LOCK', X(0)+5, T+24); }
}
