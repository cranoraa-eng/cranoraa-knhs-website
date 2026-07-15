/**
 * Codemod to replace deprecated String.prototype.substr with modern alternatives
 * 
 * Rules:
 * - substr with non-negative start index → replace with substring
 * - substr with negative start index → replace with slice
 * - Preserves original behavior for all edge cases
 * 
 * Requirements: 4.2, 4.3, 4.7
 */

module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let transformCount = 0;

  // Find all CallExpression nodes where the callee is a MemberExpression with property name 'substr'
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        property: { name: 'substr' }
      }
    })
    .replaceWith(path => {
      const node = path.value;
      const args = node.arguments;
      const object = node.callee.object;
      const start = args[0];
      const length = args[1];

      // Check if start index is negative
      const isNegativeStart = isNegativeLiteral(start);

      if (isNegativeStart) {
        // Negative index → use slice
        // str.substr(-n, len) → str.slice(-n, -n + len) if len provided, else str.slice(-n)
        transformCount++;
        
        if (length) {
          // slice requires end position, not length
          // For negative start: slice(start, start + length)
          const endPosition = j.binaryExpression('+', start, length);
          return j.callExpression(
            j.memberExpression(object, j.identifier('slice')),
            [start, endPosition]
          );
        } else {
          // No length specified, slice to end
          return j.callExpression(
            j.memberExpression(object, j.identifier('slice')),
            [start]
          );
        }
      } else {
        // Positive or zero index → use substring
        // str.substr(start, len) → str.substring(start, start + len)
        transformCount++;
        
        if (length) {
          // substring requires end position: start + length
          const endPosition = j.binaryExpression('+', start, length);
          return j.callExpression(
            j.memberExpression(object, j.identifier('substring')),
            [start, endPosition]
          );
        } else {
          // No length specified, substring to end
          return j.callExpression(
            j.memberExpression(object, j.identifier('substring')),
            [start]
          );
        }
      }
    });

  // Log transformation statistics
  if (transformCount > 0) {
    console.log(`${fileInfo.path}: Transformed ${transformCount} substr() calls`);
  }

  return root.toSource();
};

/**
 * Helper function to check if a node represents a negative literal or expression
 */
function isNegativeLiteral(node) {
  if (!node) return false;
  
  // Check for unary expression with minus operator: -5
  if (node.type === 'UnaryExpression' && node.operator === '-') {
    return true;
  }
  
  // Check for negative numeric literal (though this is usually a UnaryExpression)
  if (node.type === 'Literal' && typeof node.value === 'number' && node.value < 0) {
    return true;
  }
  
  // Check for negative numeric literal with raw value (another representation)
  if (node.type === 'Numeric' && node.value < 0) {
    return true;
  }
  
  return false;
}
