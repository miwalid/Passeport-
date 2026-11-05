import {build} from 'esbuild';import fs from 'node:fs';
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/assets',{recursive:true});fs.cpSync('public','dist',{recursive:true});
fs.copyFileSync('app/globals.css','dist/style.css');fs.copyFileSync('scripts/index.template.html','dist/index.html');fs.copyFileSync('config.js','dist/config.js');fs.writeFileSync('dist/.nojekyll','');
const clientBuild=await build({metafile:true,entryPoints:['main.tsx'],outdir:'dist/assets',entryNames:'[name]-[hash]',bundle:true,format:'esm',splitting:true,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const entry=Object.entries(clientBuild.metafile.outputs).find(([file,info])=>info.entryPoint==='main.tsx')?.[0];if(!entry)throw Error('Missing client entry');fs.writeFileSync('dist/index.html',fs.readFileSync('scripts/index.template.html','utf8').replace('./assets/main.js','./'+entry.replace(/^dist\//,'')));
await build({entryPoints:['supabase/functions/rihla-game/index.ts'],outfile:'supabase/functions/rihla-game/bundle.ts',bundle:true,format:'esm',platform:'neutral',target:'es2022'});
const client=fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync('dist/assets/'+f,'utf8')).join('');
if(client.includes('SUPABASE_SERVICE_ROLE_KEY')||client.includes('تتفتّح أزهار الساكورا'))throw Error('Server-only content in client');
console.log('Built GitHub Pages client and Supabase Edge Function; private clues excluded.');
