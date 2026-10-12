/* =====================================================================
   MUNDO 3D — layout, estaciones, pistas tipo PCB, piezas
   ===================================================================== */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {STATIONS, WIPS, ZONES, WALLS, LINE_COL, PX, KBUILD, KRETEST} from './data.js';

export const U = 4.6;               // unidades por metro en altura (estaciones más bajas)
export const UNITS_PER_M = 9.6;     // escala del plano (≈96 px/m en el layout)
const H_TABLE = .92*U, H_CELL = 2.0*U, H_HEAD = .28*U;

export function createWorld(container){
  /* ---------------- renderer / cámara ---------------- */
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  Object.assign(labelRenderer.domElement.style,{position:'absolute',inset:'0',pointerEvents:'none'});
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  const FR = 62; const W0=()=>container.clientWidth, H0=()=>container.clientHeight;
  const camera = new THREE.OrthographicCamera(-FR*W0()/H0()/2, FR*W0()/H0()/2, FR/2, -FR/2, -600, 1200);
  const ISO = new THREE.Vector3(62, 78, 92);
  camera.position.copy(ISO).add(new THREE.Vector3(0,3,0));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.maxPolarAngle = Math.PI/2.1; controls.minZoom=.3; controls.maxZoom=10;
  controls.target.set(0,3,0);
  const Z0 = ()=> W0()<820 ? .3 : .66;
  camera.zoom = Z0(); camera.updateProjectionMatrix();
  let labelsDirty = true;
  controls.addEventListener('change', ()=>{ labelsDirty = true; });

  /* ---------------- luces (sol ajustable) ---------------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d6f0, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 1.55);
  sun.castShadow = true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:500});
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = .04;
  scene.add(sun, sun.target);
  const sunState = {az:215, el:58};
  function setSun(az, el){
    sunState.az = az; sunState.el = el;
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el), r = 200;
    sun.position.set(Math.cos(e)*Math.sin(a)*r, Math.sin(e)*r, Math.cos(e)*Math.cos(a)*r);
    sun.intensity = .55 + 1.1*Math.sin(e);
    renderer.shadowMap.needsUpdate = true;
  }
  function setShadows(on){ sun.castShadow = on; renderer.shadowMap.needsUpdate = true; }
  setSun(sunState.az, sunState.el);

  /* ---------------- materiales compartidos ---------------- */
  const M = (c,o={})=>new THREE.MeshStandardMaterial({color:c, roughness:.55, metalness:.05, ...o});
  const MAT = {
    white:M(0xffffff), white2:M(0xeef2f8), floor:M(0xf6f8fc,{roughness:.9}), edge:M(0x2f6bff,{roughness:.4}),
    alu:M(0xc3ccd8,{metalness:.55,roughness:.35}), alu2:M(0x9aa6b8,{metalness:.5,roughness:.4}),
    blue:M(0x2c3fa8,{metalness:.25,roughness:.45}), table:M(0xdde3ea,{roughness:.7}), tableEdge:M(0x2e7d5b,{roughness:.6}),
    dark:M(0x1b2436,{roughness:.35}), screen:M(0x223a6e,{roughness:.2,emissive:0x1b3d8f,emissiveIntensity:.35}),
    glass:M(0xbfd8ff,{transparent:true,opacity:.16,roughness:.05,depthWrite:false}),
    hazard:M(0xf2c200), black:M(0x14171d), red:M(0xe23b3b,{emissive:0x8a0f0f,emissiveIntensity:.3}), amber:M(0xf2a23a),
    green:M(0x2fbf5a,{emissive:0x0f6b2c,emissiveIntensity:.5}), estop:M(0xf2c200), skin:M(0xf0d2bc), gown:M(0x4a6ee0), gown2:M(0x6f8fe8),
    tote:M(0x262c38), toteRed:M(0xd83a3a), wip:M(0xe3e9f4), tray:M(0xc5d3ee), tank:M(0xf2f5fb,{metalness:.3,roughness:.3}), wall:M(0xf3f6fb),
    // estilo "equipo" (no estación automática): cuerpo redondeado gris perla
    eq:M(0xe8edf4,{roughness:.45}), eq2:M(0xd3dbe7,{roughness:.5}), eqDark:M(0x3a4459,{roughness:.3}), wood:M(0xe9dfd0,{roughness:.8}),
  };

  /* ---------------- piso / zonas / paredes ---------------- */
  {
    const [x1,z1]=PX(120,178), [x2,z2]=PX(1578,938); const w=x2-x1, d=z2-z1, cx=(x1+x2)/2, cz=(z1+z2)/2;
    const slab=new THREE.Mesh(new RoundedBoxGeometry(w+4,2,d+4,3,.6),MAT.white); slab.position.set(cx,-1.02,cz); slab.receiveShadow=true; scene.add(slab);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(w+4.2,.25,d+4.2),MAT.edge); edge.position.set(cx,-1.9,cz); scene.add(edge);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,d),MAT.floor); floor.rotation.x=-Math.PI/2; floor.position.set(cx,.005,cz); floor.receiveShadow=true; scene.add(floor);
    const grid=new THREE.GridHelper(Math.max(w,d),Math.round(Math.max(w,d)/2),0xdde5f2,0xe9eef7); grid.position.set(cx,.012,cz); grid.material.transparent=true; grid.material.opacity=.55; scene.add(grid);
  }
  const ZMAT={}; for(const k in LINE_COL) ZMAT[k]=new THREE.MeshBasicMaterial({color:LINE_COL[k],transparent:true,opacity:.06,depthWrite:false});
  for(const z of ZONES){ const [x1,z1]=PX(z.r[0],z.r[1]), [x2,z2]=PX(z.r[2],z.r[3]); const m=new THREE.Mesh(new THREE.PlaneGeometry(x2-x1,z2-z1),ZMAT[z.line]); m.rotation.x=-Math.PI/2; m.position.set((x1+x2)/2,.02,(z1+z2)/2); m.userData.dyn=true; scene.add(m); }
  for(const poly of WALLS) for(let i=0;i<poly.length-1;i++){
    const [ax,az]=PX(...poly[i]), [bx,bz]=PX(...poly[i+1]); const len=Math.hypot(bx-ax,bz-az); if(len<.01) continue;
    const wall=new THREE.Mesh(new THREE.BoxGeometry(len+.4,2.4,.4),MAT.wall); wall.position.set((ax+bx)/2,1.2,(az+bz)/2); wall.rotation.y=-Math.atan2(bz-az,bx-ax); wall.castShadow=wall.receiveShadow=true; scene.add(wall);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(len+.4,.1,.42),MAT.edge); cap.position.set(wall.position.x,2.45,wall.position.z); cap.rotation.y=wall.rotation.y; scene.add(cap);
  }

  /* ---------------- primitivas ---------------- */
  const GEO = {box:new THREE.BoxGeometry(1,1,1), cyl:new THREE.CylinderGeometry(.5,.5,1,16), rbox:new RoundedBoxGeometry(1,1,1,3,.12)};
  function part(p,geo,mat,x,y,z,sx,sy,sz,o={}){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz);
    if(o.ry) m.rotation.y=o.ry; if(o.rx) m.rotation.x=o.rx; if(o.rz) m.rotation.z=o.rz; m.castShadow=o.shadow!==false; m.receiveShadow=true; p.add(m); return m; }
  const B=(p,mat,x,y,z,sx,sy,sz,o)=>part(p,GEO.box,mat,x,y,z,sx,sy,sz,o);
  const Bb=(p,mat,x,y0,z,sx,sy,sz,o)=>part(p,GEO.box,mat,x,y0+sy/2,z,sx,sy,sz,o);
  const Rb=(p,mat,x,y0,z,sx,sy,sz,o)=>{ // caja redondeada sin deformar el radio
    const g=new RoundedBoxGeometry(sx,sy,sz,3,Math.min(.6,sx/4,sy/4,sz/4)); const m=new THREE.Mesh(g,mat); m.position.set(x,y0+sy/2,z); m.castShadow=!(o&&o.shadow===false); m.receiveShadow=true; p.add(m); return m; };
  const C=(p,mat,x,y0,z,r,h,o)=>part(p,GEO.cyl,mat,x,y0+h/2,z,r*2,h,r*2,o);
  const dynB=(p,mat,x,y,z,sx,sy,sz)=>{ const m=B(p,mat,x,y,z,sx,sy,sz,{shadow:false}); m.userData.dyn=true; return m; };

  function lightTower(g,x,y,z){ C(g,MAT.alu2,x,y,z,.12,.35); let yy=y+.35; for(const m of [MAT.green,MAT.amber,MAT.red]){ C(g,m,x,yy,z,.18,.36,{shadow:false}); yy+=.36; } }
  function sign(g,accent,W,y,zf){ const w=Math.min(W*.55,4); Bb(g,MAT.white,0,y,zf,w,1.1,.1); dynB(g,accent,0,y+.2,zf+(zf<0?-.06:.06),w*.92,.25,.04); }
  function frame4(g,W,D,y0,y1,inset=.15,size=.24){ for(const sx of [-1,1]) for(const sz of [-1,1]) Bb(g,MAT.alu,sx*(W/2-inset),y0,sz*(D/2-inset),size,y1-y0,size); }
  function monitor(g,x,y,z,w=2.4,h=1.5,ry=0){ const m=new THREE.Group(); m.position.set(x,y,z); m.rotation.y=ry; g.add(m); B(m,MAT.dark,0,0,0,w,h,.14); B(m,MAT.screen,0,0,.08,w*.92,h*.88,.02,{shadow:false}); return m; }
  function openHeader(g,W,D,y,f){ Bb(g,MAT.white,0,y,f*(D/2-.1),W+.1,H_HEAD,.35); Bb(g,MAT.white,0,y+H_HEAD-.3,-f*(D/2-.1),W+.1,.3,.3); for(const sx of [-1,1]) Bb(g,MAT.white,sx*(W/2-.1),y+H_HEAD-.3,0,.3,.3,D); }

  /* ---- ESTACIONES AUTOMÁTICAS ---- */
  function buildCell(g,W,D,accent,f){ // Gecko (foto LEDs Assy)
    const Hb=H_TABLE;
    Bb(g,MAT.white,0,0,0,W,Hb,D);
    Bb(g,MAT.white,0,Hb-.6,f*(D/2+.25),W*.98,.6,.55);
    C(g,MAT.green,-W*.3,Hb,f*(D/2+.3),.16,.08,{shadow:false}); C(g,MAT.green,W*.3,Hb,f*(D/2+.3),.16,.08,{shadow:false});
    Bb(g,MAT.blue,W/2+.12,0,0,.26,H_CELL+H_HEAD,D);
    frame4(g,W,D,Hb,H_CELL);
    Bb(g,MAT.glass,0,Hb,0,W-.2,H_CELL-Hb,D-.2,{shadow:false});
    Bb(g,MAT.hazard,0,H_CELL-.9,f*(D/2-.1),W-.5,.3,.06,{shadow:false});
    openHeader(g,W,D,H_CELL,f); sign(g,accent,W,H_CELL+.15,f*(D/2+.12));
    lightTower(g,W/2-.6,H_CELL+H_HEAD,-f*(D/2-.6));
    Bb(g,MAT.alu2,0,Hb,0,W*.8,.15,D*.75,{shadow:false}); Bb(g,MAT.dark,0,Hb+.15,0,1.4,.5,1.4);
    const yG=H_CELL-1.4; Bb(g,MAT.alu,0,yG,-f*D*.25,W-.6,.35,.45);
    const car=new THREE.Group(); car.position.set(0,yG,-f*D*.25); car.userData.dyn=true; g.add(car);
    Bb(car,MAT.alu2,0,-.15,f*.4,.8,.8,.6); Bb(car,MAT.dark,0,-2,f*.6,.35,1.9,.35); C(car,MAT.black,.45,-2.3,f*.6,.18,1);
    monitor(g,W/2+1.7,Hb+3.4,f*D*.15,2.4,1.7,-f*Math.PI/2.6); Bb(g,MAT.alu2,W/2+.7,Hb+3,f*D*.15,1,.2,.2);
    C(g,MAT.estop,W/2+.3,Hb+2,f*(D/2-.5),.26,.22,{rz:Math.PI/2}); C(g,MAT.red,W/2+.4,Hb+2,f*(D/2-.5),.18,.22,{rz:Math.PI/2});
    return {top:Hb+.7, height:H_CELL+H_HEAD+1.6, carriage:car};
  }
  function buildScrew(g,W,D,accent,f){ // Moose / Scorpion (foto Moisture Absorber)
    const Hb=H_TABLE, top=1.9*U;
    Bb(g,MAT.white,-.15,0,f*.15,W*.85,Hb-.35,D*.75); Bb(g,MAT.blue,W*.425-.15,0,f*.15,.45,Hb-.35,D*.75);
    Bb(g,MAT.table,0,Hb-.35,0,W,.35,D); Bb(g,MAT.tableEdge,0,Hb-.35,f*D/2,W,.35,.1,{shadow:false});
    C(g,MAT.green,-W*.32,Hb-.95,f*(D*.575+.15),.15,.15,{rx:Math.PI/2,shadow:false});
    C(g,MAT.estop,W*.05,Hb-.95,f*(D*.575+.15),.26,.18,{rx:Math.PI/2,shadow:false});
    frame4(g,W,D,Hb,top,.18,.22);
    Bb(g,MAT.alu,0,top,D/2-.18,W,.22,.22); Bb(g,MAT.alu,0,top,-D/2+.18,W,.22,.22); Bb(g,MAT.alu,-W/2+.18,top,0,.22,.22,D); Bb(g,MAT.alu,W/2-.18,top,0,.22,.22,D);
    Bb(g,MAT.alu,0,Hb+2.3,-f*(D/2-.18),W,.2,.2);
    sign(g,accent,W,top-1.05,f*(D/2-.05)); lightTower(g,W/2-.3,top+.22,-f*(D/2-.3));
    monitor(g,0,Hb+3.2,-f*(D/2-.4),Math.min(3,W*.5),1.7,f<0?Math.PI:0);
    const px=-W/2+.8, pz=-f*(D/2-.9);
    C(g,MAT.alu,px,Hb,pz,.14,3.6); Bb(g,MAT.blue,px+W*.22,Hb+2.3,pz+f*D*.12,W*.45,.2,.24,{ry:-.35*f});
    Bb(g,MAT.dark,px+W*.42,Hb+.8,pz+f*D*.28,.28,1.5,.28); C(g,MAT.alu2,px+W*.42,Hb+.35,pz+f*D*.28,.05,.5);
    Bb(g,MAT.alu2,-W*.05,Hb,f*.3,1.7,.35,1.4); Bb(g,MAT.tote,W*.28,Hb,f*D*.15,1.4,.28,1.2);
    return {top:Hb+.4, height:top+1.6};
  }
  function buildKasalis(g,W,D,accent){ // operador en -z
    const Hb=H_TABLE, Ht=1.9*U, f=-1;
    Bb(g,MAT.white,0,0,0,W,Hb,D); Bb(g,MAT.blue,W/2+.12,0,0,.26,Ht+H_HEAD,D);
    frame4(g,W,D,Hb,Ht); Bb(g,MAT.glass,0,Hb,0,W-.2,Ht-Hb,D-.2,{shadow:false});
    openHeader(g,W,D,Ht,f); sign(g,accent,W,Ht+.15,f*(D/2+.12)); lightTower(g,W/2-.6,Ht+H_HEAD,D/2-.6);
    const R=Math.min(W,D)*.3, yT=Hb+.35;
    const table=new THREE.Group(); table.position.y=yT; table.userData.dyn=true; g.add(table);
    B(table,MAT.alu,0,0,0,R*2.3,.25,.9); B(table,MAT.alu,0,0,0,.9,.25,R*2.3); C(table,MAT.edge,0,-.15,0,.7,.4);
    for(let i=0;i<4;i++){ const a=i*Math.PI/2; B(table,i===0?MAT.edge:MAT.alu2,-R*Math.sin(a),.28,-R*Math.cos(a),1.3,.3,1.3); }
    const modPos=i=>{ const a=i*Math.PI/2; return new THREE.Vector3(-R*Math.sin(a),0,-R*Math.cos(a)); };
    const pD=modPos(1), pA=modPos(2), pS=modPos(3);
    Bb(g,MAT.alu,pD.x-1,Hb,pD.z,.3,Ht-Hb-.6,.3); Bb(g,MAT.alu,pD.x,Ht-1.8,pD.z,2.2,.3,.4);
    C(g,MAT.edge,pD.x,Ht-3.6,pD.z,.26,1.8); C(g,MAT.dark,pD.x,Ht-4.1,pD.z,.06,.5);
    Bb(g,MAT.alu,pA.x,Hb,pA.z+1.3,.45,Ht-Hb-.4,.45);
    const tgt=new THREE.Group(); tgt.position.set(pA.x,Ht-2.4,pA.z); tgt.userData.dyn=true; g.add(tgt);
    B(tgt,MAT.dark,0,0,0,2,.3,2); B(tgt,MAT.screen,0,-.17,0,1.7,.03,1.7,{shadow:false});
    B(g,MAT.alu2,pA.x+1.2,yT+1.6,pA.z,.3,.3,1.8);
    Bb(g,MAT.alu2,pS.x,Hb,pS.z+1,.4,2.6,.4); Bb(g,MAT.dark,pS.x,Hb+2.2,pS.z+.35,.6,.45,.6);
    const uv=new THREE.Mesh(new THREE.ConeGeometry(.8,1.8,20,1,true),new THREE.MeshBasicMaterial({color:0x8b5cf6,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
    uv.position.set(pA.x,yT+1.3,pA.z); uv.userData.dyn=true; g.add(uv);
    monitor(g,-W/2+1,Hb+3.4,-D/2-1,2.6,1.7,Math.PI); Bb(g,MAT.alu2,-W/2+1,Hb,-D/2-.9,.2,2.7,.2);
    return {top:yT+.5, height:Ht+H_HEAD+2, extra:{table,R,uv,tgt,yT,goal:0,mod:0,Ht}};
  }
  /* ---- EQUIPOS (no estaciones automáticas): EOL, leak, ASELEC/Fisnar, hornos, refri, plasma ---- */
  function eqBody(g,W,D,h,accent,f){
    Rb(g,MAT.eq2,0,0,0,W,.5,D);                     // zoclo
    Rb(g,MAT.eq,0,.45,0,W*.96,h-.45,D*.96);          // cuerpo
    dynB(g,accent,0,h-.25,f*(D*.48+.03),W*.9,.18,.04);
  }
  function buildEOL(g,W,D,accent,f){
    const h=1.75*U; eqBody(g,W,D,h,accent,f);
    Bb(g,MAT.eqDark,0,1.6,f*(D*.48+.02),W*.45,2.4,.08,{shadow:false});
    C(g,MAT.eq2,0,h,0,Math.min(W,D)*.25,.4); monitor(g,W*.3,h+1.2,-f*D*.2,2.4,1.5,f<0?Math.PI:0);
    return {top:h, height:h+3};
  }
  function buildLeak(g,W,D,accent,f){
    const h=1.0*U; eqBody(g,W,D,h,accent,f);
    Rb(g,MAT.white,-W*.15,h,0,W*.4,1.5,D*.5); C(g,MAT.eqDark,-W*.15,h+1.5,0,.5,.3);
    Rb(g,MAT.eq2,W*.25,h,-f*D*.15,1.4,1.1,1.1); monitor(g,W*.25,h+2.1,-f*(D*.35),2,1.3,f<0?Math.PI:0);
    return {top:h+.1, height:h+3.2};
  }
  function buildDispenser(g,W,D,accent,f){ // Fisnar / ASELEC
    const h=.95*U; eqBody(g,W,D,h,accent,f);
    for(const sx of [-1,1]) Bb(g,MAT.eq2,sx*(W/2-.5),h,0,.4,2.2,D*.7);
    Bb(g,MAT.eq2,0,h+2.2,0,W-.6,.4,.6);
    const car=new THREE.Group(); car.position.set(0,h+2.2,0); car.userData.dyn=true; g.add(car);
    Bb(car,MAT.eqDark,0,-.9,0,.6,1.1,.6); C(car,MAT.edge,0,-1.4,0,.12,.5);
    return {top:h+.1, height:h+4, carriage:car};
  }
  function buildOven(g,W,D,accent,f,hh=1.55){
    const h=hh*U; eqBody(g,W,D,h,accent,f);
    const door=new THREE.Mesh(GEO.box,M(0x2a3550,{emissive:0xff7a1a,emissiveIntensity:0})); door.scale.set(W*.6,h*.45,.08); door.position.set(0,h*.5,f*(D*.48+.04)); door.userData.dyn=true; g.add(door);
    C(g,MAT.alu,W/4,h,-f*D/4,.25,1.2);
    return {top:h, height:h+2.4, extra:{door}};
  }
  function buildFridge(g,W,D,accent,f){
    const h=1.75*U; eqBody(g,W,D,h,accent,f);
    Bb(g,MAT.glass,0,.7,f*(D*.48+.04),W*.8,h-1.6,.06,{shadow:false}); Bb(g,MAT.alu2,W*.38,h*.4,f*(D*.48+.1),.15,h*.25,.15);
    return {top:h, height:h+2};
  }
  function buildPlasma(g,W,D,accent,f){
    const h=1.4*U; eqBody(g,W,D,h,accent,f);
    const win=new THREE.Mesh(GEO.box,M(0x2a3550,{emissive:0xa855f7,emissiveIntensity:0})); win.scale.set(W*.5,h*.28,.08); win.position.set(0,h*.62,f*(D*.48+.04)); win.userData.dyn=true; g.add(win);
    monitor(g,-W*.2,h+1,0,2.2,1.4);
    return {top:h, height:h+2.6, extra:{door:win}};
  }
  function buildCabinet(g,W,D,accent,f,hh=1.8){ const h=hh*U; eqBody(g,W,D,h,accent,f); for(let i=1;i<4;i++) Bb(g,MAT.eq2,0,i*h/4,f*(D*.48+.02),W*.9,.06,.04,{shadow:false}); return {top:h, height:h+1.6}; }
  /* ---- MESAS / SOPORTE ---- */
  function buildTable(g,W,D,accent,f){
    const h=.85*U; Bb(g,MAT.wood,0,h-.3,0,W,.3,D); for(const sx of [-1,1]) for(const sz of [-1,1]) Bb(g,MAT.alu,sx*(W/2-.3),0,sz*(D/2-.3),.2,h-.3,.2);
    Bb(g,MAT.alu,0,.6,0,W-.6,.12,D-.6); monitor(g,0,h+1,-f*(D/2-.6),2.2,1.3,f<0?Math.PI:0);
    dynB(g,accent,0,h-.15,f*(D/2+.01),W*.9,.15,.04);
    return {top:h, height:h+2.4};
  }
  function buildPrinter(g,W,D,accent){ const h=.75*U; Bb(g,MAT.eq,0,0,0,W,h,D); Bb(g,MAT.eqDark,0,h,0,W*.9,1,D*.7); return {top:h+1, height:h+2.4}; }
  function buildCart(g,W,D,accent,red){
    const h=.8*U; for(const sx of [-1,1]) for(const sz of [-1,1]) Bb(g,MAT.alu,sx*(W/2-.15),0,sz*(D/2-.15),.16,h,.16);
    Bb(g,MAT.alu2,0,.9,0,W,.12,D); Bb(g,MAT.alu2,0,h-.12,0,W,.12,D);
    Bb(g,red?MAT.toteRed:MAT.tote,0,h,0,W*.8,.8,D*.75); dynB(g,accent,0,h-.4,D/2,W*.9,.2,.04);
    return {top:h+.8, height:h+2.2};
  }

  /* ---------------- construir estaciones ---------------- */
  const ST = {}; const pickables = []; const LBL = {};
  function rectInfo(r){ const [x1,z1]=PX(r[0],r[1]), [x2,z2]=PX(r[2],r[3]); return {cx:(x1+x2)/2, cz:(z1+z2)/2, w:Math.abs(x2-x1), d:Math.abs(z2-z1)}; }
  for(const s of STATIONS){
    const {cx,cz,w,d}=rectInfo(s.r); const g=new THREE.Group(); g.position.set(cx,0,cz);
    const col=LINE_COL[s.line]; const accent=M(col,{emissive:col,emissiveIntensity:0});
    const W=Math.max(w-.6,1.5), D=Math.max(d-.6,1.5);
    const f = s.fr || (s.r[1]>740 ? -1 : 1);
    let r;
    switch(s.type){
      case 'auto': r = s.line==='gecko' ? buildCell(g,W,D,accent,f) : buildScrew(g,W,D,accent,f); break;
      case 'kasalis': r = buildKasalis(g,W,D,accent); break;
      case 'eol': r = buildEOL(g,W,D,accent,f); break;
      case 'tester': r = buildLeak(g,W,D,accent,f); break;
      case 'dispenser': r = buildDispenser(g,W,D,accent,f); break;
      case 'oven': r = buildOven(g,W,D,accent,f); break;
      case 'fridge': r = buildFridge(g,W,D,accent,f); break;
      case 'plasma': r = buildPlasma(g,W,D,accent,f); break;
      case 'cabinet': r = buildCabinet(g,W,D,accent,f,s.id==='kanban'?1.1:1.8); break;
      case 'bin': r = buildCart(g,W,D,accent,s.line==='fail'); break;
      case 'printer': r = buildPrinter(g,W,D,accent); break;
      default: r = buildTable(g,W,D,accent,f);
    }
    const ring=new THREE.Mesh(new THREE.RingGeometry(Math.max(W,D)*.6,Math.max(W,D)*.67,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
    ring.rotation.x=-Math.PI/2; ring.position.y=.05; ring.userData.dyn=true; g.add(ring);
    const pick=new THREE.Mesh(GEO.box,new THREE.MeshBasicMaterial({visible:false})); pick.scale.set(W+1,r.height,D+1); pick.position.y=r.height/2; pick.userData={pick:true,dyn:true,station:s.id}; g.add(pick); pickables.push(pick);
    const el=document.createElement('div'); el.className='label3d'+(s.line==='fail'?' fail':'')+(s.approx?' approx':'');
    el.innerHTML=`<b>${s.name}</b><span class="st"></span>`;
    const lb=new CSS2DObject(el); lb.position.set(0,r.height+.4,0); g.add(lb);
    scene.add(g);
    const anchor=new THREE.Vector3(cx,0,cz+f*(D/2+1.8));
    ST[s.id]={...s, g, accent, ring, top:r.top, height:r.height, extra:{...(r.extra||{}), carriage:r.carriage}, cx, cz, W, D, f, anchor, el, stEl:el.querySelector('.st'), badge:null};
  }
  // carritos WIP de piso
  for(const r of WIPS){ const {cx,cz,w,d}=rectInfo(r); const W=Math.max(w-.5,1.4), D=Math.max(d-.5,1.4); const g=new THREE.Group(); g.position.set(cx,0,cz); scene.add(g);
    for(const sx of [-1,1]) for(const sz of [-1,1]) Bb(g,MAT.alu,sx*(W/2-.15),0,sz*(D/2-.15),.15,.85*U,.15);
    for(const y of [.9,2.2,.85*U-.12]) Bb(g,MAT.wip,0,y,0,W,.12,D); Bb(g,MAT.tray,0,2.32,0,W*.7,.3,D*.7); }
  {
    const [tx,tz]=PX(1445,382); for(const dz of [-1,1]) C(scene,MAT.tank,tx,0,tz+dz*1.2,.8,1.3*U);
    const {cx,cz,w}=rectInfo([815,588,1400,594]); Bb(scene,MAT.alu2,cx,1.0*U,cz,w,.25,.45);
    for(const [txt,x,y] of [['IN',437,845],['OUT',437,720],['Tanque Ar & O₂',1445,382]]){ const [lx,lz]=PX(x,y); const d=document.createElement('div'); d.className='label3d dim'; d.innerHTML=`<b>${txt}</b>`; const l=new CSS2DObject(d); l.position.set(lx,txt.startsWith('T')?1.3*U+1:2.5,lz); scene.add(l); }
  }
  // operadores (~1.7 m)
  const capsule=new THREE.CapsuleGeometry(.17*U,.85*U,4,10), headGeo=new THREE.SphereGeometry(.11*U,12,10);
  [[600,452],[820,385],[930,385],[985,385],[1150,445],[1220,445],[1390,480],[1130,520],[1220,520],[1000,520],[905,615],[1250,700],[1350,700],[1090,780],[1200,780],[1360,775],[795,880],[540,345],[640,345],[440,365],[420,565],[300,620],[480,770]].forEach(([x,y],i)=>{
    const [px,pz]=PX(x,y); const b=new THREE.Mesh(capsule,i%3?MAT.gown:MAT.gown2); b.position.set(px,.6*U,pz); b.castShadow=true; scene.add(b);
    const h=new THREE.Mesh(headGeo,MAT.skin); h.position.set(px,1.53*U,pz); h.castShadow=true; scene.add(h);
    const c=new THREE.Mesh(headGeo,MAT.white); c.position.set(px,1.6*U,pz); c.scale.set(1.05,.6,1.05); scene.add(c);
  });

  /* fusión de geometría estática por material */
  (function mergeStatic(){
    scene.updateMatrixWorld(true); const buckets=new Map(), kill=[];
    scene.traverse(o=>{ if(!o.isMesh||o.userData.dyn) return; for(let p=o.parent;p;p=p.parent) if(p.userData.dyn) return;
      let g=o.geometry.index? o.geometry.toNonIndexed(): o.geometry.clone();
      for(const k of Object.keys(g.attributes)) if(!['position','normal','uv'].includes(k)) g.deleteAttribute(k);
      if(!g.attributes.uv) g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
      g.applyMatrix4(o.matrixWorld); const key=o.material.uuid+(o.castShadow?'s':'');
      if(!buckets.has(key)) buckets.set(key,{mat:o.material,geos:[],cast:o.castShadow}); buckets.get(key).geos.push(g); kill.push(o); });
    kill.forEach(o=>o.parent.remove(o));
    for(const {mat,geos,cast} of buckets.values()){ const m=new THREE.Mesh(mergeGeometries(geos,false),mat); m.castShadow=cast&&!mat.transparent; m.receiveShadow=!mat.transparent; m.matrixAutoUpdate=false; m.updateMatrix(); scene.add(m); geos.forEach(g=>g.dispose()); }
  })();
  renderer.shadowMap.needsUpdate = true;

  /* =====================================================================
     PISTAS TIPO PCB (rutas) — trazos ortogonales con quiebres a 45°
     ===================================================================== */
  const pathCache = new Map();
  function laneOf(key){ let h=0; for(const c of key) h=(h*31+c.charCodeAt(0))|0; return ((Math.abs(h)%5)-2)*.5; }
  function pcbPoints(a,b,lane){
    const A=a.clone(), Bp=b.clone(); A.x+=lane; A.z+=lane; Bp.x+=lane; Bp.z+=lane;
    const dx=Bp.x-A.x, dz=Bp.z-A.z, adx=Math.abs(dx), adz=Math.abs(dz), sx=Math.sign(dx)||1, sz=Math.sign(dz)||1;
    const pts=[a.clone(), A];
    if(adx>=adz){ const e=(adx-adz)/2; pts.push(new THREE.Vector3(A.x+sx*e,0,A.z), new THREE.Vector3(Bp.x-sx*e,0,Bp.z)); }
    else { const e=(adz-adx)/2; pts.push(new THREE.Vector3(A.x,0,A.z+sz*e), new THREE.Vector3(Bp.x,0,Bp.z-sz*e)); }
    pts.push(Bp, b.clone());
    // quitar duplicados
    return pts.filter((p,i)=>i===0||p.distanceTo(pts[i-1])>.01);
  }
  function getPath(a,b){
    const key=a+'>'+b; if(pathCache.has(key)) return pathCache.get(key);
    const pts=pcbPoints(ST[a].anchor,ST[b].anchor,laneOf(key));
    const lens=[0]; for(let i=1;i<pts.length;i++) lens.push(lens[i-1]+pts[i].distanceTo(pts[i-1]));
    const P={pts,lens,len:lens[lens.length-1]}; pathCache.set(key,P); return P;
  }
  function pathPoint(P,d,out){ d=Math.max(0,Math.min(P.len,d)); let i=1; while(i<P.lens.length-1 && P.lens[i]<d) i++;
    const a=P.pts[i-1], b=P.pts[i], seg=P.lens[i]-P.lens[i-1]||1, k=(d-P.lens[i-1])/seg; return out.copy(a).lerp(b,k); }
  const pathLen=(a,b)=>getPath(a,b).len;

  const traceGroup=new THREE.Group(); scene.add(traceGroup);
  let chevrons=null, chevData=[];
  const chevGeo=(()=>{ const s=new THREE.Shape(); s.moveTo(-.45,-.35); s.lineTo(.55,0); s.lineTo(-.45,.35); s.lineTo(-.15,0); s.lineTo(-.45,-.35); const g=new THREE.ShapeGeometry(s); g.rotateX(-Math.PI/2); return g; })();
  const zoneGroup=new THREE.Group(); scene.add(zoneGroup);
  let routeStations=new Set();
  const ZONE_COL={q:0x2f6bff,o:0x22a06b,k:0xf08c00};

  function setRoute(prodKey, route, failBin){
    traceGroup.traverse(o=>{ if(o.geometry && o.geometry!==chevGeo) o.geometry.dispose(); }); traceGroup.clear(); zoneGroup.clear(); chevData=[];
    for(const id in ST){ if(ST[id].badge){ ST[id].g.remove(ST[id].badge); ST[id].badge.element.remove(); ST[id].badge=null; } ST[id].zones=null; }
    const col=LINE_COL[prodKey];
    const segs=[]; const nums={}; let n=0;
    for(const b of Object.keys(route)) for(const s of route[b]){ s._n=++n; (nums[s.st]=nums[s.st]||[]).push(n); }
    const add=(a,b2,c,w)=>{ if(a!==b2) segs.push({a,b:b2,c,w}); };
    for(const b of Object.keys(route)){
      const L=route[b]; for(let i=0;i<L.length-1;i++) add(L[i].st,L[i+1].st,b==='main'?col:0x7aa2ff,b==='main'?.6:.42);
      if(b!=='main'){ const m=route.main.find(s=>s.merge&&s.merge.includes(b)); add(L[L.length-1].st,m.st,0x7aa2ff,.42); }
    }
    const byColor=new Map(); const pads=[]; const tmp=new THREE.Object3D();
    for(const s of segs){
      const P=getPath(s.a,s.b); const arr=byColor.get(s.c)||[]; byColor.set(s.c,arr);
      for(let i=1;i<P.pts.length;i++){ const a=P.pts[i-1], b=P.pts[i], len=a.distanceTo(b); if(len<.01) continue;
        const g=new THREE.BoxGeometry(len,.06,s.w); tmp.position.copy(a).lerp(b,.5); tmp.position.y=s.w>.5?.07:.08; tmp.rotation.set(0,-Math.atan2(b.z-a.z,b.x-a.x),0); tmp.updateMatrix(); g.applyMatrix4(tmp.matrix); arr.push(g.toNonIndexed());
        const j=new THREE.CylinderGeometry(s.w/2,s.w/2,.06,14); j.translate(b.x,tmp.position.y,b.z); arr.push(j.toNonIndexed()); }
      pads.push(P.pts[0], P.pts[P.pts.length-1]);
      for(let d=1.2; d<P.len-1; d+=3.2) chevData.push({P,d0:d,c:s.c});
    }
    for(const [c,geos] of byColor){ geos.forEach(g=>{ for(const k of Object.keys(g.attributes)) if(!['position','normal'].includes(k)) g.deleteAttribute(k); });
      const m=new THREE.Mesh(mergeGeometries(geos,false),new THREE.MeshBasicMaterial({color:c})); traceGroup.add(m); }
    // pads dorados (vías) en cada estación
    const padGeos=[], holeGeos=[];
    const seen=new Set(); for(const p of pads){ const k=p.x.toFixed(1)+','+p.z.toFixed(1); if(seen.has(k)) continue; seen.add(k);
      const r=new THREE.CylinderGeometry(.9,.9,.08,24); r.translate(p.x,.1,p.z); padGeos.push(r.toNonIndexed());
      const h=new THREE.CylinderGeometry(.42,.42,.09,18); h.translate(p.x,.11,p.z); holeGeos.push(h.toNonIndexed()); }
    const strip=gs=>{ gs.forEach(g=>{ for(const k of Object.keys(g.attributes)) if(!['position','normal'].includes(k)) g.deleteAttribute(k); }); return mergeGeometries(gs,false); };
    if(padGeos.length){ traceGroup.add(new THREE.Mesh(strip(padGeos),new THREE.MeshBasicMaterial({color:0xd4a73a}))); traceGroup.add(new THREE.Mesh(strip(holeGeos),new THREE.MeshBasicMaterial({color:0xffffff}))); }
    chevrons=new THREE.InstancedMesh(chevGeo,new THREE.MeshBasicMaterial({color:0xffffff}),Math.max(1,chevData.length)); chevrons.frustumCulled=false; traceGroup.add(chevrons);
    // badges de número de paso
    routeStations=new Set(Object.keys(nums)); routeStations.add(failBin);
    for(const id in ST){ ST[id].el.classList.toggle('dim', !routeStations.has(id)); }
    for(const id in nums){ const s=ST[id]; const el=document.createElement('div'); el.className='badge3d'; el.style.background='#'+col.toString(16).padStart(6,'0'); el.textContent=nums[id].join(' · ');
      const o=new CSS2DObject(el); o.position.set(0,s.height+2.6,0); s.g.add(o); s.badge=o; }
    // zonas de WIP por estación (cola / salida-lote / componentes)
    for(const b of Object.keys(route)) route[b].forEach((s,i)=>{
      const S=ST[s.st]; S.zones=S.zones||[]; const zs=S.zones;
      if(!zs.find(z=>z.key==='q:'+s.op)) zs.push({key:'q:'+s.op,type:'q'});
      if(!(b==='main' && i===route.main.length-1)) zs.push({key:'o:'+b+':'+i,type:'o'});
      for(const mb of (s.merge||[])) zs.push({key:'k:'+mb,type:'k'});
    });
    for(const id in ST){ const S=ST[id]; if(!S.zones) continue; const n=S.zones.length;
      S.zones.forEach((z,i)=>{ z.x=S.anchor.x+(i-(n-1)/2)*4.6; z.z=S.anchor.z+S.f*1.6;
        const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.2),new THREE.MeshBasicMaterial({color:ZONE_COL[z.type],transparent:true,opacity:.12,depthWrite:false}));
        m.rotation.x=-Math.PI/2; m.position.set(z.x,.09,z.z+S.f*1.4); zoneGroup.add(m); }); }
    const fb=ST[failBin]; fb.zones=[{key:'fail',type:'k',x:fb.anchor.x,z:fb.anchor.z+fb.f*1.6}];
    labelsDirty=true;
  }

  /* =====================================================================
     PIEZAS — geometría fusionada por etapa (1 draw call por pieza)
     ===================================================================== */
  const PART_DEFS = (()=>{ const d=[]; const add=(k,geo,c,x,y,z,rx=0,rz=0)=>{ const g=geo.clone(); if(rx) g.rotateX(rx); if(rz) g.rotateZ(rz); g.translate(x,y,z); d.push({k,g,c}); };
    add('tray',new THREE.BoxGeometry(1.6,.14,1.6),0x2f6bff,0,.07,0);
    add('pcb',new THREE.BoxGeometry(1.05,.08,1.05),0x2e9e5b,0,.18,0);
    add('adapter',new THREE.CylinderGeometry(.4,.44,.36,20),0xcfd6e0,0,.4,0);
    for(const [x,z] of [[-.4,-.4],[.4,.4]]) add('screws1',new THREE.CylinderGeometry(.06,.06,.12,8),0x8a96a8,x,.28,z);
    add('glue',new THREE.TorusGeometry(.33,.06,8,24),0x4f7cff,0,.6,0,Math.PI/2);
    add('lens',new THREE.CylinderGeometry(.27,.3,.5,20),0x22324a,0,.85,0); add('lens',new THREE.CylinderGeometry(.22,.22,.03,20),0x9cc3ff,0,1.11,0);
    add('front',new THREE.BoxGeometry(1.35,.75,1.35),0xe2e9f8,0,.75,0);
    add('window',new THREE.BoxGeometry(.9,.05,.9),0x8fbaff,0,1.15,0);
    add('back',new THREE.BoxGeometry(1.4,.22,1.4),0xb8c7e6,0,.25,0);
    add('serial',new THREE.BoxGeometry(.6,.06,.45),0x2e9e5b,.35,.37,-.72);
    for(const [x,z] of [[-.55,-.55],[.55,-.55],[-.55,.55],[.55,.55]]) add('screws',new THREE.CylinderGeometry(.07,.07,.1,8),0x6b778a,x,1.16,z);
    add('bracket',new THREE.BoxGeometry(.12,1.1,1.3),0x8a96a8,-.82,.6,0); add('bracket',new THREE.BoxGeometry(.6,.12,1.3),0x8a96a8,-1.1,.08,0);
    for(const [x,z] of [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]]) add('leds',new THREE.SphereGeometry(.09,8,6),0xffe066,x,1.2,z);
    add('ampseal',new THREE.BoxGeometry(.35,.3,.5),0x222831,.85,.35,.2);
    add('absorber',new THREE.BoxGeometry(.3,.25,.3),0xffffff,-.4,1.25,.35);
    add('desiccant',new THREE.CylinderGeometry(.18,.18,.6,12),0xe9e2c7,.85,.5,-.35,0,Math.PI/2);
    add('gasket',new THREE.TorusGeometry(.6,.05,6,24),0x1d2433,0,1.18,0,Math.PI/2);
    add('dogbone',new THREE.BoxGeometry(3.3,.15,.4),0x8a96a8,.9,1.3,0); add('dogbone',new THREE.BoxGeometry(1.35,1,1.35),0xe2e9f8,1.9,.6,0);
    add('box',new THREE.BoxGeometry(1.9,1.5,1.9),0xc8a46a,0,.85,0);
    return d; })();
  const pieceGeoCache=new Map();
  function pieceGeometry(parts, branch){
    const keys=['tray',...[...parts].sort()]; const key=branch+'|'+keys.join(',');
    if(pieceGeoCache.has(key)) return pieceGeoCache.get(key);
    const has=new Set(keys); const boxed=has.has('box'); const geos=[]; const c=new THREE.Color();
    for(const d of PART_DEFS){ if(!has.has(d.k)) continue; if(boxed && d.k!=='box' && d.k!=='tray') continue;
      let col=d.c; if(d.k==='tray') col = branch==='main'?0x2f6bff:branch==='housing'?0x7aa2ff:0x5ec3d0; if(d.k==='glue'&&has.has('cured')) col=0x1e3a8a;
      const g=d.g.index?d.g.toNonIndexed():d.g.clone(); for(const k of Object.keys(g.attributes)) if(!['position','normal'].includes(k)) g.deleteAttribute(k);
      c.set(col); const n=g.attributes.position.count, arr=new Float32Array(n*3); for(let i=0;i<n;i++){ arr[i*3]=c.r; arr[i*3+1]=c.g; arr[i*3+2]=c.b; }
      g.setAttribute('color',new THREE.BufferAttribute(arr,3)); geos.push(g); }
    const g=mergeGeometries(geos,false); pieceGeoCache.set(key,g); return g;
  }
  const pieceMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.1});
  const pieceSel=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,emissive:0x2f6bff,emissiveIntensity:.55});
  const pieceFail=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,color:0xff7b7b,emissive:0x7a0000,emissiveIntensity:.35});
  const pieceDone=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,color:0xb7f0cf});
  const pieceGroup=new THREE.Group(); scene.add(pieceGroup);
  const meshes=new Map(); let selected=null;
  const PSCALE=.75;

  function slotPos(zone,i,out,y){ const col=i%3, row=(i/3)|0; out.set(zone.x+(col-1)*1.35, y, zone.z+row*1.35*(zone.f||1)); return out; }

  const _v=new THREE.Vector3(), _w=new THREE.Vector3();
  function syncPieces(E, rdt){
    if(!E) return;
    const vis=new Map(); // id -> target position (or 'hide')
    const kasSlot = E.st.kas && E.st.kas.slots[0];
    for(const id in E.st){
      const S=E.st[id], W=ST[id]; if(!W) continue; const zs=W.zones||[]; const zf=k=>{ const z=zs.find(z=>z.key===k); if(z) z.f=W.f; return z; };
      for(const op in S.q){ const z=zf('q:'+op); S.q[op].forEach((p,i)=>vis.set(p.id, i<9&&z ? slotPos(z,i,new THREE.Vector3(),.15) : null)); }
      for(const k in S.out){ const z=zf('o:'+k); S.out[k].forEach((p,i)=>vis.set(p.id, i<9&&z ? slotPos(z,i,new THREE.Vector3(),.15) : null)); }
      for(const b in S.kit){ const z=zf('k:'+b); S.kit[b].forEach((p,i)=>vis.set(p.id, i<9&&z ? slotPos(z,i,new THREE.Vector3(),.15) : null)); }
      if(S.batch) S.batch.pieces.forEach(p=>vis.set(p.id,null)); // dentro del horno
      S.slots.forEach((sl,i)=>{ if(id==='kas') return; vis.set(sl.p.id,new THREE.Vector3(W.cx+(i-(S.slots.length-1)/2)*1.4,W.top,W.cz)); });
    }
    if(kasSlot){ const K=ST.kas.extra, th=K.table.rotation.y; vis.set(kasSlot.p.id,new THREE.Vector3(ST.kas.cx-K.R*Math.sin(th),K.yT+.45,ST.kas.cz-K.R*Math.cos(th))); }
    // terminadas / falladas: últimas 9 apiladas
    const failedL=[], doneL=[];
    for(const p of E.pieces){ if(p.state==='failed') failedL.push(p); else if(p.state==='done') doneL.push(p); }
    const stack=(L,id)=>{ const W=ST[id]; if(!W) return; const z={x:W.anchor.x,z:W.anchor.z+W.f*1.6,f:W.f}; L.forEach((p,i)=>{ const j=L.length-1-i; vis.set(p.id, j<9? slotPos(z,j,new THREE.Vector3(),.15):null); }); };
    stack(failedL,E.failBin); stack(doneL,E.route.main[E.route.main.length-1].st);
    // tránsito
    for(const p of E.pieces){ if(p.state!=='transit'||!p.tr) continue; const P=getPath(p.tr.from,p.tr.to); pathPoint(P,P.len*Math.min(1,p.tr.t/p.tr.dur),_v); vis.set(p.id,_v.clone().setY(.3)); }
    // crear / actualizar
    const k=Math.min(1,rdt*10);
    for(const p of E.pieces){
      if(p.state==='merged'){ const m=meshes.get(p.id); if(m){ pieceGroup.remove(m); meshes.delete(p.id); } continue; }
      const target=vis.get(p.id);
      let m=meshes.get(p.id);
      if(target===undefined || target===null){ if(m) m.visible=false; continue; }
      const gkey=[...p.parts].join(',');
      if(!m){ m=new THREE.Mesh(pieceGeometry(p.parts,p.branch),pieceMat); m.scale.setScalar(PSCALE); m.position.copy(target); m.userData={piece:p.id,gkey}; meshes.set(p.id,m); pieceGroup.add(m); }
      if(m.userData.gkey!==gkey){ m.geometry=pieceGeometry(p.parts,p.branch); m.userData.gkey=gkey; }
      m.visible=true;
      if(p.state==='transit') m.position.copy(target); else m.position.lerp(target,k);
      m.material = p.id===selected ? pieceSel : p.result==='FAIL' ? pieceFail : p.state==='done' ? pieceDone : pieceMat;
      const sc = p.id===selected ? PSCALE*1.35 : PSCALE; m.scale.setScalar(sc);
    }
    // limpiar mallas de piezas que ya no existen
    if(meshes.size > E.pieces.length){ const ids=new Set(E.pieces.map(p=>p.id)); for(const [id,m] of meshes) if(!ids.has(id)){ pieceGroup.remove(m); meshes.delete(id); } }
  }
  function clearPieces(){ for(const m of meshes.values()) pieceGroup.remove(m); meshes.clear(); }

  /* =====================================================================
     RESALTADO de la estación actual / anterior / siguiente de la pieza
     ===================================================================== */
  function hiMesh(color, op){ const g=new THREE.Group();
    const frame=new THREE.Mesh(new THREE.RingGeometry(.92,1,4,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false}));
    frame.rotation.x=-Math.PI/2; frame.rotation.z=Math.PI/4; frame.position.y=.12; g.add(frame);
    const col=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:op*.18,depthWrite:false})); col.position.y=.5; g.add(col);
    g.visible=false; g.userData={frame,col}; scene.add(g); return g; }
  const HI={cur:hiMesh(0x2f6bff,.95), prev:hiMesh(0x9aa7c0,.6), next:hiMesh(0x22a06b,.75)};
  function placeHi(h,id,t){ const S=id&&ST[id]; if(!S){ h.visible=false; return; } h.visible=true;
    const s=Math.max(S.W,S.D)*.82+1.2; h.position.set(S.cx,0,S.cz); h.userData.frame.scale.set(s,s,1);
    h.userData.col.scale.set(S.W+1.2,S.height+1,S.D+1.2); h.userData.col.position.y=(S.height+1)/2;
    const pulse=.75+.25*Math.sin(t*5); h.userData.col.material.opacity = (h===HI.cur? .2:.08)*pulse; }
  let hiIds={cur:null,prev:null,next:null};
  function setHighlight(ids){ ids=ids||{cur:null,prev:null,next:null}; if(ids.cur===hiIds.cur&&ids.prev===hiIds.prev&&ids.next===hiIds.next) return; hiIds=ids; labelsDirty=true;
    for(const id in ST) ST[id].el.classList.toggle('hl', id===hiIds.cur); }

  /* =====================================================================
     FRAME
     ===================================================================== */
  let labelTimer=0;
  function animateStations(E, now, rdt){
    if(!E) return;
    for(const id in ST){ const W=ST[id]; const S=E.st[id]; const on = S ? (S.slots.length>0 || !!S.batch) : false;
      W.accent.emissiveIntensity += ((on?.8+.4*Math.sin(now*6):0)-W.accent.emissiveIntensity)*.2;
      W.ring.material.opacity += ((on?.5:0)-W.ring.material.opacity)*.15;
      if(W.extra.door) W.extra.door.material.emissiveIntensity = on? .6+.4*Math.sin(now*3) : 0;
      if(W.extra.carriage) W.extra.carriage.position.x = on? Math.sin(now*2.4)*W.W*.25 : W.extra.carriage.position.x*.9;
    }
    // Kasalis: mesa siempre antihoraria (carga → dispensado → alineación → spare)
    const K=ST.kas.extra, S=E.st.kas;
    if(S && S.slots[0]){ const sl=S.slots[0]; const prog=Math.min(1,(E.t-sl.t0)/Math.max(.001,sl.tEnd-sl.t0)); const seq=sl.op==='kas_build'?KBUILD:KRETEST;
      let acc=0,i=0; for(;i<seq.length;i++){ acc+=seq[i][3]; if(prog<=acc) break; } i=Math.min(i,seq.length-1);
      const mod=seq[i][1]; if(mod!==K.mod){ K.goal+=((mod-K.mod+4)%4)*Math.PI/2; K.mod=mod; }
      const uvOn=seq[i][0].includes('UV'); K.uv.material.opacity=uvOn? .35+.15*Math.sin(now*11):0;
      K.tgt.position.y=(mod===2&&!uvOn)? K.Ht-2.6+Math.sin(now*2.5)*.4 : K.Ht-2.2;
      K.sub={i,name:seq[i][0],detail:seq[i][2],mod,prog,op:sl.op,piece:sl.p.id};
    } else { K.uv.material.opacity=0; K.sub=null; }
    K.table.rotation.y += (K.goal-K.table.rotation.y)*Math.min(1,rdt*4);
  }
  function updateLabels(E, fmt){
    if(!E) return;
    for(const id in ST){ const W=ST[id]; const c=E.counts(id); let txt='';
      if(c && routeStations.has(id)){
        const parts=[];
        if(c.batch) parts.push(`🔥 ${c.batch.pieces.length} pzs · ${fmt(c.batch.tEnd-E.t)}`);
        else if(c.inp) parts.push('▶ '+(id==='kas'?(c.mode==='build'?'BUILD':'RETEST'):'proceso'));
        else if(c.state==='cambio de modo') parts.push('⇄ cambio a '+(c.mode==='build'?'BUILD':'RETEST'));
        else if(c.state==='espera componente') parts.push('⏸ espera componente');
        if(c.q) parts.push('cola '+c.q); if(c.out) parts.push('lote '+c.out); if(c.kit) parts.push('kit '+c.kit);
        if(c.done) parts.push('✓'+c.done); if(c.fail) parts.push('✗'+c.fail);
        txt=parts.join(' · ');
        W.el.dataset.state = c.batch||c.inp ? 'run' : (c.q||c.kit) ? 'wait' : 'idle';
      } else if(id===E.failBin && c && c.fail){ txt=''; }
      if(W._txt!==txt){ W._txt=txt; W.stEl.textContent=txt; }
    }
  }
  const _m4=new THREE.Matrix4(), _q=new THREE.Quaternion(), _s=new THREE.Vector3(1,1,1), _up=new THREE.Vector3(0,1,0), _d=new THREE.Vector3(), _p2=new THREE.Vector3();
  function frame(E, rdt, fmt, opts={}){
    const now=performance.now()/1000;
    animateStations(E, now, rdt);
    syncPieces(E, rdt);
    if(chevrons && opts.traces!==false){ for(let i=0;i<chevData.length;i++){ const c=chevData[i]; const d=(c.d0+now*3.2)%c.P.len;
        pathPoint(c.P,d,_v); pathPoint(c.P,Math.min(c.P.len,d+.3),_p2); _d.subVectors(_p2,_v); const ang=Math.atan2(-_d.z,_d.x);
        _q.setFromAxisAngle(_up,ang); _v.y=.14; _m4.compose(_v,_q,_s); chevrons.setMatrixAt(i,_m4); }
      chevrons.instanceMatrix.needsUpdate=true; }
    traceGroup.visible = opts.traces!==false; zoneGroup.visible = opts.traces!==false;
    for(const k of ['cur','prev','next']) placeHi(HI[k],hiIds[k],now);
    if(opts.follow){ const id=hiIds.cur; const m=selected&&meshes.get(selected); if(m){ _w.set(m.position.x,3,m.position.z); _d.subVectors(_w,controls.target).multiplyScalar(.06); controls.target.add(_d); camera.position.add(_d); labelsDirty=true; } }
    if(camAnim){ camAnim.k=Math.min(1,camAnim.k+rdt*1.8); const e=1-Math.pow(1-camAnim.k,3);
      camera.position.lerpVectors(camAnim.p0,camAnim.p1,e); controls.target.lerpVectors(camAnim.t0,camAnim.t1,e); camera.zoom=camAnim.z0+(camAnim.z1-camAnim.z0)*e; camera.updateProjectionMatrix(); labelsDirty=true; if(camAnim.k>=1) camAnim=null; }
    labelTimer-=rdt; if(labelTimer<=0){ labelTimer=.25; updateLabels(E, fmt); }
    controls.update();
    renderer.render(scene,camera);
    if(labelsDirty){ labelsDirty=false; labelRenderer.render(scene,camera); }
  }

  /* cámara */
  let camAnim=null;
  function animateCam(pos,target,zoom){ camAnim={p0:camera.position.clone(),t0:controls.target.clone(),z0:camera.zoom,p1:pos,t1:target,z1:zoom??camera.zoom,k:0}; }
  function viewIso(){ animateCam(ISO.clone().add(new THREE.Vector3(0,3,0)),new THREE.Vector3(0,3,0),Z0()); }
  function viewTop(){ animateCam(new THREE.Vector3(0,180,.01),new THREE.Vector3(0,0,0),W0()<820?.36:.78); }
  function focusStation(id){ const s=ST[id]; if(!s) return; const t=new THREE.Vector3(s.cx,s.top,s.cz); animateCam(t.clone().add(ISO.clone().multiplyScalar(.6)),t,2.6); }
  function resize(){ const w=W0(), h=H0(); camera.left=-FR*w/h/2; camera.right=FR*w/h/2; camera.top=FR/2; camera.bottom=-FR/2; camera.updateProjectionMatrix(); renderer.setSize(w,h); labelRenderer.setSize(w,h); labelsDirty=true; }
  addEventListener('resize',resize);
  if(typeof ResizeObserver!=='undefined') new ResizeObserver(resize).observe(container);

  /* selección */
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2(); let downAt=null; const pickCbs=[];
  const pos=e=>{ const r=renderer.domElement.getBoundingClientRect(); mouse.set((e.clientX-r.left)/r.width*2-1, -(e.clientY-r.top)/r.height*2+1); };
  renderer.domElement.addEventListener('pointerdown',e=>downAt=[e.clientX,e.clientY]);
  renderer.domElement.addEventListener('pointerup',e=>{ if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5) return; pos(e); ray.setFromCamera(mouse,camera);
    const hp=ray.intersectObjects([...meshes.values()].filter(m=>m.visible),false)[0];
    if(hp){ pickCbs.forEach(f=>f({type:'piece',id:hp.object.userData.piece})); return; }
    const hs=ray.intersectObjects(pickables,false)[0]; if(hs) pickCbs.forEach(f=>f({type:'station',id:hs.object.userData.station})); });
  renderer.domElement.addEventListener('pointermove',e=>{ if(e.buttons) return; pos(e); ray.setFromCamera(mouse,camera); renderer.domElement.style.cursor=ray.intersectObjects(pickables,false).length?'pointer':'grab'; });

  return {
    ST, scene, camera, renderer, setRoute, pathLen, frame, clearPieces, setHighlight,
    setSelected(id){ selected=id; }, get selected(){ return selected; },
    focusStation, viewIso, viewTop, setSun, setShadows, sunState,
    setLabels(on){ container.classList.toggle('hideLabels',!on); labelsDirty=true; },
    onPick(fn){ pickCbs.push(fn); }, kasSub(){ return ST.kas.extra.sub; }, markLabels(){ labelsDirty=true; },
  };
}
