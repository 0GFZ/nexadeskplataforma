const http = require('http');
const mode = process.env.MODE || 'api';
let requests = 0, errors = 0;

const log = (msg, extra = {}) => console.log(JSON.stringify({
  time: new Date().toLocaleString('pt-BR', {timeZone: 'America/Fortaleza'}),
  service: mode, message: msg, ...extra
}));

if (mode === 'worker') {
  log('worker iniciado');
  setInterval(() => log('fila processada'), 15000);
} else {
  http.createServer((req, res) => {
    requests++;
    const requestId = `${Date.now()}-${requests}`;
    log('requisicao', {requestId, path: req.url});

    const send = (code, type, body) => {
      res.writeHead(code, {'Content-Type': type});
      res.end(body);
    };

    if (req.url === '/metrics') {
      return send(200, 'text/plain',
        `# TYPE http_requests_total counter\nhttp_requests_total ${requests}\n# TYPE http_errors_total counter\nhttp_errors_total ${errors}\n`);
    }
    if (req.url === '/error') {
      errors++;
      return send(500, 'application/json', '{"erro":"teste"}');
    }
    if (mode === 'frontend' && req.url === '/') {
      return send(200, 'text/html; charset=utf-8',
        '<h1>NexaDesk</h1><p>Frontend SPA funcionando.</p>');
    }
    if (req.url === '/health') {
      return send(200, 'application/json', '{"status":"ok","servico":"api"}');
    }
    send(200, 'application/json', '{"status":"ok"}');
  }).listen(3000, () => log('servico iniciado', {port: 3000}));
}
