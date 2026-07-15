/**
 * Codemod to replace deprecated String HTML methods with template literals
 * 
 * Deprecated methods and their HTML equivalents:
 * - anchor(name) → <a name="name">str</a>
 * - big() → <big>str</big>
 * - blink() → <blink>str</blink>
 * - bold() → <b>str</b>
 * - fixed() → <tt>str</tt>
 * - fontcolor(color) → <font color="color">str</font>
 * - fontsize(size) → <font size="size">str</font>
 * - italics() → <i>str</i>
 * - link(url) → <a href="url">str</a>
 * - small() → <small>str</small>
 * - strike() → <strike>str</strike>
 * - sub() → <sub>str</sub>
 * - sup() → <sup>str</sup>
 * 
 * Requirements: 4.5, 4.7
 */

module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);
  const transformCounts = {};

  // HTML method mappings
  const htmlMethods = {
    'anchor': { tag: 'a', attr: 'name', hasArg: true },
    'big': { tag: 'big', hasArg: false },
    'blink': { tag: 'blink', hasArg: false },
    'bold': { tag: 'b', hasArg: false },
    'fixed': { tag: 'tt', hasArg: false },
    'fontcolor': { tag: 'font', attr: 'color', hasArg: true },
    'fontsize': { tag: 'font', attr: 'size', hasArg: true },
    'italics': { tag: 'i', hasArg: false },
    'link': { tag: 'a', attr: 'href', hasArg: true },
    'small': { tag: 'small', hasArg: false },
    'strike': { tag: 'strike', hasArg: false },
    'sub': { tag: 'sub', hasArg: false },
    'sup': { tag: 'sup', hasArg: false }
  };

  // Process each HTML method
  Object.keys(htmlMethods).forEach(methodName => {
    const config = htmlMethods[methodName];
    
    root
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          property: { name: methodName }
        }
      })
      .replaceWith(path => {
        const node = path.value;
        const object = node.callee.object;
        const args = node.arguments;

        // Track transformation
        transformCounts[methodName] = (transformCounts[methodName] || 0) + 1;

        if (config.hasArg) {
          // Methods with arguments (anchor, fontcolor, fontsize, link)
          const arg = args[0];
          
          if (!arg) {
            // No argument provided - use empty string
            console.warn(`  ⚠️  ${methodName}() called without argument, using empty string`);
            return createTemplateWithAttr(j, object, config.tag, config.attr, j.literal(''));
          }
          
          return createTemplateWithAttr(j, object, config.tag, config.attr, arg);
        } else {
          // Methods without arguments (bold, italics, etc.)
          return createSimpleTemplate(j, object, config.tag);
        }
      });
  });

  // Log transformation statistics
  const methodNames = Object.keys(transformCounts);
  if (methodNames.length > 0) {
    const totalTransforms = Object.values(transformCounts).reduce((sum, count) => sum + count, 0);
    console.log(`${fileInfo.path}: Transformed ${totalTransforms} HTML method calls`);
    methodNames.forEach(method => {
      console.log(`  - ${method}(): ${transformCounts[method]} occurrences`);
    });
  }

  return root.toSource();
};

/**
 * Create a template literal for methods without arguments
 * Example: str.bold() → `<b>${str}</b>`
 */
function createSimpleTemplate(j, object, tag) {
  return j.templateLiteral(
    [
      j.templateElement({ raw: `<${tag}>`, cooked: `<${tag}>` }, false),
      j.templateElement({ raw: `</${tag}>`, cooked: `</${tag}>` }, true)
    ],
    [object]
  );
}

/**
 * Create a template literal for methods with attributes
 * Example: str.anchor('name') → `<a name="${name}">${str}</a>`
 */
function createTemplateWithAttr(j, object, tag, attrName, attrValue) {
  return j.templateLiteral(
    [
      j.templateElement({ raw: `<${tag} ${attrName}="`, cooked: `<${tag} ${attrName}="` }, false),
      j.templateElement({ raw: '">', cooked: '">' }, false),
      j.templateElement({ raw: `</${tag}>`, cooked: `</${tag}>` }, true)
    ],
    [attrValue, object]
  );
}

/**
 * Helper to check if an expression is safe for template literal embedding
 * Returns true if the expression needs escaping
 */
function needsEscaping(node) {
  // If it's a literal, we can check the value
  if (node.type === 'Literal' && typeof node.value === 'string') {
    // Check for HTML special characters
    return /[<>"&]/.test(node.value);
  }
  
  // For non-literals (variables, expressions), we can't determine at compile time
  // The original deprecated methods didn't escape either, so we maintain that behavior
  return false;
}
