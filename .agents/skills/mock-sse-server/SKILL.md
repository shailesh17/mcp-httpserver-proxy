---
name: mock-sse-server
description: >-
  Provides a mock MCP SSE server and runbook to test and verify mcp-httpserver-proxy locally end-to-end.
---

# Mock SSE MCP Server

Use this skill when you want to verify that `mcp-httpserver-proxy` connects properly to an HTTP/SSE MCP endpoint and forwards messages.

## Quick Start

1. Start the mock SSE server:

   ```bash
   node .agents/skills/mock-sse-server/scripts/mock-server.js
   ```

   This will listen on `http://127.0.0.1:8123/sse`.

2. In another terminal, test the proxy against the mock server:

   ```bash
   node dist/index.js http://127.0.0.1:8123/sse
   ```

3. The proxy should output `Proxy running. Connected to http://127.0.0.1:8123/sse` on stderr.
