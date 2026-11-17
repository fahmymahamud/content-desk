/* Content Desk scene engine: draws one reel scene (270x480 design units) at local time t.
   Shared by the Content Desk storyboard preview and the video renderer. */
(function(){
const POSES=["arms-crossed-low-angle","big-grin","celebrating","confused","count-one","determined","exhausted","face-palm","fullbody-pointing","fullbody-wave","jaw-dropped","laughing","mind-blown","peek-over-glasses","pointing-side","proud-tie","sceptical-eyebrow","shushing","smirk-glasses-lowered","thinking","whispering","worried-sweat"];
const KINDS=["media","icon","phone","search","chat","counter","checklist","cards","stamp","quote","versus","bigtext","table","steps"];
const CSS=`
.cs-st{position:absolute;left:0;top:0;width:270px;height:480px;overflow:hidden;transform-origin:0 0;background:radial-gradient(120% 70% at 50% 62%,#cfe6da,#f1f6f3 70%);font-family:Inter,system-ui,sans-serif;color:#151c2b}
.cs-cam{position:absolute;inset:0;transform-origin:135px 240px}
.cs-a{position:absolute;inset:0}
.cs-o{position:absolute;box-sizing:border-box}
.cs-hd{position:absolute;left:16px;top:40px;max-width:236px;background:#fff;border-radius:12px;padding:8px 12px;font:900 21px/1.12 Montserrat,'Arial Black',sans-serif;letter-spacing:-.4px;box-shadow:0 6px 14px rgba(21,28,43,.13);transform-origin:20px 40px;z-index:5}
.cs-hd em,.cs-sb em{font-style:normal;color:var(--acc,#12824a)}
.cs-sb{position:absolute;left:6px;right:6px;bottom:84px;text-align:center;font:900 20px Montserrat,'Arial Black',sans-serif;z-index:6;text-shadow:0 0 4px #fff,2px 2px 0 #fff,-2px 2px 0 #fff,2px -2px 0 #fff,-2px -2px 0 #fff,0 2px 0 #fff,0 -2px 0 #fff,2px 0 0 #fff,-2px 0 0 #fff}
.cs-tg{position:absolute;left:14px;bottom:50px;font:700 9px Inter,sans-serif;background:rgba(255,255,255,.85);border-radius:999px;padding:3px 8px;z-index:6}
.cs-av{position:absolute;filter:drop-shadow(0 8px 8px rgba(21,28,43,.2));z-index:4}
.cs-sh{position:absolute;height:14px;border-radius:50%;background:rgba(21,28,43,.16);filter:blur(4px)}
.cs-pill{background:#fff;border-radius:999px;box-shadow:0 8px 18px rgba(21,28,43,.16),inset 0 -3px 0 rgba(21,28,43,.06);display:flex;align-items:center;gap:8px;font:700 13px Inter,sans-serif;padding:0 14px;white-space:nowrap;overflow:hidden}
.cs-mag{width:14px;height:14px;border:3px solid #5b6474;border-radius:50%;position:relative;flex:none}
.cs-mag:after{content:"";position:absolute;right:-6px;bottom:-5px;width:7px;height:3px;background:#5b6474;transform:rotate(45deg);border-radius:2px}
.cs-chip{position:absolute;background:#151c2b;color:#fff;border-radius:999px;padding:5px 11px;font:800 11px Inter,sans-serif;letter-spacing:.4px;white-space:nowrap;z-index:5}
.cs-card{background:#fff;border-radius:12px;box-shadow:0 8px 16px rgba(21,28,43,.16)}
.cs-emo{font-family:'Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji',sans-serif;line-height:1;text-align:center}
.cs-orb{border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#e4efe8 60%,#c3dccd);box-shadow:0 14px 24px rgba(21,28,43,.18),inset 0 -6px 0 rgba(21,28,43,.05);display:flex;align-items:center;justify-content:center}
`;
function css(){if(document.getElementById('cs-css'))return;const s=document.createElement('style');s.id='cs-css';s.textContent=CSS;document.head.appendChild(s)}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hl=s=>esc(s).replace(/\*([^*]+)\*/g,'<em>$1</em>');
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const oc=x=>1-Math.pow(1-cl(x),3);
const back=x=>{x=cl(x);const c=1.70158,c3=c+1;return 1+c3*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const bounce=x=>{x=cl(x);const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-=1.5/d)*x+.75;if(x<2.5/d)return n*(x-=2.25/d)*x+.9375;return n*(x-=2.625/d)*x+.984375};
// an animated wrapper: list of [anim, start] ; origin
const A=(an,h,o)=>`<div class="cs-a" data-an='${JSON.stringify(an)}' style="transform-origin:${o?o[0]+'px '+o[1]+'px':'135px 240px'}">${h}</div>`;
function pose(p){return POSES.includes(p)?p:null}
function emo(e,size,x,y){return `<div class="cs-o cs-emo" style="left:${x}px;top:${y}px;width:${size}px;font-size:${size*.8}px">${esc(e||'✨')}</div>`}
// ---- object builders: return html; area box {x,y,w,h} for main object ----
const B={
 media(d,b,o){const m=((o&&o.media)||[])[d.media|0]||{};const full=d.fit==='full',x=b.x,y=b.y,w=b.w,h=b.h,fit=d.fit==='contain'?'contain':'cover';const st=Number(d.start)||0;
   const css=`position:absolute;inset:0;width:100%;height:100%;object-fit:${fit};background:#151c2b`;
   const inner=!m.url||m.kind==='audio'?`<div class="cs-emo" style="${css};display:flex;align-items:center;justify-content:center;font-size:60px;background:#e4efe8">🖼️</div>`
     :m.kind==='video'?(o.frameSrc?`<img data-vf="1" alt="" src="${esc(o.frameSrc(0))}" style="${css}">`:`<video data-mv="${st}" muted playsinline preload="auto" src="${esc(m.url)}#t=${st}" style="${css}"></video>`)
     :`<img alt="" src="${esc(m.url)}" style="${css}">`;
   if(full)return `<div class="cs-o" style="left:0;top:0;width:270px;height:480px;overflow:hidden">${inner}<div style="position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.28),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 70%,rgba(0,0,0,.25))"></div></div>`
     +(d.label?A([['pop',.4]],`<div class="cs-chip" style="left:16px;top:${(o&&o.pose)?120:150}px">${esc(d.label)}</div>`,[60,150]):'');
   return A([['pop',0]],`<div class="cs-o cs-card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden;border:4px solid #fff">${inner}</div>`,[x+w/2,y+h/2])
   +(d.label?A([['pop',.4]],`<div class="cs-chip" style="left:${x+10}px;top:${y+h-18}px">${esc(d.label)}</div>`,[x+60,y+h]):'')},
 icon(d,b){const s=Math.min(b.w,b.h,170),x=b.x+(b.w-s)/2,y=b.y+(b.h-s)/2;const m=d.motion||'drop';
   return A([[m=='pop'?'pop':m=='spin'?'pop':'drop',0],[m=='spin'?'spin':'float',0]],`<div class="cs-o cs-orb" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px"><div class="cs-emo" style="font-size:${s*.55}px">${esc(d.emoji)}</div></div>`,[x+s/2,y+s/2])
   +(d.label?A([['pop',.45]],`<div class="cs-chip" style="left:${x+s/2-60}px;top:${y+s-8}px;min-width:120px;text-align:center">${esc(d.label)}</div>`,[x+s/2,y+s]):'')},
 phone(d,b){const w=120,h=210,x=b.x+(b.w-w)/2,y=b.y+(b.h-h)/2;
   return A([['up',0]],`<div class="cs-o" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:#fff;border:5px solid #1b2233;border-radius:22px;box-shadow:0 12px 22px rgba(21,28,43,.22);padding:16px 10px;font:700 11px/1.35 Inter,sans-serif;overflow:hidden">${(d.lines||[d.screen||'']).map((l,i)=>`<div style="background:${i%2?'#e3f3ea':'#eef0f3'};border-radius:10px;padding:6px 8px;margin-bottom:6px">${esc(l)}</div>`).join('')}</div>`,[x+w/2,y+h/2])
   +(d.bubble?A([['pop',.5]],`<div class="cs-o" style="left:${x-20}px;top:${y-34}px;background:var(--acc,#12824a);color:#fff;border-radius:16px 16px 16px 4px;padding:7px 11px;font:800 12px Inter,sans-serif;box-shadow:0 6px 12px rgba(18,130,74,.25);white-space:nowrap">${esc(d.bubble)}</div>`,[x,y-20]):'')},
 search(d,b){const w=Math.min(250,b.w),x=b.x+(b.w-w)/2,y=b.y+b.h/2-30;
   return A([['pop',0]],`<div class="cs-o cs-pill" style="left:${x}px;top:${y}px;width:${w}px;height:56px;font-size:15px"><span class="cs-mag"></span><span data-type="${esc(d.text)}" data-t0=".15" data-t1="1.0" ${d.fix?`data-fix="${esc(d.fix)}"`:''}></span></div>`,[x+w/2,y+28])
   +(d.fix?A([['pop',1.35]],`<div class="cs-o" style="left:${x+w/2-28}px;top:${y+74}px;width:56px;height:56px;border-radius:50%;background:var(--acc,#12824a);color:#fff;font:900 34px/56px Montserrat,sans-serif;text-align:center;box-shadow:0 8px 16px rgba(18,130,74,.35)">✓</div>`,[x+w/2,y+100]):'')},
 chat(d,b){const w=Math.min(232,b.w),x=b.x+(b.w-w)/2,y=b.y+20;
   return A([['pop',0]],`<div class="cs-o" style="left:${x}px;top:${y}px;width:${w}px;min-height:80px;background:var(--acc,#12824a);color:#fff;border-radius:22px 22px 6px 22px;padding:14px;font:700 15px/1.3 Inter,sans-serif;box-shadow:0 8px 16px rgba(18,130,74,.28)"><span data-type="${esc(d.text)}" data-t0=".15" data-t1="1.2"></span></div>`,[x+w/2,y+40])},
 counter(d,b){const x=b.x,w=b.w,y=b.y+b.h/2-60;const L=((d.prefix||'')+(Number(d.value)||0).toLocaleString('en-US')+(d.suffix||'')).length,fs=Math.max(26,Math.min(64,Math.floor(w*1.6/Math.max(L,1))));
   return A([['pop',0]],`<div class="cs-o" style="left:${x}px;top:${y}px;width:${w}px;text-align:center"><div style="font:900 ${fs}px/1 Montserrat,sans-serif;color:var(--acc,#12824a);letter-spacing:-2px;text-shadow:0 8px 0 rgba(18,130,74,.15)"><span data-count="${Number(d.value)||0}" data-pre="${esc(d.prefix||'')}" data-suf="${esc(d.suffix||'')}"></span></div>${d.label?`<div style="margin-top:10px;font:800 15px Inter,sans-serif">${esc(d.label)}</div>`:''}</div>`,[x+w/2,y+40])},
 checklist(d,b){const it=(d.items||[]).slice(0,5),w=Math.min(200,b.w),x=b.x+(b.w-w)/2,y=b.y+Math.max(0,(b.h-(it.length*38+30))/2);
   return A([['drop',0]],`<div class="cs-o cs-card" style="left:${x}px;top:${y}px;width:${w}px;padding:20px 14px 10px"><div class="cs-o" style="left:${w/2-25}px;top:-8px;width:50px;height:16px;border-radius:6px;background:#151c2b"></div>${it.map((t,i)=>`<div style="display:flex;gap:8px;align-items:center;font:800 14px Inter,sans-serif;padding:7px 0;border-bottom:1px solid #eef0f3"><span class="cs-a" style="position:relative;display:inline-flex" data-an='[["pop",${.55+i*.4}]]'><span style="display:inline-flex;width:18px;height:18px;border-radius:50%;background:var(--acc,#12824a);color:#fff;font:900 11px Inter;align-items:center;justify-content:center">✓</span></span>${esc(t)}</div>`).join('')}</div>`)},
 cards(d,b){const it=(d.items||[]).slice(0,5),n=it.length||1,cx=b.x+b.w/2,y=b.y+b.h/2-50,hi=d.highlight;
   return it.map((t,i)=>{const r=(i-(n-1)/2)*11,x=cx-36+(i-(n-1)/2)*42;const hot=i===hi;
     return A([['from',.05+i*.09,(cx-x)*0.8,150]],`<div class="cs-o cs-card" style="left:${x}px;top:${y+Math.abs(i-(n-1)/2)*10-(hot?16:0)}px;width:76px;height:104px;transform:rotate(${r}deg);${hot?'outline:3px solid #35c27a;box-shadow:0 0 18px rgba(53,194,122,.7)':''}"><div style="height:30px;border-radius:12px 12px 0 0;background:${hot?'#35c27a':'#cfd6e2'}"></div><div style="font:800 10px/1.2 Inter,sans-serif;padding:7px 5px;text-align:center;word-break:break-word">${esc(t)}</div></div>`,[x+36,y+50])}).join('')},
 stamp(d,b){const s=Math.min(b.w,b.h,160),x=b.x+(b.w-s)/2,y=b.y+(b.h-s)/2;
   return A([['pop',0]],`<div class="cs-o cs-orb" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px"><div class="cs-emo" style="font-size:${s*.55}px">${esc(d.emoji)}</div></div>`,[x+s/2,y+s/2])
   +A([['slam',.55]],`<div class="cs-o" style="left:${x-20}px;top:${y+s/2-26}px;width:${s+40}px;text-align:center;transform:rotate(-12deg)"><span style="display:inline-block;border:5px solid #d93025;color:#d93025;border-radius:10px;padding:4px 12px;font:900 30px Montserrat,sans-serif;background:rgba(255,255,255,.85)">${esc(d.text)}</span></div>`,[x+s/2,y+s/2])},
 quote(d,b){const w=Math.min(236,b.w),x=b.x+(b.w-w)/2,y=b.y+b.h/2-70;
   return A([['pop',0]],`<div class="cs-o cs-card" style="left:${x}px;top:${y}px;width:${w}px;padding:18px 16px"><div style="font:900 44px/0.6 Montserrat,sans-serif;color:var(--acc,#12824a)">“</div><div style="font:800 17px/1.3 Inter,sans-serif;margin-top:6px">${esc(d.text)}</div>${d.by?`<div style="margin-top:10px;font:600 12px Inter,sans-serif;color:#5b6474">${esc(d.by)}</div>`:''}</div>`,[x+w/2,y+60])},
 versus(d,b){const L=d.left||{},R=d.right||{},w=104,y=b.y+b.h/2-70;
   const box=(o,x,c)=>`<div class="cs-o cs-card" style="left:${x}px;top:${y}px;width:${w}px;height:140px;padding:12px 8px;text-align:center;border-top:6px solid ${c}"><div class="cs-emo" style="font-size:52px">${esc(o.emoji||'❓')}</div><div style="font:800 13px/1.2 Inter,sans-serif;margin-top:10px">${esc(o.text)}</div></div>`;
   return A([['from',0,-120,0]],box(L,b.x+b.w/2-w-12,'#5b6474'))+A([['from',.15,120,0]],box(R,b.x+b.w/2+12,'#12824a'))+A([['pop',.45]],`<div class="cs-o" style="left:${b.x+b.w/2-20}px;top:${y+48}px;width:40px;height:40px;border-radius:50%;background:#151c2b;color:#fff;font:900 13px/40px Montserrat;text-align:center;z-index:3">VS</div>`,[b.x+b.w/2,y+68])},
 bigtext(d,b){const t=String(d.text||'');const fs=t.length<=4?120:t.length<=8?72:46;
   return A([['drop',0],['wob',0]],`<div class="cs-o" style="left:${b.x}px;top:${b.y+b.h/2-fs*.6}px;width:${b.w}px;text-align:center;font:900 ${fs}px/1 Montserrat,sans-serif;color:var(--acc,#12824a);text-shadow:0 8px 0 rgba(18,130,74,.18)">${esc(t)}</div>`,[b.x+b.w/2,b.y+b.h/2])},
 table(d,b){const cols=(d.cols||[]).slice(0,3),rows=(d.rows||[]).slice(0,5),w=Math.min(220,b.w),x=b.x+(b.w-w)/2,y=b.y+20;
   return A([['rise',0]],`<div class="cs-o cs-card" style="left:${x}px;top:${y}px;width:${w}px;padding:10px;font:600 11px Inter,sans-serif"><div style="display:grid;grid-template-columns:repeat(${Math.max(cols.length,1)},1fr);gap:6px">${cols.map(c=>`<b style="color:var(--acc,#12824a)">${esc(c)}</b>`).join('')}${rows.map(r=>r.slice(0,cols.length||3).map(c=>`<span>${esc(c)}</span>`).join('')).join('')}</div></div>`,[x+w/2,y+120])},
 steps(d,b){const it=(d.items||[]).slice(0,4),n=it.length||1,h=58,y0=b.y+(b.h-n*h)/2,w=Math.min(220,b.w),x=b.x+(b.w-w)/2;
   return it.map((s,i)=>A([['from',.05+i*.25,-160,0]],`<div class="cs-o cs-pill" style="left:${x}px;top:${y0+i*h}px;width:${w}px;height:46px;border-radius:14px"><span style="display:inline-flex;width:24px;height:24px;border-radius:50%;background:var(--acc,#12824a);color:#fff;font:900 12px Montserrat;align-items:center;justify-content:center;flex:none">${i+1}</span><span class="cs-emo" style="font-size:20px">${esc(s.emoji||'')}</span><span style="white-space:normal;line-height:1.15">${esc(s.text)}</span></div>`,[x+w/2,y0+i*h+23])).join('')}
};
function build(scene,opts){
  opts=opts||{};const k=KINDS.includes(scene.kind)?scene.kind:'icon';const d=scene.data||{};const br=opts.brand||{};
  const p=br.avatar===false?null:pose(scene.pose),side=scene.posePos==='right'?'right':'left';
  const area=p?{x:side==='left'?96:14,y:118,w:160,h:240}:{x:20,y:120,w:230,h:260};
  if(p&&['table','search','chat','quote','steps','checklist','versus'].includes(k)){area.x=20;area.w=230;area.h=170}
  if(k==='media'&&!p){area.x=18;area.y=114;area.w=234;area.h=252}
  let h=`<div class="cs-cam">`+B[k](d,area,{...opts,pose:p});
  if(scene.chip)h+=A([['pop',.35]],`<div class="cs-chip" style="right:18px;top:${area.y-6}px">${esc(scene.chip)}</div>`,[230,area.y]);
  if(p){const big=/fullbody|arms-crossed/.test(p),w=big?100:130,x=side==='left'?6:270-w-6,y=big?222:250;
    h+=A([[side==='left'?'left':'right',.08],['float',0]],`<div class="cs-sh" style="left:${x+15}px;top:${y+(big?148:120)}px;width:${w-30}px"></div><img class="cs-av" src="${opts.avBase||'av/'}${p}.png" alt="" style="left:${x}px;top:${y}px;width:${w}px">`,[x+w/2,y+80])}
  h+=`</div><div class="cs-hd">${hl(scene.headline)}</div>`;
  if(opts.captions!==false)h+=`<div class="cs-sb"></div>`;
  const tg=handle(br);if(tg)h+=`<div class="cs-tg">${esc(tg)}</div>`;
  return h}
function handle(br){br=br||{};return br.handle===undefined||br.handle===null?'':String(br.handle).slice(0,40)}
function skin(stage,br){br=br||{};stage.style.background=br.bg?String(br.bg):'';stage.style.setProperty('--acc',br.accent?String(br.accent):'#12824a')}
function animEl(el,lt){const sp=JSON.parse(el.dataset.an);let tr='',op=1;
  for(const s of sp){const [a,t0,dx,dy]=s;const p=(lt-t0)/.35;
    if(a=='pop'){tr+=` scale(${p<=0?0:back(p)})`;op*=cl(p*3)}
    else if(a=='up'){tr+=` translateY(${(1-oc(p/1.2))*330}px)`}
    else if(a=='left'){tr+=` translateX(${-(1-oc(p/1.2))*220}px)`}
    else if(a=='right'){tr+=` translateX(${(1-oc(p/1.2))*220}px)`}
    else if(a=='drop'){tr+=` translateY(${-(1-bounce(p/2))*460}px)`}
    else if(a=='rise'){tr+=` translateY(${(1-oc(p/1.4))*190}px) scale(${.3+.7*oc(p/1.4)})`;op*=cl(p*2.5)}
    else if(a=='from'){const q=p<=0?0:back(cl(p/1.2));tr+=` translate(${(1-q)*(dx||0)}px,${(1-q)*(dy||0)}px) scale(${.3+.7*cl(q)})`;op*=cl(p*3)}
    else if(a=='slam'){const q=cl(p/.8);tr+=` scale(${p<=0?0:3-2*oc(q)})`;op*=cl(p*4)}
    else if(a=='spin'){tr+=` rotate(${lt*60}deg)`}
    else if(a=='float'){tr+=` translateY(${Math.sin(lt*3.2)*3}px)`}
    else if(a=='wob'){tr+=` rotate(${Math.sin(lt*5)*5*Math.max(0,1-lt/1.5)}deg)`}}
  el.style.transform=tr;el.style.opacity=op}
// draw scene into stage at local time lt; dur = scene duration (for camera); words = [{w,s}] captions
function frame(stage,scene,lt,o){o=o||{};
  if(stage._scene!==scene){skin(stage,o.brand);stage.innerHTML=build(scene,o);stage._scene=scene}
  const cam=stage.querySelector('.cs-cam'),dur=o.dur||2.5;
  cam.style.transform=`scale(${1+.05*cl(lt/dur)})`;
  const hd=stage.querySelector('.cs-hd'),hp=lt/.22;hd.style.transform=`scale(${hp<=0?0:back(hp)})`;hd.style.opacity=cl(hp*3);
  stage.querySelectorAll('[data-an]').forEach(e=>animEl(e,lt));
  stage.querySelectorAll('[data-type]').forEach(e=>{const full=e.dataset.type,a=+e.dataset.t0,b=+e.dataset.t1;const n=Math.round(full.length*cl((lt-a)/(b-a)));
    if(e.dataset.fix&&lt>1.25){e.innerHTML=`<span style="color:var(--acc,#12824a)">${esc(e.dataset.fix)}</span>`}else e.textContent=full.slice(0,n)+(n<full.length&&n>0?'▍':'')});
  stage.querySelectorAll('[data-count]').forEach(e=>{const v=+e.dataset.count,q=oc(cl((lt-.1)/1.1));e.textContent=e.dataset.pre+Math.round(v*q).toLocaleString('en-US')+e.dataset.suf});
  stage.querySelectorAll('[data-vf]').forEach(e=>{const s=o.frameSrc&&o.frameSrc(lt);if(s&&e.getAttribute('src')!==s)e.setAttribute('src',s)});
  stage.querySelectorAll('[data-mv]').forEach(e=>{const tg=(+e.dataset.mv||0)+lt;try{if(o.live){if(e.paused){e.currentTime=tg;e.play().catch(()=>{})}}else{if(!e.paused)e.pause();if(Math.abs(e.currentTime-tg)>.1)e.currentTime=tg}}catch(_){}});
  const sb=stage.querySelector('.cs-sb');
  if(sb){const ws=o.words||[];if(!ws.length||lt<ws[0].s-.02)sb.innerHTML='';else{let k=0;ws.forEach((w,j)=>{if(lt>=w.s)k=j});const g=Math.floor(k/3)*3;sb.innerHTML=ws.slice(g,g+3).map((w,j)=>g+j==k?`<em>${esc(w.w)}</em>`:esc(w.w)).join(' ')}}
}
function thumb(stage,th,o){o=o||{};const br=o.brand||{};skin(stage,br);const p=br.avatar===false||th.pose==='none'?null:(pose(th.pose)||(th.pose===null&&th.media!=null?null:'jaw-dropped'));const tgt=handle(br);const tm=th.media!=null?((o.media||[])[th.media|0]||null):null;
  const tsrc=tm&&tm.kind!=='audio'?(tm.image||(tm.kind==='image'?tm.url:null)):null;
  const tcss='position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
  stage.innerHTML=(tm&&tm.kind!=='audio'&&(th.full||!p)?`<div class="cs-o" style="left:0;top:0;width:270px;height:480px;overflow:hidden">${tsrc?`<img alt="" src="${esc(tsrc)}" style="${tcss}">`:`<video muted playsinline preload="auto" src="${esc(tm.url)}#t=${Number(th.start)||0.5}" style="${tcss}"></video>`}<div style="position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,0) 35%,rgba(0,0,0,0) 65%,rgba(0,0,0,.35))"></div></div>`
  :tm&&tm.kind!=='audio'?`<div class="cs-o cs-card" style="left:60px;top:132px;width:196px;height:220px;overflow:hidden;border:4px solid #fff;transform:rotate(2deg);box-shadow:0 0 30px rgba(53,194,122,.55)">${tsrc?`<img alt="" src="${esc(tsrc)}" style="${tcss}">`:`<video muted playsinline preload="auto" src="${esc(tm.url)}#t=${Number(th.start)||0.5}" style="${tcss}"></video>`}</div>`
  :`<div class="cs-o cs-orb" style="left:70px;top:150px;width:170px;height:170px;box-shadow:0 0 30px rgba(53,194,122,.55)"><div class="cs-emo" style="font-size:96px">${esc(th.emoji||'🤯')}</div></div>`)+`
  <div class="cs-hd" style="left:16px;top:40px;max-width:none;width:214px;font-size:27px;padding:10px 12px;transform:rotate(-2deg)">${hl(th.headline||'')}</div>
  ${p?`<div class="cs-sh" style="left:8px;top:438px;width:140px"></div><img class="cs-av" src="${o.avBase||'av/'}${p}.png" alt="" style="left:-6px;top:300px;width:150px">`:''}
  ${th.sticker?`<div class="cs-o" style="left:${p?146:16}px;top:${p?350:370}px;width:112px;background:#151c2b;color:#fff;border-radius:14px;padding:10px 12px;font:900 15px/1.15 Montserrat,sans-serif;transform:rotate(3deg)">${hl(th.sticker).replace(/<em>/g,'<em style="font-style:normal;color:#35c27a">')}</div>`:''}
  ${tgt?`<div class="cs-tg" style="bottom:14px;left:auto;right:14px">${esc(tgt)}</div>`:''}`;stage._scene=null}
window.DESK={POSES,KINDS,css,build,frame,thumb,handle};
})();
