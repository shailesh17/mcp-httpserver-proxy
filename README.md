# MCP HTTP Server Proxy

A transparent proxy to bridge a local Model Context Protocol (MCP) server listening over HTTP (SSE) to an MCP client (like Claude Desktop) using standard input/output (`stdio`).

## Motivation

Claude Desktop officially requires MCP servers to run as local commands communicating over standard input/output (`stdio`). However, some applications implement MCP servers embedded into HTTP servers, using Server-Sent Events (SSE) for transport. 

This proxy solves that by acting as a bridge:
- It exposes a `stdio` interface to Claude Desktop.
- It connects as a client to your HTTP MCP Server via SSE.
- It transparently forwards JSON-RPC messages back and forth.

## Installation & Build

Ensure you have [Node.js](https://nodejs.org) (v20+) and [pnpm](https://pnpm.io/) installed.

```bash
# Clone the repository
git clone https://github.com/your-username/mcp-httpserver-proxy.git
cd mcp-httpserver-proxy

# Install dependencies
pnpm install

# Build the TypeScript code
pnpm run build
```

## Usage with Claude Desktop

To use this proxy with Claude Desktop, configure your `claude_desktop_config.json` to launch this proxy as the command, and pass your real MCP server's SSE URL as an argument.

Edit your configuration (usually located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "my-http-server": {
      "command": "node",
      "args": [
        "/path/to/mcp-httpserver-proxy/dist/index.js",
        "http://localhost:8080/sse"
      ]
    }
  }
}
```

*Replace `/path/to/mcp-httpserver-proxy` with the absolute path to this project, and `http://localhost:8080/sse` with your server's actual SSE endpoint.*

## Development

This project uses Trunk for linting/formatting and standard GitHub Actions for CI.

- `pnpm run build` - Compile TypeScript to JavaScript.
- `pnpm run dev` - Watch for changes and rebuild automatically.
- `pnpm run format` - Format code using Prettier via Trunk.
- `pnpm run check` - Lint code using Trunk.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
