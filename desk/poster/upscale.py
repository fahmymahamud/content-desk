# usage: python3 upscale.py poster.jpg   -> poster.png (original), poster_hi.png (sharp enlargement), scale.json {"S": n}
# Small posters are enlarged 4x with Real-ESRGAN (free, CPU, no torch needed) so cut-out pieces stay sharp at 1080x1920.
# S = how many poster_hi pixels per original pixel. All cut coordinates are given in ORIGINAL pixels.
import sys, os, json, zipfile, pickle, time, urllib.request, subprocess, numpy as np
from PIL import Image
src=sys.argv[1]; im=Image.open(src).convert('RGB'); im.save('poster.png'); W,H=im.size
if max(W,H)>=1800:
    im.save('poster_hi.png'); json.dump({'S':1,'w':W,'h':H},open('scale.json','w')); print('big poster, no upscale. S=1',W,H); sys.exit()
os.makedirs('models',exist_ok=True); PTH='models/esr.pth'; ONNX='models/esr.onnx'
if not os.path.exists(ONNX):
    try: import onnx
    except ImportError: subprocess.run([sys.executable,'-m','pip','install','--break-system-packages','-q','onnx','onnxruntime'],check=True); import onnx
    if not os.path.exists(PTH): subprocess.run(['curl','-sSL','-m','300','-o',PTH,'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'],check=True)
    from onnx import helper as Hh, TensorProto as TP, numpy_helper as NH
    z=zipfile.ZipFile(PTH); root=[n for n in z.namelist() if n.endswith('data.pkl')][0][:-8]
    class St:
        def __init__(s,key,dt): s.key=key; s.dt=dt
    def rebuild(storage,offset,size,stride,*a):
        arr=np.frombuffer(z.read(root+'data/'+storage.key),dtype=storage.dt); n=int(np.prod(size)) if len(size) else 1
        return arr[offset:offset+n].reshape(size).copy()
    class U(pickle.Unpickler):
        def find_class(s,mod,name):
            if name=='_rebuild_tensor_v2': return rebuild
            if name=='FloatStorage': return np.float32
            if name=='OrderedDict':
                import collections; return collections.OrderedDict
            if mod.startswith('torch'): return lambda *a,**k: None
            return super().find_class(mod,name)
        def persistent_load(s,pid): return St(pid[2],pid[1])
    sd=U(z.open(root+'data.pkl')).load(); sd=sd.get('params_ema',sd.get('params',sd))
    nodes=[];inits=[];cnt=[0]
    def nm(p='t'): cnt[0]+=1; return f'{p}{cnt[0]}'
    def conv(x,key):
        w=nm('w');b=nm('b');inits.append(NH.from_array(sd[key+'.weight'],w));inits.append(NH.from_array(sd[key+'.bias'],b))
        o=nm();nodes.append(Hh.make_node('Conv',[x,w,b],[o],pads=[1,1,1,1],kernel_shape=[3,3]));return o
    def lrelu(x): o=nm();nodes.append(Hh.make_node('LeakyRelu',[x],[o],alpha=0.2));return o
    def cat(xs): o=nm();nodes.append(Hh.make_node('Concat',xs,[o],axis=1));return o
    inits.append(NH.from_array(np.array(0.2,dtype=np.float32),'c02'))
    def addscaled(x,y):
        m=nm();nodes.append(Hh.make_node('Mul',[y,'c02'],[m]));o=nm();nodes.append(Hh.make_node('Add',[x,m],[o]));return o
    def add(x,y): o=nm();nodes.append(Hh.make_node('Add',[x,y],[o]));return o
    inits.append(NH.from_array(np.array([1,1,2,2],dtype=np.float32),'sc'))
    def up(x): o=nm();nodes.append(Hh.make_node('Resize',[x,'','sc'],[o],mode='nearest'));return o
    def rdb(x,p):
        x1=lrelu(conv(x,p+'.conv1'));x2=lrelu(conv(cat([x,x1]),p+'.conv2'));x3=lrelu(conv(cat([x,x1,x2]),p+'.conv3'));x4=lrelu(conv(cat([x,x1,x2,x3]),p+'.conv4'));x5=conv(cat([x,x1,x2,x3,x4]),p+'.conv5')
        return addscaled(x,x5)
    feat=conv('in','conv_first');x=feat
    nb=1+max(int(k.split('.')[1]) for k in sd if k.startswith('body.'))
    for i in range(nb):
        o=rdb(rdb(rdb(x,f'body.{i}.rdb1'),f'body.{i}.rdb2'),f'body.{i}.rdb3');x=addscaled(x,o)
    x=add(feat,conv(x,'conv_body'))
    x=lrelu(conv(up(x),'conv_up1'));x=lrelu(conv(up(x),'conv_up2'));x=conv(lrelu(conv(x,'conv_hr')),'conv_last')
    nodes.append(Hh.make_node('Identity',[x],['out']))
    g=Hh.make_graph(nodes,'esr',[Hh.make_tensor_value_info('in',TP.FLOAT,[1,3,None,None])],[Hh.make_tensor_value_info('out',TP.FLOAT,[1,3,None,None])],inits)
    m=Hh.make_model(g,opset_imports=[Hh.make_opsetid('',13)]);m.ir_version=8;onnx.save(m,ONNX)
import onnxruntime as ort
a=np.asarray(im,dtype=np.float32)/255; so=ort.SessionOptions(); so.intra_op_num_threads=os.cpu_count() or 2
s=ort.InferenceSession(ONNX,so,providers=['CPUExecutionProvider']); T=160;P=12;out=np.zeros((H*4,W*4,3),dtype=np.float32);t0=time.time()
for y in range(0,H,T):
    for x in range(0,W,T):
        y0,x0=max(0,y-P),max(0,x-P);y1,x1=min(H,y+T+P),min(W,x+T+P)
        r=s.run(None,{'in':a[y0:y1,x0:x1].transpose(2,0,1)[None]})[0][0].transpose(1,2,0)
        r=r[(y-y0)*4:(y-y0)*4+(min(H,y+T)-y)*4,(x-x0)*4:(x-x0)*4+(min(W,x+T)-x)*4]; out[y*4:y*4+r.shape[0],x*4:x*4+r.shape[1]]=r
    print('upscaling row',y,'of',H,round(time.time()-t0),'s',flush=True)
hi=Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8)); S=4
if max(W,H)>=900: hi=hi.resize((W*2,H*2),Image.LANCZOS); S=2
hi.save('poster_hi.png'); json.dump({'S':S,'w':W,'h':H},open('scale.json','w')); print('done. S=',S,'original',W,H)
