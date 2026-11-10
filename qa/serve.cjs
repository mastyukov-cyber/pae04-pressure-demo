'use strict';
// PAE-04 synthetic-only ephemeral localhost server for GitHub Actions QA.
// No Supabase credentials, no medical records, no public deployment.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const file = path.resolve(__dirname, '..', 'index.html');
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:4173');
  if (req.method !== 'GET' || !['/', '/index.html'].includes(u.pathname)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('Test fixture unavailable');
  }
});
server.listen(4173, '127.0.0.1', () => console.log('PAE04_QA_LOCAL_READY'));
process.on('SIGTERM', () => server.close());
