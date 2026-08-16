---
name: create-pr
description: >-
  Automated end-to-end workflow to verify, format, test, push, and open a polished, AI-native Pull Request using GitHub CLI (gh) with emojified Conventional Commits and rich markdown formatting.
---

# Create PR Skill

Use this skill when you need to prepare, verify, push, and create a Pull Request on GitHub following this repository's AI-native development standards.

---

## 📋 Standard PR Title Format (Emojified Conventional Commit)

All Pull Request titles must follow the **emojified Conventional Commit** pattern:

`<emoji> <type>(<optional-scope>): <description>`

### Emoji Mapping Reference

| Emoji | Conventional Type | Usage                                   | Example                                                |
| :---- | :---------------- | :-------------------------------------- | :----------------------------------------------------- |
| ✨    | `feat`            | New feature or capability               | `✨ feat(cli): add interactive options and help flag`  |
| 🐛    | `fix`             | Bug fix or error resolution             | `🐛 fix(transport): prevent message drop during init`  |
| 📝    | `docs`            | Documentation changes                   | `📝 docs(readme): add Cursor and VS Code setup guides` |
| 🎨    | `style`           | Formatting or styling adjustments       | `🎨 style: standardize TypeScript import order`        |
| ♻️    | `refactor`        | Code restructuring without logic change | `♻️ refactor(proxy): extract signal cleanup handlers`  |
| 🚀    | `perf`            | Performance improvement                 | `🚀 perf(sse): optimize message serialization`         |
| 🧪    | `test`            | Adding or updating tests                | `🧪 test: add mock SSE server end-to-end suite`        |
| 📦    | `build`           | Build system or dependency updates      | `📦 build: update TypeScript target to ES2022`         |
| 👷    | `ci`              | CI/CD workflow updates                  | `👷 ci: add Node 24 matrix test and semantic PR check` |
| 🔧    | `chore`           | Tooling, configs, or maintenance        | `🔧 chore(trunk): track .trunk configs in Git`         |
| ⏪    | `revert`          | Reverting a previous commit             | `⏪ revert: undo experimental stream buffer`           |

---

## 🛠️ Step-by-Step Execution Workflow

### Step 1: Pre-flight Verification & Stream Hygiene

Run all verification tools to ensure zero build errors, format violations, or lint issues:

```bash
# 1. Compile TypeScript
pnpm run build

# 2. Format code with Trunk
pnpm run format

# 3. Lint and analyze workspace
pnpm run check
```

> [!IMPORTANT]
> **Verify Stdout Isolation**: Ensure no `console.log()` calls exist in runtime proxy code (`src/index.ts`). All logging must be routed to `process.stderr` via `console.error()`.

### Step 2: Testing Verification & Evidence Collection

If transport, proxy, or server integration was modified, run the local mock SSE server and verify end-to-end:

```bash
# Start mock server in background
node .agents/skills/mock-sse-server/scripts/mock-server.js

# Test connection
node dist/index.js http://127.0.0.1:8123/sse
```

Capture the execution logs to include in the PR description under **Testing Evidence**.

### Step 3: Git Branch & Push

1. Ensure changes are committed with Conventional Commit messages.

2. Check current branch:

   ```bash
   git branch --show-current
   ```

   If on `main`, switch to a descriptive branch:

   ```bash
   git checkout -b <type>/<short-description>
   ```

3. Push branch to remote:

   ```bash
   git push -u origin <branch-name>
   ```

### Step 4: Create Pull Request with GitHub CLI (`gh`)

Use `gh pr create` with the emojified title and a rich Markdown body adhering to the template below:

````bash
gh pr create \
  --title "✨ feat(cli): add interactive options and help flag" \
  --body "$(cat <<'EOF'
# Pull Request

## 🤖 AI Agent & Model
- **Agent / Tool**: Antigravity
- **Model**: Gemini 3.7 Flash

---

## 📋 Description & What Changed
- Added `-h` / `--help` and `-v` / `--version` CLI flags.
- Implemented `SIGINT` and `SIGTERM` signal handlers for graceful connection cleanup.
- Configured executable `bin` field in `package.json`.

---

## 💡 Motivation & Why
Allows developers to run `mcp-httpserver-proxy` directly via `npx` with zero setup and ensures child processes terminate cleanly when the terminal session ends.

---

## 🧪 How to Test
1. Run `pnpm run build`.
2. Run `node dist/index.js --help` and verify options display correctly.
3. Run `node dist/index.js http://127.0.0.1:8123/sse` against the mock SSE server.

---

## 🔍 Testing Evidence & Execution Logs
```text
$ pnpm run build
$ trunk check
Checked 24 modified files
✔ No issues

$ node dist/index.js http://127.0.0.1:8123/sse
Proxy running. Connected to http://127.0.0.1:8123/sse
```

---

## 🛡️ Contributor Checklist
- [x] PR Title follows Emojified Conventional Commits.
- [x] TypeScript builds cleanly with `pnpm run build`.
- [x] Code is formatted with `pnpm run format` and passes `pnpm run check`.
- [x] Zero `console.log()` calls to `stdout` (diagnostics use `console.error()`).
EOF
)"
````
