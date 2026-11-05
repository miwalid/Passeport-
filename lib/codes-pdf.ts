// Rasterized Arabic text preserves browser shaping and Latin code digits in every PDF viewer.
export function imagePdf(images:Uint8Array[],width=1240,height=1754){
 const encoder=new TextEncoder(),parts:Uint8Array[]=[],offsets=[0];let size=0;
 const add=(s:string|Uint8Array)=>{const bytes=typeof s==='string'?encoder.encode(s):s;parts.push(bytes);size+=bytes.length;};
 const object=(id:number,body:string)=>{offsets[id]=size;add(`${id} 0 obj\n${body}\nendobj\n`);};
 add('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,`<< /Type /Pages /Count ${images.length} /Kids [${images.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
 images.forEach((bytes,i)=>{const page=3+i*3,image=page+1,content=page+2;
 object(page,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${image} 0 R >> >> /Contents ${content} 0 R >>`);
 offsets[image]=size;add(`${image} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');
 const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';object(content,`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`);
 });
 const xref=size;add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(const offset of offsets.slice(1))add(String(offset).padStart(10,'0')+' 00000 n \n');
 add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 return new Blob(parts as BlobPart[],{type:'application/pdf'});
}
export async function createCodesPdf(room:any){
 await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,2000))]);
 const groups=[{title:'رموز الفرق',label:'الفريق',rows:room.teams.map((t:any)=>[t.name,String(t.secret)])},{title:'رموز الطوارئ للمحطات',label:'المحطة',rows:room.posts.map((p:any)=>[p.name,String(p.rescue)])}];
 const pages:any[]=[];for(const group of groups){if(!group.rows.length)pages.push({...group,rows:[]});else for(let i=0;i<group.rows.length;i+=12)pages.push({...group,rows:group.rows.slice(i,i+12)});}
 const images:Uint8Array[]=[];
 for(let n=0;n<pages.length;n++){
 const page=pages[n],canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const c=canvas.getContext('2d');if(!c)throw Error('تعذّر إنشاء PDF في هذا المتصفح');
 c.fillStyle='#fff';c.fillRect(0,0,1240,1754);c.fillStyle='#102842';c.fillRect(0,0,1240,290);
 const text=(value:string,x:number,y:number,font:string,color:string,rtl=true,max=1080)=>{c.font=font;c.fillStyle=color;c.direction=rtl?'rtl':'ltr';c.textAlign=rtl?'right':'left';c.fillText(value,x,y,max);};
 text('رحلة حول العالم',1160,85,'bold 42px sans-serif','#fff');text(String(room.name),1160,145,'30px sans-serif','#fff');
 text('رمز اللعبة',1160,220,'26px sans-serif','#dce9f5');text(String(room.code),80,220,'bold 36px monospace','#fff',false);
 text(page.title,1160,360,'bold 38px sans-serif','#102842');text('نسخة خاصة بالمنظّم — شارك رمز كل فريق معه فقط',1160,415,'25px sans-serif','#5c6570');
 c.fillStyle='#102842';c.fillRect(80,455,1080,65);text(page.label,1135,498,'bold 27px sans-serif','#fff');text('الرمز',430,498,'bold 27px sans-serif','#fff');
 if(!page.rows.length)text('لا توجد بيانات مسجّلة',1135,580,'28px sans-serif','#102842');
 page.rows.forEach(([name,code]:string[],i:number)=>{const y=520+i*83;c.fillStyle=i%2?'#fff':'#eef4f8';c.fillRect(80,y,1080,83);text(name,1135,y+53,'28px sans-serif','#102842',true,650);text(code,105,y+53,'bold 32px monospace','#102842',false,320);});
 text('احتفظ بهذا الملف لدى المنظّم. رموز الطوارئ تُقدّم عند الحاجة فقط.',1160,1635,'24px sans-serif','#5c6570');text(`${n+1} / ${pages.length}`,80,1695,'24px sans-serif','#5c6570',false);
 images.push(Uint8Array.from(atob(canvas.toDataURL('image/jpeg',0.8).split(',')[1]),ch=>ch.charCodeAt(0)));
 }
 return imagePdf(images);
}
