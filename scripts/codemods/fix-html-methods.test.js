/**
 * Tests for fix-html-methods codemod
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const jscodeshift = require('jscodeshift');
const transform = require('./fix-html-methods');

function applyTransform(source) {
  const fileInfo = { path: 'test.js', source };
  const api = { jscodeshift };
  return transform(fileInfo, api);
}

describe('fix-html-methods codemod', () => {
  describe('Methods without arguments', () => {
    it('should transform bold()', () => {
      const input = `const text = "hello".bold();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<b>${"hello"}</b>`;');
    });

    it('should transform italics()', () => {
      const input = `const text = "hello".italics();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<i>${"hello"}</i>`;');
    });

    it('should transform big()', () => {
      const input = `const text = str.big();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<big>${str}</big>`;');
    });

    it('should transform blink()', () => {
      const input = `const text = str.blink();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<blink>${str}</blink>`;');
    });

    it('should transform fixed()', () => {
      const input = `const text = str.fixed();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<tt>${str}</tt>`;');
    });

    it('should transform small()', () => {
      const input = `const text = str.small();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<small>${str}</small>`;');
    });

    it('should transform strike()', () => {
      const input = `const text = str.strike();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<strike>${str}</strike>`;');
    });

    it('should transform sub()', () => {
      const input = `const text = str.sub();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<sub>${str}</sub>`;');
    });

    it('should transform sup()', () => {
      const input = `const text = str.sup();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<sup>${str}</sup>`;');
    });
  });

  describe('Methods with arguments', () => {
    it('should transform anchor() with string literal', () => {
      const input = `const text = "hello".anchor("section1");`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<a name="${"section1"}">${"hello"}</a>`;');
    });

    it('should transform anchor() with variable', () => {
      const input = `const text = str.anchor(name);`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<a name="${name}">${str}</a>`;');
    });

    it('should transform link() with string literal', () => {
      const input = `const text = "click here".link("http://example.com");`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<a href="${"http://example.com"}">${"click here"}</a>`;');
    });

    it('should transform link() with variable', () => {
      const input = `const text = linkText.link(url);`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<a href="${url}">${linkText}</a>`;');
    });

    it('should transform fontcolor() with color name', () => {
      const input = `const text = "red text".fontcolor("red");`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<font color="${"red"}">${"red text"}</font>`;');
    });

    it('should transform fontcolor() with hex color', () => {
      const input = `const text = str.fontcolor("#FF0000");`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<font color="${"#FF0000"}">${str}</font>`;');
    });

    it('should transform fontsize() with number', () => {
      const input = `const text = "big".fontsize(7);`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<font size="${7}">${"big"}</font>`;');
    });

    it('should transform fontsize() with string', () => {
      const input = `const text = str.fontsize("5");`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<font size="${"5"}">${str}</font>`;');
    });
  });

  describe('Complex expressions', () => {
    it('should transform method call on variable', () => {
      const input = `const formatted = userName.bold();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const formatted = `<b>${userName}</b>`;');
    });

    it('should transform method call on expression', () => {
      const input = `const text = (firstName + " " + lastName).bold();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<b>${(firstName + " " + lastName)}</b>`;');
    });

    it('should transform multiple method calls in same file', () => {
      const input = `
const bold = str.bold();
const italic = str.italics();
const link = str.link(url);
      `.trim();
      const output = applyTransform(input);
      assert.ok(output.includes('`<b>${str}</b>`'));
      assert.ok(output.includes('`<i>${str}</i>`'));
      assert.ok(output.includes('`<a href="${url}">${str}</a>`'));
    });

    it('should handle method call in template literal', () => {
      const input = `const html = \`<div>\${name.bold()}</div>\`;`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const html = `<div>${`<b>${name}</b>`}</div>`;');
    });

    it('should handle method call in function return', () => {
      const input = `
function formatName(name) {
  return name.bold();
}
      `.trim();
      const output = applyTransform(input);
      assert.ok(output.includes('return `<b>${name}</b>`;'));
    });

    it('should handle method call in array', () => {
      const input = `const items = [str1.bold(), str2.italics()];`;
      const output = applyTransform(input);
      assert.ok(output.includes('`<b>${str1}</b>`'));
      assert.ok(output.includes('`<i>${str2}</i>`'));
    });

    it('should handle method call in object property', () => {
      const input = `const obj = { formatted: text.bold() };`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const obj = { formatted: `<b>${text}</b>` };');
    });

    it('should handle chained property access', () => {
      const input = `const text = user.profile.name.bold();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<b>${user.profile.name}</b>`;');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      const input = `const text = "".bold();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const text = `<b>${""}</b>`;');
    });

    it('should preserve other method calls', () => {
      const input = `const upper = str.toUpperCase();`;
      const output = applyTransform(input);
      assert.strictEqual(output, 'const upper = str.toUpperCase();');
    });

    it('should handle method call with computed property', () => {
      const input = `const text = str["bold"]();`;
      const output = applyTransform(input);
      // Computed properties are not matched by our transformation
      assert.strictEqual(output, 'const text = str["bold"]();');
    });
  });

  describe('No transformations needed', () => {
    it('should return unchanged code when no deprecated methods found', () => {
      const input = `const text = "hello".toUpperCase();`;
      const output = applyTransform(input);
      assert.strictEqual(output, input);
    });

    it('should handle files with no string methods', () => {
      const input = `const x = 42; const y = x + 10;`;
      const output = applyTransform(input);
      assert.strictEqual(output, input);
    });
  });
});
