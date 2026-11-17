# Example: how the K Clean poster (649x795) was cut. Coordinates are original poster pixels, read off the grid images.
import numpy as np
from scipy import ndimage as ndi
from cutlib import Cutter
c=Cutter()
# --- outlined art on the blue background: dark outline + filled holes ---
mascot=c.darkfill((8,14,124,128.5)); yearend=c.darkfill((150,35,380,105),seeds=[(170,70)]); promo=c.darkfill((118,232,352,302),seeds=[(135,270)])
ex=c.grow((promo>0.3)|(yearend>0.3),1.5)|c.region((0,0,126,128.5))          # keep neighbours out of the title
title=c.darkfill((10,98,436,262),exclude=ex)
c.save('mascot',(8,14,124,128.5),mascot); c.save('yearend',(150,35,380,105),yearend); c.save('promo',(118,232,352,302),promo); c.save('title',(10,98,436,262),title)
# --- plain dark italic tagline, split into its three phrases, painted flat navy ---
NAVY=(10,38,96); tm=c.darkalpha((55,290,390,360))*~c.grow(promo,2.5); visit=c.region((160,323,302,360))
c.save('tag1',(60,298,207,336),tm*~visit,color=NAVY); c.save('tag2',(207,292,386,337),tm*~visit,color=NAVY)
c.save('tag3',(160,323,302,357),tm*visit*~c.region((155,320,176,333)),color=NAVY)
# --- the photo blob (everything that is not the cyan background), plus its round badge as a separate piece on top ---
cyan=(c.B>175)&(c.R<175)&(c.B-c.R>45); pm=c.blob((405,0,644,371),cyan,seed=(560,150))
teal=(c.R<90)&(c.G>110)&(c.G<200)&(c.B>160); cx,cy,r=c.component(teal,(425,250,505,360)); bm=c.circle(cx,cy,r+7)
pm=(pm|(bm>0.5))&~c.grow(title,0.75)&c.region((400,4,644,375)); c.save('photo',(400,0,649,375),c.feather(pm,1.5))
c.save('badge',(380,220,560,375),bm); c.meta['badge'].update(cx=cx,cy=cy,r=r+7)
# --- art printed on white cards: unwhite makes the white transparent ---
for k,b in {'bed':(88,394,200,474),'first':(82,474,212,502),'regular':(54,499,243,538),'second':(314,384,564,414),'sixty':(286,410,508,510),'each':(510,434,607,490),'same':(287,510,599,545),
            'f1':(48,566,222,627),'f2':(262,566,414,627),'f3':(444,566,608,627)}.items(): c.save(k,b,unwhite=True)
# --- art on the navy bar: plain rectangles, shown on a navy box with blend-mode lighten (class "navy") ---
for k,b in {'wa':(28,668,102,744),'watext':(106,672,396,693),'number':(110,693,398,744),'cal':(450,676,512,740),'ends':(514,674,622,740)}.items(): c.save(k,b)
print('bar colour',c.at(410,705))
# --- decorations lifted from the poster ---
c.whitealpha('bubble',(110,18,156,64),(170,18,190,30)); c.whitealpha('star',(404,10,438,52),(385,5,400,15))
c.poster((0,3,645,795)); c.finish()
