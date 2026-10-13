"""Divide el GLB de la Kasalis (una malla por color) en piezas móviles con nombre.
Salida: GLB en mm, origen = centro del rotary sobre la cama (y=0 en la cama), un nodo por pieza/color: '<grupo>__<color>'."""
import sys, json, struct, numpy as np
sys.path.insert(0, sys.argv[3])
from glbcomp import load, components
COLORS=['gris','naranja','morado','azul','rojo','beige','verde','gris2','negro','amarillo']
# mínimo de la caja (mm, coordenadas originales) de cada componente → grupo
RULES={
 'naranja':[((-247,-179,300),'base'),((-62,-195,194),'base'),((-88,-167,248),'disp_x'),((-77,-137,297),'disp_z'),('*','disp_head')],
 'morado':[((288,-179,-124),'base'),((156,-195,-63),'base'),((236,-167,-104),'align_z'),((239,-150,-78),'align_x'),((192,-47,-43),'align_head'),((129,-11,-13),'finger_a'),((129,-11,-52),'finger_b')],
 'rojo':[((-384,-216,-82),'base'),((-382,-200,-82),'piston'),('*','plate')],
 'gris':[((-136,-87,-62),'rotary'),('*','base')],
 'azul':[('*','spare')], 'amarillo':[('*','rotary')],
 'beige':[('*','plate')],'verde':[('*','plate')],'gris2':[('*','plate')],'negro':[('*','lens')],
}
CENTER=np.array([-112.0,-195.0,-38.5])  # centro del rotary (x,z) y cama (y), mm
j,M=load(sys.argv[1])
parts={}  # (grupo,color) -> list of (P,N,I)
for k,(P,N,I,_) in enumerate(M):
    col=COLORS[k]; tr=components(P,I); T=I.reshape(-1,3)
    for r in np.unique(tr):
        tris=T[tr==r]; mn=np.round(P[np.unique(tris)].min(0)*1000).astype(int)
        grp=None
        for key,g in RULES[col]:
            if key=='*' or np.all(np.abs(mn-np.array(key))<=2): grp=g; break
        if grp is None: raise SystemExit(f'sin regla {col} {mn}')
        parts.setdefault((grp,col),[]).append(tris)
    print(col,'ok')
# armar GLB
bin_=bytearray(); bvs=[]; accs=[]; meshes=[]; nodes=[]
def add(arr,target,comp,typ):
    global bin_
    while len(bin_)%4: bin_.append(0)
    off=len(bin_); data=arr.tobytes(); bin_+=data
    bvs.append({'buffer':0,'byteOffset':off,'byteLength':len(data),'target':target})
    a={'bufferView':len(bvs)-1,'componentType':comp,'count':len(arr),'type':typ}
    if typ=='VEC3': a['min']=arr.min(0).tolist(); a['max']=arr.max(0).tolist()
    accs.append(a); return len(accs)-1
for (grp,col),trilist in sorted(parts.items()):
    P,N,I,_=M[COLORS.index(col)]
    tris=np.concatenate(trilist); used,inv=np.unique(tris,return_inverse=True)
    pos=(P[used]*1000-CENTER).astype(np.float32); nor=N[used].astype(np.float32)
    idx=inv.reshape(-1).astype(np.uint32)
    ip=add(pos,34962,5126,'VEC3'); inn=add(nor,34962,5126,'VEC3'); ii=add(idx,34963,5125,'SCALAR')
    meshes.append({'name':f'{grp}__{col}','primitives':[{'attributes':{'POSITION':ip,'NORMAL':inn},'indices':ii}]})
    nodes.append({'name':f'{grp}__{col}','mesh':len(meshes)-1})
    print(grp,col,len(idx)//3,'tris', 'min',np.round(pos.min(0)).astype(int),'max',np.round(pos.max(0)).astype(int))
while len(bin_)%4: bin_.append(0)
gj={'asset':{'version':'2.0','generator':'split_kasalis.py'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'accessors':accs,'bufferViews':bvs,'buffers':[{'byteLength':len(bin_)}]}
js=json.dumps(gj,separators=(',',':')).encode()
while len(js)%4: js+=b' '
out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(bin_))+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(bin_),0x004E4942)+bytes(bin_)
open(sys.argv[2],'wb').write(out); print('bytes',len(out))
