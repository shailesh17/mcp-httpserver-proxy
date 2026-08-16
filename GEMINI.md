# Antigravity / Gemini Workspace Rules

Refer to [AGENTS.md](./AGENTS.md) for full architecture overview, development workflows, and constraints.

## Key Rules

1. **Never output to stdout (`console.log`)** in proxy code. All logs must use `console.error` to avoid corrupting MCP JSON-RPC stdio transport.
2. **Build and Verification**: Always verify code changes with `pnpm run build`, `pnpm run format`, and `pnpm run check`.
3. **Commit Standards**: Use Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
