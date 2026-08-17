import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseEnvHeaders, parseHeaderString, resolveHeaders } from '../dist/headers.js';

describe('parseHeaderString', () => {
  it('should parse standard "Header-Name: Header-Value" format', () => {
    const result = parseHeaderString('Authorization: Bearer my-secret-token');
    assert.deepEqual(result, {
      key: 'Authorization',
      value: 'Bearer my-secret-token',
    });
  });

  it('should parse header without space after colon', () => {
    const result = parseHeaderString('X-Api-Key:123456');
    assert.deepEqual(result, {
      key: 'X-Api-Key',
      value: '123456',
    });
  });

  it('should handle values containing multiple colons', () => {
    const result = parseHeaderString('Authorization: Basic dXNlcjpwYXNz');
    assert.deepEqual(result, {
      key: 'Authorization',
      value: 'Basic dXNlcjpwYXNz',
    });
  });

  it('should trim surrounding whitespace from key and value', () => {
    const result = parseHeaderString('   X-Tenant-ID  :   acme-corp   ');
    assert.deepEqual(result, {
      key: 'X-Tenant-ID',
      value: 'acme-corp',
    });
  });

  it('should throw on invalid format without colon', () => {
    assert.throws(() => parseHeaderString('InvalidHeaderWithoutColon'), /Invalid header format/);
  });

  it('should throw on empty key', () => {
    assert.throws(() => parseHeaderString(': value-only'), /Header name cannot be empty/);
  });
});

describe('parseEnvHeaders', () => {
  it('should return empty object if env variable is undefined or empty', () => {
    assert.deepEqual(parseEnvHeaders(undefined), {});
    assert.deepEqual(parseEnvHeaders(''), {});
    assert.deepEqual(parseEnvHeaders('   '), {});
  });

  it('should parse valid JSON object of headers', () => {
    const envString = JSON.stringify({
      Authorization: 'Bearer token-from-env',
      'X-Custom-Env': 'env-value',
    });
    const result = parseEnvHeaders(envString);
    assert.deepEqual(result, {
      Authorization: 'Bearer token-from-env',
      'X-Custom-Env': 'env-value',
    });
  });

  it('should cast non-string values to string', () => {
    const envString = '{"X-Rate-Limit": 100, "X-Debug": true}';
    const result = parseEnvHeaders(envString);
    assert.deepEqual(result, {
      'X-Rate-Limit': '100',
      'X-Debug': 'true',
    });
  });

  it('should throw on invalid JSON', () => {
    assert.throws(() => parseEnvHeaders('{ invalid json'), /Failed to parse MCP_PROXY_HEADERS/);
  });

  it('should throw if JSON is an array or primitive', () => {
    assert.throws(() => parseEnvHeaders('["not", "an", "object"]'), /must be a valid JSON object/);
    assert.throws(() => parseEnvHeaders('"just a string"'), /must be a valid JSON object/);
  });
});

describe('resolveHeaders', () => {
  it('should combine env headers and CLI flags', () => {
    const envString = JSON.stringify({
      'X-From-Env': 'env-val',
      'X-Shared': 'from-env',
    });
    const cliHeaders = ['X-From-CLI: cli-val', 'X-Shared: overridden-by-cli'];

    const result = resolveHeaders(cliHeaders, envString);
    assert.deepEqual(result, {
      'X-From-Env': 'env-val',
      'X-From-CLI': 'cli-val',
      'X-Shared': 'overridden-by-cli',
    });
  });

  it('should handle only CLI flags', () => {
    const cliHeaders = ['Authorization: Bearer token123', 'X-Tenant: beta'];
    const result = resolveHeaders(cliHeaders, undefined);
    assert.deepEqual(result, {
      Authorization: 'Bearer token123',
      'X-Tenant': 'beta',
    });
  });

  it('should handle only environment variables', () => {
    const envString = JSON.stringify({
      Authorization: 'Bearer env-token',
    });
    const result = resolveHeaders([], envString);
    assert.deepEqual(result, {
      Authorization: 'Bearer env-token',
    });
  });
});
