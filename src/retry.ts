import {
  SSEClientTransport,
  SSEClientTransportOptions,
} from '@modelcontextprotocol/sdk/client/sse.js';

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
}

/**
 * Attempts to establish a connection to the SSE server, retrying on transient failures
 * with exponential backoff before throwing an error.
 */
export async function connectWithRetry(
  url: URL,
  transportOpts: SSEClientTransportOptions,
  options: RetryOptions,
): Promise<SSEClientTransport> {
  const { maxAttempts, baseDelayMs } = options;
  let attempt = 1;

  while (attempt <= maxAttempts) {
    const transport = new SSEClientTransport(url, transportOpts);
    try {
      if (attempt > 1) {
        console.error(`[Attempt ${attempt}/${maxAttempts}] Connecting to ${url.href}...`);
      }
      await transport.start();
      return transport;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      try {
        await transport.close();
      } catch {
        // Ignore errors during failed transport cleanup
      }

      if (attempt < maxAttempts) {
        const delay = Math.round(baseDelayMs * Math.pow(1.5, attempt - 1));
        console.error(
          `Connection attempt ${attempt}/${maxAttempts} failed (${errorMsg}). Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      } else {
        console.error(`All ${maxAttempts} connection attempts failed. Last error: ${errorMsg}`);
        throw err;
      }
    }
  }

  throw new Error(`Failed to connect after ${maxAttempts} attempts`);
}
