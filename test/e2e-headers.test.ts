import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';

describe('End-to-End Custom Headers Verification', () => {
  const TEST_PORT = 8199;
  let server: http.Server;
  let receivedGetHeaders: http.IncomingHttpHeaders | null = null;
  let sseClientResponse: http.ServerResponse | null = null;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);

        if (url.pathname === '/sse') {
          receivedGetHeaders = req.headers;
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          sseClientResponse = res;
          res.write(`event: endpoint\ndata: /messages?sessionId=test-session-auth\n\n`);
          return;
        }

        if (url.pathname === '/messages' && req.method === 'POST') {
          res.writeHead(202, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'accepted' }));
          return;
        }

        res.writeHead(404);
        res.end();
      });

      server.listen(TEST_PORT, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  after(async () => {
    if (sseClientResponse) {
      sseClientResponse.end();
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should deliver -H headers to remote SSE server endpoint', async () => {
    const proxyProcess = spawn(
      'node',
      [
        'dist/index.js',
        `http://127.0.0.1:${TEST_PORT}/sse`,
        '-H',
        'Authorization: Bearer test-secret-token',
        '-H',
        'X-Tenant-ID: acme-corp',
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    // Wait for connection to be established
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        proxyProcess.kill('SIGKILL');
        reject(new Error('Timed out waiting for proxy connection'));
      }, 5000);

      proxyProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('Proxy running. Connected to')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    assert.ok(receivedGetHeaders, 'Expected SSE server to receive GET request');
    assert.equal(receivedGetHeaders['authorization'], 'Bearer test-secret-token');
    assert.equal(receivedGetHeaders['x-tenant-id'], 'acme-corp');

    proxyProcess.kill('SIGTERM');
  });

  it('should deliver MCP_PROXY_HEADERS environment variable to SSE server endpoint', async () => {
    receivedGetHeaders = null;

    const proxyProcess = spawn('node', ['dist/index.js', `http://127.0.0.1:${TEST_PORT}/sse`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_PROXY_HEADERS: JSON.stringify({
          'X-Api-Key': 'env-secret-key-999',
        }),
      },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        proxyProcess.kill('SIGKILL');
        reject(new Error('Timed out waiting for proxy connection'));
      }, 5000);

      proxyProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('Proxy running. Connected to')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    assert.ok(receivedGetHeaders, 'Expected SSE server to receive GET request');
    assert.equal(receivedGetHeaders['x-api-key'], 'env-secret-key-999');

    proxyProcess.kill('SIGTERM');
  });
});
