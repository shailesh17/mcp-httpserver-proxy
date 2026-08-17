# Claude Code Guidelines for `mcp-httpserver-proxy`

Welcome, Claude! This document details the technical architecture, strict constraints, development workflows, and Pull Request procedures for `mcp-httpserver-proxy`.

---

## ⚠️ Critical Constraint: Sacred Standard Output (`stdout`)

> [!IMPORTANT]
> **NEVER use `console.log()` or write arbitrary text to `process.stdout`!**
> The client (Claude Desktop, Cursor, etc.) parses `stdout` strictly as JSON-RPC Model Context Protocol messages. Any non-protocol output on `stdout` will corrupt the transport and crash the client session.
>
> All logging, informational messages, and diagnostics **MUST** be routed to `process.stderr` via `console.error()`.

---

## 🛠️ Common Commands

- **Build**: `pnpm run build` (`tsc`)
- **Test**: `pnpm test` (`node --test test/**/*.test.ts`)
- **Format**: `pnpm run format` (`trunk fmt`)
- **Lint & Static Analysis**: `pnpm run check` (`trunk check`)
- **Dev Watch Mode**: `pnpm run dev`

---

## 🏗️ Architecture & Transports

- **Transport Bridge**: Transparently connects an **MCP Client** over `stdio` (`StdioServerTransport`) to an **MCP HTTP Server** over Server-Sent Events (`SSEClientTransport`).
- **Transport Lifecycle Order**: Establish and confirm the SSE backend connection (`sseTransport.start()`) **before** starting `stdioTransport.start()`.
- **Custom HTTP Headers**: Configured via repeated `-H` / `--header` flags and `MCP_PROXY_HEADERS` environment variable.
- **Resilient Connection Retries**: Configured via `--retries` (`-r`) and `--retry-delay` (`-d`) with exponential backoff.

---

## 📝 Coding & Commit Standards

- **Conventional Commits**: All commit messages and PR titles must follow `<type>(<scope>): <description>` (e.g. `feat(cli): add header flag`, `docs(claude): add CLAUDE.md`).
- **Pre-flight Checks**: Always run `pnpm test`, `pnpm run format`, and `pnpm run check` before submitting.
- **Dependency Management**: Use `pnpm` exclusively. Never introduce `npm` or `yarn` lockfiles.
