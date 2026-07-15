/**
 * Test suite for fix-escape-unescape.js codemod
 * 
 * Run with: node scripts/codemods/fix-escape-unescape.test.js
 */

const jscodeshift = require('jscodeshift');
const transform = require('./fix-escape-unescape');

/**
 * Helper function to run the transform and compare output
 */
function runTransform(input, expected, description) {
  const fileInfo = { path: 'test.js', source: input };
  const api = { jscodeshift };
  
  const output = transform(fileInfo, api);
  
  // Normalize whitespace for comparison
  const normalizedOutput = output.trim();
  const normalizedExpected = expected.trim();
  
  if (normalizedOutput === normalizedExpected) {
    console.log(`✅ PASS: ${description}`);
    return true;
  } else {
    console.error(`❌ FAIL: ${description}`);
    console.error('Expected:', normalizedExpected);
    console.error('Got:     ', normalizedOutput);
    return false;
  }
}

/**
 * Test cases
 */
const tests = [
  // Test 1: Basic escape() replacement
  {
    description: 'Replace escape() with encodeURIComponent()',
    input: `const encoded = escape(str);`,
    expected: `const encoded = encodeURIComponent(str);`
  },

  // Test 2: Basic unescape() replacement
  {
    description: 'Replace unescape() with decodeURIComponent()',
    input: `const decoded = unescape(encodedStr);`,
    expected: `const decoded = decodeURIComponent(encodedStr);`
  },

  // Test 3: escape() with string literal
  {
    description: 'Replace escape() with string literal argument',
    input: `const encoded = escape("hello world");`,
    expected: `const encoded = encodeURIComponent("hello world");`
  },

  // Test 4: unescape() with string literal
  {
    description: 'Replace unescape() with string literal argument',
    input: `const decoded = unescape("hello%20world");`,
    expected: `const decoded = decodeURIComponent("hello%20world");`
  },

  // Test 5: Chained method calls
  {
    description: 'Replace escape() in chained expression',
    input: `const encoded = escape(str.trim());`,
    expected: `const encoded = encodeURIComponent(str.trim());`
  },

  // Test 6: Nested function calls
  {
    description: 'Replace escape() in nested function call',
    input: `const result = doSomething(escape(data));`,
    expected: `const result = doSomething(encodeURIComponent(data));`
  },

  // Test 7: In conditional expression
  {
    description: 'Replace escape() in conditional',
    input: `if (escape(value) === expected) { }`,
    expected: `if (encodeURIComponent(value) === expected) { }`
  },

  // Test 8: In template literal
  {
    description: 'Replace escape() in template literal',
    input: 'const url = `https://example.com?q=${escape(query)}`;',
    expected: 'const url = `https://example.com?q=${encodeURIComponent(query)}`;'
  },

  // Test 9: Return statement
  {
    description: 'Replace escape() in return statement',
    input: `return escape(data);`,
    expected: `return encodeURIComponent(data);`
  },

  // Test 10: Object property
  {
    description: 'Replace escape() as object property value',
    input: `const obj = { encoded: escape(value) };`,
    expected: `const obj = { encoded: encodeURIComponent(value) };`
  },

  // Test 11: Array element
  {
    description: 'Replace escape() in array',
    input: `const arr = [escape(a), escape(b)];`,
    expected: `const arr = [encodeURIComponent(a), encodeURIComponent(b)];`
  },

  // Test 12: No changes when no escape/unescape
  {
    description: 'No transformation when no escape/unescape present',
    input: `const result = doSomething(data);`,
    expected: `const result = doSomething(data);`
  },

  // Test 13: Don't replace escaped as identifier (not function call)
  {
    description: 'Don\'t replace "escape" when not a function call',
    input: `const escape = true; const value = escape;`,
    expected: `const escape = true; const value = escape;`
  },

  // Test 14: Complex expression
  {
    description: 'Replace escape() in complex expression',
    input: `const url = baseUrl + '?param=' + escape(value) + '&other=' + escape(other);`,
    expected: `const url = baseUrl + '?param=' + encodeURIComponent(value) + '&other=' + encodeURIComponent(other);`
  }
];

/**
 * Run all tests
 */
console.log('Running fix-escape-unescape.js codemod tests...\n');

let passCount = 0;
let failCount = 0;

tests.forEach(test => {
  const passed = runTransform(test.input, test.expected, test.description);
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Test Results: ${passCount} passed, ${failCount} failed`);
console.log('='.repeat(60));

// Exit with error code if any tests failed
if (failCount > 0) {
  process.exit(1);
}
