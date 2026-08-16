# Contributing to MCP HTTP Server Proxy

Thank you for your interest in contributing to **MCP HTTP Server Proxy**! This project bridges Model Context Protocol (MCP) servers operating over HTTP (SSE) to stdio-based clients like Claude Desktop and Cursor.

We welcome all contributions—from bug reports and documentation improvements to new features and performance enhancements.

---

## 🤖 AI-Native Development Model

This repository is designed as a premier example of **100% AI-native development**. We encourage contributors to leverage modern AI coding agents (such as Antigravity, Cursor, Claude Code, GitHub Copilot, or Gemini CLI) for planning, implementation, verification, and opening Pull Requests.

### How to Prompt Your AI Agent

You can instruct your AI assistant directly with tasks like:

```text
Please implement [feature/fix description].
1. Follow the guidelines in AGENTS.md.
2. Ensure stdout hygiene is maintained (console.error only).
3. Run `pnpm run build`, `pnpm run format`, and `pnpm run check`.
4. Test against the mock SSE server in `.agents/skills/mock-sse-server`.
5. Open or draft a Pull Request with a Conventional Commit title and the template in .github/PULL_REQUEST_TEMPLATE.md.
```

---

## 🛠️ Development Setup

### Prerequisites

Ensure you have the following installed on your machine:

- **[Node.js](https://nodejs.org/)**: Version 20 LTS or later (e.g., Node 20, 22, or 24).
- **[pnpm](https://pnpm.io/)**: Version 9 or 11 (recommended package manager).
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

This repository strictly adheres to the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Why Conventional Commits?

We use GitHub's **Squash and Merge** strategy. Enforcing conventional commit formats guarantees a clean, automated release history and changelog.

### Commit Format

```text
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types

| Type       | Description                                                 | Example                                         |
| :--------- | :---------------------------------------------------------- | :---------------------------------------------- |
| `feat`     | A new feature or capability                                 | `feat: add configurable connection timeout`     |
| `fix`      | A bug fix                                                   | `fix: handle unexpected SSE stream termination` |
| `docs`     | Documentation changes only                                  | `docs: add Cursor configuration instructions`   |
| `style`    | Formatting, missing semicolons, etc. (no code logic change) | `style: format imports`                         |
| `refactor` | Code restructuring without fixing a bug or adding a feature | `refactor: extract signal cleanup handler`      |
| `perf`     | A code change that improves performance                     | `perf: reduce serialization latency`            |
| `test`     | Adding or updating tests                                    | `test: add mock sse transport tests`            |
| `build`    | Changes to build system or dependencies                     | `build: update typescript compiler target`      |
| `ci`       | Changes to CI configuration files or scripts                | `ci: add node 24 to matrix test`                |
| `chore`    | Routine maintenance tasks                                   | `chore: update dependencies`                    |
| `revert`   | Reverting a previous commit                                 | `revert: undo feature flag changes`             |

### Enforcement

1. **Local Hook**: Every `git commit` is validated by `@commitlint` through Trunk pre-commit hooks.
2. **PR Title Check**: Every Pull Request title is validated by GitHub Actions (`semantic-pr.yml`). Please ensure your PR title follows Conventional Commits.

---

## 🚀 Submitting a Pull Request

1. **Create your feature branch** in your fork:

   ```bash
   git checkout -b my-feature-name
   ```

2. **Make your changes** adhering to TypeScript strict mode and coding guidelines.

3. **Format and lint your code**:

   ```bash
   pnpm run format
   pnpm run check
   pnpm run build
   ```

4. **Commit your changes** with a conventional commit message:

   ```bash
   git commit -m "feat: support custom headers in SSE connection"
   ```

5. **Push to your fork** and open a Pull Request against the `main` branch.

6. **Generate PR with AI**: Use your AI coding agent to generate the full PR description adhering to [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) and ensuring the PR title follows Conventional Commits.

---

## 🛡️ Code Guidelines

- **Standard I/O Hygiene**: **Never call `console.log()` to `stdout`**. The `stdout` stream is exclusively reserved for Model Context Protocol JSON-RPC transport frames. All logging, diagnostic output, and error messages MUST go to `stderr` via `console.error()`.
- **Async & Transport Safety**: Transports must be started sequentially (SSE connection verified first before initializing `stdioTransport`).
- **Clean Disconnects**: Always handle `onclose` and process termination signals (`SIGINT`, `SIGTERM`) gracefully.
