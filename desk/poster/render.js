// node render.js prev 1.2,5,9.4   -> prev/t*.jpg + prev/sheet*.jpg (contact sheets to Read)   | always rewrites events.json
// node render.js scene all        -> seg/<scene>.mp4 for every scene     | node render.js scene hook price  -> only those
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const http=require('http');const {spawn,execFileSync}=require('child_process');
const MIME={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.json':'application/json'};
(async()=>{const mode=process.argv[2]||'prev';const TL=JSON.parse(fs.readFileSync('tl.json'));const M=JSON.parse(fs.readFileSync('p/meta.json'));
 const srv=http.createServer((q,r)=>{const f=path.join(process.cwd(),decodeURIComponent(q.url.split('?')[0]));fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});r.end(d)})});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port;
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});let bad=0;
 p.on('pageerror',e=>{bad++;console.log('PAGE ERROR:',e.message)});p.on('console',m=>{if(m.type()=='error')console.log('console error:',m.text())});
 await p.goto(`http://127.0.0.1:${port}/comp.html`);const ev=await p.evaluate(([m,t])=>setup(m,t),[M,TL]);fs.writeFileSync('events.json',JSON.stringify(ev));
 await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>Promise.all([...document.images].map(im=>im.decode().catch(()=>1))));await p.waitForTimeout(400);
 if(mode=='events'){console.log('events',ev.length)}
 else if(mode=='prev'){fs.rmSync('prev',{recursive:true,force:true});fs.mkdirSync('prev');
   const ts=process.argv[3]?process.argv[3].split(',').map(Number):TL.scenes.flatMap(s=>[s.t0+s.d*.35,s.t0+s.d*.8]);
   for(const t of ts){await p.evaluate(t=>render(t),t);await p.screenshot({path:`prev/t${t.toFixed(2).padStart(6,'0')}.jpg`,type:'jpeg',quality:85})}
   try{execFileSync('python3',['-c',`
from PIL import Image
import glob
fs=sorted(glob.glob('prev/t*.jpg'))
for k in range(0,len(fs),5):
    g=fs[k:k+5];sh=Image.new('RGB',(len(g)*360,640))
    for i,f in enumerate(g): sh.paste(Image.open(f).resize((360,640)),(i*360,0))
    sh.save(f'prev/sheet{k//5+1}.jpg',quality=88)
print('preview frames',len(fs),'-> prev/sheet*.jpg')`],{stdio:'inherit'})}catch(e){}}
 else{fs.mkdirSync('seg',{recursive:true});let names=process.argv.slice(3);if(!names.length||names[0]=='all')names=TL.scenes.map(s=>s.name);
   for(const name of names){const s=TL.scenes.find(x=>x.name==name);if(!s){console.log('no scene',name);continue}const f0=Math.round(s.t0*30),f1=Math.round((s.t0+s.d)*30);const tmp=`seg/${name}.tmp.mp4`;
     const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-r','30',tmp],{stdio:['pipe','inherit','inherit']});
     const done=new Promise(r=>ff.on('exit',r));
     for(let f=f0;f<f1;f++){await p.evaluate(t=>render(t),f/30);const buf=await p.screenshot({type:'jpeg',quality:92});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
     ff.stdin.end();const code=await done;if(code===0)fs.renameSync(tmp,`seg/${name}.mp4`);console.log('scene',name,f1-f0,'frames',code===0?'ok':'FAILED')}}
 await b.close();srv.close();if(bad)process.exitCode=1})();
