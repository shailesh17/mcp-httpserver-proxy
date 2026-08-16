# MCP Proxy Workspace Rules

## Architecture Constraints

- The proxy bridges `StdioServerTransport` (client side) to `SSEClientTransport` (server side).
- `stdio` stdout channel MUST ONLY contain valid JSON-RPC frames.
- Any logging, runtime errors, and connection notifications MUST be written to `stderr` (`console.error`).

## Code Style & Dependencies

- TypeScript compiler target: `ES2022`, module resolution: `NodeNext`.
- Strict mode is enabled in `tsconfig.json`.
- Do not introduce heavy external dependencies for logging or CLI parsing if lightweight native Node.js APIs suffice.
- Format all code with `pnpm run format` (`trunk fmt`).
