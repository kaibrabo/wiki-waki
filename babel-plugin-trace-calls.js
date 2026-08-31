// Dev-only call tracing. Instruments every function defined under `src/` to log
// its name and argument values on entry. Guarded three ways so it never affects
// production and isn't a firehose by default:
//   1. Only files under `/src/` are touched.
//   2. The injected log is wrapped in `if (__DEV__ && globalThis.__TRACE__)`, so
//      it's dead-code-eliminated from production (__DEV__ === false) and stays
//      silent in dev until you flip the toggle.
//   3. Turn it on at runtime with `setTrace(true)` from `src/lib/trace.ts`.
module.exports = function traceCalls({ types: t }) {
  const VISITED = new WeakSet();

  function functionName(path) {
    const node = path.node;
    if (node.id && node.id.name) return node.id.name;
    if ((t.isObjectMethod(node) || t.isClassMethod(node)) && node.key) {
      return node.key.name || node.key.value || 'method';
    }
    const parent = path.parent;
    if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) return parent.id.name;
    if (t.isObjectProperty(parent) && parent.key) return parent.key.name || parent.key.value;
    if (t.isAssignmentExpression(parent) && t.isIdentifier(parent.left)) return parent.left.name;
    if (t.isClassProperty(parent) && parent.key) return parent.key.name;
    return 'anonymous';
  }

  function paramBindingNames(node) {
    const names = [];
    for (const param of node.params) {
      try {
        Object.keys(t.getBindingIdentifiers(param)).forEach((n) => names.push(n));
      } catch (e) {
        // pattern we can't read — skip it
      }
    }
    return names;
  }

  return {
    name: 'trace-calls',
    visitor: {
      'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ObjectMethod|ClassMethod'(
        path,
        state,
      ) {
        const filename = state.file.opts.filename || '';
        if (!filename.includes('/src/')) return;
        if (VISITED.has(path.node)) return;
        VISITED.add(path.node);

        // Ensure a block body so we can prepend a statement.
        let body = path.get('body');
        if (!body.isBlockStatement()) {
          body.replaceWith(t.blockStatement([t.returnStatement(body.node)]));
          body = path.get('body');
        }

        const name = functionName(path);
        const props = paramBindingNames(path.node).map((n) =>
          t.objectProperty(t.identifier(n), t.identifier(n), false, true),
        );
        const argsObject = t.objectExpression(props);

        // if (typeof __DEV__ !== 'undefined' && __DEV__ && globalThis.__TRACE__)
        //   console.log('[trace] <name>', { ...args });
        const guard = t.logicalExpression(
          '&&',
          t.logicalExpression(
            '&&',
            t.binaryExpression(
              '!==',
              t.unaryExpression('typeof', t.identifier('__DEV__')),
              t.stringLiteral('undefined'),
            ),
            t.identifier('__DEV__'),
          ),
          t.memberExpression(t.identifier('globalThis'), t.identifier('__TRACE__')),
        );

        const logStatement = t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.identifier('console'), t.identifier('log')),
            [t.stringLiteral(`[trace] ${name}`), argsObject],
          ),
        );

        body.node.body.unshift(t.ifStatement(guard, t.blockStatement([logStatement])));
      },
    },
  };
};
