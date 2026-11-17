// usage: node render.js storyboard.json [prev]   (needs tl.json)  -> out/f0000.jpg..., thumbnail.jpg
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const SB=JSON.parse(fs.readFileSync(process.argv[2]));const T=JSON.parse(fs.readFileSync('tl.json'));const prev=process.argv[3]=='prev';
 const MD=fs.existsSync('media/index.json')?JSON.parse(fs.readFileSync('media/index.json')).map(m=>({kind:m.kind,url:m.file?'media/'+m.file:'',image:m.image?'media/'+m.image:''})):[];
 const FR=fs.existsSync('media/frames.json')?JSON.parse(fs.readFileSync('media/frames.json')):{};
 fs.mkdirSync('out',{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:270,height:480},deviceScaleFactor:prev?1.5:4});
 p.on('pageerror',e=>console.log('PAGEERR',e.message));
 await p.goto('file://'+path.resolve('video.html'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 await p.evaluate(([sb,tl,md,fr])=>setup(sb,tl,md,fr),[SB,T.tl,MD,FR]);
 const times=[];if(prev)T.tl.forEach(s=>times.push(s.t0+Math.min(1.6,s.d*.8)));else{const N=Math.round(T.total*30);for(let i=0;i<N;i++)times.push(i/30)}
 for(let i=0;i<times.length;i++){await p.evaluate(t=>render(t),times[i]);await p.screenshot({path:`out/${prev?'p':'f'}${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:prev?80:92})}
 await p.evaluate(()=>thumb());await p.waitForTimeout(300);await p.screenshot({path:'thumbnail.jpg',type:'jpeg',quality:92});
 await b.close();console.log('frames',times.length)})();
