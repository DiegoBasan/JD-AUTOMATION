/* Flujo de resolución guiado (lo usan Fallas Kasalis y Fallas de línea).
   Un paso a la vez: el actual resaltado, los hechos con ✓ y los siguientes atenuados.
   Pasos con SÍ / NO saltan al paso que dice el texto ("paso 4") o terminan si dice "listo".
   Al terminar se guarda en el historial local (lo ve el inicio de JD Automation). */
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const HKEY = 'jd_historial';
export function historial(){ try{ return JSON.parse(localStorage.getItem(HKEY)||'[]'); }catch(e){ return []; } }
function guardar(r){ try{ const h = historial(); h.unshift(r); localStorage.setItem(HKEY, JSON.stringify(h.slice(0, 50))); }catch(e){} }

const CSS = `
.gf{display:grid;gap:8px}
.gf .gs{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:12px 14px;border-radius:20px;background:var(--surface,var(--chip,#fff));border:1px solid var(--line,rgba(0,0,0,.08));transition:opacity .2s,transform .2s;cursor:pointer}
.gf .gs .n{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:14px;background:var(--surface2,var(--bg,#eee));color:var(--ink,#141416)}
.gf .gs b{display:block;font-size:15.5px;line-height:1.35;padding-top:6px}
.gf .gs .d{color:var(--ink2,#6b6b6b);font-size:13.5px;margin-top:3px;line-height:1.45}
.gf .gs.next{opacity:.5}
.gf .gs.next .d,.gf .gs.next .acts,.gf .gs.done .d,.gf .gs.done .acts{display:none}
.gf .gs.done{background:transparent;border-style:dashed}
.gf .gs.done .n{background:var(--gfc,#22a06b);color:#fff}
.gf .gs.done b{font-weight:600}
.gf .gs.skip{opacity:.45}
.gf .gs.skip .n{background:var(--line,#ccc);color:var(--ink2,#666)}
.gf .gs .ans{display:none;font-size:12.5px;color:var(--ink2,#6b6b6b);margin-top:3px}
.gf .gs.done .ans{display:block}
.gf .gs.cur{border:2px solid var(--gfa,var(--ink,#141416));box-shadow:0 10px 28px rgba(0,0,0,.08);cursor:default}
.gf .gs.cur .n{background:var(--gfa,var(--ink,#141416));color:#fff}
.gf .acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.gf .acts button{min-height:44px;padding:8px 16px;border-radius:14px;border:1.5px solid var(--line,#d6d6da);background:transparent;color:inherit;font:inherit;font-weight:700;font-size:14px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:8px;line-height:1.25}
.gf .acts button small{display:block;font-weight:500;font-size:12px;opacity:.8}
.gf .acts .si{border-color:rgba(34,160,107,.5);background:rgba(34,160,107,.1)}
.gf .acts .no{border-color:rgba(229,72,77,.45);background:rgba(229,72,77,.08)}
.gf .acts .ok{background:var(--ink,#141416);color:var(--bg,#fff);border-color:var(--ink,#141416)}
.gf .acts em{font-style:normal;font-size:11px;font-weight:800;padding:2px 7px;border-radius:6px;background:rgba(127,127,127,.18)}
.gf .end{padding:16px;border-radius:20px;background:rgba(34,160,107,.12);border:1.5px solid rgba(34,160,107,.4)}
.gf .end.fail{background:rgba(229,72,77,.08);border-color:rgba(229,72,77,.35)}
.gf .end b{font-size:16px;display:block}
.gf .end p{margin:4px 0 10px;font-size:13.5px;color:var(--ink2,#6b6b6b)}
.gf .end button,.gf .reset{min-height:40px;padding:0 14px;border-radius:99px;border:1.5px solid var(--line,#d6d6da);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}
.gf .bar{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;color:var(--ink2,#6b6b6b);margin:0 2px 2px}
.gf .bar i{flex:1;height:6px;border-radius:9px;background:var(--line,#e0e0e0);overflow:hidden}
.gf .bar i u{display:block;height:100%;background:var(--gfa,var(--ink,#141416));border-radius:9px;transition:width .3s}
`;
let styled = false;

const destino = (txt, i, n) => { if(!txt) return i+1; const m = String(txt).match(/paso\s*(\d+)/i); if(m) return Math.min(n, Math.max(1, +m[1])) - 1;
  if(/\b(listo|resuelto|empacar)\b/i.test(txt)) return 'fin'; return i+1; };
const corto = t => { const s = String(t||'').split(/→|\./)[0].trim(); return s.length > 60 ? s.slice(0,57)+'…' : s; };

/* mount(el, falla, {app, accent, procHTML(step) → html, onDone}) */
export function mountFlow(el, f, o={}){
  if(!styled){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
  const n = f.flujo.length; let cur = 0, done = {}, fin = null;
  el.style.setProperty('--gfa', o.accent || 'var(--ink)');
  function draw(){
    const pct = fin ? 100 : Math.round(cur/n*100);
    let h = `<div class="gf"><div class="bar"><span>${fin ? 'Terminado' : `Paso ${cur+1} de ${n}`}</span><i><u style="width:${pct}%"></u></i>${Object.keys(done).length||fin?'<button class="reset" data-gf="reset">Empezar de nuevo</button>':''}</div>`;
    f.flujo.forEach((s,i)=>{
      const st = fin ? (done[i] ? 'done' : 'next') : i===cur ? 'cur' : done[i] ? 'done' : 'next';
      let acts = '';
      if(st==='cur'){
        if(s.si || s.no){
          if(s.si) acts += `<button class="si" data-gf="si"><em>SÍ</em><span>${esc(corto(s.si))}</span></button>`;
          acts += `<button class="no" data-gf="no"><em>NO</em><span>${esc(s.no ? corto(s.no) : 'Sigue al siguiente paso')}</span></button>`;
          if(!s.si) acts += `<button class="si" data-gf="hecho">Hecho, siguiente</button>`;
        } else acts += `<button class="ok" data-gf="hecho">Hecho, siguiente →</button>`;
        acts += `<button data-gf="resolvio">✓ Con esto se resolvió</button>`;
      }
      const sk = done[i]==='Saltado';
      h += `<div class="gs ${st}${sk&&st==='done'?' skip':''}" data-gi="${i}"><div class="n">${sk ? '–' : done[i] ? '✓' : i+1}</div><div><b>${esc(s.p)}</b>${s.d?`<div class="d">${esc(s.d)}</div>`:''}
        ${st==='cur' && s.si ? `<div class="d"><b style="display:inline;font-size:12.5px;padding:0">SÍ:</b> ${esc(s.si)}</div>` : ''}${st==='cur' && s.no ? `<div class="d"><b style="display:inline;font-size:12.5px;padding:0">NO:</b> ${esc(s.no)}</div>` : ''}
        <div class="ans">${esc(done[i]||'')}</div>${st==='cur' && o.procHTML ? o.procHTML(s) : ''}${acts?`<div class="acts">${acts}</div>`:''}</div></div>`;
    });
    if(fin) h += `<div class="end ${fin.ok?'':'fail'}"><b>${fin.ok ? '✓ Resuelto' : 'Sin resolver con este flujo'}</b><p>${esc(fin.txt)}</p>${fin.ok?'':'<button data-gf="reset">Revisar otra vez</button>'}</div>`;
    else if(cur >= n) h += `<div class="end fail"><b>Llegaste al final del flujo</b><p>Si sigue fallando, escálalo con ingeniería con lo que ya revisaste.</p><button data-gf="cerrar">Registrar como no resuelto</button></div>`;
    el.innerHTML = h + '</div>';
  }
  function terminar(ok, i){ fin = {ok, txt: ok ? `Se resolvió en el paso ${i+1}: ${f.flujo[i].p}` : 'Se revisaron todos los pasos.'};
    guardar({app:o.app||'', id:f.id, titulo:f.titulo, fecha:new Date().toISOString(), ok, paso:i+1, solucion: ok ? f.flujo[i].p : ''}); o.onDone && o.onDone(fin); draw(); }
  el.addEventListener('click', e=>{
    const b = e.target.closest('[data-gf]');
    if(b){ e.stopPropagation(); const a = b.dataset.gf, s = f.flujo[cur];
      if(a==='reset'){ cur = 0; done = {}; fin = null; return draw(); }
      if(a==='cerrar') return terminar(false, n-1);
      if(a==='resolvio'){ done[cur] = '✓ Esto lo resolvió'; return terminar(true, cur); }
      const txt = a==='si' ? s.si : a==='no' ? s.no : null;
      done[cur] = a==='si' ? 'SÍ — '+corto(s.si) : a==='no' ? 'NO — '+(s.no?corto(s.no):'siguiente') : 'Hecho';
      const d = destino(txt, cur, n);
      if(d==='fin') return terminar(true, cur);
      for(let k=cur+1;k<d;k++) if(!done[k]) done[k] = 'Saltado';
      cur = d; draw(); el.querySelector('.gs.cur')?.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    const g = e.target.closest('[data-gi]');
    if(g && !fin && !e.target.closest('button,a')){ const i = +g.dataset.gi; if(i!==cur){ cur = i; delete done[i]; draw(); } }
  });
  draw();
}
