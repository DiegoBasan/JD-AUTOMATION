/* Escena 3D de la Kasalis: carga el GLB (piezas con nombre "<grupo>__<color>") y mueve los ejes según la pose. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CSS2DRenderer, CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';

const COL = {
  gris:0x8a8a90, naranja:0xE08A2E, morado:0x9B4FC2, azul:0x3F4FC8, rojo:0xD23A3A, beige:0xE6C98F,
  verde:0x2FC94A, gris2:0xA8A8A8, negro:0x2a2a2c, amarillo:0xE2D44A,
};
const THEME = {
  light:{bg:0xF2F2F3, floor:0xE6E6E8, edge:0x1a1a1d, edgeOp:.28},
  dark: {bg:0x0E0E10, floor:0x161619, edge:0x000000, edgeOp:.55},
};
const PISTON_STROKE = 60;   // mm que baja el vástago para librar el rotary

export async function createScene(container, url){
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer(); labels.domElement.className = 'labels'; container.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 5, 20000);
  camera.position.set(-1050, 780, 420);   // como el operador: carga al frente, dispensado a la derecha
  const controls = new OrbitControls(camera, labels.domElement);
  controls.target.set(0, 140, 0); controls.enableDamping = true; controls.maxPolarAngle = Math.PI*0.49;
  controls.minDistance = 150; controls.maxDistance = 4000;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a90, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-500, 1200, 700); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, {left:-750, right:750, top:750, bottom:-750, near:100, far:3000});
  sun.shadow.bias = -0.0005; scene.add(sun);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1800, 64), new THREE.MeshStandardMaterial({color:0xE6E6E8, roughness:1}));
  floor.rotation.x = -Math.PI/2; floor.position.y = -12; floor.receiveShadow = true; scene.add(floor);

  /* ---------- modelo ---------- */
  const gltf = await new GLTFLoader().loadAsync(url);
  const G = {}; const grp = n => G[n] || (G[n] = new THREE.Group());
  const meshes = []; const edges = [];
  const edgeMat = new THREE.LineBasicMaterial({color:0x1a1a1d, transparent:true, opacity:.28});
  for(const m of [...gltf.scene.children]){
    if(!m.isMesh) continue;
    const [g, c] = m.name.split('__');
    const piece = g==='lens' || (g==='plate' && c!=='rojo');
    m.material = new THREE.MeshStandardMaterial({color:COL[c]||0x999999, roughness:.55, metalness:.05, transparent:piece});
    m.castShadow = m.receiveShadow = true;
    m.userData = {group:g, color:c, piece};
    grp(g).add(m); meshes.push(m);
    const eg = new THREE.EdgesGeometry(m.geometry, 35);
    const ln = new THREE.LineSegments(eg, edgeMat); m.add(ln); edges.push(ln);
  }
  const box = n => { const b = new THREE.Box3(); G[n].children.filter(c=>c.isMesh).forEach(c=>b.union(new THREE.Box3().setFromObject(c))); return b; };
  const boxOf = (g,c) => new THREE.Box3().setFromObject(meshes.find(m=>m.name===`${g}__${c}`));
  // jerarquía de ejes
  const root = new THREE.Group(); scene.add(root);
  root.add(grp('base'), grp('spare'), grp('piston'), grp('rotary'));
  grp('rotary').add(grp('plate')); grp('plate').add(grp('lens'));
  root.add(grp('disp_x')); grp('disp_x').add(grp('disp_z')); grp('disp_z').add(grp('disp_head'));
  root.add(grp('align_z')); grp('align_z').add(grp('align_x')); grp('align_x').add(grp('align_head'));
  grp('align_head').add(grp('finger_a'), grp('finger_b'));

  /* ---------- geometría de referencia (mm, origen = centro del rotary sobre la cama) ---------- */
  const v = (b)=>b.getCenter(new THREE.Vector3());
  const sensor = v(boxOf('plate','verde')), adapter = boxOf('plate','gris2'), lensB = boxOf('lens','negro');
  const lensC = v(lensB), lensH = lensB.max.y - lensB.min.y;
  const drop = boxOf('plate','rojo').min.y - boxOf('rotary','amarillo').max.y;   // plato elevado sobre el rotary
  const fa = boxOf('finger_a','morado'), fb = boxOf('finger_b','morado');
  const fC = v(fa.clone().union(fb)), gap = fa.min.z - fb.max.z, lensD = lensB.max.x - lensB.min.x;
  const close = Math.max(0, (gap - lensD)/2);
  const NEEDLE = new THREE.Vector3(-22, 183, 285), CAM = new THREE.Vector3(-22, 267, 313);   // punta de aguja y cámara (del modelo)
  const adapterTop = adapter.max.y - drop;
  // posiciones de la pieza en cada estación (rotación CCW de 90° por índice)
  const at = (p, deg) => { const a = THREE.MathUtils.degToRad(deg); return new THREE.Vector3(p.x*Math.cos(a)+p.z*Math.sin(a), p.y-drop, -p.x*Math.sin(a)+p.z*Math.cos(a)); };
  const sD = at(sensor, 90), sA = at(sensor, 180), lA = at(lensC, 180);
  const gripY = -9, g = new THREE.Vector3(0, (lensC.y - drop) - (fC.y + gripY), 0);   // lente respecto al centro de los dedos
  const fingersYFor = lensBottom => lensBottom + lensH/2 - g.y - fC.y;
  let arcR = 8.9;
  const geo = {
    dispCam: [sD.x - CAM.x, -40, sD.z - CAM.z],
    get dispArcStart(){ return [sD.x + arcR - NEEDLE.x, adapterTop + 0.6 - NEEDLE.y, sD.z - NEEDLE.z]; },
    get dispUp(){ const a = this.dispArcStart; return [a[0], a[1] + 12, a[2]]; },
    alignAboveLens: [lA.x - fC.x, 0, lA.z - fC.z],
    alignGripLens: [lA.x - fC.x, gripY, lA.z - fC.z],
    alignOverSensor: [sA.x - fC.x, fingersYFor(adapterTop + 3), sA.z - fC.z],
    alignPlace: [sA.x - fC.x, fingersYFor(adapterTop - 6), sA.z - fC.z],
    // aguja sobre el arco en el ángulo 'deg' (X máquina = X mundo, Y máquina = -Z mundo)
    arcAt(deg, p){ const a = THREE.MathUtils.degToRad(deg); return [sD.x + p.XR*Math.cos(a) - NEEDLE.x, adapterTop + 0.6 + p.ZO - NEEDLE.y, sD.z - p.YR*Math.sin(a) - NEEDLE.z]; },
  };
  const lensInGrip = fC.clone().add(g).sub(lensC);
  const lensPlaced = new THREE.Vector3(sensor.x - lensC.x, (adapterTop - 6 + lensH/2 + drop) - lensC.y, sensor.z - lensC.z);

  /* ---------- cordón de DELO (hijo del plato: gira con él) ---------- */
  const beadMat = new THREE.MeshStandardMaterial({color:0xF3EBD2, roughness:.25, transparent:true, opacity:.95});
  let bead = null;
  function buildBead(p){
    if(bead){ grp('plate').remove(bead); bead.geometry.dispose(); }
    arcR = p.XR;
    const pts = [], n = 160, on0 = p.LI / (Math.PI*p.XR) * 180, on1 = p.IA - p.LO;   // grados donde abre y cierra el DELO
    for(let i=0;i<=n;i++){ const a = THREE.MathUtils.degToRad(p.SA + on0 + (on1-on0)*i/n);
      // punto en el mundo (estación de dispensado) → coordenadas del plato (deshacer giro de 90°)
      const X = sD.x + p.XR*Math.cos(a), Z = sD.z - p.YR*Math.sin(a);
      pts.push(new THREE.Vector3(-Z, adapterTop + 0.5 + drop + i/n*0.6, X)); }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, 0.75, 8, false);
    bead = new THREE.Mesh(tube, beadMat); bead.userData = {on0, on1}; bead.castShadow = true;
    grp('plate').add(bead);
  }

  /* ---------- luces de proceso ---------- */
  const uvMat = new THREE.MeshBasicMaterial({color:0x8A6CFF, transparent:true, opacity:0, depthWrite:false, side:THREE.DoubleSide});
  const uvCone = new THREE.Mesh(new THREE.ConeGeometry(22, 60, 32, 1, true), uvMat);
  uvCone.position.set(sA.x, adapterTop + 25, sA.z); scene.add(uvCone);
  const uvLight = new THREE.PointLight(0x8A6CFF, 0, 220); uvLight.position.set(sA.x, adapterTop + 40, sA.z); scene.add(uvLight);
  const spareC = v(box('spare'));
  const domeLight = new THREE.PointLight(0xffffff, 0, 300); domeLight.position.set(spareC.x, adapterTop + 40, spareC.z); scene.add(domeLight);

  /* ---------- etiquetas de estación ---------- */
  const tag = (txt, cls, pos) => { const d = document.createElement('div'); d.className = 'st-label '+cls; d.textContent = txt; const o = new CSS2DObject(d); o.position.copy(pos); scene.add(o); return d; };
  const LBL = {
    load: tag('Carga','load', new THREE.Vector3(-430, 40, 0)),
    disp: tag('Dispensado','disp', new THREE.Vector3(30, 40, 520)),
    align: tag('Alineación','align', new THREE.Vector3(520, 40, 0)),
    spare: tag('Spare','spare', new THREE.Vector3(0, 40, -480)),
  };

  /* ---------- resaltado de estación (modo falla) ---------- */
  const STGROUPS = {load:['piston','plate'], disp:['disp_x','disp_z','disp_head'], align:['align_z','align_x','align_head','finger_a','finger_b'], spare:['spare'], rotary:['rotary']};
  let hl = null;
  function highlight(st){ hl = st; meshes.forEach(m=>m.material.emissive.setHex(0)); Object.entries(LBL).forEach(([k,d])=>d.classList.toggle('on', k===st)); }

  /* ---------- aplicar pose ---------- */
  function apply(pose, extra={}){
    grp('rotary').rotation.y = THREE.MathUtils.degToRad(pose.rot);
    grp('piston').position.y = -PISTON_STROKE*pose.piston;
    grp('plate').position.y = -drop*pose.piston;
    grp('disp_x').position.x = pose.disp[0]; grp('disp_head').position.y = pose.disp[1]; grp('disp_z').position.z = pose.disp[2];
    grp('align_x').position.x = pose.align[0]; grp('align_head').position.y = pose.align[1]; grp('align_z').position.z = pose.align[2];
    grp('finger_a').position.z = -close*pose.grip; grp('finger_b').position.z = close*pose.grip;
    const L = grp('lens');
    if(pose.lens==='grip'){ if(L.parent!==grp('align_head')) grp('align_head').add(L); L.position.copy(lensInGrip); }
    else { if(L.parent!==grp('plate')) grp('plate').add(L); L.position.copy(pose.lens==='placed' ? lensPlaced : new THREE.Vector3()); }
    meshes.forEach(m=>{ if(m.userData.piece){ m.material.opacity = pose.piece; m.visible = pose.piece>0.02; } });
    if(bead){ const idx = bead.geometry.index.count; bead.geometry.setDrawRange(0, Math.floor(idx*pose.bead/6)*6); bead.visible = pose.bead>0 && pose.piece>0.02; beadMat.opacity = .95*pose.piece; }
    uvMat.opacity = .28*pose.uv; uvLight.intensity = 9000*pose.uv; domeLight.intensity = 12000*pose.dome;
    if(hl){ const k = .35+.35*Math.sin(performance.now()/180); meshes.forEach(m=>m.material.emissive.setRGB(0,0,0));
      for(const n of STGROUPS[hl]||[]) G[n].traverse(o=>{ if(o.isMesh) o.material.emissive.setRGB(k*.9, k*.12, k*.12); }); }
  }

  /* ---------- tema, cámara y loop ---------- */
  function setTheme(t){ const th = THEME[t]||THEME.light; scene.background = new THREE.Color(th.bg); floor.material.color.setHex(th.floor); edgeMat.color.setHex(th.edge); edgeMat.opacity = th.edgeOp; }
  const VIEWS = {
    iso:[new THREE.Vector3(-1050,780,420), new THREE.Vector3(0,140,0)], top:[new THREE.Vector3(-1,1700,0), new THREE.Vector3(0,0,0)],
    load:[new THREE.Vector3(-720,400,180), new THREE.Vector3(-270,190,0)], disp:[new THREE.Vector3(-260,430,720), new THREE.Vector3(0,190,280)],
    align:[new THREE.Vector3(-120,460,260), new THREE.Vector3(272,190,10)], spare:[new THREE.Vector3(-420,470,-700), new THREE.Vector3(0,170,-280)],
  };
  let fly = null;
  function view(name){ const v = VIEWS[name]; if(!v) return;
    const k = container.clientWidth < 700 ? 2.2 : 1, p1 = v[1].clone().add(v[0].clone().sub(v[1]).multiplyScalar(k));   // en celular, más lejos
    fly = {p0:camera.position.clone(), t0:controls.target.clone(), p1, t1:v[1].clone(), s:performance.now()}; }
  function resize(){ const w = container.clientWidth, h = container.clientHeight; renderer.setSize(w,h); labels.setSize(w,h); camera.aspect = w/h;
    // en celular la tarjeta tapa la mitad de abajo: subir la imagen
    if(w < 700) camera.setViewOffset(w, h, 0, h*0.2, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    if(w < 700 && !resize.done){ camera.position.multiplyScalar(1.35); resize.done = true; } }
  addEventListener('resize', resize); resize();
  function render(){
    if(fly){ const k = Math.min(1,(performance.now()-fly.s)/900), e = 1-Math.pow(1-k,3); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); if(k>=1) fly = null; }
    controls.update(); renderer.render(scene, camera); labels.render(scene, camera);
  }
  return {apply, render, setTheme, view, highlight, buildBead, geo, info:{drop, close, lensH, sensor, arcCenterDisp:sD}};
}
