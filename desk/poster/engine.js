/* Poster Alive engine. Stage is 1080x1920. Everything is a pure function of time T (seconds), so frames render deterministically.
   Your scenes.js defines buildScenes() and uses these globals:
   M (pieces meta), TL (timeline), S[sceneName] = {t0,d}, L[i] = narration line {s,d,cap,words:[{w,s,e}]}
   img(name,b,z,parent)  piece as an element; b = the LARGEST poster-scale you will show it at (keeps it sharp)
   box(w,h,cls,z,parent) plain div (classes: card, chip, navy, wave, or '' and style it yourself via o.e.style.cssText+=...)
   add(o,T=>({x,y,s,r,a,sx,sy}) or null)   per-frame placement: centre x,y in stage px (or parent px), s = poster-scale (img) or plain scale (box)
   put(o,{...}) place once (static child inside a group)
   easing: oc io ic back elastic bounce ; tw(T,t0,d) 0..1 ; pop(T,t0,d) ; lerp cl rnd
   burst(t0,cx,cy,n,spread,piece)  ring of bubbles flying out ; twinkle(parent,x,y,t0,size,z,piece) repeating sparkle
   shine(pieceName,b,z,parent) + sweep(o,p)   a light band that wipes across a piece, masked to its shape
   shake(t,amp)  camera shake ; sfx(t,'whoosh'|'whoosh_long'|'pop'|'thud'|'ding'|'ring',gain,freq)  sound effect at time t
   spread(word,n)  n evenly spaced times across one caption word (e.g. digits of a phone number) */
let M=null,TL=null,S={},L=[];const EVENTS=[],objs=[],shakes=[];
const stage=document.getElementById('stage'),cam=document.getElementById('cam'),capEl=document.getElementById('cap');
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,p)=>a+(b-a)*p;
const oc=x=>1-Math.pow(1-cl(x),3),io=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2},ic=x=>Math.pow(cl(x),3);
const back=x=>{x=cl(x);const c=1.9,c3=c+1;return 1+c3*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const elastic=x=>{x=cl(x);return x===0?0:x===1?1:Math.pow(2,-10*x)*Math.sin((x*10-.75)*(2*Math.PI)/3)+1};
const bounce=x=>{x=cl(x);const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375};
const tw=(T,t0,d)=>cl((T-t0)/d);
const rnd=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
function img(name,b,z,parent){const m=M[name];if(!m)throw new Error('no piece named '+name);const e=document.createElement('img');e.src='p/'+name+'.png';e.className='o';e.style.width=m.w*b+'px';e.style.height=m.h*b+'px';e.style.zIndex=z||1;(parent?(parent.e||parent):cam).appendChild(e);return {e,w:m.w*b,h:m.h*b,b}}
function box(w,h,cls,z,parent){const e=document.createElement('div');e.className='o '+(cls||'');e.style.width=w+'px';e.style.height=h+'px';e.style.zIndex=z||1;(parent?(parent.e||parent):cam).appendChild(e);return {e,w,h,b:1}}
function put(o,p){if(!p||p.a<=0.003){o.e.style.display='none';return}o.e.style.display='';o.e.style.opacity=p.a==null?1:p.a;const s=(p.s==null?o.b:p.s)/o.b;
  o.e.style.transform=`translate(${p.x-o.w/2}px,${p.y-o.h/2}px) rotate(${p.r||0}deg) scale(${s*(p.sx||1)},${s*(p.sy||1)})`}
function add(o,f){objs.push([o,f]);return o}
function pop(T,t0,d=.4){return T<t0?0:back(tw(T,t0,d))}
function inout(T,t0,t1,fd=.22){return cl((T-t0)/.12)*(t1==null?1:1-tw(T,t1-fd,fd))}
function shake(t,amp=18){shakes.push([t,amp])}
function sfx(t,fx,g=1,f){EVENTS.push({t:Math.round(t*1000)/1000,fx,g,f:f||null})}
function spread(word,n){const o=[];for(let i=0;i<n;i++)o.push(word.s+(word.e-word.s)*(i+.35)/(n+.3));return o}
function burst(t0,cx,cy,n=12,spread=520,piece='bubble'){for(let i=0;i<n;i++){const o=img(piece,4,30);const ang=i/n*Math.PI*2+rnd(i+t0)*.6,dist=spread*(.5+rnd(i*3+t0)),sz=1.2+rnd(i+5+t0)*2.4;
  add(o,T=>{const p=tw(T,t0,.9);if(T<t0||p>=1)return null;const e=oc(p);return {x:cx+Math.cos(ang)*dist*e,y:cy+Math.sin(ang)*dist*e-60*p,s:sz*(.4+.8*e),a:1-ic(p)}})}}
function twinkle(parent,x,y,t0,sz=2,z=5,piece='star'){const o=img(piece,4,z,parent);add(o,T=>{if(T<t0)return null;const p=(T-t0)%1.3,k=Math.sin(Math.min(1,p/.7)*Math.PI);return {x,y,s:sz*k,r:p*90,a:k}});return o}
function shine(name,b,z,parent,strength=.9){const m=M[name];const o=box(m.w*b,m.h*b,'',z,parent);o.b=b;
  o.e.style.cssText+=`;-webkit-mask-image:url(p/${name}.png);-webkit-mask-size:100% 100%;mask-image:url(p/${name}.png);mask-size:100% 100%;background:linear-gradient(105deg,rgba(255,255,255,0) 42%,rgba(255,255,255,${strength}) 50%,rgba(255,255,255,0) 58%);background-size:300% 100%;background-repeat:no-repeat`;return o}
function sweep(o,p){o.e.style.backgroundPosition=lerp(150,-50,p)+'% 0'}
function floaters(n=16,piece='bubble'){for(let i=0;i<n;i++){const sz=.9+rnd(i)*2.6;const o=img(piece,4,1);const sp=70+rnd(i+40)*130,ph=rnd(i+80)*2400,bx=40+rnd(i+11)*1000;
  add(o,T=>{const y=2050-((T*sp+ph)%2300);return {x:bx+Math.sin(T*1.1+i)*34,y,s:sz*(1+Math.sin(T*2+i)*.04),a:.75}})}}
function setup(meta,tl){M=meta;TL=tl;tl.scenes.forEach(s=>S[s.name]=s);L=tl.lines;buildScenes();
  L.forEach(l=>{const ws=l.words.map(w=>w.w);l.groups=[];let g=[];ws.forEach((w,i)=>{g.push(i);if(g.length>=3||/[.?!,]$/.test(w)||i==ws.length-1){l.groups.push(g);g=[]}});
    for(let k=l.groups.length-1;k>0;k--){const pv=l.groups[k-1];if(l.groups[k].length==1&&pv.length<=2&&!/[.?!]$/.test(ws[pv[pv.length-1]])){l.groups[k-1]=pv.concat(l.groups[k]);l.groups.splice(k,1)}}});
  return EVENTS}
function shakeAt(T,t0,amp){const p=T-t0;if(p<0||p>.45)return [0,0];const k=amp*Math.pow(1-p/.45,2);return [Math.sin(p*70)*k,Math.cos(p*55)*k*.6]}
const escH=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function caption(T){let h='';for(const l of L){if(T<l.s-.05||T>l.s+l.d+.25)continue;let k=0;l.words.forEach((w,j)=>{if(T>=w.s)k=j});const g=l.groups.find(g=>g.includes(k));const first=l.words[g[0]].s;const p=back(cl((T-first)/.16));
  h=`<span class="b" style="transform:scale(${.8+.2*p})">${g.map(j=>j==k?`<em>${escH(l.words[j].w)}</em>`:escH(l.words[j].w)).join(' ')}</span>`}
  capEl.innerHTML=h}
function render(T){let sx=0,sy=0;shakes.forEach(s=>{const v=shakeAt(T,s[0],s[1]);sx+=v[0];sy+=v[1]});cam.style.transform=`translate(${sx}px,${sy}px)`;
  for(const [o,f] of objs)put(o,f(T));caption(T);
  return Promise.all([...document.images].map(im=>im.complete?1:im.decode().catch(()=>1)))}
