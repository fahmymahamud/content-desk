/* Dad hydration comic reel. Pieces: dad (comic sticker), dadhead, field (comic background), av-* (your avatar). */
function buildScenes(){
 const INK=C.ink,YEL=C.yel,BLU=C.blu,RED=C.red,CREAM=C.cream;
 const H=S.hook,SU=S.sun,FO=S.forgets,WA=S.water,AV=S.avatar,RU=S.rule,WH=S.why,CL=S.close;
 const vis=(T,a,b)=>T>=a-0.02&&T<=b+0.05;
 // ---------- background ----------
 const fld=img('field',1,0);
 add(fld,T=>{if(T>=FO.t0-0.25&&T<AV.t0-0.25)return null;if(T>=RU.t0-0.25&&T<CL.t0-0.25)return null;
   let k=T<FO.t0?T/FO.t0:T<RU.t0?(T-AV.t0)/(RU.t0-AV.t0):(T-CL.t0)/(26-CL.t0);
   return {x:540,y:960,s:1.05+0.09*cl(k),a:1}});
 const paper=box(1080,1920,'',0);paper.e.style.background=CREAM;
 const dots=box(1080,1920,'half',0);dots.e.style.opacity=.07;
 [paper,dots].forEach(o=>add(o,T=>{const on=(T>=FO.t0-0.25&&T<AV.t0-0.25)||(T>=RU.t0-0.25&&T<CL.t0-0.25);return on?{x:540,y:960,s:1,a:1}:null}));
 // ---------- 1. HOOK ----------
 const sl=speed(1);add(sl,T=>{if(!vis(T,0.75,H.t0+H.d))return null;return {x:540,y:1120,s:0.6+0.5*oc(tw(T,0.75,.6)),r:T*8,a:.85*inout(T,0.75,H.t0+H.d-0.1,.3)}});
 const t1=ttl('THIS IS\nMY DAD',132,980,12);
 add(t1,T=>{if(!vis(T,0.2,H.t0+H.d))return null;const p=back(tw(T,0.2,.45)),ex=ic(tw(T,H.t0+H.d-0.35,.3));
   return {x:540,y:330-900*ex,s:p*(1+.02*Math.sin(T*4)),r:-3+Math.sin(T*1.6)*1.2,a:cl(p*4)}});
 const dad1=img('dad',0.70,10);shake(0.95,26);
 add(dad1,T=>{if(!vis(T,0.5,H.t0+H.d))return null;const d=bounce(tw(T,0.5,.52)),ex=ic(tw(T,H.t0+H.d-0.3,.3));
   const sq=T>0.80&&T<1.05?1+Math.sin((T-0.80)/0.25*Math.PI)*.05:1;
   return {x:540+1500*ex,y:lerp(2550,1120,d)+Math.sin(T*1.9)*8,s:0.70,r:Math.sin(T*1.3)*1.4,sx:sq,sy:2-sq,a:1}});
 sfx(0.25,'pop',.4,520);sfx(0.5,'whoosh',.6);sfx(0.95,'thud',.9);sfx(1.0,'ding',.5,1046);
 // ---------- 2. SUN ----------
 const sun=svg(...PROPS.sun,6);
 add(sun,T=>{if(!vis(T,SU.t0+0.1,SU.t0+SU.d))return null;const p=back(tw(T,SU.t0+0.1,.5)),ex=ic(tw(T,FO.t0-0.3,.3));
   return {x:850+700*ex,y:360,s:1.15*p,r:T*14,a:1}});
 const dad2=img('dad',0.50,10);
 add(dad2,T=>{if(!vis(T,SU.t0+0.15,SU.t0+SU.d))return null;const p=back(tw(T,SU.t0+0.15,.5)),ex=ic(tw(T,FO.t0-0.3,.3));
   return {x:lerp(-700,370,p)-900*ex,y:1120+Math.sin(T*2.1)*9,s:0.50,r:-2,a:1}});
 [[730,700,.95],[820,840,1.25],[700,900,1.55]].forEach((q,i)=>{const d=svg(...PROPS.drop,14);
   add(d,T=>{const t0=SU.t0+q[2];if(!vis(T,t0,SU.t0+SU.d))return null;const p=tw(T,t0,.75);const ex=ic(tw(T,FO.t0-0.3,.25));
     return {x:q[0],y:q[1]+p*150,s:(1.5+i*0.2)*pop(T,t0,.3),r:8*i,a:(1-ic(p))*(1-ex)}});sfx(SU.t0+q[2],'pop',.22,760+i*90)});
 const c2=chip('EVERY  WEEK.  RAIN  OR  SHINE.',820,128,56,13);
 add(c2,T=>{const t0=SU.t0+1.75;if(!vis(T,t0,SU.t0+SU.d))return null;const ex=ic(tw(T,FO.t0-0.3,.28));
   return {x:540,y:1330+600*ex,s:back(tw(T,t0,.45)),r:-2,a:1}});
 sfx(SU.t0+0.1,'whoosh',.5);sfx(SU.t0+1.75,'thud',.45);
 // ---------- 3. FORGETS ----------
 const head=img('dadhead',0.80,10);
 add(head,T=>{if(!vis(T,FO.t0,FO.t0+FO.d))return null;const p=back(tw(T,FO.t0,.45)),ex=ic(tw(T,WA.t0-0.25,.25));
   return {x:540,y:760,s:0.80*(1-0.25*ex)*p,r:Math.sin(T*1.7)*1.2,a:cl(p*4)}});
 [[250,430,FO.t0+0.35,1.5,-18],[850,370,FO.t0+0.6,1.8,16]].forEach(q=>{const o=ttl('?',150,200,15);
   add(o,T=>{if(!vis(T,q[2],FO.t0+FO.d))return null;const ex=ic(tw(T,WA.t0-0.25,.25));
     return {x:q[0],y:q[1]+Math.sin(T*3+q[0])*14,s:q[3]*back(tw(T,q[2],.4)),r:q[4],a:1-ex}});sfx(q[2],'pop',.3,640)});
 const wor=img('av-worried-sweat',1.05,11);
 add(wor,T=>{const t0=FO.t0+0.85;if(!vis(T,t0,FO.t0+FO.d))return null;const ex=ic(tw(T,WA.t0-0.25,.25));
   return {x:lerp(1500,935,back(tw(T,t0,.5))),y:1215+Math.sin(T*2.4)*7,s:1.05,a:1-ex}});
 const c3=chip('HE  FORGETS  ONE  THING',740,126,54,13,'#fff');
 add(c3,T=>{const t0=FO.t0+0.5;if(!vis(T,t0,FO.t0+FO.d))return null;const ex=ic(tw(T,WA.t0-0.25,.25));
   return {x:470,y:1340,s:back(tw(T,t0,.45)),r:2,a:1-ex}});
 sfx(FO.t0,'whoosh',.5);
 // ---------- 4. WATER ----------
 const bst=bang(1500,YEL,20,5);
 add(bst,T=>{if(!vis(T,WA.t0,WA.t0+WA.d))return null;const ex=ic(tw(T,AV.t0-0.3,.28));
   return {x:540,y:860,s:1.1*back(tw(T,WA.t0,.35))*(1-0.3*ex),r:T*9,a:1-ex}});
 const bst2=bang(1180,'#fff',16,5);
 add(bst2,T=>{if(!vis(T,WA.t0+0.06,WA.t0+WA.d))return null;const ex=ic(tw(T,AV.t0-0.3,.28));
   return {x:540,y:860,s:1.05*back(tw(T,WA.t0+0.06,.35))*(1-0.3*ex),r:-T*7,a:1-ex}});
 const bot=svg(...PROPS.bottle,12);shake(WA.t0+0.3,30);
 add(bot,T=>{if(!vis(T,WA.t0+0.12,WA.t0+WA.d))return null;const p=tw(T,WA.t0+0.12,.26),q=T-WA.t0-0.38,ex=ic(tw(T,AV.t0-0.3,.28));
   return {x:540,y:830,s:lerp(4.2,1.45,oc(p))*(q>0?1+.07*Math.exp(-q*5)*Math.sin(q*26)+.02*Math.sin(q*3):1)*(1-0.4*ex),r:lerp(-22,-4,oc(p)),a:cl(p*4)}});
 const t4=ttl('WATER!',150,900,14);
 add(t4,T=>{const t0=WA.t0+0.42;if(!vis(T,t0,WA.t0+WA.d))return null;const ex=ic(tw(T,AV.t0-0.3,.28));
   return {x:540,y:1320,s:back(tw(T,t0,.35))*(1+.03*Math.sin(T*6)),r:-4,a:1-ex}});
 sfx(WA.t0,'whoosh_long',.7);sfx(WA.t0+0.3,'thud',.95);sfx(WA.t0+0.34,'ding',.8,1318);sfx(WA.t0+0.42,'pop',.4,900);
 // ---------- 5. AVATAR TALKS ----------
 const dad5=img('dad',0.46,10);
 add(dad5,T=>{if(!vis(T,AV.t0,AV.t0+AV.d))return null;const p=back(tw(T,AV.t0,.5)),ex=ic(tw(T,RU.t0-0.3,.28));
   return {x:lerp(-650,300,p)-800*ex,y:1180+Math.sin(T*2)*8,s:0.46,r:-2,a:1}});
 const av5=img('av-fullbody-pointing',2.1,11);
 add(av5,T=>{const t0=AV.t0+0.18;if(!vis(T,t0,AV.t0+AV.d))return null;const p=back(tw(T,t0,.5)),ex=ic(tw(T,RU.t0-0.3,.28));
   let nod=0;const q=T-L[4].s;if(q>0&&q<2)nod=Math.sin(q*7)*2.5;
   return {x:lerp(1700,810,p)+900*ex,y:1210+Math.sin(T*2.3)*7,s:2.1,r:nod,a:1}});
 const b5=bub('DAD!  DON'T  FORGET\nYOUR  WATER!',840,290,74,16);
 add(b5,T=>{const t0=AV.t0+0.45;if(!vis(T,t0,AV.t0+AV.d))return null;const ex=ic(tw(T,RU.t0-0.3,.28));
   return {x:520,y:540-500*ex,s:back(tw(T,t0,.42))*(1+.015*Math.sin(T*5)),r:-2,a:1}});
 const tl5=tail(15,'left');
 add(tl5,T=>{const t0=AV.t0+0.5;if(!vis(T,t0,AV.t0+AV.d))return null;const ex=ic(tw(T,RU.t0-0.3,.28));
   return {x:830,y:720-500*ex,s:back(tw(T,t0,.4)),r:16,a:1}});
 sfx(AV.t0,'whoosh',.55);sfx(AV.t0+0.45,'pop',.45,620);
 // ---------- 6. THE RULE ----------
 const t6=ttlLight('1  GLASS\nEVERY  HOUR',116,1000,13);
 add(t6,T=>{const t0=RU.t0+0.1;if(!vis(T,t0,RU.t0+RU.d))return null;const ex=ic(tw(T,WH.t0-0.3,.28));
   return {x:540,y:400-700*ex,s:back(tw(T,t0,.42)),r:-2,a:1}});
 for(let i=0;i<8;i++){const g=svg(...PROPS.glass,12);const t0=RU.t0+0.75+i*0.13;
   add(g,T=>{if(!vis(T,t0,RU.t0+RU.d))return null;const ex=ic(tw(T,WH.t0-0.3,.28));const hop=Math.abs(Math.sin((T-t0)*4))*12*Math.exp(-(T-t0)*1.4);
     return {x:150+i*95,y:860-hop+600*ex,s:0.92*back(tw(T,t0,.35)),r:(i%2?3:-3),a:1}});
   if(i%2==0)sfx(t0,'pop',.26,620+i*45)}
 const c6=chip('ABOUT  8  A  DAY',640,122,56,13);
 add(c6,T=>{const t0=RU.t0+2.0;if(!vis(T,t0,RU.t0+RU.d))return null;const ex=ic(tw(T,WH.t0-0.3,.28));
   return {x:400,y:1130+600*ex,s:back(tw(T,t0,.42)),r:-2,a:1}});
 const av6=img('av-count-one',1.55,11);
 add(av6,T=>{const t0=RU.t0+0.3;if(!vis(T,t0,RU.t0+RU.d))return null;const p=back(tw(T,t0,.5)),ex=ic(tw(T,WH.t0-0.3,.28));
   return {x:lerp(1700,865,p)+800*ex,y:1330+Math.sin(T*2.2)*7,s:1.55,r:Math.sin(T*1.5)*1.5,a:1}});
 sfx(RU.t0+0.1,'whoosh',.5);sfx(RU.t0+2.0,'thud',.45);
 // ---------- 7. WHY ----------
 const t7=ttlLight('SO  HE  FEELS  BETTER',86,980,13);
 add(t7,T=>{const t0=WH.t0+0.1;if(!vis(T,t0,WH.t0+WH.d))return null;const ex=ic(tw(T,CL.t0-0.3,.28));
   return {x:540,y:380-700*ex,s:back(tw(T,t0,.4)),r:-1.5,a:1}});
 [['LESS  DIZZY',PROPS.stars,'#fff'],['FEWER  CRAMPS',PROPS.bolt,'#fff'],['MORE  ENERGY',PROPS.battery,YEL]].forEach((q,i)=>{
   const t0=WH.t0+0.45+i*0.78,dir=i%2?1:-1;const c=chip('   '+q[0],760,150,62,13,q[2]);
   const ic2=svg(...q[1],14,c);put(ic2,{x:96,y:75,s:1});
   add(c,T=>{if(!vis(T,t0,WH.t0+WH.d))return null;const p=back(tw(T,t0,.42)),ex=ic(tw(T,CL.t0-0.3,.28));
     return {x:lerp(540+dir*1300,540,p)+dir*1300*ex,y:700+i*230,s:1+.04*Math.exp(-(T-t0-.42)*7)*Math.sin((T-t0)*26),r:dir*1.6,a:1}});
   sfx(t0,'whoosh',.3);sfx(t0+0.28,'thud',.4)});
 sfx(WH.t0+0.1,'whoosh',.5);
 // ---------- 8. CLOSE ----------
 const t8=ttl('LOVE  YOU,  DAD',124,1000,13);
 add(t8,T=>{const t0=CL.t0+0.15;if(!vis(T,t0,26))return null;return {x:540,y:316,s:back(tw(T,t0,.45))*(1+.02*Math.sin(T*3)),r:-3,a:1}});
 const c8=chip('STAY  HYDRATED',700,126,60,13,BLU,'#fff');
 add(c8,T=>{const t0=CL.t0+0.5;if(!vis(T,t0,26))return null;return {x:540,y:520,s:back(tw(T,t0,.45)),r:2,a:1}});
 const dad8=img('dad',0.50,10);
 add(dad8,T=>{if(!vis(T,CL.t0,26))return null;const p=back(tw(T,CL.t0,.55));
   return {x:lerp(-700,292,p),y:1150+Math.sin(T*1.9)*9,s:0.50,r:-2,a:1}});
 const av8=img('av-celebrating',1.55,11);
 add(av8,T=>{const t0=CL.t0+0.22;if(!vis(T,t0,26))return null;const p=back(tw(T,t0,.55));const hop=Math.abs(Math.sin((T-t0)*3.4))*16;
   return {x:lerp(1700,845,p),y:1235-hop,s:1.55,r:Math.sin(T*3)*3,a:1}});
 const bot8=svg(...PROPS.bottle,14);
 add(bot8,T=>{const t0=CL.t0+0.65;if(!vis(T,t0,26))return null;
   return {x:566,y:1012+Math.sin(T*2.6)*14,s:0.46*back(tw(T,t0,.45)),r:-10+Math.sin(T*2)*5,a:1}});
 for(let i=0;i<9;i++){const h=svg(...PROPS.heart,16);const t0=CL.t0+0.8+rnd(i)*2.4,bx=250+rnd(i+30)*560;
   add(h,T=>{if(T<t0)return null;const p=((T-t0)/2.6)%1;return {x:bx+Math.sin(T*2+i)*40,y:1320-p*820,s:(0.7+rnd(i+7)*0.8)*Math.sin(cl(p*3)*Math.PI/2),a:(1-p)*0.95}})}
 sfx(CL.t0,'whoosh',.55);sfx(CL.t0+0.15,'thud',.5);sfx(CL.t0+0.5,'ding',.6,1568);sfx(CL.t0+0.65,'pop',.4,880);sfx(CL.t0+1.2,'ding',.4,1975);
}
