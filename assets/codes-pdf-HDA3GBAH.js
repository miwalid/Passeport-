import"./chunk-EK7ODJWE.js";function b(i,h=1240,l=1754){let p=new TextEncoder,t=[],r=[0],a=0,e=s=>{let o=typeof s=="string"?p.encode(s):s;t.push(o),a+=o.length},n=(s,o)=>{r[s]=a,e(`${s} 0 obj
${o}
endobj
`)};e(`%PDF-1.4
`),n(1,"<< /Type /Catalog /Pages 2 0 R >>"),n(2,`<< /Type /Pages /Count ${i.length} /Kids [${i.map((s,o)=>`${3+o*3} 0 R`).join(" ")}] >>`),i.forEach((s,o)=>{let f=3+o*3,g=f+1,d=f+2;n(f,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${g} 0 R >> >> /Contents ${d} 0 R >>`),r[g]=a,e(`${g} 0 obj
<< /Type /XObject /Subtype /Image /Width ${h} /Height ${l} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${s.length} >>
stream
`),e(s),e(`
endstream
endobj
`);let m=`q
595.28 0 0 841.89 0 0 cm
/Im0 Do
Q
`;n(d,`<< /Length ${p.encode(m).length} >>
stream
${m}endstream`)});let c=a;e(`xref
0 ${r.length}
0000000000 65535 f 
`);for(let s of r.slice(1))e(String(s).padStart(10,"0")+` 00000 n 
`);return e(`trailer
<< /Size ${r.length} /Root 1 0 R >>
startxref
${c}
%%EOF
`),new Blob(t,{type:"application/pdf"})}async function x(i){await Promise.race([document.fonts.ready,new Promise(t=>setTimeout(t,2e3))]);let h=[{title:"\u0631\u0645\u0648\u0632 \u0627\u0644\u0641\u0631\u0642",label:"\u0627\u0644\u0641\u0631\u064A\u0642",rows:i.teams.map(t=>[t.name,String(t.secret)])},{title:"\u0631\u0645\u0648\u0632 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0644\u0644\u0645\u062D\u0637\u0627\u062A",label:"\u0627\u0644\u0645\u062D\u0637\u0629",rows:i.posts.map(t=>[t.name,String(t.rescue)])}],l=[];for(let t of h)if(!t.rows.length)l.push({...t,rows:[]});else for(let r=0;r<t.rows.length;r+=12)l.push({...t,rows:t.rows.slice(r,r+12)});let p=[];for(let t=0;t<l.length;t++){let r=l[t],a=document.createElement("canvas");a.width=1240,a.height=1754;let e=a.getContext("2d");if(!e)throw Error("\u062A\u0639\u0630\u0651\u0631 \u0625\u0646\u0634\u0627\u0621 PDF \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062A\u0635\u0641\u062D");e.fillStyle="#fff",e.fillRect(0,0,1240,1754),e.fillStyle="#102842",e.fillRect(0,0,1240,290);let n=(c,s,o,f,g,d=!0,m=1080)=>{e.font=f,e.fillStyle=g,e.direction=d?"rtl":"ltr",e.textAlign=d?"right":"left",e.fillText(c,s,o,m)};n("\u0631\u062D\u0644\u0629 \u062D\u0648\u0644 \u0627\u0644\u0639\u0627\u0644\u0645",1160,85,"bold 42px sans-serif","#fff"),n(String(i.name),1160,145,"30px sans-serif","#fff"),n("\u0631\u0645\u0632 \u0627\u0644\u0644\u0639\u0628\u0629",1160,220,"26px sans-serif","#dce9f5"),n(String(i.code),80,220,"bold 36px monospace","#fff",!1),n(r.title,1160,360,"bold 38px sans-serif","#102842"),n("\u0646\u0633\u062E\u0629 \u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0645\u0646\u0638\u0651\u0645 \u2014 \u0634\u0627\u0631\u0643 \u0631\u0645\u0632 \u0643\u0644 \u0641\u0631\u064A\u0642 \u0645\u0639\u0647 \u0641\u0642\u0637",1160,415,"25px sans-serif","#5c6570"),e.fillStyle="#102842",e.fillRect(80,455,1080,65),n(r.label,1135,498,"bold 27px sans-serif","#fff"),n("\u0627\u0644\u0631\u0645\u0632",430,498,"bold 27px sans-serif","#fff"),r.rows.length||n("\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0633\u062C\u0651\u0644\u0629",1135,580,"28px sans-serif","#102842"),r.rows.forEach(([c,s],o)=>{let f=520+o*83;e.fillStyle=o%2?"#fff":"#eef4f8",e.fillRect(80,f,1080,83),n(c,1135,f+53,"28px sans-serif","#102842",!0,650),n(s,105,f+53,"bold 32px monospace","#102842",!1,320)}),n("\u0627\u062D\u062A\u0641\u0638 \u0628\u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641 \u0644\u062F\u0649 \u0627\u0644\u0645\u0646\u0638\u0651\u0645. \u0631\u0645\u0648\u0632 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u062A\u064F\u0642\u062F\u0651\u0645 \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629 \u0641\u0642\u0637.",1160,1635,"24px sans-serif","#5c6570"),n(`${t+1} / ${l.length}`,80,1695,"24px sans-serif","#5c6570",!1),p.push(Uint8Array.from(atob(a.toDataURL("image/jpeg",.8).split(",")[1]),c=>c.charCodeAt(0)))}return b(p)}export{x as createCodesPdf,b as imagePdf};
