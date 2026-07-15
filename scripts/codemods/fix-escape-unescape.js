/**
 * Codemod to replace deprecated escape() and unescape() with modern alternatives
 * 
 * Rules:
 * - escape() → encodeURIComponent()
 * - unescape() → decodeURIComponent()
 * 
 * Note: escape()/unescape() and encodeURIComponent()/decodeURIComponent() are not
 * 100% equivalent. The main differences:
 * - escape() doesn't encode: @ * _ + - . /
 * - encodeURIComponent() encodes everything except: A-Z a-z 0-9 - _ . ! ~ * ' ( )
 * 
 * For URI encoding, encodeURIComponent() is the modern standard and recommended replacement.
 * If the original code relies on specific escape() behavior, manual review may be needed.
 * 
 * Requirements: 4.6, 4.8
 */

module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  let escapeCount = 0;
  let unescapeCount = 0;
  let needsManualReview = false;

  // Find all CallExpression nodes where callee is an Identifier named 'escape'
  root
    .find(j.CallExpression, {
      callee: {
        type: 'Identifier',
        name: 'escape'
      }
    })
    .replaceWith(path => {
      const node = path.value;
      escapeCount++;

      // Check if this might need manual review
      // If escape() is used in complex expressions or with unusual arguments
      if (node.arguments.length === 0 || node.arguments.length > 1) {
        needsManualReview = true;
      }

      // Replace escape() with encodeURIComponent()
      return j.callExpression(
        j.identifier('encodeURIComponent'),
        node.arguments
      );
    });

  // Find all CallExpression nodes where callee is an Identifier named 'unescape'
  root
    .find(j.CallExpression, {
      callee: {
        type: 'Identifier',
        name: 'unescape'
      }
    })
    .replaceWith(path => {
      const node = path.value;
      unescapeCount++;

      // Check if this might need manual review
      if (node.arguments.length === 0 || node.arguments.length > 1) {
        needsManualReview = true;
      }

      // Replace unescape() with decodeURIComponent()
      return j.callExpression(
        j.identifier('decodeURIComponent'),
        node.arguments
      );
    });

  // Log transformation statistics
  const totalTransforms = escapeCount + unescapeCount;
  if (totalTransforms > 0) {
    console.log(`${fileInfo.path}: Transformed ${escapeCount} escape() and ${unescapeCount} unescape() calls`);
    
    if (needsManualReview) {
      console.warn(`  ⚠️  Manual review recommended: Verify encoding behavior matches expectations`);
    }
  }

  return root.toSource();
};

/**
 * Helper function to add a comment indicating manual review is needed
 * (Note: This is complex to implement with jscodeshift, so we just log warnings)
 */
function shouldFlagForReview(node) {
  // Cases that might need review:
  // 1. No arguments or multiple arguments
  // 2. Using escape/unescape on data that might contain special characters
  
  if (!node.arguments || node.arguments.length !== 1) {
    return true;
  }

  return false;
}
