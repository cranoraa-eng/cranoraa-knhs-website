/**
 * Sample file for testing the fix-escape-unescape codemod
 * 
 * This file contains examples of escape() and unescape() usage
 * that should be transformed to encodeURIComponent() and decodeURIComponent()
 */

// Example 1: Basic escape usage
function encodeQueryParam(value) {
  return encodeURIComponent(value);
}

// Example 2: Basic unescape usage
function decodeQueryParam(encodedValue) {
  return decodeURIComponent(encodedValue);
}

// Example 3: URL construction with escape
function buildUrl(baseUrl, params) {
  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  return `${baseUrl}?${queryString}`;
}

// Example 4: Decoding URL parameters
function parseUrlParam(encodedParam) {
  try {
    return decodeURIComponent(encodedParam);
  } catch (error) {
    console.error('Failed to decode parameter:', error);
    return encodedParam;
  }
}

// Example 5: Nested usage
function processData(data) {
  const encoded = encodeURIComponent(data.trim());
  const doubled = encodeURIComponent(encodeURIComponent(data));
  return { encoded, doubled };
}

// Example 6: Mixed with other string operations
const url = `https://example.com/search?q=${encodeURIComponent(searchTerm)}&lang=en`;

// Example 7: In object literals
const config = {
  encode: (str) => encodeURIComponent(str),
  decode: (str) => decodeURIComponent(str),
};

// Example 8: Array map
const encodedValues = values.map(v => encodeURIComponent(v));
const decodedValues = encodedValues.map(v => decodeURIComponent(v));
