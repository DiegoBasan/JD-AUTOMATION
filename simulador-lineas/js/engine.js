/* =====================================================================
   MOTOR DE SIMULACIÓN DE LÍNEA (independiente del render 3D)
   - Piezas con ruta por producto (principal + ramas paralelas que convergen)
   - Estaciones con cola, capacidad, tiempo ciclo, lote de transferencia
   - Hornos por lote (batch)
   - Kasalis: una sola máquina con 2 operaciones excluyentes (BUILD / RETEST)
   Más adelante este mismo modelo se puede alimentar con logs reales
   (los eventos de pieza: llegada, inicio, fin, falla) en lugar de simularlos.
   ===================================================================== */
import {OPS, GLOBAL_DEFAULTS, ROUTES} from './data.js';

const BUSY = 'proceso', IDLE = 'sin material', CO = 'cambio de modo', WAITKIT = 'espera componente', OVEN = 'horneando';

export class Engine {
  constructor(){ this.listeners = []; this.params = Engine.loadParams(); }

  static defaults(){ return {ops: JSON.parse(JSON.stringify(OPS)), g: {...GLOBAL_DEFAULTS}}; }
  static loadParams(){
    const d = Engine.defaults();
    try{
      const s = JSON.parse(localStorage.getItem('jd_sim_params')||'null');
      if(s){ for(const k in s.ops||{}) if(d.ops[k]) Object.assign(d.ops[k], s.ops[k]); Object.assign(d.g, s.g||{}); }
    }catch(e){}
    return d;
  }
  saveParams(){ try{ localStorage.setItem('jd_sim_params', JSON.stringify(this.params)); }catch(e){} }
  resetParams(){ this.params = Engine.defaults(); try{ localStorage.removeItem('jd_sim_params'); }catch(e){} }

  on(fn){ this.listeners.push(fn); }
  emit(type, data){ for(const fn of this.listeners) fn(type, data); }

  /* ------------------------------------------------------------------ */
  reset(prod, variant, pathTime){
    this.prod = prod; this.variant = variant;
    this.route = ROUTES[prod].build(variant);
    this.failBin = ROUTES[prod].fail;
    this.pathTime = pathTime || (()=>10);       // (stA, stB) => s de transporte
    this.t = 0; this.pieces = []; this.alive = new Map(); this.seq = 0;
    this.released = 0; this.nextRelease = 0;
    this.done = 0; this.failed = 0; this.leadSum = 0;
    this.inject = null;
    this.st = {};
    const touch = id => this.st[id] || (this.st[id] = {id, q:{}, kit:{}, out:{}, lotCnt:{}, slots:[], batch:null,
      mode:'build', campaign:0, coEnd:0, stats:{done:0, fail:0, busy:0}, state:IDLE, lastOp:null});
    for(const b in this.route) this.route[b].forEach((s,i)=>{ s.branch=b; s.idx=i; touch(s.st); });
    touch(this.failBin);
    // qué pasos consumen cada rama
    this.mergeAt = {};
    for(const s of this.route.main) for(const b of (s.merge||[])) this.mergeAt[b] = s;
  }

  get total(){ return this.params.g.totalPieces|0; }
  releaseDone(){ return this.total>0 && this.released>=this.total; }
  op(o){ return this.params.ops[o]; }

  /* ------------------------------------------------------------------ */
  update(dt){
    let r = dt;
    while(r > 1e-9){ const h = Math.min(r, 0.5); this.step(h); r -= h; }
  }

  step(h){
    this.t += h; const t = this.t;
    // 1) liberación de material
    while(t >= this.nextRelease && !(this.total>0 && this.released>=this.total)){
      this.released++;
      for(const b in this.route) this.spawn(b, this.released);
      this.nextRelease += Math.max(1, +this.params.g.releaseInterval || 1);
    }
    this.tickFailed(h);
    // 2) transporte
    for(const p of this.alive.values()) if(p.state==='transit'){
      p.tr.t += h;
      if(p.tr.t >= p.tr.dur) this.arrive(p);
    }
    // 3) máquinas
    for(const id in this.st) this.runStation(this.st[id], h);
    // 4) transferencias por lote
    for(const id in this.st){
      const S = this.st[id];
      for(const key in S.out){
        const buf = S.out[key]; if(!buf.length) continue;
        const [b, idxS] = key.split(':'); const idx = +idxS; const step = this.route[b][idx];
        const lot = Math.max(1, (this.op(step.op).lot|0) || 1);
        // el lote cuenta piezas procesadas en el paso (OK + falla): una falla no deja el lote atorado
        if((S.lotCnt[key]||0) >= lot || this.upstreamEmpty(b, idx)){
          const batch = buf.splice(0, buf.length); S.lotCnt[key] = 0;
          batch.forEach((p,i)=>this.sendNext(p, i));
          if(batch.length>1) this.emit('lot', {st:id, n:batch.length, step});
        }
      }
    }
  }

  spawn(branch, n){
    const p = {id: ++this.seq, unit:n, prod:this.prod, branch, route:this.route[branch], idx:0,
      state:'queue', at:null, parts:new Set(branch==='housing'?['front']:branch==='back'?['back']:[]),
      hist:[], born:this.t, tr:null, slot:0, result:null};
    this.pieces.push(p); this.alive.set(p.id, p);
    this.enqueue(p, 0);
    if(branch==='main') this.emit('release', p);
  }

  enqueue(p, idx){
    p.idx = idx; const s = p.route[idx]; p.at = s.st; p.state = 'queue';
    const S = this.st[s.st]; (S.q[s.op] || (S.q[s.op]=[])).push(p);
    p.hist.push({op:s.op, st:s.st, name:s.name, tq:this.t, ts:null, te:null, res:null});
  }

  upstreamEmpty(branch, idx){
    if(!this.releaseDone()) return false;
    for(const p of this.alive.values()){
      if(p.branch!==branch || p.state==='kit' || (p.tr && p.tr.kit)) continue;
      if(p.idx < idx || (p.idx===idx && p.state!=='out')) return false;
    }
    return true;
  }

  sendNext(p, k){
    const r = p.route; const next = p.idx+1;
    let dest, kit=false;
    if(next < r.length){ dest = r[next].st; p.idx = next; }
    else { dest = this.mergeAt[p.branch].st; kit = true; }
    const dur = this.pathTime(p.at, dest) + (+this.params.g.handling||0) + k*0.6;
    p.state = 'transit'; p.tr = {from:p.at, to:dest, t:0, dur, kit, next};
  }

  arrive(p){
    const {to, kit, next, fail} = p.tr; p.tr = null; p.at = to;
    if(fail){ p.state='failed'; return; }
    if(kit){ p.state='kit'; const S=this.st[to]; (S.kit[p.branch]||(S.kit[p.branch]=[])).push(p); return; }
    this.enqueue(p, next);
  }

  /* ------------------------------------------------------------------ */
  runStation(S, h){
    const isKas = S.id==='kas';
    // horno (lote)
    const ovenOp = Object.keys(S.q).find(o=>this.op(o).batch);
    if(ovenOp){
      const O = this.op(ovenOp);
      if(S.batch){
        S.stats.busy += h;
        if(this.t >= S.batch.tEnd){ const ps=S.batch.pieces; S.batch=null; ps.forEach(p=>this.finish(S,p)); this.emit('oven_end',{st:S.id,n:ps.length}); }
      }
      const q = S.q[ovenOp];
      if(!S.batch && q.length && !this.inTransitTo(S.id)){
        const ps = q.splice(0, Math.max(1, O.cap|0 || 999));
        ps.forEach(p=>this.start(S,p,ovenOp));
        S.batch = {pieces:ps, t0:this.t, tEnd:this.t + (+O.ct||1), op:ovenOp};
        this.emit('oven_start',{st:S.id,n:ps.length});
      }
      S.state = S.batch ? OVEN : (q.length ? 'cargando' : IDLE);
      return;
    }
    // slots en proceso
    for(let i=S.slots.length-1;i>=0;i--){ const sl=S.slots[i]; if(this.t>=sl.tEnd){ S.slots.splice(i,1); this.finish(S, sl.p); } }
    if(S.slots.length) S.stats.busy += h * Math.min(1, S.slots.length);
    if(isKas){ this.kasalis(S); return; }
    // genérico
    let waitingKit = false;
    for(const op in S.q){
      const O = this.op(op); const cap = Math.max(1, O.cap|0 || 1); const q = S.q[op];
      while(S.slots.length < cap && q.length){
        const p = q[0]; const s = p.route[p.idx];
        if(s.merge && !s.merge.every(b=>S.kit[b] && S.kit[b].length)){ waitingKit = true; break; }
        q.shift();
        if(s.merge) for(const b of s.merge){ const c=S.kit[b].shift(); c.state='merged'; c.mergedInto=p.id; this.alive.delete(c.id); c.parts.forEach(x=>p.parts.add(x)); }
        this.start(S, p, op);
        S.slots.push({p, tEnd:this.t + (+O.ct||1), t0:this.t, op});
      }
    }
    S.state = S.slots.length ? BUSY : (waitingKit ? WAITKIT : IDLE);
  }

  kasalis(S){
    const g = this.params.g;
    if(S.coEnd && this.t < S.coEnd){ S.state = CO; return; }
    if(S.coEnd){ S.coEnd = 0; this.emit('kas_mode', {mode:S.mode}); }
    if(S.slots.length){ S.state = BUSY; return; }
    const qb = S.q.kas_build||[], qr = S.q.kas_retest||[];
    let want = S.mode;
    if(S.mode==='build'){
      const campaignDone = S.campaign >= Math.max(1, g.kasCampaign|0);
      if(qr.length && (!qb.length || g.kasPriority==='retest' || campaignDone)) want = 'retest';
    } else {
      if(!qr.length && qb.length) want = 'build';
    }
    if(want !== S.mode){
      S.mode = want; S.campaign = 0; S.coEnd = this.t + Math.max(0, +g.kasChangeover||0);
      S.state = CO; this.emit('kas_switch', {mode:want}); return;
    }
    const q = S.mode==='build' ? qb : qr; const op = S.mode==='build' ? 'kas_build' : 'kas_retest';
    if(!q.length){ S.state = IDLE; return; }
    const p = q.shift(); this.start(S, p, op);
    S.slots.push({p, tEnd:this.t + (+this.op(op).ct||1), t0:this.t, op}); S.campaign++;
    S.state = BUSY;
  }

  inTransitTo(id){ for(const p of this.alive.values()) if(p.state==='transit' && p.tr.to===id && !p.tr.fail) return true; return false; }

  start(S, p, op){
    p.state = 'proc'; S.lastOp = op;
    const h = p.hist[p.hist.length-1]; if(h) h.ts = this.t;
  }

  finish(S, p){
    const s = p.route[p.idx]; const h = p.hist[p.hist.length-1]; if(h){ h.te = this.t; h.res='OK'; }
    (s.add||[]).forEach(x=>p.parts.add(x));
    const lkey = p.branch+':'+p.idx; S.lotCnt[lkey] = (S.lotCnt[lkey]||0) + 1;
    // falla: inyectada (una vez) o por % de falla de la operación
    let code = null;
    if(this.inject && s.fails && s.fails.includes(this.inject) && p.branch==='main'){ code = this.inject; this.inject = null; }
    else { const f = +this.op(s.op).fail || 0; if(f>0 && Math.random()*100 < f) code = (s.fails&&s.fails[0]) || 'falla'; }
    if(code){
      S.stats.fail++; this.failed++; if(h) h.res = 'FALLA '+code;
      p.result = 'FAIL'; p.failCode = code; p.failStep = s;
      p.state = 'transit'; p.tr = {from:p.at, to:this.failBin, t:0, dur:this.pathTime(p.at,this.failBin)+5, fail:true};
      this.alive.delete(p.id);
      // también se retira su lote en espera? no: sólo la pieza
      this.emit('fail', {p, step:s, code});
      this.failMoving = this.failMoving || new Set(); this.failMoving.add(p);
      return;
    }
    S.stats.done++;
    if(p.idx === p.route.length-1 && p.branch==='main'){
      p.state='done'; p.result='OK'; this.done++; this.leadSum += this.t - p.born; this.alive.delete(p.id);
      this.emit('done', p); return;
    }
    p.state = 'out';
    const key = p.branch+':'+p.idx; (S.out[key] || (S.out[key]=[])).push(p);
  }

  /* avanza piezas que van a la caja de fallas (fuera de "alive") */
  tickFailed(h){
    if(!this.failMoving) return;
    for(const p of this.failMoving){ p.tr.t += h; if(p.tr.t>=p.tr.dur){ p.state='failed'; p.at=p.tr.to; p.tr=null; this.failMoving.delete(p); } }
  }

  /* ------------------------------------------------------------------ */
  kpis(){
    const wip = this.alive.size;
    const thr = this.t>0 ? this.done/(this.t/3600) : 0;
    return {t:this.t, released:this.released, wip, done:this.done, failed:this.failed, thr, lead: this.done? this.leadSum/this.done : 0};
  }
  counts(id){
    const S = this.st[id]; if(!S) return null;
    let q=0, out=0, kit=0, inp=0;
    for(const o in S.q) q += S.q[o].length;
    for(const k in S.out) out += S.out[k].length;
    for(const b in S.kit) kit += S.kit[b].length;
    inp = S.batch ? S.batch.pieces.length : S.slots.length;
    return {q, out, kit, inp, state:S.state, done:S.stats.done, fail:S.stats.fail, util: this.t? S.stats.busy/this.t : 0, mode:S.mode, campaign:S.campaign, batch:S.batch, slots:S.slots, coEnd:S.coEnd};
  }
}

/* Formato hh:mm:ss */
export function fmt(t){ t=Math.max(0,t|0); const h=(t/3600)|0, m=((t%3600)/60)|0, s=t%60; return (h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(s).padStart(2,'0'); }
