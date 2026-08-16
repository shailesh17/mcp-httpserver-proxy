# Pull Request

> **🤖 AI-Native Development Repository**
> This repository is designed to be built, tested, and maintained using AI coding agents (such as Antigravity, Cursor, Claude Code, GitHub Copilot, or Gemini CLI).
>
> **Prompt for your AI agent to generate this PR**:
>
> ```text
> Review the diff against `main`, run `pnpm run build`, `pnpm run format`, and `pnpm run check`.
> Then generate a complete Pull Request description following the repository template with:
> 1. A Conventional Commit PR title (e.g. `feat: ...`, `fix: ...`)
> 2. Summary of architectural changes
> 3. AI agent / model used
> 4. Verification & test results
> ```

---

## 🤖 AI Agent & Model

- **Agent / Tool**: <!-- e.g., Antigravity, Cursor, Claude Code, GitHub Copilot, Roo Code -->
- **Model**: <!-- e.g., Gemini 2.5 Pro, Claude 3.7 Sonnet, GPT-4o -->

---

## 📋 Summary of Changes

<!-- AI-generated overview of what was added, modified, or removed, and the technical rationale. -->

---

## 🧪 Verification & Quality Checks

<!-- Summary of verification steps executed by the agent before opening this PR. -->

- [ ] **Build**: `pnpm run build` completed with zero TypeScript errors.
- [ ] **Formatting**: `pnpm run format` (`trunk fmt`) passed.
- [ ] **Linting & Analysis**: `pnpm run check` (`trunk check`) passed with zero issues.
- [ ] **Stdio Stream Hygiene**: Verified no `console.log()` output on `stdout` (all diagnostics go to `stderr`).
- [ ] **Semantic PR Title**: PR title adheres to [Conventional Commits](https://www.conventionalcommits.org/).

---

## 🔍 Test Evidence & Execution Logs

```text
<!-- Paste CLI test runs, trunk check output, or mock SSE transport verification logs here -->
```
