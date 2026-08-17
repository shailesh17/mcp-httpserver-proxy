#!/usr/bin/env node

import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import { resolveHeaders } from './headers.js';

function printUsage(): void {
  console.error('Usage: mcp-httpserver-proxy <mcp-server-sse-url> [options]');
  console.error('');
  console.error('Options:');
  console.error('  -H, --header <name: value>  Custom HTTP request header (can be repeated)');
  console.error('  -h, --help                  Show help information');
  console.error('  -v, --version               Show version number');
  console.error('');
  console.error('Environment Variables:');
  console.error('  MCP_PROXY_HEADERS           JSON string of key-value header pairs');
  console.error('                              Example: \'{"Authorization": "Bearer secret"}\'');
  console.error('');
  console.error('Examples:');
  console.error('  mcp-httpserver-proxy http://localhost:8080/sse');
  console.error(
    '  mcp-httpserver-proxy https://api.example.com/sse -H "Authorization: Bearer secret"',
  );
  console.error(
    '  mcp-httpserver-proxy https://api.example.com/sse -H "X-Api-Key: 123" -H "X-Tenant-ID: acme"',
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let sseUrlString: string | undefined;
  const cliHeaders: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--version' || arg === '-v') {
      console.error('mcp-httpserver-proxy v1.0.0');
      process.exit(0);
    }

    if (arg === '-H' || arg === '--header') {
      if (i + 1 >= args.length) {
        console.error(
          `Error: Option '${arg}' requires an argument in format "Header-Name: Header-Value"`,
        );
        printUsage();
        process.exit(1);
      }
      cliHeaders.push(args[++i]);
    } else if (arg.startsWith('-H=')) {
      cliHeaders.push(arg.slice(3));
    } else if (arg.startsWith('--header=')) {
      cliHeaders.push(arg.slice(9));
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      process.exit(1);
    } else {
      if (!sseUrlString) {
        sseUrlString = arg;
      } else {
        console.error(`Unexpected extra positional argument: ${arg}`);
        printUsage();
        process.exit(1);
      }
    }
  }

  if (!sseUrlString) {
    console.error('Error: Missing required <mcp-server-sse-url> argument.');
    printUsage();
    process.exit(1);
  }

  let sseUrl: URL;
  try {
    sseUrl = new URL(sseUrlString);
  } catch (_err) {
    console.error(`Invalid URL provided: ${sseUrlString}`);
    printUsage();
    process.exit(1);
  }

  let headers: Record<string, string>;
  try {
    headers = resolveHeaders(cliHeaders, process.env.MCP_PROXY_HEADERS);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Header configuration error: ${msg}`);
    process.exit(1);
  }

  const customHeadersCount = Object.keys(headers).length;
  if (customHeadersCount > 0) {
    console.error(`Configured ${customHeadersCount} custom HTTP header(s) for backend connection.`);
  }

  // Claude Desktop / Cursor uses stdio to communicate with this proxy (Proxy acts as the "Server")
  const stdioTransport = new StdioServerTransport();

  // Proxy uses SSE to communicate with the real MCP Server (Proxy acts as the "Client")
  const sseTransport = new SSEClientTransport(sseUrl, {
    requestInit: customHeadersCount > 0 ? { headers } : undefined,
  });

  let sseStarted = false;
  let stdioStarted = false;

  const cleanup = async (): Promise<void> => {
    try {
      if (sseStarted) {
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

  // Forward messages from Claude Desktop / Cursor (stdio) to Real Server (SSE)
  stdioTransport.onmessage = async (message: JSONRPCMessage) => {
    try {
      if (sseStarted) {
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

  sseTransport.onerror = (error) => {
    console.error('SSE Connection error:', error);
  };

  stdioTransport.onclose = () => {
    console.error('Stdio Connection closed');
    process.exit(0);
  };

  stdioTransport.onerror = (error) => {
    console.error('Stdio Connection error:', error);
  };

  // Start the transports sequentially:
  // Connect to SSE server first before exposing stdio interface to prevent dropped initialization frames.
  try {
    await sseTransport.start();
    sseStarted = true;

    await stdioTransport.start();
    stdioStarted = true;

    console.error(`Proxy running. Connected to ${sseUrlString}`);
  } catch (error) {
    console.error('Failed to connect to SSE server:', error);
    await cleanup();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal proxy error:', error);
  process.exit(1);
});
