const http = require('http');
const mode = process.env.MODE || 'api';
const zone = 'America/Fortaleza';
let requests = 0, errors = 0;
const log = (msg, extra = {}) => console.log(JSON.stringify({
  time: new Date().toLocaleString('pt-BR', {timeZone: zone}),
  service: mode, message: msg, ...extra
}));

if (mode === 'worker') {
  log('worker iniciado');
  setInterval(() => log('fila processada'), 15000);
} else {
  http.createServer((req, res) => {
    requests++;
    const requestId = `${Date.now()}-${requests}`;
    log('requisição', {requestId, path: req.url});

    if (req.url === '/metrics') {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      return res.end(`# TYPE http_requests_total counter\nhttp_requests_total ${requests}\n# TYPE http_errors_total counter\nhttp_errors_total ${errors}\n`);
    }
    if (req.url === '/error') {
      errors++;
      res.writeHead(500, {'Content-Type': 'application/json'});
      return res.end('{"erro":"teste"}');
    }
    if (mode === 'frontend') {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      return res.end('<h1>NexaDesk</h1><p>Frontend SPA funcionando.</p>');
    }
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{"status":"ok","servico":"api"}');
  }).listen(3000, () => log('serviço iniciado', {port: 3000}));
}
