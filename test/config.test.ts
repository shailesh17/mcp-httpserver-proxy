import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseConfig } from '../dist/config.js';

describe('parseConfig', () => {
  it('should parse URL and default options', () => {
    const config = parseConfig(['http://localhost:8080/sse'], {});
    assert.equal(config.sseUrl?.href, 'http://localhost:8080/sse');
    assert.deepEqual(config.headers, {});
    assert.equal(config.retries, 3);
    assert.equal(config.retryDelayMs, 1000);
    assert.equal(config.isHelp, undefined);
  });

  it('should handle --help and -h flags', () => {
    const helpConfig1 = parseConfig(['--help']);
    assert.equal(helpConfig1.isHelp, true);

    const helpConfig2 = parseConfig(['-h']);
    assert.equal(helpConfig2.isHelp, true);
  });

  it('should handle --version and -v flags', () => {
    const verConfig1 = parseConfig(['--version']);
    assert.equal(verConfig1.isVersion, true);

    const verConfig2 = parseConfig(['-v']);
    assert.equal(verConfig2.isVersion, true);
  });

  it('should parse --retries and --retry-delay flags', () => {
    const config = parseConfig(
      ['https://api.example.com/sse', '-r', '5', '-d', '2500', '-H', 'Authorization: Bearer test'],
      {},
    );

    assert.equal(config.sseUrl?.href, 'https://api.example.com/sse');
    assert.equal(config.retries, 5);
    assert.equal(config.retryDelayMs, 2500);
    assert.deepEqual(config.headers, {
      Authorization: 'Bearer test',
    });
  });

  it('should parse --retries=N and --retry-delay=N syntax', () => {
    const config = parseConfig(
      ['https://api.example.com/sse', '--retries=7', '--retry-delay=500'],
      {},
    );

    assert.equal(config.retries, 7);
    assert.equal(config.retryDelayMs, 500);
  });

  it('should read retries and retry delay from environment variables', () => {
    const config = parseConfig(['https://api.example.com/sse'], {
      MCP_PROXY_RETRIES: '4',
      MCP_PROXY_RETRY_DELAY: '1500',
    });

    assert.equal(config.retries, 4);
    assert.equal(config.retryDelayMs, 1500);
  });

  it('should allow CLI flags to override environment variables', () => {
    const config = parseConfig(['https://api.example.com/sse', '--retries', '8'], {
      MCP_PROXY_RETRIES: '2',
    });

    assert.equal(config.retries, 8);
  });

  it('should throw error on missing URL', () => {
    assert.throws(() => parseConfig([]), /Missing required <mcp-server-sse-url> argument/);
  });

  it('should throw error on invalid URL', () => {
    assert.throws(() => parseConfig(['not-a-valid-url']), /Invalid URL provided/);
  });

  it('should throw error on invalid retries argument', () => {
    assert.throws(
      () => parseConfig(['http://localhost:8080/sse', '--retries', '0']),
      /Invalid retry count/,
    );
    assert.throws(
      () => parseConfig(['http://localhost:8080/sse', '--retries', 'abc']),
      /Invalid retry count/,
    );
  });

  it('should throw error on invalid retry delay argument', () => {
    assert.throws(
      () => parseConfig(['http://localhost:8080/sse', '--retry-delay', '-5']),
      /Invalid retry delay/,
    );
  });

  it('should throw error on unknown options', () => {
    assert.throws(
      () => parseConfig(['http://localhost:8080/sse', '--unknown-option']),
      /Unknown option: --unknown-option/,
    );
  });
});
