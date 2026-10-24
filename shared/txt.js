/* Texto con marcas: {{así}} = complemento de Claude (no confirmado en piso) → se pinta en naranja.
   Lo usan todas las apps de fallas. */
export const esc = s => String(s??'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const tx = s => esc(s).replace(/\{\{([\s\S]+?)\}\}/g, '<span class="asum" title="Complemento de Claude: no confirmado en piso">$1</span>');
export const plain = s => String(s??'').replace(/\{\{|\}\}/g, '');
export const hasAsum = s => /\{\{/.test(JSON.stringify(s??''));
export const LEYENDA = '<div class="leyenda"><span class="asum">Naranja</span> = lo complementó Claude, falta confirmarlo en piso. Lo demás es retro real.</div>';
if(typeof document!=='undefined' && !document.getElementById('asumCSS')){
  const st = document.createElement('style'); st.id = 'asumCSS';
  st.textContent = `.asum{color:#C2643F;background:rgba(217,119,87,.13);border-radius:5px;padding:0 3px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
[data-theme=dark] .asum,.head .asum{color:#F0A27F;background:rgba(217,119,87,.2)}
.leyenda{font-size:12px;color:var(--ink2,#777);margin:18px 4px 4px;line-height:1.5}`;
  document.head.appendChild(st);
}
