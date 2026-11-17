# Turn photos into comic art: flat colours, ink lines, and a white sticker border for cut-out subjects.
import cv2, numpy as np
from PIL import Image
def quantize(bgr,k=11):
    Z=bgr.reshape(-1,3).astype(np.float32)
    _,lab,cen=cv2.kmeans(Z,k,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,20,1.0),3,cv2.KMEANS_PP_CENTERS)
    return cen[lab.flatten()].reshape(bgr.shape).astype(np.uint8)
def ink(bgr,blur=9,lo=50,hi=115,thick=4):
    """Canny on a heavily smoothed copy: structural lines only. Adaptive-threshold edges fire on every
    hair and grass blade and turn white beards and lawns into black speckle, so prefer this."""
    g=cv2.cvtColor(bgr,cv2.COLOR_BGR2GRAY); g=cv2.bilateralFilter(g,13,90,13); g=cv2.GaussianBlur(g,(blur,blur),0)
    return 255-cv2.GaussianBlur(cv2.dilate(cv2.Canny(g,lo,hi),np.ones((thick,thick),np.uint8)),(3,3),0)
def toon(bgr,k=12,sat=1.3,blur=9,lo=50,hi=115,thick=4,line=(38,22,14),passes=4):
    """Flat comic colour + ink. People: defaults. Backgrounds: k=9,sat=1.35,blur=13,lo=70,hi=150,thick=3,passes=6."""
    sm=bgr
    for _ in range(passes): sm=cv2.bilateralFilter(sm,11,70,11)
    hsv=cv2.cvtColor(sm,cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[...,1]*=sat; hsv[...,2]=np.clip(hsv[...,2]*1.07,0,255)
    sm=cv2.cvtColor(np.clip(hsv,0,255).astype(np.uint8),cv2.COLOR_HSV2BGR)
    q=quantize(sm,k); L=ink(sm,blur,lo,hi,thick).astype(np.float32)/255
    return (q*L[...,None]+np.array(line,np.float32)*(1-L[...,None])).astype(np.uint8)
def sticker(photo,mask,out,white=18,dark=9,pad=60,**kw):
    """Cut-out -> comic character with a white sticker border. photo/mask are paths; writes a transparent PNG."""
    im=cv2.imread(photo); al=cv2.imread(mask,0)
    ys,xs=np.where(al>100); im=im[ys.min():ys.max()+1,xs.min():xs.max()+1]; al=al[ys.min():ys.max()+1,xs.min():xs.max()+1]
    im=cv2.copyMakeBorder(toon(im,**kw),pad,pad,pad,pad,cv2.BORDER_REPLICATE)   # pad so the border closes all round
    al=cv2.copyMakeBorder(al,pad,pad,pad,pad,cv2.BORDER_CONSTANT,value=0)
    rgb=cv2.cvtColor(im,cv2.COLOR_BGR2RGB); a=(al>110).astype(np.uint8)*255
    W=cv2.dilate(a,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(white*2+1,)*2))
    D=cv2.dilate(W,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(dark*2+1,)*2))
    o=np.zeros(rgb.shape,np.uint8); o[:]=(26,16,10); o[W>0]=(255,255,255)
    inner=cv2.GaussianBlur(a,(5,5),0).astype(np.float32)/255
    o=(rgb*inner[...,None]+o*(1-inner[...,None])).astype(np.uint8)
    Image.fromarray(np.dstack([o,cv2.GaussianBlur(D,(5,5),0)])).save(out); print('wrote',out)
def backdrop(photo,out,size=(1080,1920),white_lines=True,grass=1.65,**kw):
    """A photo as a comic background. white_lines pushes near-white marks (pitch lines, road markings) to pure white -
    keep the threshold strict (V>198, S<42) or whole sunlit patches turn white and the scene looks snowed on."""
    kw={**dict(k=9,sat=1.35,blur=13,lo=70,hi=150,thick=3,line=(52,40,28),passes=6),**kw}
    rgb=cv2.cvtColor(toon(cv2.imread(photo),**kw),cv2.COLOR_BGR2RGB)
    hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV).astype(np.float32); H,S,V=hsv[...,0],hsv[...,1],hsv[...,2]
    g=(H>22)&(H<60)&(S>=42)&(V>=90); d=V<95
    S[g]=np.clip(S[g]*grass,0,255); V[g]=np.clip(V[g]*1.05,0,255)
    S[d]=np.clip(S[d]*1.2,0,255); V[d]=np.clip(V[d]*0.9,0,255)
    o=cv2.cvtColor(np.stack([H,S,V],-1).clip(0,255).astype(np.uint8),cv2.COLOR_HSV2RGB)
    if white_lines: o[(V>198)&(S<42)]=(250,250,252)
    Image.fromarray(o).resize(size,Image.LANCZOS).save(out); print('wrote',out)
def write_meta(names,out='p/meta.json'):
    """meta.json for the engine: every piece at its natural pixel size, so b in img() is a plain scale."""
    import json,os
    m={n:{'x':0,'y':0,'w':Image.open(f'{os.path.dirname(out)}/{n}.png').width,'h':Image.open(f'{os.path.dirname(out)}/{n}.png').height} for n in names}
    json.dump(m,open(out,'w'),indent=0); print({k:(v['w'],v['h']) for k,v in m.items()}); return m
