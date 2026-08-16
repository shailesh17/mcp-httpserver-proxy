#!/usr/bin/env node

import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

function printUsage(): void {
  console.error('Usage: mcp-httpserver-proxy <mcp-server-sse-url>');
  console.error('');
  console.error('Options:');
  console.error('  -h, --help     Show help information');
  console.error('  -v, --version  Show version number');
  console.error('');
  console.error('Examples:');
  console.error('  mcp-httpserver-proxy http://localhost:8080/sse');
  console.error('  mcp-httpserver-proxy https://api.example.com/mcp/events');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.error('mcp-httpserver-proxy v1.0.0');
    process.exit(0);
  }

  const sseUrlString = args[0];
  let sseUrl: URL;
  try {
    sseUrl = new URL(sseUrlString);
  } catch (_err) {
    console.error(`Invalid URL provided: ${sseUrlString}`);
    printUsage();
    process.exit(1);
  }

  // Claude Desktop / Cursor uses stdio to communicate with this proxy (Proxy acts as the "Server")
  const stdioTransport = new StdioServerTransport();

  // Proxy uses SSE to communicate with the real MCP Server (Proxy acts as the "Client")
  const sseTransport = new SSEClientTransport(sseUrl);

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
