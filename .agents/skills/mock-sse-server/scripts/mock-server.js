#!/usr/bin/env node

import http from 'http';

const PORT = 8123;
let sseResponse = null;

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (url.pathname === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    sseResponse = res;
    // Send endpoint event as per MCP SSE specification
    res.write(`event: endpoint\ndata: /messages?sessionId=test-session-123\n\n`);

    req.on('close', () => {
      sseResponse = null;
    });
    return;
  }

  if (url.pathname === '/messages' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted' }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock MCP SSE server running at http://127.0.0.1:${PORT}/sse`);
});
