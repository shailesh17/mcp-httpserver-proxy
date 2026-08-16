# Antigravity / Gemini Workspace Rules

Refer to [AGENTS.md](./AGENTS.md) for full architecture overview, development workflows, and constraints.

## Key Rules

1. **Never output to stdout (`console.log`)** in proxy code. All logs must use `console.error` to avoid corrupting MCP JSON-RPC stdio transport.
2. **Build and Verification**: Always verify code changes with `pnpm run build`, `pnpm run format`, and `pnpm run check`.
3. **Commit & PR Standards**: Use Emojified Conventional Commits (`✨ feat:`, `🐛 fix:`, `📝 docs:`, `🔧 chore:`, etc.).
4. **Pull Requests**: Follow the AI PR workflow detailed in `.agents/skills/create-pr/SKILL.md` with rich markdown formatting (What, Why, How to Test, Testing Evidence).
