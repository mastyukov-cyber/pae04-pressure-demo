// Local CI WebKit QA server: read-only static TEST files; no API or database.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const port = 4173;
const mime = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8"};
const server = http.createServer((req,res)=>{
  if(req.method!=="GET"){res.writeHead(405);res.end("Method Not Allowed");return;}
  let filename;
  try{
    const url=new URL(req.url,"http://127.0.0.1:"+port);
    filename=path.resolve(root,"."+decodeURIComponent(url.pathname));
  }catch{res.writeHead(400);res.end("Bad request");return;}
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end("Forbidden");return;}
  let st;
  try{st=fs.statSync(filename);if(st.isDirectory()){filename=path.join(filename,"index.html");st=fs.statSync(filename);}if(!st.isFile())throw Error("Not a file");}
  catch{res.writeHead(404);res.end("Not found");return;}
  res.writeHead(200,{"Content-Type":mime[path.extname(filename)]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
  fs.createReadStream(filename).pipe(res);
});
server.listen(port,"127.0.0.1",()=>process.stdout.write("PAE04 TEST read-only server ready on "+port+"\n"));
