# Agent Guidelines for `mcp-httpserver-proxy`

Welcome, AI agent! This document details the technical architecture, development workflows, strict constraints, coding standards, and Pull Request procedures for this repository.

---

## 🎯 Repository Overview

`mcp-httpserver-proxy` is a transparent bridge between:

1. An **MCP Client** communicating over `stdio` (`StdioServerTransport` from `@modelcontextprotocol/sdk`).
2. An **MCP HTTP Server** communicating over Server-Sent Events (`SSEClientTransport` from `@modelcontextprotocol/sdk`).

The primary entry point is `src/index.ts`, which compiles to `dist/index.js` as an executable Node.js CLI.

---

## ⚠️ Critical Constraints & Rules

### 1. Standard Output (`stdout`) is Sacred

> [!IMPORTANT]
> **NEVER** use `console.log()` or write arbitrary text to `process.stdout`!
> The client (Claude Desktop, Cursor, etc.) parses `stdout` strictly as JSON-RPC Model Context Protocol messages. Any non-protocol output on `stdout` will corrupt the transport and crash the client session.
>
> All logging, informational messages, and diagnostics **MUST** be routed to `process.stderr` via `console.error()`.

### 2. Transport Lifecycle Order

- The proxy **must** establish and confirm the SSE backend connection (`sseTransport.start()`) **before** starting `stdioTransport.start()`.
- If the SSE backend fails or closes, the proxy must gracefully exit or signal failure without leaving orphaned stdio loops.
- Handle process termination signals (`SIGINT`, `SIGTERM`) to clean up open transport connections.

### 3. Package Management & Tooling

- Always use **`pnpm`** as the package manager (`pnpm install`, `pnpm run build`, `pnpm run format`, `pnpm run check`).
- Never introduce `npm` or `yarn` lockfiles.
- Standard formatting and linting is managed by **Trunk**:
  - Format: `pnpm run format` (`trunk fmt`)
  - Lint/Check: `pnpm run check` (`trunk check`)

### 4. Git & Commit Standards

- All commit messages and PR titles must follow **Conventional Commits**:
  - Format: `<type>(<scope>): <description>`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Commits are verified locally via Trunk git hooks (`commitlint`).
- PR titles are verified in CI via GitHub Actions (`semantic-pr.yml`).

---

## 🤖 AI Pull Request Workflow

When instructed to open a Pull Request, use the [create-pr skill](.agents/skills/create-pr/SKILL.md):

1. **Pre-flight**: Run `pnpm run build`, `pnpm run format`, and `pnpm run check`. Ensure 0 errors.
2. **Testing**: Run mock SSE verification if transport was touched (`node .agents/skills/mock-sse-server/scripts/mock-server.js`).
3. **Branch & Push**: Create a feature branch and push to remote (`git push -u origin <branch>`).
4. **Open PR via `gh pr create`**:
   - **Title**: Conventional Commit (e.g. `feat(cli): add version and help flags`).
   - **Body**: Rich Markdown format including:
     - `📋 Description & What Changed`
     - `💡 Motivation & Why`
     - `🧪 How to Test`
     - `🔍 Testing Evidence & Execution Logs`
     - `🤖 AI Agent & Model`
     - `🛡️ Contributor Checklist`

---

## 🛠️ Common Commands

```bash
# Install dependencies
pnpm install

# Compile TypeScript
pnpm run build

# Development watch mode
pnpm run dev

# Format code
pnpm run format

# Run linters & static analysis
pnpm run check
```
