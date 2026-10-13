import json,struct,sys,numpy as np
def load(path):
    b=open(path,'rb').read()
    L=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+L])
    off=20+L; BL=struct.unpack('<I',b[off:off+4])[0]; bin_=b[off+8:off+8+BL]
    def acc(i):
        a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]
        n={'SCALAR':1,'VEC3':3}[a['type']]; dt={5125:np.uint32,5123:np.uint16,5126:np.float32}[a['componentType']]
        st=bv.get('byteStride'); base=bv.get('byteOffset',0)+a.get('byteOffset',0)
        if st:
            raw=np.frombuffer(bin_,dtype=np.uint8,count=st*(a['count']-1)+n*4,offset=base)
            out=np.lib.stride_tricks.as_strided(np.frombuffer(bin_,dtype=dt,offset=base,count=(st*(a['count']-1))//4+n),shape=(a['count'],n),strides=(st,4))
            return np.array(out)
        return np.frombuffer(bin_,dtype=dt,count=a['count']*n,offset=base).reshape(-1,n) if n>1 else np.frombuffer(bin_,dtype=dt,count=a['count'],offset=base)
    meshes=[]
    for m in j['meshes']:
        p=m['primitives'][0]
        meshes.append((acc(p['attributes']['POSITION']),acc(p['attributes']['NORMAL']),acc(p['indices']).astype(np.int64),p.get('material')))
    return j,meshes
def components(P,I):
    # union-find over vertices, merging vertices at same position
    key=np.round(P*1e5).astype(np.int64)
    _,inv=np.unique(key,axis=0,return_inverse=True); inv=inv.ravel()
    n=inv.max()+1; par=np.arange(n)
    def find(x):
        while par[x]!=x:
            par[x]=par[par[x]]; x=par[x]
        return x
    T=inv[I.reshape(-1,3)]
    for a,b,c in T:
        ra,rb,rc=find(a),find(b),find(c)
        if ra!=rb: par[rb]=ra
        rc=find(c); ra=find(a)
        if ra!=rc: par[rc]=ra
    roots=np.array([find(x) for x in range(n)])
    triroot=roots[T[:,0]]
    return triroot
if __name__=='__main__':
    j,M=load(sys.argv[1])
    names=['gris','naranja','morado','azul','rojo','beige','verde','gris2','negro','amarillo']
    for k in map(int,sys.argv[2].split(',')):
        P,N,I,_=M[k]; tr=components(P,I); T=I.reshape(-1,3)
        u,c=np.unique(tr,return_counts=True)
        print('==',names[k],'componentes',len(u))
        rows=[]
        for r,cnt in zip(u,c):
            v=P[np.unique(T[tr==r])]; mn=v.min(0)*1000; mx=v.max(0)*1000
            rows.append((cnt,mn,mx))
        rows.sort(key=lambda r:-r[0])
        for cnt,mn,mx in rows[:40]: print(f'{cnt:6d} min {np.round(mn).astype(int)} max {np.round(mx).astype(int)} size {np.round(mx-mn).astype(int)}')
