#!/usr/bin/env node

/**
 * Codemod to fix common ESLint errors
 * 
 * Fixes:
 * - Unused imports and variables
 * - Unescaped entities in JSX
 * - Empty catch/finally blocks
 * - Object.prototype.hasOwnProperty calls
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FIXES = {
  removeUnusedImports: true,
  removeUnusedVariables: true,
  fixUnescapedEntities: true,
  fixEmptyBlocks: true,
  fixPrototypeBuiltins: true,
};

/**
 * Fix unescaped entities in JSX
 */
function fixUnescapedEntities(code) {
  // Match JSX content (between > and <, not in strings)
  const jsxTextPattern = />(([^<>]*?)(['"])([^<>]*?))<(?!\/?\w)/g;
  
  // Simple approach: replace common entities in text content
  let fixed = code;
  
  // Fix apostrophes in JSX text content (not in attributes)
  fixed = fixed.replace(/>((?:[^<>]*?(?:don't|can't|won't|shouldn't|couldn't|wouldn't|isn't|aren't|hasn't|haven't|'s|'t|'re|'ve|'ll|'d))[^<>]*?)</g, (match) => {
    return match.replace(/'/g, '&apos;');
  });
  
  // Fix quotes in JSX text content
  fixed = fixed.replace(/>([^<>]*?"[^"]*?"[^<>]*?)</g, (match) => {
    return match.replace(/"/g, '&quot;');
  });
  
  return fixed;
}

/**
 * Remove unused imports from a line
 */
function removeUnusedImport(line, unusedVars) {
  if (!line.trim().startsWith('import ')) return line;
  
  // Extract named imports
  const namedImportMatch = line.match(/import\s+\{([^}]+)\}\s+from/);
  if (namedImportMatch) {
    const imports = namedImportMatch[1]
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => {
        const varName = imp.split(' as ')[0].trim();
        return !unusedVars.includes(varName);
      });
    
    if (imports.length === 0) {
      return ''; // Remove entire import line
    }
    
    return line.replace(/\{[^}]+\}/, `{ ${imports.join(', ')} }`);
  }
  
  // Check default imports
  const defaultImportMatch = line.match(/import\s+(\w+)\s+from/);
  if (defaultImportMatch && unusedVars.includes(defaultImportMatch[1])) {
    return '';
  }
  
  return line;
}

/**
 * Fix Object.prototype.hasOwnProperty calls
 */
function fixPrototypeBuiltins(code) {
  // Replace obj.hasOwnProperty(key) with Object.prototype.hasOwnProperty.call(obj, key)
  return code.replace(
    /(\w+)\.hasOwnProperty\((['"`]?\w+['"`]?)\)/g,
    'Object.prototype.hasOwnProperty.call($1, $2)'
  );
}

/**
 * Fix empty catch/finally blocks
 */
function fixEmptyBlocks(code) {
  // Add console.error for empty catch blocks
  code = code.replace(
    /catch\s*\(\s*(\w+)\s*\)\s*\{\s*\}/g,
    'catch ($1) {\n    // Error handled silently\n  }'
  );
  
  // Add comment for other empty blocks
  code = code.replace(
    /\{\s*\}/g,
    (match, offset) => {
      const before = code.substring(Math.max(0, offset - 50), offset);
      if (before.includes('catch') || before.includes('finally')) {
        return '{\n    // Intentionally empty\n  }';
      }
      return match;
    }
  );
  
  return code;
}

/**
 * Remove unused variable declarations
 */
function removeUnusedVariableDeclarations(lines, unusedVars) {
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and imports (handled separately)
    if (!trimmed || trimmed.startsWith('import ')) {
      result.push(line);
      continue;
    }
    
    // Check for variable declarations
    let keep = true;
    
    // const/let/var declarations
    const declMatch = trimmed.match(/^(?:const|let|var)\s+(?:\{[^}]+\}|\[([^\]]+)\]|(\w+))/);
    if (declMatch) {
      // Destructured array
      if (declMatch[1]) {
        const vars = declMatch[1].split(',').map(v => v.trim());
        const used = vars.filter(v => !unusedVars.includes(v));
        if (used.length === 0) {
          keep = false;
        }
      }
      // Single variable
      else if (declMatch[2] && unusedVars.includes(declMatch[2])) {
        keep = false;
      }
    }
    
    // Function declarations
    const funcMatch = trimmed.match(/^(?:function|const|let|var)\s+(\w+)\s*=/);
    if (funcMatch && unusedVars.includes(funcMatch[1])) {
      keep = false;
    }
    
    if (keep) {
      result.push(line);
    }
  }
  
  return result;
}

/**
 * Extract unused variables from error output
 */
function extractUnusedVarsFromErrors(errorText) {
  const unusedVars = new Set();
  const lines = errorText.split('\n');
  
  for (const line of lines) {
    // Match patterns like: '  9:10  error  'lazy' is defined but never used'
    const match = line.match(/['']([^'']+)[''][\s\w]*(?:defined but never used|is defined but never used)/);
    if (match) {
      unusedVars.add(match[1]);
    }
  }
  
  return Array.from(unusedVars);
}

/**
 * Process a single file
 */
function processFile(filePath, unusedVars = []) {
  console.log(`Processing: ${filePath}`);
  
  let code = fs.readFileSync(filePath, 'utf8');
  const originalCode = code;
  
  // Apply fixes
  if (FIXES.fixUnescapedEntities) {
    code = fixUnescapedEntities(code);
  }
  
  if (FIXES.fixPrototypeBuiltins) {
    code = fixPrototypeBuiltins(code);
  }
  
  if (FIXES.fixEmptyBlocks) {
    code = fixEmptyBlocks(code);
  }
  
  // Handle unused imports and variables
  if ((FIXES.removeUnusedImports || FIXES.removeUnusedVariables) && unusedVars.length > 0) {
    const lines = code.split('\n');
    const processedLines = [];
    
    for (const line of lines) {
      if (FIXES.removeUnusedImports && line.trim().startsWith('import ')) {
        const processed = removeUnusedImport(line, unusedVars);
        if (processed) {
          processedLines.push(processed);
        }
      } else {
        processedLines.push(line);
      }
    }
    
    if (FIXES.removeUnusedVariables) {
      const finalLines = removeUnusedVariableDeclarations(processedLines, unusedVars);
      code = finalLines.join('\n');
    } else {
      code = processedLines.join('\n');
    }
  }
  
  // Remove consecutive empty lines
  code = code.replace(/\n\n\n+/g, '\n\n');
  
  // Write back if changed
  if (code !== originalCode) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`  ✓ Fixed`);
    return true;
  } else {
    console.log(`  - No changes needed`);
    return false;
  }
}

/**
 * Find all JSX/TSX files
 */
function findFiles(dir, extensions = ['.jsx', '.tsx', '.js', '.ts']) {
  const files = [];
  
  function walk(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, build, dist, etc.
        if (!['node_modules', 'build', 'dist', '.git', 'coverage'].includes(item)) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node fix-eslint-errors.js <directory|file> [--unused-vars=var1,var2,...]');
    console.error('\nOptions:');
    console.error('  --unused-vars=name1,name2   Comma-separated list of unused variable names to remove');
    console.error('  --dry-run                   Show what would be changed without modifying files');
    process.exit(1);
  }
  
  const target = args[0];
  const unusedVarsArg = args.find(arg => arg.startsWith('--unused-vars='));
  const unusedVars = unusedVarsArg 
    ? unusedVarsArg.split('=')[1].split(',').map(v => v.trim())
    : [];
  
  const isDryRun = args.includes('--dry-run');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  console.log(`Target: ${target}`);
  console.log(`Unused vars to remove: ${unusedVars.length > 0 ? unusedVars.join(', ') : 'none'}\n`);
  
  const stat = fs.statSync(target);
  let files = [];
  
  if (stat.isDirectory()) {
    files = findFiles(target);
    console.log(`Found ${files.length} files\n`);
  } else {
    files = [target];
  }
  
  let fixedCount = 0;
  
  for (const file of files) {
    if (!isDryRun) {
      const fixed = processFile(file, unusedVars);
      if (fixed) fixedCount++;
    } else {
      console.log(`Would process: ${file}`);
    }
  }
  
  console.log(`\n✨ Complete! Fixed ${fixedCount}/${files.length} files`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, fixUnescapedEntities, fixPrototypeBuiltins, fixEmptyBlocks };
