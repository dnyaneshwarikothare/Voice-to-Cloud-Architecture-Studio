const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const globals = new Set([
  'window', 'document', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'fetch', 'navigator', 'localStorage', 'sessionStorage', 'URL', 'Blob', 'FileReader',
  'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON',
  'RegExp', 'Map', 'Set', 'Error', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'decodeURIComponent',
  'encodeURIComponent', 'requestAnimationFrame', 'cancelAnimationFrame', 'btoa', 'atob',
  'React', 'process', 'SpeechRecognition', 'webkitSpeechRecognition', 'Image', 'XMLSerializer', 'alert', 'DOMParser'
]);

let totalErrors = 0;

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (err) {
    console.error(`Syntax error parsing ${filePath}: ${err.message}`);
    totalErrors++;
    return;
  }

  traverse(ast, {
    Identifier(astPath) {
      const name = astPath.node.name;
      const parent = astPath.parent;

      // Property in object: { key: value }
      if (parent.type === 'Property' || parent.type === 'ObjectProperty') {
        if (parent.key === astPath.node && !parent.computed) return;
      }
      // MetaProperty: import.meta
      if (parent.type === 'MetaProperty') return;
      // Member expression: obj.prop or obj?.prop
      if (parent.type === 'MemberExpression' || parent.type === 'OptionalMemberExpression') {
        if (parent.property === astPath.node && !parent.computed) return;
      }
      // Function declaration/expression name or param
      if (parent.type === 'FunctionDeclaration' && parent.id === astPath.node) return;
      if (parent.type === 'FunctionExpression' && parent.id === astPath.node) return;
      if (parent.type === 'ClassDeclaration' && parent.id === astPath.node) return;
      if (parent.type === 'ClassMethod' && parent.key === astPath.node) return;
      if (parent.type === 'VariableDeclarator' && parent.id === astPath.node) return;
      if (parent.type === 'ImportSpecifier' || parent.type === 'ImportDefaultSpecifier' || parent.type === 'ImportNamespaceSpecifier') return;
      if (parent.type === 'CatchClause' && parent.param === astPath.node) return;

      if (globals.has(name)) return;

      if (!astPath.scope.hasBinding(name)) {
        console.error(`UNDEFINED IDENTIFIER in ${filePath}:${astPath.node.loc?.start.line}:${astPath.node.loc?.start.column} "${name}"`);
        totalErrors++;
      }
    },
    JSXOpeningElement(astPath) {
      const nameNode = astPath.node.name;
      if (nameNode.type === 'JSXIdentifier') {
        const name = nameNode.name;
        // Standard HTML/SVG tags are lowercase
        if (name[0] === name[0].toLowerCase()) return;
        if (globals.has(name)) return;
        if (!astPath.scope.hasBinding(name)) {
          console.error(`UNDEFINED JSX COMPONENT in ${filePath}:${nameNode.loc?.start.line}:${nameNode.loc?.start.column} <${name}>`);
          totalErrors++;
        }
      }
    }
  });
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist') walk(full);
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      checkFile(full);
    }
  }
}

walk('src');
console.log(`\nScan complete. Total real errors found: ${totalErrors}`);
process.exit(totalErrors > 0 ? 1 : 0);
