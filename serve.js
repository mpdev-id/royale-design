// Static server untuk demo Royale unified shell
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = 'C:/Users/mnpra/OneDrive/Desktop/stitch_royale_gym_cafe/app';
const port = 5555;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json'
};

const server = http.createServer(function (req, res) {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(root, p);
  const norm = path.resolve(f).toLowerCase();
  if (norm !== path.resolve(root).toLowerCase() && !norm.startsWith(path.resolve(root).toLowerCase() + path.sep)) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  fs.readFile(f, function (err, data) {
    if (err) {
      if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      res.writeHead(404); res.end('not found: ' + p); return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});
server.listen(port, '127.0.0.1', function () {
  console.log('royale demo server: http://localhost:' + port + '/');
});
