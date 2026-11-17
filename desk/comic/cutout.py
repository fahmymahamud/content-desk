# Cut a person or object out of a photo.
#   python3 cutout.py grid photo.jpg     -> grid1.png, grid2.png ... (the photo with a labelled 100px grid; Read them)
# Then in your own cut.py:
#   from cutout import Cutout
#   c=Cutout('photo.jpg'); c.poly([(0,740),(120,680),...]); c.refine(); c.save('mask.png')   # Read cut_check.jpg
# Auto segmentation (grabCut from a box, rembg, SAM) does not know where a wide hat ends and a roof begins,
# so the reliable method is: read the outline off the grid yourself, then let grabCut tidy the edges where there is contrast.
import sys, cv2, numpy as np
from PIL import Image, ImageDraw
class Cutout:
    def __init__(s,path):
        s.im=cv2.imread(path); s.H,s.W=s.im.shape[:2]; s.m=None
    def poly(s,points):
        """points: the silhouette in photo pixels, clockwise. Rough is fine - refine() fixes edges that have contrast."""
        m=Image.new('L',(s.W,s.H),0); ImageDraw.Draw(m).polygon([tuple(p) for p in points],fill=255)
        s.m=np.asarray(m); return s
    def refine(s,band=91,iters=4):
        """grabCut, free to move the edge only inside a band around your polygon, so it cannot run away."""
        k=np.ones((band,band),np.uint8)
        edge=cv2.dilate(s.m,k)-cv2.erode(s.m,k)
        g=np.where(s.m>0,cv2.GC_FGD,cv2.GC_BGD).astype(np.uint8)
        g[edge>0]=np.where(s.m[edge>0]>0,cv2.GC_PR_FGD,cv2.GC_PR_BGD)
        cv2.grabCut(s.im,g,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),iters,cv2.GC_INIT_WITH_MASK)
        s.m=np.where((g==cv2.GC_FGD)|(g==cv2.GC_PR_FGD),255,0).astype(np.uint8); return s
    def clean(s,close=21,open_=15,blur=7):
        s.m=cv2.morphologyEx(s.m,cv2.MORPH_CLOSE,np.ones((close,close),np.uint8))
        s.m=cv2.morphologyEx(s.m,cv2.MORPH_OPEN,np.ones((open_,open_),np.uint8))
        n,lab,st,_=cv2.connectedComponentsWithStats(s.m)
        if n>1: s.m=np.where(lab==1+np.argmax(st[1:,4]),255,0).astype(np.uint8)
        s.m=cv2.GaussianBlur(s.m,(blur,blur),0); return s
    def save(s,path='mask.png',check='cut_check.jpg'):
        s.clean(); cv2.imwrite(path,s.m)
        p=cv2.cvtColor(s.im,cv2.COLOR_BGR2RGB).copy(); p[s.m<128]=(255,0,255)   # magenta = cut away
        Image.fromarray(p).resize((s.W//2,s.H//2)).save(check,quality=85)
        print('saved',path,'- Read',check,'and fix any magenta on the subject, or any background still kept')
        return s
def grid(path):
    im=Image.open(path).convert('RGB'); W,Hh=im.size; k=1 if W>900 else 2
    g=im.resize((int(W*k*0.5*2/2),int(Hh*k*0.5*2/2))) if False else im.resize((W*k//2*2//2,Hh*k//2*2//2))
    sc=g.width/W; d=ImageDraw.Draw(g)
    for x in range(0,W,100):
        d.line((x*sc,0,x*sc,g.height),fill=(255,0,0) if x%200==0 else (255,170,170)); d.text((x*sc+2,2),str(x),fill=(255,0,0))
    for y in range(0,Hh,100):
        d.line((0,y*sc,g.width,y*sc),fill=(255,0,0) if y%200==0 else (255,170,170))
        for x in range(0,g.width,500): d.text((x+2,y*sc+2),str(y),fill=(255,0,0))
    n=0
    for y in range(0,g.height,760): n+=1; g.crop((0,y,g.width,min(g.height,y+860))).save(f'grid{n}.png')
    print(f'wrote {n} grid images; the labels are photo pixels; the photo is {W}x{Hh}')
if __name__=='__main__' and len(sys.argv)>2 and sys.argv[1]=='grid': grid(sys.argv[2])
