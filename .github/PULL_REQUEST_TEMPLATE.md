# Pull Request

> **🤖 AI-Native Contribution Flow**
> This repository uses AI coding agents to build, test, and open Pull Requests.
>
> **PR Title Format**: `<emoji> <type>(<scope>): <description>` (e.g. `✨ feat(cli): add help and version flags`)
>
> **Agent Prompt**:
>
> ```text
> Review the diff against `main`, run `pnpm run build`, `pnpm run format`, and `pnpm run check`.
> Then generate a complete Pull Request using the repository template with:
> 1. Emojified Conventional Commit title
> 2. Description of what changed
> 3. Motivation / Why
> 4. How to test instructions
> 5. Testing evidence & execution logs
> ```

---

## 📋 Description & What Changed

<!-- Concise, structured overview of what was added, modified, or removed, and the technical rationale. -->

---

## 💡 Motivation & Why

<!-- Why is this change needed? What problem does it solve? -->

---

## 🧪 How to Test

<!-- Step-by-step instructions for maintainers/reviewers to test and verify this change. -->

1. `pnpm run build`
2. ...

---

## 🔍 Testing Evidence & Execution Logs

```text
<!-- Paste execution output, test logs, or CLI runs here -->
```

---

## 🤖 AI Agent & Model

- **Agent / Tool**: <!-- e.g., Antigravity, Cursor, Claude Code, GitHub Copilot -->
- **Model**: <!-- e.g., Gemini 3.7 Flash, Claude 3.7 Sonnet, GPT-4o -->

---

## 🛡️ Contributor Checklist

- [ ] PR Title follows **Emojified Conventional Commits** (e.g. `✨ feat: ...`, `🐛 fix: ...`).
- [ ] TypeScript builds cleanly with `pnpm run build`.
- [ ] Code is formatted with `pnpm run format` and passes `pnpm run check`.
- [ ] Stdio hygiene verified (no `console.log()` to `stdout`; all diagnostics use `console.error()`).
