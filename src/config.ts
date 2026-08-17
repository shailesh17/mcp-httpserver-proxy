import { resolveHeaders } from './headers.js';

export interface ProxyConfig {
  sseUrl?: URL;
  headers: Record<string, string>;
  retries: number;
  retryDelayMs: number;
  isHelp?: boolean;
  isVersion?: boolean;
}

/**
 * Parses and validates command line arguments and environment variables into a typed ProxyConfig.
 */
export function parseConfig(args: string[], env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  let sseUrlString: string | undefined;
  const cliHeaders: string[] = [];
  let retries: number | undefined;
  let retryDelayMs: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      return {
        headers: {},
        retries: 3,
        retryDelayMs: 1000,
        isHelp: true,
      };
    }

    if (arg === '--version' || arg === '-v') {
      return {
        headers: {},
        retries: 3,
        retryDelayMs: 1000,
        isVersion: true,
      };
    }

    if (arg === '-H' || arg === '--header') {
      if (i + 1 >= args.length) {
        throw new Error(
          `Option '${arg}' requires an argument in format "Header-Name: Header-Value"`,
        );
      }
      cliHeaders.push(args[++i]);
    } else if (arg.startsWith('-H=')) {
      cliHeaders.push(arg.slice(3));
    } else if (arg.startsWith('--header=')) {
      cliHeaders.push(arg.slice(9));
    } else if (arg === '-r' || arg === '--retries') {
      if (i + 1 >= args.length) {
        throw new Error(`Option '${arg}' requires an integer argument`);
      }
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val < 1) {
        throw new Error(`Invalid retry count: '${args[i]}'. Must be an integer >= 1`);
      }
      retries = val;
    } else if (arg.startsWith('--retries=')) {
      const val = parseInt(arg.slice(10), 10);
      if (isNaN(val) || val < 1) {
        throw new Error(`Invalid retry count: '${arg.slice(10)}'. Must be an integer >= 1`);
      }
      retries = val;
    } else if (arg === '-d' || arg === '--retry-delay') {
      if (i + 1 >= args.length) {
        throw new Error(`Option '${arg}' requires an integer argument (ms)`);
      }
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val < 0) {
        throw new Error(`Invalid retry delay: '${args[i]}'. Must be an integer >= 0`);
      }
      retryDelayMs = val;
    } else if (arg.startsWith('--retry-delay=')) {
      const val = parseInt(arg.slice(14), 10);
      if (isNaN(val) || val < 0) {
        throw new Error(`Invalid retry delay: '${arg.slice(14)}'. Must be an integer >= 0`);
      }
      retryDelayMs = val;
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      if (!sseUrlString) {
        sseUrlString = arg;
      } else {
        throw new Error(`Unexpected extra positional argument: ${arg}`);
      }
    }
  }

  if (!sseUrlString) {
    throw new Error('Missing required <mcp-server-sse-url> argument.');
  }

  let sseUrl: URL;
  try {
    sseUrl = new URL(sseUrlString);
  } catch {
    throw new Error(`Invalid URL provided: ${sseUrlString}`);
  }

  // Resolve headers from CLI and environment
  const headers = resolveHeaders(cliHeaders, env.MCP_PROXY_HEADERS);

  // Resolve retries from CLI, environment, or default (3)
  if (retries === undefined && env.MCP_PROXY_RETRIES) {
    const val = parseInt(env.MCP_PROXY_RETRIES, 10);
    if (!isNaN(val) && val >= 1) {
      retries = val;
    }
  }
  const resolvedRetries = retries ?? 3;

  // Resolve retry delay from CLI, environment, or default (1000ms)
  if (retryDelayMs === undefined && env.MCP_PROXY_RETRY_DELAY) {
    const val = parseInt(env.MCP_PROXY_RETRY_DELAY, 10);
    if (!isNaN(val) && val >= 0) {
      retryDelayMs = val;
    }
  }
  const resolvedRetryDelayMs = retryDelayMs ?? 1000;

  return {
    sseUrl,
    headers,
    retries: resolvedRetries,
    retryDelayMs: resolvedRetryDelayMs,
  };
}
