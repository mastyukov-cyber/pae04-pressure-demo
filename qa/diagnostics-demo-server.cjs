'use strict';
// Ephemeral synthetic-only server, bound to localhost. Only serves diagnostic
// demo static files. No Supabase requests, credentials, patient data or writes.
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..','diagnostics');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const allow=new Set([
 '/diagnostics/demo/index.html',
 '/diagnostics/demo/demo.mjs',
 '/diagnostics/preview-model.mjs',
 '/diagnostics/basic-contract.mjs',
 '/diagnostics/contract.mjs'
]);
const server=http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1:4173').pathname;
 const p=pathname==='/diagnostics/demo/'?'/diagnostics/demo/index.html':pathname;
 if(req.method!=='GET'||!allow.has(p)){
   res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;
 }
 try {
   const file=path.join(root,p.slice('/diagnostics/'.length));
   const body=await fs.readFile(file);
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
     'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(body);
 }catch {
   res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Fixture unavailable');
 }
});
server.listen(4173,'127.0.0.1',()=>console.log('PAE04_DIAGNOSTICS_DEMO_READY'));
process.on('SIGTERM',()=>server.close());
