# Example: how the "Dad" reel was cut. Coordinates are photo pixels, read off the grid images.
from cutout import Cutout
from comic import sticker, backdrop, write_meta
from PIL import Image
import shutil, os
os.makedirs('p',exist_ok=True)
# --- 1. the subject: trace the silhouette, then let grabCut tidy the edges ---
# A wide hat that runs off both sides of the frame is exactly what auto-segmentation gets wrong,
# so the hat brim, the hair, the gap between brim and shoulder and the collar are all traced by eye.
Cutout('dad.jpg').poly([
 (0,792),(120,700),(260,640),(400,620),(520,612),(640,620),(760,640),(860,668),(950,710),(1030,766),(1090,834),(1130,902),(1152,965),
 (1152,1268),(1080,1292),(1000,1280),(930,1256),(872,1226),(840,1198),      # lower-right brim
 (782,1288),(764,1378),(792,1452),(882,1496),(962,1540),(1046,1606),(1126,1690),(1152,1726),   # jaw -> right shoulder
 (1152,2048),(0,2048),(0,1660),(55,1580),(125,1505),(190,1438),             # left shoulder
 (292,1418),(360,1370),(385,1280),(372,1194),(330,1152),                    # hair
 (230,1140),(130,1114),(50,1068),(5,988),(0,880)                            # lower-left brim
]).refine().save('mask.png')
# --- 2. comic character + comic background ---
sticker('dad.jpg','mask.png','p/dad.png')
Image.open('p/dad.png').crop((0,0,0,0)) if False else None
d=Image.open('p/dad.png'); d.crop((int(d.width*0.02),0,int(d.width*0.98),int(d.height*0.70))).save('p/dadhead.png')  # close-up variant
backdrop('field.jpg','p/field.png')
# --- 3. your avatar poses this reel uses ---
POSES=['pointing-side','big-grin','fullbody-pointing','worried-sweat','celebrating','count-one']
for n in POSES: shutil.copy(f'av/{n}.png',f'p/av-{n}.png')
write_meta(['dad','dadhead','field']+['av-'+n for n in POSES])
