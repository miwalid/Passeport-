import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync('scripts/artwork-manifest.json','utf8'));
const origin='https://rihla-passeport-monde.samwal2018.chatgpt.site';
let imported=0;
for(const item of manifest){
 if(fs.existsSync(item.path)&&createHash('sha256').update(fs.readFileSync(item.path)).digest('hex')===item.sha256)continue;
 const response=await fetch(origin+'/'+item.path.replace(/^public\//,''));if(!response.ok)throw Error('Artwork download failed: '+item.path+' '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Artwork checksum differs: '+item.path);
 fs.mkdirSync(path.dirname(item.path),{recursive:true});fs.writeFileSync(item.path,bytes);imported++;
}
console.log('Artwork verified; imported '+imported+' files. Subsequent builds use repository copies.');
