// height of front-matter sections vs. the A4 content box (260 mm). usage: node secheight.js book.html id1 id2 ...
const {chromium}=require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:612,height:900}});
  await p.emulateMedia({media:'print'});
  await p.goto('file://'+path.resolve(process.argv[2]),{waitUntil:'load',timeout:600000}); await p.evaluate(()=>document.fonts.ready);
  const r=await p.evaluate((ids)=>{const mm=96/25.4; return ids.map(id=>{const el=document.getElementById(id); if(!el) return [id,null];
    const bb=el.getBoundingClientRect(); return [id, +(bb.height/mm).toFixed(1)];});}, process.argv.slice(3));
  for(const [id,h] of r) console.log(id, h===null?'missing':(h+' mm'+(h>260?'  > 260 (overflows one page by '+(h-260).toFixed(1)+' mm)':'  fits')));
  await b.close();
})();
