/**
 * Tests for fix-substr codemod
 * Verifies that substr is correctly replaced with substring or slice
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const jscodeshift = require('jscodeshift');
const transform = require('./fix-substr.js');

function applyTransform(source) {
  const fileInfo = { path: 'test.js', source };
  const api = { jscodeshift, report: () => {} };
  return transform(fileInfo, api);
}

describe('fix-substr codemod', () => {
  it('should replace substr with positive index and length with substring', () => {
    const input = `const result = str.substr(5, 10);`;
    const expected = `const result = str.substring(5, 5 + 10);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });

  it('should replace substr with positive index and no length with substring', () => {
    const input = `const result = str.substr(5);`;
    const expected = `const result = str.substring(5);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });

  it('should replace substr with negative index and length with slice', () => {
    const input = `const result = str.substr(-5, 3);`;
    const expected = `const result = str.slice(-5, -5 + 3);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });

  it('should replace substr with negative index and no length with slice', () => {
    const input = `const result = str.substr(-5);`;
    const expected = `const result = str.slice(-5);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });

  it('should replace substr with zero index', () => {
    const input = `const result = str.substr(0, 5);`;
    const expected = `const result = str.substring(0, 0 + 5);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });

  it('should handle multiple substr calls in same file', () => {
    const input = `
const a = str.substr(0, 5);
const b = str.substr(-3);
const c = text.substr(10, 20);
    `.trim();
    
    const expected = `
const a = str.substring(0, 0 + 5);
const b = str.slice(-3);
const c = text.substring(10, 10 + 20);
    `.trim();
    
    const output = applyTransform(input);
    // Normalize line endings for cross-platform compatibility
    assert.strictEqual(output.replace(/\r\n/g, '\n'), expected.replace(/\r\n/g, '\n'));
  });

  it('should handle chained method calls', () => {
    const input = `const result = str.trim().substr(5, 10);`;
    const expected = `const result = str.trim().substring(5, 5 + 10);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });

  it('should preserve variable expressions as arguments', () => {
    const input = `const result = str.substr(startIndex, len);`;
    const expected = `const result = str.substring(startIndex, startIndex + len);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });

  it('should not modify code without substr', () => {
    const input = `const result = str.substring(5, 10);`;
    const output = applyTransform(input);
    assert.strictEqual(output, input);
  });

  it('should handle substr on string literals', () => {
    const input = `const result = "hello world".substr(6, 5);`;
    const expected = `const result = "hello world".substring(6, 6 + 5);`;
    const output = applyTransform(input);
    assert.strictEqual(output, expected);
  });
});
