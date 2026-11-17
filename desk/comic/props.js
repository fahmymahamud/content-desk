/* Comic toolkit: UI builders and SVG props, shared by every comic reel. Loaded after engine.js, before scenes.js. */
const C={ink:'#17100a',yel:'#ffd43d',blu:'#2bb3f0',red:'#ff4f32',cream:'#fff6e2',grn:'#35c46a',wht:'#fff'};
const STROKE=w=>`stroke="${C.ink}" stroke-width="${w||11}" stroke-linejoin="round" stroke-linecap="round"`;
function svg(w,h,inner,z,parent){const o=box(w,h,'',z,parent);
  o.e.innerHTML=`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block;overflow:visible">${inner}</svg>`;return o}
/** big comic title with a thick ink outline. \n works. */
function ttl(txt,size,w,z,color){const o=box(w,size*1.35,'ttl',z);
  o.e.style.cssText+=`;font-size:${size}px;display:flex;align-items:center;justify-content:center;white-space:pre-line`;
  if(color){o.e.style.color=color;o.e.style.textShadow=`0 0 0 ${C.ink},6px 6px 0 ${C.ink},-6px 6px 0 ${C.ink},6px -6px 0 ${C.ink},-6px -6px 0 ${C.ink},10px 14px 0 rgba(23,16,10,.3)`}
  o.e.textContent=txt;return o}
/** title drawn dark with a WHITE outline, for busy photo backgrounds */
function ttlLight(txt,size,w,z){const o=ttl(txt,size,w,z);o.e.style.color=C.ink;
  o.e.style.textShadow='0 0 0 #fff,6px 6px 0 #fff,-6px 6px 0 #fff,6px -6px 0 #fff,-6px -6px 0 #fff,10px 14px 0 rgba(23,16,10,.25)';return o}
/** speech bubble. Pair with tail(). */
function bub(txt,w,h,size,z){const o=box(w,h,'bub',z);o.e.style.fontSize=size+'px';o.e.style.whiteSpace='pre-line';o.e.textContent=txt;return o}
function tail(z,side){const o=box(0,0,'',z);
  o.e.style.cssText+=`;border-${side==='right'?'right':'left'}:46px solid transparent;border-top:120px solid ${C.ink};width:0;height:0`;return o}
/** pill label */
function chip(txt,w,h,size,z,bg,fg){const o=box(w,h,'chip',z);o.e.style.fontSize=size+'px';
  if(bg)o.e.style.background=bg;if(fg)o.e.style.color=fg;o.e.textContent=txt;return o}
/** radiating speed lines; put it behind the hero and spin it slowly */
function speed(z,size){const o=box(size||1700,size||1700,'',z);
  o.e.style.cssText+=`;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(23,16,10,.17) 0deg 1.7deg,transparent 1.7deg 8deg);-webkit-mask-image:radial-gradient(circle,transparent 26%,#000 52%);mask-image:radial-gradient(circle,transparent 26%,#000 52%)`;return o}
/** comic explosion shape, e.g. box(1500,1500).e.style.clipPath=`polygon(${starPoly(20,50,33)})` */
function starPoly(n,r1,r2){const p=[];for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2-Math.PI/2,r=i%2?r2:r1;
  p.push(`${(50+Math.cos(a)*r).toFixed(1)}% ${(50+Math.sin(a)*r).toFixed(1)}%`)}return p.join(',')}
/** a burst behind something: returns the box, you animate it */
function bang(size,color,points,z){const o=box(size,size,'',z);o.e.style.cssText+=`;background:${color};clip-path:polygon(${starPoly(points||20,50,33)})`;return o}
/* ---- SVG props. Each entry is [width,height,markup]; use with svg(...PROPS.x). ---- */
const PROPS={
 bottle:[240,620,`<g ${STROKE()}><rect x="80" y="26" width="80" height="60" rx="16" fill="#1f7fd0"/><rect x="94" y="84" width="52" height="72" fill="#eaf7ff"/>
   <clipPath id="pb"><rect x="40" y="150" width="160" height="420" rx="54"/></clipPath>
   <rect x="40" y="150" width="160" height="420" rx="54" fill="#eaf7ff"/>
   <g clip-path="url(#pb)" stroke="none"><rect x="40" y="268" width="160" height="302" fill="${C.blu}"/><path d="M40 276 q40 -26 80 0 t80 0 v20 h-160z" fill="#5ed0ff"/></g>
   <rect x="40" y="150" width="160" height="420" rx="54" fill="none"/><rect x="40" y="330" width="160" height="96" fill="${C.yel}"/>
   <rect x="66" y="196" width="22" height="104" rx="11" fill="#fff" stroke="none" opacity=".9"/></g>`],
 glass:[140,180,`<g ${STROKE()}><path id="pg0" d="M22 18 h96 l-13 142 q-2 18 -35 18 t-35 -18 z" fill="#eaf7ff"/>
   <clipPath id="pg"><path d="M22 18 h96 l-13 142 q-2 18 -35 18 t-35 -18 z"/></clipPath>
   <g clip-path="url(#pg)" stroke="none"><rect x="10" y="62" width="120" height="130" fill="${C.blu}"/></g>
   <path d="M22 18 h96 l-13 142 q-2 18 -35 18 t-35 -18 z" fill="none"/></g>`],
 drop:[60,80,`<g ${STROKE()}><path d="M30 4 C 48 34, 58 46, 58 56 a28 28 0 0 1 -56 0 C 2 46, 12 34, 30 4 z" fill="${C.blu}"/></g>`],
 heart:[80,72,`<g ${STROKE()}><path d="M40 68 C 6 44, 4 22, 18 12 C 30 3, 40 14, 40 20 C 40 14, 50 3, 62 12 C 76 22, 74 44, 40 68 z" fill="${C.red}"/></g>`],
 bolt:[72,96,`<g ${STROKE()}><path d="M44 4 L10 46 h24 L26 86 L62 40 H38 z" fill="${C.yel}"/></g>`],
 battery:[104,96,`<g ${STROKE()}><rect x="8" y="22" width="76" height="46" rx="12" fill="#fff"/><rect x="86" y="36" width="12" height="18" rx="5" fill="${C.ink}"/><rect x="20" y="33" width="52" height="24" rx="7" fill="${C.grn}" stroke="none"/></g>`],
 stars:[96,96,`<g ${STROKE()}>${[[26,26,20],[66,16,14],[56,54,11]].map(([x,y,r])=>`<path d="M${x} ${y-r} l${r*0.3} ${r*0.6} l${r*0.7} ${r*0.1} l-${r*0.5} ${r*0.5} l${r*0.15} ${r*0.7} l-${r*0.65} -${r*0.35} l-${r*0.65} ${r*0.35} l${r*0.15} -${r*0.7} l-${r*0.5} -${r*0.5} l${r*0.7} -${r*0.1} z" fill="${C.yel}"/>`).join('')}</g>`],
 sun:[360,360,(()=>{let r='';for(let i=0;i<12;i++)r+=`<g transform="rotate(${i*30} 180 180)"><path d="M180 28 l26 44 h-52 z" fill="${C.yel}" ${STROKE()}/></g>`;
   return r+`<circle cx="180" cy="180" r="96" fill="${C.yel}" ${STROKE()}/>`})()],
 clock:[120,120,`<g ${STROKE()}><circle cx="60" cy="64" r="48" fill="#fff"/><path d="M60 34 v30 l22 14" fill="none"/><path d="M40 10 h40" /></g>`],
 bang:[120,120,`<g ${STROKE()}><path d="M60 8 l14 38 l38 -12 l-24 34 l24 34 l-38 -12 l-14 38 l-14 -38 l-38 12 l24 -34 l-24 -34 l38 12 z" fill="${C.yel}"/></g>`],
 tick:[104,104,`<g ${STROKE()}><circle cx="52" cy="52" r="42" fill="${C.grn}"/><path d="M30 54 l16 17 l30 -34" fill="none" stroke="#fff" stroke-width="12"/></g>`],
 cross:[104,104,`<g ${STROKE()}><circle cx="52" cy="52" r="42" fill="${C.red}"/><path d="M34 34 l36 36 M70 34 l-36 36" fill="none" stroke="#fff" stroke-width="12"/></g>`]
};
