import {build} from 'esbuild';import fs from 'node:fs';
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/assets',{recursive:true});fs.cpSync('public','dist',{recursive:true});
fs.copyFileSync('app/globals.css','dist/style.css');fs.copyFileSync('index.html','dist/index.html');fs.copyFileSync('config.js','dist/config.js');fs.writeFileSync('dist/.nojekyll','');
await build({entryPoints:['main.tsx'],outdir:'dist/assets',entryNames:'main',bundle:true,format:'esm',splitting:true,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
await build({entryPoints:['supabase/functions/rihla-game/index.ts'],outfile:'supabase/functions/rihla-game/bundle.ts',bundle:true,format:'esm',platform:'neutral',target:'es2022'});
const client=fs.readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync('dist/assets/'+f,'utf8')).join('');
if(client.includes('SUPABASE_SERVICE_ROLE_KEY')||client.includes('تتفتّح أزهار الساكورا'))throw Error('Server-only content in client');
console.log('Built GitHub Pages client and Supabase Edge Function; private clues excluded.');
