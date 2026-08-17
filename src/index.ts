#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { parseConfig } from './config.js';
import { connectWithRetry } from './retry.js';

function printUsage(): void {
  console.error('Usage: mcp-httpserver-proxy <mcp-server-sse-url> [options]');
  console.error('');
  console.error('Options:');
  console.error('  -H, --header <name: value>   Custom HTTP request header (can be repeated)');
  console.error(
    '  -r, --retries <count>        Number of connection attempts on startup (default: 3)',
  );
  console.error('  -d, --retry-delay <ms>       Base retry delay in milliseconds (default: 1000)');
  console.error('  -h, --help                   Show help information');
  console.error('  -v, --version                Show version number');
  console.error('');
  console.error('Environment Variables:');
  console.error('  MCP_PROXY_HEADERS            JSON string of key-value header pairs');
  console.error('                               Example: \'{"Authorization": "Bearer secret"}\'');
  console.error('  MCP_PROXY_RETRIES            Number of connection attempts (default: 3)');
  console.error('  MCP_PROXY_RETRY_DELAY        Base retry delay in milliseconds (default: 1000)');
  console.error('');
  console.error('Examples:');
  console.error('  mcp-httpserver-proxy http://localhost:8080/sse');
  console.error(
    '  mcp-httpserver-proxy https://api.example.com/sse -H "Authorization: Bearer secret"',
  );
  console.error('  mcp-httpserver-proxy http://localhost:8080/sse --retries 5 --retry-delay 2000');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let config;

  try {
    config = parseConfig(args, process.env);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${msg}`);
    printUsage();
    process.exit(1);
  }

  if (config.isHelp) {
    printUsage();
    process.exit(0);
  }

  if (config.isVersion) {
    console.error('mcp-httpserver-proxy v1.0.0');
    process.exit(0);
  }

  const { sseUrl, headers, retries, retryDelayMs } = config;
  if (!sseUrl) {
    console.error('Error: Missing required <mcp-server-sse-url> argument.');
    printUsage();
    process.exit(1);
  }

  const customHeadersCount = Object.keys(headers).length;
  if (customHeadersCount > 0) {
    console.error(`Configured ${customHeadersCount} custom HTTP header(s) for backend connection.`);
  }

  // Claude Desktop / Cursor uses stdio to communicate with this proxy (Proxy acts as the "Server")
  const stdioTransport = new StdioServerTransport();

  let sseStarted = false;
  let stdioStarted = false;
  let sseTransport: any = null;

  const cleanup = async (): Promise<void> => {
    try {
      if (sseStarted && sseTransport) {
        await sseTransport.close();
      }
    } catch (e) {
      console.error('Error closing SSE transport:', e);
    }

    try {
      if (stdioStarted) {
        await stdioTransport.close();
      }
    } catch (e) {
      console.error('Error closing Stdio transport:', e);
    }
  };

  process.on('SIGINT', async () => {
    console.error('Received SIGINT. Shutting down proxy...');
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM. Shutting down proxy...');
    await cleanup();
    process.exit(0);
  });

  // Connect to SSE backend with resilient retry logic
  try {
    sseTransport = await connectWithRetry(
      sseUrl,
      {
        requestInit: customHeadersCount > 0 ? { headers } : undefined,
      },
      {
        maxAttempts: retries,
        baseDelayMs: retryDelayMs,
      },
    );
    sseStarted = true;
  } catch (error) {
    console.error('Failed to connect to SSE server:', error);
    await cleanup();
    process.exit(1);
  }

  // Forward messages from Claude Desktop / Cursor (stdio) to Real Server (SSE)
  stdioTransport.onmessage = async (message: JSONRPCMessage) => {
    try {
      if (sseStarted && sseTransport) {
        await sseTransport.send(message);
      } else {
        console.error('SSE Transport not ready. Dropping message from stdio client.');
      }
    } catch (error) {
      console.error('Error forwarding message to SSE server:', error);
    }
  };

  // Forward messages from Real Server (SSE) to Claude Desktop / Cursor (stdio)
  sseTransport.onmessage = async (message: JSONRPCMessage) => {
    try {
      if (stdioStarted) {
        await stdioTransport.send(message);
      } else {
        console.error('Stdio Transport not ready. Dropping message from SSE server.');
      }
    } catch (error) {
      console.error('Error forwarding message to stdio client:', error);
    }
  };

  sseTransport.onclose = () => {
    console.error('SSE Connection closed');
    process.exit(0);
  };

  sseTransport.onerror = (error: Error) => {
    console.error('SSE Connection error:', error);
  };

  stdioTransport.onclose = () => {
    console.error('Stdio Connection closed');
    process.exit(0);
  };

  stdioTransport.onerror = (error: Error) => {
    console.error('Stdio Connection error:', error);
  };

  try {
    await stdioTransport.start();
    stdioStarted = true;
    console.error(`Proxy running. Connected to ${sseUrl.href}`);
  } catch (error) {
    console.error('Failed to start Stdio transport:', error);
    await cleanup();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal proxy error:', error);
  process.exit(1);
});
