// Main entry point

function greet(name) {
  return `Hello, ${name}!`;
}

module.exports = { greet };

// Simple health check server for Azure
if (require.main === module) {
  const http = require('http');
  const port = process.env.PORT || 3000;

  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Claude Automation Service</h1><p>This service runs via GitHub Actions. Create an issue and mention @claude to try it!</p>');
    }
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
