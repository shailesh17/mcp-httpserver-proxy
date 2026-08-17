import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { describe, it } from 'node:test';

describe('End-to-End Connection Retry Logic', () => {
  const RETRY_TEST_PORT = 8198;

  it('should successfully connect after initial connection failures (delayed backend startup)', async () => {
    let server: http.Server | null = null;
    let sseClientResponse: http.ServerResponse | null = null;
    let serverStarted = false;

    // Start server after a 600ms delay to simulate container/app boot time
    const startTimer = setTimeout(() => {
      server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host}`);
        if (url.pathname === '/sse') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          sseClientResponse = res;
          res.write(`event: endpoint\ndata: /messages?sessionId=retry-test-session\n\n`);
          return;
        }
        res.writeHead(404);
        res.end();
      });

      server.listen(RETRY_TEST_PORT, '127.0.0.1', () => {
        serverStarted = true;
      });
    }, 600);

    const proxyProcess = spawn(
      'node',
      [
        'dist/index.js',
        `http://127.0.0.1:${RETRY_TEST_PORT}/sse`,
        '--retries',
        '6',
        '--retry-delay',
        '250',
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stderrLogs = '';

    const connected = await new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        proxyProcess.kill('SIGKILL');
        reject(new Error(`Timed out waiting for proxy to connect. Captured logs: ${stderrLogs}`));
      }, 7000);

      proxyProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderrLogs += output;
        if (output.includes('Proxy running. Connected to')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
    });

    assert.equal(connected, true);
    assert.ok(
      stderrLogs.includes('Connection attempt 1/6 failed'),
      'Expected logs to indicate retry attempts',
    );

    proxyProcess.kill('SIGTERM');
    clearTimeout(startTimer);
    if (sseClientResponse) {
      (sseClientResponse as http.ServerResponse).end();
    }
    if (serverStarted && server) {
      await new Promise<void>((resolve) => (server as http.Server).close(() => resolve()));
    }
  });

  it('should cleanly exit with code 1 after exhausting all retry attempts', async () => {
    // Port 8197 is not listening
    const UNREACHABLE_PORT = 8197;

    const proxyProcess = spawn(
      'node',
      [
        'dist/index.js',
        `http://127.0.0.1:${UNREACHABLE_PORT}/sse`,
        '--retries',
        '2',
        '--retry-delay',
        '100',
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stderrLogs = '';
    proxyProcess.stderr.on('data', (data: Buffer) => {
      stderrLogs += data.toString();
    });

    const exitCode = await new Promise<number | null>((resolve) => {
      proxyProcess.on('exit', (code) => {
        resolve(code);
      });
    });

    assert.equal(exitCode, 1);
    assert.ok(
      stderrLogs.includes('All 2 connection attempts failed'),
      'Expected logs to indicate all retry attempts failed',
    );
  });
});
