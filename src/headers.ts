/**
 * Header parsing and resolution utilities for mcp-httpserver-proxy.
 */

/**
 * Parses a single header string in "Key: Value" or "Key:Value" format.
 * Correctly handles multiple colons (e.g., "Authorization: Basic dXNlcjpwYXNz").
 */
export function parseHeaderString(headerStr: string): { key: string; value: string } {
  const colonIndex = headerStr.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(
      `Invalid header format: "${headerStr}". Expected format: "Header-Name: Header-Value"`,
    );
  }
  const key = headerStr.slice(0, colonIndex).trim();
  const value = headerStr.slice(colonIndex + 1).trim();
  if (!key) {
    throw new Error(`Header name cannot be empty in "${headerStr}".`);
  }
  return { key, value };
}

/**
 * Parses JSON-formatted headers from the MCP_PROXY_HEADERS environment variable.
 */
export function parseEnvHeaders(envVarValue?: string): Record<string, string> {
  if (!envVarValue || envVarValue.trim() === '') {
    return {};
  }
  try {
    const parsed = JSON.parse(envVarValue);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('MCP_PROXY_HEADERS must be a valid JSON object of key-value pairs.');
    }
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'string') {
        headers[key] = String(value);
      } else {
        headers[key] = value;
      }
    }
    return headers;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse MCP_PROXY_HEADERS: ${msg}`);
  }
}

/**
 * Resolves combined headers from environment variables and CLI arguments.
 * CLI arguments take precedence over environment variables.
 */
export function resolveHeaders(
  cliHeaders: string[],
  envHeadersString?: string,
): Record<string, string> {
  const headers = parseEnvHeaders(envHeadersString);
  for (const h of cliHeaders) {
    const { key, value } = parseHeaderString(h);
    headers[key] = value;
  }
  return headers;
}
