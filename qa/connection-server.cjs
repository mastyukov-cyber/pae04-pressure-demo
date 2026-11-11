'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..','diagnostics/connection');
const allowed=new Map([
  ['/diagnostics/connection/','index.html'],
  ['/diagnostics/connection/index.html','index.html'],
  ['/diagnostics/connection/check.mjs','check.mjs'],
  ['/diagnostics/connection/app.mjs','app.mjs'],
]);
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://127.0.0.1:4175').pathname;
  const filename=allowed.get(pathname);
  if(req.method!=='GET'||!filename){
    res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found');return;
  }
  try{
    const body=await fs.readFile(path.join(root,filename));
    res.writeHead(200,{'Content-Type':filename.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(body);
  }catch{
    res.writeHead(500,{'Content-Type':'text/plain'});res.end('fixture error');
  }
});
server.listen(4175,'127.0.0.1',()=>console.log('PAE04_CONNECTION_LOCAL_ONLY_READY'));
process.on('SIGTERM',()=>server.close());
