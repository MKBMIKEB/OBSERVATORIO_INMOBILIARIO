// Servidor de prueba minimalista
const http = require('http');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });

  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      env: process.env.NODE_ENV || 'development'
    }));
  } else {
    res.end(JSON.stringify({
      message: 'Servidor funcionando!',
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Node version: ${process.version}`);
});
