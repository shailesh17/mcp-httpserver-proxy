# GitHub Copilot & Cursor Instructions

- **Project Purpose**: `mcp-httpserver-proxy` is a Node.js TypeScript proxy that converts Model Context Protocol (MCP) HTTP/SSE connections to `stdio` for desktop clients like Claude Desktop and Cursor.
- **Stdio Integrity Rule**: **Never use `console.log()` to standard output**. All logs and diagnostic output must go to `console.error()` (stderr) to prevent corrupting the JSON-RPC stdio transport.
- **Package Manager**: Use `pnpm`.
- **Formatting & Linting**: Use `trunk fmt` (`pnpm run format`) and `trunk check` (`pnpm run check`).
- **Commit Messages**: Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
