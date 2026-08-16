# Contributing to MCP HTTP Server Proxy

Thank you for your interest in contributing to **MCP HTTP Server Proxy**! This project bridges Model Context Protocol (MCP) servers operating over HTTP (SSE) to stdio-based clients like Claude Desktop and Cursor.

We welcome all contributions—from bug reports and documentation improvements to new features and performance enhancements.

---

## 🤖 AI-Native Development Model

This repository is designed as a premier model of **100% AI-native development**. We encourage contributors to leverage modern AI coding agents (such as Antigravity, Cursor, Claude Code, GitHub Copilot, or Gemini CLI) for planning, implementation, verification, and opening Pull Requests.

### How to Prompt Your AI Agent

You can instruct your AI assistant directly:

```text
Please implement [feature/fix description].
1. Follow the guidelines in AGENTS.md.
2. Ensure stdout hygiene is maintained (console.error only).
3. Run `pnpm run build`, `pnpm run format`, and `pnpm run check`.
4. Test against the mock SSE server in `.agents/skills/mock-sse-server`.
5. Open or draft a Pull Request with an Emojified Conventional Commit title and the template in .github/PULL_REQUEST_TEMPLATE.md.
```

---

## 🛠️ Development Setup

### Prerequisites

Ensure you have the following installed on your machine:

- **[Node.js](https://nodejs.org/)**: Version 20 LTS or later (e.g., Node 20, 22, or 24).
- **[pnpm](https://pnpm.io/)**: Version 9 or 11 (recommended package manager).
- **[GitHub CLI (gh)](https://cli.github.com/)**: For automated PR creation via AI.
- **[Git](https://git-scm.com/)**

### 1. Clone the Repository

```bash
git clone https://github.com/shailesh17/mcp-httpserver-proxy.git
cd mcp-httpserver-proxy
```

### 2. Install Dependencies & Setup Git Hooks

```bash
pnpm install
```

> **Note**: Running `pnpm install` will automatically initialize local Git hooks via [Trunk](https://trunk.io/) to enforce linting, formatting, and Conventional Commits on `git commit`.

---

## 🔄 Development Workflow

The repository follows a single-trunk workflow centered around the **`main`** branch. External contributors work on their forks and submit Pull Requests targeting `main`.

### Available Scripts

- **`pnpm run build`**: Compiles TypeScript files from `src/` to `dist/`.
- **`pnpm run dev`**: Starts TypeScript in watch mode alongside the running proxy.
- **`pnpm run format`**: Automatically formats the codebase using Trunk (Prettier).
- **`pnpm run check`**: Runs linters and static analysis across modified files using Trunk.
- **`pnpm run check:ci`**: Runs all linters across the entire workspace in CI mode.

---

## 📝 Commit & PR Conventions

This repository strictly adheres to **Emojified Conventional Commits**.

### Why Conventional Commits?

We use GitHub's **Squash and Merge** strategy. Enforcing conventional commit formats guarantees a clean, automated release history and changelog.

### Format

```text
<emoji> <type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types & Emojis

| Emoji | Type       | Description                                                 | Example                                                  |
| :---- | :--------- | :---------------------------------------------------------- | :------------------------------------------------------- |
| ✨    | `feat`     | A new feature or capability                                 | `✨ feat(cli): add configurable connection timeout`      |
| 🐛    | `fix`      | A bug fix                                                   | `🐛 fix(transport): handle unexpected stream close`      |
| 📝    | `docs`     | Documentation changes only                                  | `📝 docs(readme): add Cursor configuration instructions` |
| 🎨    | `style`    | Formatting, missing semicolons, etc. (no code logic change) | `🎨 style: format imports`                               |
| ♻️    | `refactor` | Code restructuring without fixing a bug or adding a feature | `♻️ refactor: extract signal cleanup handler`            |
| 🚀    | `perf`     | A code change that improves performance                     | `🚀 perf: reduce serialization latency`                  |
| 🧪    | `test`     | Adding or updating tests                                    | `🧪 test: add mock sse transport tests`                  |
| 📦    | `build`    | Changes to build system or dependencies                     | `📦 build: update typescript compiler target`            |
| 👷    | `ci`       | Changes to CI configuration files or scripts                | `👷 ci: add node 24 to matrix test`                      |
| 🔧    | `chore`    | Routine maintenance tasks                                   | `🔧 chore: update dependencies`                          |
| ⏪    | `revert`   | Reverting a previous commit                                 | `⏪ revert: undo feature flag changes`                   |

### Enforcement

1. **Local Hook**: Every `git commit` is validated by `@commitlint` through Trunk pre-commit hooks.
2. **PR Title Check**: Every Pull Request title is validated by GitHub Actions (`semantic-pr.yml`).

---

## 🚀 Submitting a Pull Request (AI Flow)

1. **Create your feature branch**:

   ```bash
   git checkout -b <type>/<short-description>
   ```

2. **Make your changes** adhering to TypeScript strict mode and coding guidelines.

3. **Verify quality**:

   ```bash
   pnpm run build
   pnpm run format
   pnpm run check
   ```

4. **Commit with Emojified Conventional Commit**:

   ```bash
   git commit -m "✨ feat: support custom headers in SSE connection"
   ```

5. **Push to remote**:

   ```bash
   git push -u origin <branch-name>
   ```

6. **Create PR with rich Markdown via GitHub CLI (`gh`)**:

   ```bash
   gh pr create \
     --title "✨ feat: support custom headers in SSE connection" \
     --body-file .github/PULL_REQUEST_TEMPLATE.md
   ```

   Ensure your PR body includes:
   - **🤖 AI Agent & Model**: Tool and LLM used.
   - **📋 Description & What Changed**: Clear overview of code additions and changes.
   - **💡 Motivation & Why**: Why this change is necessary.
   - **🧪 How to Test**: Clear verification steps.
   - **🔍 Testing Evidence & Execution Logs**: Terminal outputs and test runs.

---

## 🛡️ Code Guidelines

- **Standard I/O Hygiene**: **Never call `console.log()` to `stdout`**. The `stdout` stream is exclusively reserved for Model Context Protocol JSON-RPC transport frames. All logging, diagnostic output, and error messages MUST go to `stderr` via `console.error()`.
- **Async & Transport Safety**: Transports must be started sequentially (SSE connection verified first before initializing `stdioTransport`).
- **Clean Disconnects**: Always handle `onclose` and process termination signals (`SIGINT`, `SIGTERM`) gracefully.
