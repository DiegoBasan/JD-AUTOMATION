/* Visor de guías del programa Kasalis: paso a paso con fotos de pantalla y marcas de dónde picar.
   Lo usan Fallas Kasalis y Kasalis 3D. Datos en buscador-kasalis/data/procedimientos.js. */
import {PROCS} from '../buscador-kasalis/data/procedimientos.js';
export {PROCS};

const BASE = new URL('../buscador-kasalis/', import.meta.url);
const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CSS = `
.pv{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;animation:pvF .2s}
@keyframes pvF{from{opacity:0}}
.pv .pp{background:var(--sheet,var(--surface,#fff));color:var(--ink,#141416);width:min(760px,100%);max-height:94dvh;border-radius:28px 28px 0 0;display:flex;flex-direction:column;overflow:hidden;animation:pvU .3s cubic-bezier(.2,.9,.25,1)}
@keyframes pvU{from{transform:translateY(40px);opacity:.4}}
@media(min-width:800px){.pv{align-items:center}.pv .pp{border-radius:28px;max-height:90dvh}}
.pv .ph{display:flex;align-items:center;gap:10px;padding:14px 16px 10px}
.pv .ph b{flex:1;font-size:17px;line-height:1.2}
.pv .ph button{width:36px;height:36px;border-radius:50%;border:0;background:var(--bg,#f2f2f3);color:inherit;font-weight:800;cursor:pointer}
.pv .pm{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 8px}
.pv .pm span{font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px;background:var(--bg,#f2f2f3)}
.pv .pm .w{background:rgba(229,72,77,.14);color:#C2292E}
.pv .pb{overflow:auto;padding:0 16px 16px;flex:1}
.pv .when{font-size:13.5px;color:var(--ink2,#7c7c84);margin:2px 0 10px}
.pv .dots{display:flex;gap:5px;justify-content:center;margin:4px 0 10px}
.pv .dots i{width:7px;height:7px;border-radius:99px;background:var(--line,#d6d6da);transition:width .2s}
.pv .dots i.on{width:20px;background:var(--ink,#141416)}
.pv .shot{position:relative;border-radius:16px;overflow:hidden;background:#111;touch-action:pan-y}
.pv .shot img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}
.pv .shot.zoom{overflow:auto;max-height:62dvh}
.pv .shot.zoom img{width:200%;max-width:none}
.pv .mk{position:absolute;transform:translate(-50%,-50%);pointer-events:none}
.pv .mk i{display:block;width:34px;height:34px;border-radius:50%;border:3px solid #E5484D;box-shadow:0 0 0 3px rgba(255,255,255,.7);animation:pvP 1.2s ease-out infinite}
@keyframes pvP{0%{transform:scale(.7);opacity:1}100%{transform:scale(1.5);opacity:.15}}
.pv .mk span{position:absolute;left:50%;top:40px;transform:translateX(-50%);white-space:nowrap;background:#E5484D;color:#fff;font:700 12px system-ui,sans-serif;padding:3px 8px;border-radius:8px}
.pv .stxt{font-size:17px;font-weight:700;margin:12px 2px 4px;line-height:1.35}
.pv .sval{display:inline-block;margin:4px 2px;font:700 14px ui-monospace,Menlo,monospace;background:var(--bg,#f2f2f3);padding:6px 10px;border-radius:10px}
.pv .sojo{margin:8px 0 0;padding:9px 12px;border-radius:12px;background:rgba(224,163,46,.14);font-size:13.5px}
.pv .nav{display:flex;gap:10px;padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line,rgba(0,0,0,.08))}
.pv .nav button{flex:1;height:48px;border-radius:99px;border:1.5px solid var(--line,#d6d6da);background:none;color:inherit;font-weight:700;font-size:15px;cursor:pointer}
.pv .nav button.dk{background:var(--ink,#141416);color:var(--bg,#fff);border-color:var(--ink,#141416)}
.pv .nav button:disabled{opacity:.35}
.pv h4{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--ink2,#7c7c84);margin:14px 2px 6px}
.pv ul{margin:0;padding-left:20px;font-size:14px;line-height:1.5}
.pv .todo{border:1.5px dashed var(--line,#d6d6da);border-radius:16px;padding:12px 14px;margin-top:12px}
.pv .todo b{display:block;margin-bottom:4px}
.pv .todo li{color:var(--ink2,#7c7c84)}
`;
let styled = false;
function style(){ if(styled) return; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }

/* Botón para poner debajo de un paso del flujo. */
export function procBtn(id, cls='procbtn'){
  const p = PROCS[id]; if(!p) return '';
  return `<button class="${cls}" data-proc="${id}">${p.pasos.length ? '▶ Paso a paso en el programa' : 'Cómo hacerlo en el programa'} <small>${p.pasos.length ? p.pasos.length+' fotos' : 'faltan fotos'}</small></button>`;
}

/* Abre la guía. */
export function openProc(id){
  const p = PROCS[id]; if(!p) return; style();
  let i = 0, zoom = false;
  const el = document.createElement('div'); el.className = 'pv'; el.setAttribute('role','dialog');
  const close = () => { el.remove(); removeEventListener('keydown', key); };
  const key = e => { if(e.key==='Escape') close(); if(e.key==='ArrowRight') go(1); if(e.key==='ArrowLeft') go(-1); };
  const go = d => { if(!p.pasos.length) return; i = Math.max(0, Math.min(p.pasos.length-1, i+d)); zoom = false; draw(); };
  function draw(){
    const meta = `<div class="pm"><span>${esc(p.estacion)}</span><span class="${/Ingenier/.test(p.permisos)?'w':''}">${esc(p.permisos)}</span>${(p.codigos||[]).map(c=>`<span>${esc(c)}</span>`).join('')}</div>`;
    let body = `<div class="when"><b>Cuándo:</b> ${esc(p.cuando)}</div>`;
    if(p.pasos.length){
      const s = p.pasos[i];
      body += `<div class="dots">${p.pasos.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div>
        <div class="shot${zoom?' zoom':''}" id="pvShot">${s.foto?`<img src="${new URL(s.foto, BASE).href}" alt="Paso ${i+1}">`:''}
          ${(s.marcas||[]).map(m=>`<div class="mk" style="left:${m.x}%;top:${m.y}%"><i></i>${m.t?`<span>${esc(m.t)}</span>`:''}</div>`).join('')}</div>
        <div class="stxt">${i+1}. ${esc(s.texto)}</div>${s.valor?`<span class="sval">${esc(s.valor)}</span>`:''}${s.ojo?`<div class="sojo">⚠︎ ${esc(s.ojo)}</div>`:''}`;
      if(i===p.pasos.length-1 && p.sabemos?.length) body += `<h4>Para recordar</h4><ul>${p.sabemos.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
    } else {
      if(p.sabemos?.length) body += `<h4>Lo que ya sabemos</h4><ul>${p.sabemos.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
      body += `<div class="todo"><b>Guía en construcción: faltan las fotos del programa</b><ul>${(p.necesito||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
    }
    el.innerHTML = `<div class="pp"><div class="ph"><b>${esc(p.titulo)}</b><button data-x aria-label="Cerrar">✕</button></div>${meta}<div class="pb">${body}</div>
      ${p.pasos.length?`<div class="nav"><button data-d="-1" ${i===0?'disabled':''}>Anterior</button><button class="dk" data-d="1">${i===p.pasos.length-1?'Listo':'Siguiente'}</button></div>`:''}</div>`;
    const shot = el.querySelector('#pvShot');
    if(shot){ let x0 = null;
      shot.onclick = () => { zoom = !zoom; draw(); };
      shot.addEventListener('touchstart', e=>{ x0 = e.touches[0].clientX; }, {passive:true});
      shot.addEventListener('touchend', e=>{ if(x0===null || zoom) return; const dx = e.changedTouches[0].clientX - x0; if(Math.abs(dx) > 50) go(dx<0 ? 1 : -1); x0 = null; }); }
  }
  el.addEventListener('click', e=>{
    if(e.target===el || e.target.closest('[data-x]')) return close();
    const b = e.target.closest('[data-d]'); if(b){ if(+b.dataset.d===1 && i===p.pasos.length-1) return close(); go(+b.dataset.d); }
  });
  addEventListener('keydown', key);
  draw(); document.body.appendChild(el);
}
