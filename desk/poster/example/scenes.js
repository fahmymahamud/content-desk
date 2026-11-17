/* Example scenes: the K Clean year-end promo poster brought alive as a 7-scene story.
   Scene names and line indexes come from script.json: hook(L0) title(L1) photo(L2) price(L3,L4,L5) tag(L6) cta(L7,L8) poster(L9).
   Pattern to copy: a host piece that stays on screen, each scene's pieces entering on the narration line that names them,
   exiting ~0.3s before the next scene, and sfx() placed at the same times as the visual hits. */
function buildScenes(){
  stage.style.background='linear-gradient(180deg,#27b3e3 0%,#55c9ee 38%,#a9e4f6 72%,#e4f6fc 100%)';
  const H=S.hook,TI=S.title,PH=S.photo,PR=S.price,TG=S.tag,CT=S.cta,PO=S.poster;
  // ---------- background ----------
  const w1=box(1700,700,'wave',0),w2=box(1500,560,'wave',0);
  add(w1,T=>({x:300+Math.sin(T*.35)*60,y:1830+Math.cos(T*.4)*18,r:-6,a:1}));
  add(w2,T=>({x:900+Math.cos(T*.3)*70,y:1900+Math.sin(T*.45)*16,r:5,a:.8}));
  floaters(16);
  const starSpots=[[120,560],[960,470],[90,1250],[985,1330],[540,250],[880,1650],[210,1700]];
  starSpots.forEach((p,i)=>{const o=img('star',4,1);add(o,T=>{const k=Math.max(0,Math.sin(T*2.4+i*1.7));return {x:p[0],y:p[1],s:(1.2+rnd(i)*1.6)*k,r:T*20+i*30,a:k}})});
  // ---------- host: mascot + year-end pill ----------
  const HX=178,HY=335;
  const mas=img('mascot',5.4,20);
  add(mas,T=>{if(T>=PO.t0-.3){const p=tw(T,PO.t0-.3,.3);return {x:HX,y:HY-500*ic(p),s:2.25,a:1-p}}
    if(T<TI.t0-.15){const p=bounce(tw(T,.1,.85));const land=T>.95?Math.sin((T-.95)*3)*10:0;const sq=T>.7&&T<1.0?1+Math.sin((T-.7)/.3*Math.PI)*.06:1;
      return {x:540,y:lerp(-420,730,p)+land,s:5.2,r:Math.sin(T*2.2)*2.5,sx:sq,sy:2-sq,a:1}}
    const p=io(tw(T,TI.t0-.15,.55));let nod=0;L.forEach(l=>{const q=T-l.s;if(q>0&&q<.5)nod=Math.sin(q/.5*Math.PI)*7});
    return {x:lerp(540,HX,p),y:lerp(730,HY,p)+Math.sin(T*2.6)*6,s:lerp(5.2,2.25,p),r:-nod+Math.sin(T*1.7)*1.5,a:1}});
  const ye=img('yearend',3.4,19);
  add(ye,T=>{if(T<.95)return null;if(T<TI.t0-.15){return {x:540,y:1165,s:3.3*pop(T,.95,.45),r:-2+Math.sin(T*3)*1.5,a:1}}
    const p=io(tw(T,TI.t0-.15,.55));let a=1,dy=0;
    if(T>PH.t0-.3&&T<PR.t0){const q=T<PH.t0?tw(T,PH.t0-.3,.3):1-tw(T,PR.t0-.3,.3);a=1-q;dy=-200*q}
    if(T>=PO.t0-.3){const q=tw(T,PO.t0-.3,.3);a=1-q;dy=-300*q}
    return {x:lerp(540,665,p),y:lerp(1165,335,p)+dy,s:lerp(3.3,2.45,p),r:-2,a}});
  burst(.82,540,760,14,620);
  // squeegee shine sweep in the hook
  const sweep=box(260,2600,'',25);sweep.e.style.background='linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.75),rgba(255,255,255,0))';
  add(sweep,T=>{const p=tw(T,1.25,.7);if(T<1.25||p>=1)return null;return {x:lerp(-300,1400,io(p)),y:960,r:18,a:Math.sin(p*Math.PI)}});
  [[250,480,1.5],[840,560,1.75],[200,1010,1.95],[900,980,2.15]].forEach(q=>{const o=img('star',4,26);add(o,T=>{const p=tw(T,q[2],.9);if(T<q[2]||p>=1||T>TI.t0)return null;const k=Math.sin(p*Math.PI);return {x:q[0],y:q[1],s:3.4*k,r:p*120,a:k}})});
  // ---------- title ----------
  const tOut=PH.t0-.28,tIn=TI.t0+.12;shake(tIn+.28,22);
  const titleF=T=>{if(T<tIn||T>PH.t0+.05)return null;const p=tw(T,tIn,.34);const ex=ic(tw(T,tOut,.3));
    return {x:540-1400*ex,y:745,s:lerp(7,2.45,oc(p))*(1+Math.sin(T*3)*.008)*(p>=1?1+.05*Math.exp(-(T-tIn-.34)*9)*Math.sin((T-tIn-.34)*40):1),r:lerp(-8,0,oc(p)),a:cl(p*4)}};
  const title=img('title',2.6,10);add(title,titleF);
  const sh=box(M.title.w*2.6,M.title.h*2.6,'',11);sh.b=2.6;sh.e.style.cssText+=`;-webkit-mask-image:url(p/title.png);-webkit-mask-size:100% 100%;mask-image:url(p/title.png);mask-size:100% 100%;background:linear-gradient(105deg,rgba(255,255,255,0) 42%,rgba(255,255,255,.9) 50%,rgba(255,255,255,0) 58%);background-size:300% 100%;background-repeat:no-repeat`;
  add(sh,T=>{const p=tw(T,tIn+.7,.9);const f=titleF(T);if(!f||T<tIn+.7||p>=1)return null;sh.e.style.backgroundPosition=lerp(150,-50,p)+'% 0';return f});
  burst(tIn+.28,540,745,12,640);
  const pIn=L[1].s+1.45;const promo=img('promo',2.9,12);
  add(promo,T=>{if(T<pIn||T>PH.t0+.05)return null;const p=tw(T,pIn,.7);const ex=ic(tw(T,tOut+.05,.3));return {x:540+1400*ex,y:1015,s:2.75*cl(elastic(p),0,1.3)*(1+Math.sin(T*5)*.012),r:lerp(-25,-2,elastic(p)),a:cl(p*6)}});
  // ---------- photo ----------
  const gIn=PH.t0+.05,gOut=PR.t0-.3,PS=2.35;
  const pg=box(M.photo.w*PS,M.photo.h*PS,'',10);
  const ph=img('photo',PS,1,pg);ph.e.style.filter='drop-shadow(0 18px 26px rgba(0,50,100,.3))';put(ph,{x:pg.w/2,y:pg.h/2,s:PS});
  const bd=img('badge',PS*1.25,3,pg);const bx=(M.badge.cx-M.photo.x)*PS,by=(M.badge.cy-M.photo.y)*PS;
  add(pg,T=>{if(T<gIn||T>PR.t0+.05)return null;const p=back(tw(T,gIn,.55)),ex=ic(tw(T,gOut,.3));return {x:lerp(1700,592,p)+1300*ex,y:630+Math.sin(T*1.8)*9,s:1,r:lerp(10,0,p)+Math.sin(T*1.3)*.8,a:1}});
  add(bd,T=>{const q=T-gIn-.55;const k=q<0?1:1+.08*Math.abs(Math.sin(q*3.2))+.25*Math.exp(-q*5)*Math.sin(q*22);return {x:bx,y:by,s:PS*k,r:q<0?0:Math.sin(q*3.2)*7,a:1}});
  [[150,262,.75,2.2],[205,300,1.15,1.7],[120,315,1.6,1.5],[190,345,2.0,2.4],[230,270,2.5,1.6],[85,120,1.3,1.4]].forEach(q=>twinkle(pg,q[0]*PS,q[1]*PS,gIn+q[2],q[3],4));
  // shine across the photo, masked to its shape
  const psh=box(pg.w,pg.h,'',2,pg);psh.e.style.cssText+=`;-webkit-mask-image:url(p/photo.png);-webkit-mask-size:100% 100%;background:linear-gradient(110deg,rgba(255,255,255,0) 40%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 60%);background-size:300% 100%;background-repeat:no-repeat`;
  add(psh,T=>{const p=tw(T,gIn+.7,1.1);if(T<gIn+.7||p>=1)return null;psh.e.style.backgroundPosition=lerp(150,-50,p)+'% 0';return {x:pg.w/2,y:pg.h/2,s:1,a:1}});
  const chipT=[L[2].s+.02,L[2].s+1.2,L[2].s+2.38];
  ['f1','f2','f3'].forEach((n,i)=>{const c=box(560,150,'chip',14);const im=img(n,2.35,1,c);put(im,{x:280,y:75,s:2.35});const dir=i%2?1:-1;shake(chipT[i]+.25,6);
    add(c,T=>{if(T<chipT[i]||T>PR.t0+.05)return null;const p=back(tw(T,chipT[i],.45)),ex=ic(tw(T,gOut+i*.04,.3));return {x:lerp(540+dir*1100,540+(i-1)*-22,p)-dir*1300*ex,y:1085+i*142,s:1+.06*Math.exp(-(T-chipT[i]-.45)*8)*Math.sin((T-chipT[i])*30),r:(i-1)*-1.5,a:1}})});
  // ---------- price ----------
  const a0=L[3].s,b0=L[4].s,c0=L[5].s,cIn=PR.t0+.05,cOut=TG.t0-.3;
  const cardOff=T=>(1-back(tw(T,cIn,.5)))*1700+ic(tw(T,cOut,.3))*1700;
  const card=box(1010,960,'card',8);add(card,T=>{if(T<cIn||T>TG.t0+.05)return null;return {x:540,y:935+cardOff(T),s:1,a:1}});
  const mv=tw0=>T=>io(tw(T,b0-.2,.5));const m=T=>io(tw(T,b0-.2,.5));
  const vis=T=>T>=cIn&&T<=TG.t0+.05;
  const bed1=img('bed',4.2,9);add(bed1,T=>{if(!vis(T)||T<a0+.05)return null;const d=bounce(tw(T,a0+.05,.6)),p=m(T);return {x:lerp(540,215,p),y:lerp(-200,lerp(770,690,p),d)+cardOff(T),s:lerp(4.2,2.4,p),a:1}});
  const first=img('first',3.7,9);add(first,T=>{if(!vis(T)||T<a0+.3)return null;const p=m(T);return {x:lerp(540,215,p),y:lerp(1020,555,p)+cardOff(T),s:lerp(3.6,1.7,p)*pop(T,a0+.3),a:1}});
  const reg=img('regular',3.1,9);add(reg,T=>{if(!vis(T)||T<a0+1.2)return null;const p=m(T);return {x:lerp(540,215,p),y:lerp(1170,852,p)+cardOff(T),s:lerp(3.0,1.3,p)*pop(T,a0+1.2),a:1}});
  [[540,b0+.45],[865,b0+.9]].forEach((q,i)=>{const b=img('bed',2.4,9);add(b,T=>{if(!vis(T)||T<q[1])return null;const d=bounce(tw(T,q[1],.6));const hop=T>b0+1.75?Math.abs(Math.sin((T-b0-1.75-i*.12)*5))*14*Math.exp(-(T-b0-1.75)*1.2):0;return {x:q[0],y:lerp(-200,690,d)-hop+cardOff(T),s:2.4,a:1}});
    const pl=box(70,70,'',9);pl.e.style.cssText+=';font:900 70px/70px Montserrat;color:#27b3e3;text-align:center';pl.e.textContent='+';add(pl,T=>{if(!vis(T)||T<q[1]+.2)return null;return {x:q[0]-163,y:690+cardOff(T),s:pop(T,q[1]+.2),a:1}});
    const mini=img('sixty',1.1,9);add(mini,T=>{const t0=b0+1.95+i*.16;if(!vis(T)||T<t0)return null;return {x:q[0],y:855+cardOff(T),s:1.0*pop(T,t0),r:-4,a:1}})});
  const second=img('second',3.2,9);add(second,T=>{if(!vis(T)||T<b0+.25)return null;const p=back(tw(T,b0+.25,.45));return {x:lerp(1500,540,p),y:985+cardOff(T),s:3.2,a:1}});
  const sT=b0+1.72;shake(sT+.2,26);
  const sixty=img('sixty',3.2,10);add(sixty,T=>{if(!vis(T)||T<sT)return null;const p=tw(T,sT,.26),q=T-sT-.26;return {x:428,y:1152+cardOff(T),s:lerp(8,2.62,oc(p))*(q>0?1+.07*Math.exp(-q*6)*Math.sin(q*34)+.02*Math.sin(q*4):1),r:lerp(-14,-2,oc(p)),a:cl(p*4)}});
  const each=img('each',2.7,10);add(each,T=>{if(!vis(T)||T<sT+.45)return null;return {x:870,y:1152+cardOff(T),s:2.5*pop(T,sT+.45,.5),r:Math.sin(T*4)*2.5,a:1}});
  burst(sT+.2,428,1165,14,560);
  const same=img('same',3.1,10);add(same,T=>{if(!vis(T)||T<c0)return null;const p=back(tw(T,c0,.5));return {x:540,y:lerp(1700,1345,p)+cardOff(T),s:2.9*(1+.03*Math.sin((T-c0)*6)*Math.exp(-(T-c0)*1.5)),a:cl((T-c0)*8)}});
  // ---------- tagline ----------
  const g0=L[6].s,gOut2=CT.t0-.28;
  const glow=box(1000,760,'',6);glow.e.style.cssText+=';background:radial-gradient(closest-side,rgba(255,255,255,.95),rgba(255,255,255,0));border-radius:50%';
  add(glow,T=>{if(T<TG.t0||T>CT.t0)return null;return {x:540,y:860,s:1+Math.sin(T*2)*.03,a:inout(T,TG.t0+.1,CT.t0,.3)}});
  [['tag1',g0-.02,650,4.5],['tag2',g0+.84,860,4.5],['tag3',g0+1.68,1075,4.7]].forEach((q,i)=>{const o=img(q[0],4.8,9);shake(q[1]+.2,8);
    add(o,T=>{if(T<q[1]||T>CT.t0+.05)return null;const p=tw(T,q[1],.3),ex=ic(tw(T,gOut2+i*.03,.28));return {x:540+(i%2?-1:1)*1400*ex,y:q[2]+Math.sin(T*2.4+i)*5,s:lerp(q[3]*2,q[3],oc(p))*(p>=1?1+.05*Math.exp(-(T-q[1]-.3)*8)*Math.sin((T-q[1])*32):1),r:-2,a:cl(p*4)}})});
  const sw=box(560,22,'',9);sw.e.style.cssText+=';background:linear-gradient(90deg,#27b3e3,#7fd9f4);border-radius:20px;transform-origin:50% 50%';
  add(sw,T=>{const t0=g0+2.0;if(T<t0||T>CT.t0)return null;return {x:540,y:1180,s:1,sx:oc(tw(T,t0,.35)),r:-3,a:1-tw(T,gOut2,.25)}});
  [330,540,750].forEach((x,i)=>{const b=img('bed',1.5,9);const t0=g0+.15+i*.84;add(b,T=>{if(T<t0||T>CT.t0)return null;const hop=Math.abs(Math.sin((T-t0)*4.2))*26*Math.exp(-(T-t0)*.8);return {x,y:1320-hop,s:1.35*pop(T,t0),a:1-tw(T,gOut2,.25)}})});
  // ---------- CTA ----------
  const d0=L[7].s,e0=L[8].s,xOut=PO.t0-.3;
  const cc=box(800,340,'navy',10);const cal=img('cal',3.5,1,cc),ends=img('ends',3.4,1,cc);put(ends,{x:520,y:170,s:3.35});
  add(cal,T=>{const q=T-d0-.3;return {x:190,y:170,s:3.4*(1+(q>0?.1*Math.exp(-q*3)*Math.abs(Math.sin(q*9)):0)),r:q>0?Math.sin(q*18)*9*Math.exp(-q*1.6):0,a:1}});
  add(cc,T=>{const t0=d0-.2;if(T<t0||T>PO.t0+.05)return null;const p=tw(T,t0,.9),ex=ic(tw(T,xOut,.3));return {x:540-1400*ex,y:lerp(-300,650,oc(tw(T,t0,.35))),s:1,r:(1-elastic(p))*-14+Math.sin(T*1.6)*.8,a:1}});
  shake(d0+.15,10);
  const wc=box(1010,420,'navy',10);const wa=img('wa',3.2,2,wc),wt=img('watext',2.3,2,wc),num=img('number',2.45,2,wc);
  put(wt,{x:628,y:112,s:2.25});
  [0,1].forEach(i=>{const r=box(240,240,'',1,wc);r.e.style.cssText+=';border:8px solid #43d15a;border-radius:50%;box-sizing:border-box';add(r,T=>{const q=((T-e0+i*.6)%1.2)/1.2;if(T<e0)return null;return {x:138,y:210,s:.6+q*1.1,a:(1-q)*.8}})});
  add(wa,T=>{const q=T-e0;const ring=q>0?Math.sin(q*34)*10*(Math.sin(q*2.6)>0?1:0):0;return {x:138,y:210,s:3.05*(1+(q>0?.04*Math.sin(q*8):0)),r:ring,a:1}});
  const DG=L[8].words.filter(w=>/\d{4}/.test(w.w)).flatMap(w=>spread(w,4));const nT=DG.map(t=>t-e0);const nX=[.125,.25,.375,.47,.64,.76,.88,1];
  add(num,T=>{let f=0;nT.forEach((t,i)=>{if(T>=e0+t)f=nX[i]});num.e.style.clipPath=`inset(0 ${(1-f)*100}% 0 0)`;const last=nT.filter(t=>T>=e0+t).pop();const q=last==null?1:T-e0-last;return {x:628,y:255,s:2.3*(1+.05*Math.exp(-q*14)),a:1}});
  add(wc,T=>{const t0=e0-.25;if(T<t0||T>PO.t0+.05)return null;const p=back(tw(T,t0,.5)),ex=ic(tw(T,xOut+.04,.3));return {x:540+1400*ex,y:lerp(2300,1090,p)+Math.sin(T*1.9)*5,s:1+(T>e0+3?.03*Math.sin((T-e0-3)*9):0),a:1}});
  // ---------- poster ----------
  const z0=PO.t0+.05,K=1.47;const pw=M.poster.w*K,phh=M.poster.h*K;shake(z0+.45,16);
  const pp=box(pw,phh,'',15);pp.e.style.cssText+=';border-radius:40px;overflow:hidden;box-shadow:0 34px 70px rgba(0,40,90,.45);border:9px solid #fff;box-sizing:content-box';
  const pim=document.createElement('img');pim.src='p/poster.jpg';pim.style.cssText=`position:absolute;left:0;top:0;width:${pw}px;height:${phh}px`;pp.e.appendChild(pim);
  const gl=box(624*K,92*K,'',2,pp);gl.e.style.cssText+=';border-radius:'+30*K+'px;border:7px solid #ffe14d;box-sizing:border-box';
  add(gl,T=>{const q=T-z0-1.1;if(q<0)return null;const k=Math.abs(Math.sin(q*3.4));gl.e.style.boxShadow=`0 0 ${20+40*k}px rgba(255,225,77,${.5+.5*k}),inset 0 0 ${10+20*k}px rgba(255,225,77,${.3+.3*k})`;return {x:(321.5)*K,y:(706-3)*K,s:1+.015*k,a:cl(q*4)}});
  const pshn=box(pw,phh,'',3,pp);pshn.e.style.cssText+=';background:linear-gradient(110deg,rgba(255,255,255,0) 42%,rgba(255,255,255,.6) 50%,rgba(255,255,255,0) 58%);background-size:300% 100%;background-repeat:no-repeat';
  add(pshn,T=>{const p=tw(T,z0+.6,1.0);if(T<z0+.6||p>=1)return null;pshn.e.style.backgroundPosition=lerp(150,-50,p)+'% 0';return {x:pw/2,y:phh/2,s:1,a:1}});
  add(pp,T=>{if(T<z0)return null;const p=tw(T,z0,.6);return {x:540,y:838+Math.sin(T*1.7)*7,s:lerp(.12,1,back(p)),r:lerp(-14,0,oc(p))+Math.sin(T*1.2)*.6,a:cl(p*5)}});
  burst(z0+.4,540,838,18,820);

  // ---------- sound effects (same moments as the visual hits) ----------
  sfx(.05,'whoosh',.5);sfx(.80,'thud',.5);sfx(.95,'pop',.3,600);sfx(1.25,'whoosh_long',.55);
  sfx(tIn,'whoosh',.6);sfx(tIn+.28,'thud',.7);sfx(pIn,'pop',.35,520);
  sfx(gIn,'whoosh',.6);chipT.forEach((t,k)=>{sfx(t,'whoosh',.35);sfx(t+.3,'pop',.32,650+k*120)});
  sfx(cIn,'whoosh',.6);sfx(a0+.45,'pop',.3,500);sfx(a0+1.2,'pop',.28,760);sfx(b0+.25,'whoosh',.4);sfx(b0+.85,'pop',.3,560);sfx(b0+1.3,'pop',.3,640);
  sfx(sT+.2,'thud',.85);sfx(sT+.22,'ding',.8);sfx(sT+.45,'pop',.3,880);sfx(c0,'whoosh',.45);sfx(c0+.4,'pop',.28,700);
  [-.02,.84,1.68].forEach((d,k)=>{sfx(g0+d+.18,'thud',.45);sfx(g0+d+.2,'pop',.25,520+k*130)});
  sfx(d0-.2,'whoosh',.5);sfx(d0+.12,'thud',.5);sfx(d0+.35,'ding',.45,1568);sfx(e0-.25,'whoosh',.5);sfx(e0+.02,'ring',.3);
  DG.forEach((t,k)=>sfx(t,'pop',.2,900+60*k));
  sfx(z0,'whoosh_long',.7);sfx(z0+.45,'thud',.8);sfx(z0+.5,'ding',.7);sfx(z0+.62,'ding',.5,1975.5);
}
