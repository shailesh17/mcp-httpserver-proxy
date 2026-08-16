import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: mcp-httpserver-proxy <mcp-server-sse-url>');
    console.error('Example: mcp-httpserver-proxy http://localhost:8080/sse');
    process.exit(1);
  }

  const sseUrlString = args[0];
  let sseUrl: URL;
  try {
    sseUrl = new URL(sseUrlString);
  } catch (err) {
    console.error(`Invalid URL: ${sseUrlString}`);
    process.exit(1);
  }

  // Claude Desktop uses stdio to communicate with this proxy (Proxy acts as the "Server")
  const stdioTransport = new StdioServerTransport();
  
  // Proxy uses SSE to communicate with the real MCP Server (Proxy acts as the "Client")
  const sseTransport = new SSEClientTransport(sseUrl);

  let sseStarted = false;
  let stdioStarted = false;

  // Forward messages from Claude Desktop (stdio) to Real Server (SSE)
  stdioTransport.onmessage = async (message: JSONRPCMessage) => {
    try {
      if (sseStarted) {
        await sseTransport.send(message);
      } else {
        console.error('SSE Transport not started yet. Dropping message from Claude Desktop.');
      }
    } catch (error) {
      console.error('Error forwarding message to SSE server:', error);
    }
  };

  // Forward messages from Real Server (SSE) to Claude Desktop (stdio)
  sseTransport.onmessage = async (message: JSONRPCMessage) => {
    try {
      if (stdioStarted) {
        await stdioTransport.send(message);
      } else {
        console.error('Stdio Transport not started yet. Dropping message from SSE server.');
      }
    } catch (error) {
      console.error('Error forwarding message to Claude Desktop:', error);
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

  // Start the transports
  try {
    await sseTransport.start();
    sseStarted = true;
    
    // Only start stdio transport after SSE is successfully connected
    // This ensures we don't accept messages from Claude before we can forward them
    await stdioTransport.start();
    stdioStarted = true;
    
    console.error(`Proxy running. Connected to ${sseUrlString}`);
  } catch (error) {
    console.error('Failed to start proxy:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
