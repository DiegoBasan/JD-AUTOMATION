/* Algoritmo de la inspección post-dispensado (VIS) de la Kasalis, según el archivo de dispensado:
   SM  segmentación: 1 = objetos claros, 0 = objetos oscuros
   ST  umbral 0–100 % (−1 = automático con SH)
   SH  umbral de histograma 0–100 % cuando ST = −1 (aquí: el SH % más claro de la ROI)
   RL/RT/RR/RB  ROI de búsqueda en % del ancho / alto
   AMN/AMX  área del material en % del área de la imagen
   BMN/BMX  área de la caja envolvente del material en % del área de la imagen
   PMN/PMX  perímetro del material en píxeles
   El "material" es la región conectada más grande (análisis de componentes conectados); las demás regiones
   detectadas se muestran en rojo pero no se miden. Material en verde = PASS, en rojo = FAIL. */

export const VIS_KEYS = ['SM','ST','SH','RL','RT','RR','RB','AMN','AMX','BMN','BMX','PMN','PMX'];

/* L: Float32Array 0..1 (w×h). ps: factor para llevar el perímetro a píxeles de la imagen original. */
export function analyze(L, w, h, V, ps=1){
  const x0 = Math.max(0, Math.floor(w*V.RL/100)), x1 = Math.min(w, Math.ceil(w*V.RR/100)), y0 = Math.max(0, Math.floor(h*V.RT/100)), y1 = Math.min(h, Math.ceil(h*V.RB/100));
  let th = V.ST/100;
  if(V.ST < 0){   // automático: deja como material el SH % de píxeles más claros (u oscuros) de la ROI
    const hist = new Uint32Array(256); let n = 0;
    for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ hist[Math.min(255, L[y*w+x]*255|0)]++; n++; }
    const want = n*(V.SH??10)/100; let acc = 0, k;
    if(V.SM===1){ for(k=255;k>0;k--){ acc += hist[k]; if(acc >= want) break; } }
    else { for(k=0;k<255;k++){ acc += hist[k]; if(acc >= want) break; } }
    th = k/255;
  }
  const M = new Uint8Array(w*h);   // 1 = detectado
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ const i = y*w+x, v = L[i]; if(V.SM===1 ? v > th : v < th) M[i] = 1; }
  // componentes conectados (8 vecinos)
  const lab = new Int32Array(w*h), stack = new Int32Array(w*h); let best = 0, bestN = 0, nl = 0;
  for(let i=0;i<w*h;i++){
    if(!M[i] || lab[i]) continue;
    nl++; let sp = 0, cnt = 0; stack[sp++] = i; lab[i] = nl;
    while(sp){ const j = stack[--sp]; cnt++; const x = j % w, y = (j - x)/w;
      for(let dy=-1;dy<=1;dy++){ const yy = y+dy; if(yy<y0||yy>=y1) continue;
        for(let dx=-1;dx<=1;dx++){ const xx = x+dx; if(xx<x0||xx>=x1) continue; const k = yy*w+xx; if(M[k] && !lab[k]){ lab[k] = nl; stack[sp++] = k; } } } }
    if(cnt > bestN){ bestN = cnt; best = nl; }
  }
  // medición del material
  let bx0 = w, by0 = h, bx1 = -1, by1 = -1, per = 0, sx = 0, sy = 0;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){ const i = y*w+x; if(lab[i]!==best || !best) continue;
    sx += x; sy += y; if(x<bx0)bx0=x; if(x>bx1)bx1=x; if(y<by0)by0=y; if(y>by1)by1=y;
    if(x===0||x===w-1||y===0||y===h-1||lab[i-1]!==best||lab[i+1]!==best||lab[i-w]!==best||lab[i+w]!==best) per++; }
  const areaPct = bestN/(w*h)*100, boxPct = bx1<0 ? 0 : (bx1-bx0+1)*(by1-by0+1)/(w*h)*100, perim = Math.round(per*ps);
  const checks = [['Área', areaPct, V.AMN, V.AMX, '%'], ['Caja', boxPct, V.BMN, V.BMX, '%'], ['Perímetro', perim, V.PMN, V.PMX, 'px']]
    .map(([n,v,a,b,u])=>({n, v, a, b, u, ok: v>=a && v<=b}));
  return {lab, best, areaPct, boxPct, perim, th, regions:nl, checks, pass: !!best && checks.every(c=>c.ok), roi:[x0,y0,x1,y1],
    box: bx1<0 ? null : [bx0,by0,bx1,by1], center: bestN ? [sx/bestN, sy/bestN] : null, w, h};
}

/* Dibuja como la pantalla de la Kasalis: material verde (PASS) o rojo (FAIL), otras regiones en rojo, cruz al centro. */
export function drawResult(canvas, L, R, opts={}){
  const {w, h} = R; canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  const ok = R.pass, mat = ok ? [40,200,70] : [225,40,40];
  for(let i=0;i<w*h;i++){ const v = L[i]*255, l = R.lab[i];
    if(l && l===R.best){ d[i*4] = v*.25 + mat[0]*.75; d[i*4+1] = v*.25 + mat[1]*.75; d[i*4+2] = v*.25 + mat[2]*.75; }
    else if(l){ d[i*4] = v*.3 + 160; d[i*4+1] = v*.3; d[i*4+2] = v*.3; }
    else { d[i*4] = d[i*4+1] = d[i*4+2] = v; }
    d[i*4+3] = 255; }
  g.putImageData(im, 0, 0);
  const k = Math.max(1, w/320);
  if(opts.roi!==false){ const [x0,y0,x1,y1] = R.roi; g.strokeStyle = '#22d3ee'; g.lineWidth = k; g.setLineDash([4*k,3*k]); g.strokeRect(x0+.5,y0+.5,x1-x0-1,y1-y0-1); g.setLineDash([]); }
  // cruz al centro de la imagen
  g.strokeStyle = '#ff2a2a'; g.lineWidth = 1.2*k; const cx = w/2, cy = h/2, s = 14*k;
  g.beginPath(); g.moveTo(cx-s,cy); g.lineTo(cx+s,cy); g.moveTo(cx,cy-s); g.lineTo(cx,cy+s); g.stroke();
  if(opts.box && R.box){ const [a,b,c,e] = R.box; g.strokeStyle = ok ? '#22c55e' : '#ef4444'; g.lineWidth = k; g.setLineDash([2*k,2*k]); g.strokeRect(a+.5,b+.5,c-a,e-b); g.setLineDash([]); }
}

/* Imagen (canvas/img) → luminancia 0..1, reducida si es muy grande. gain: ganancia virtual (aprox. de exposición). */
export function luminance(src, maxSide=1600, gain=1){
  const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height, k = Math.min(1, maxSide/Math.max(sw, sh));
  const w = Math.round(sw*k), h = Math.round(sh*k), c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', {willReadFrequently:true}); g.drawImage(src, 0, 0, w, h);
  const d = g.getImageData(0,0,w,h).data, L = new Float32Array(w*h);
  for(let i=0;i<w*h;i++) L[i] = Math.min(1, (0.299*d[i*4] + 0.587*d[i*4+1] + 0.114*d[i*4+2])/255*gain);
  return {L, w, h, ps: 1/k, native:[sw, sh]};
}

/* Lee una línea "VIS LD=00,LL=100.0,…" del archivo de dispensado. */
export function parseVIS(line){
  const o = {}; String(line||'').replace(/^\s*#?\s*VIS\s*/i,'').split(',').forEach(kv=>{ const m = kv.trim().match(/^([A-Z0-9]+)\s*=\s*(-?[\d.]+)/i); if(m) o[m[1].toUpperCase()] = parseFloat(m[2]); });
  return o;
}
/* Arma la línea VIS con los valores nuevos, conservando el orden y las demás claves de la línea original. */
export function formatVIS(base, V){
  const o = {...parseVIS(base)}, keys = Object.keys(o);
  for(const k of VIS_KEYS) if(V[k]!==undefined){ o[k] = V[k]; if(!keys.includes(k)) keys.push(k); }
  for(const k of ['LD','LL','EXP']) if(V[k]!==undefined && !keys.includes(k)){ o[k] = V[k]; keys.unshift(k); }
  const f = (k,v) => k==='LD' && v<10 ? String(v).padStart(2,'0') : (k==='LL' && Number.isInteger(v) ? v.toFixed(1) : String(v));
  return 'VIS ' + keys.map(k=>`${k}=${f(k,o[k])}`).join(',');
}
