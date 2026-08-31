// Runtime switch for the dev-only call tracer (see babel-plugin-trace-calls.js).
//
// The Babel plugin injects, at the top of every function under src/:
//   if (__DEV__ && globalThis.__TRACE__) console.log('[trace] <name>', { ...args });
// So tracing is silent until you flip it on here (or set globalThis.__TRACE__ in
// a debugger). It is compiled out of production entirely.

export function setTrace(on: boolean): void {
  (globalThis as { __TRACE__?: boolean }).__TRACE__ = on;
  if (__DEV__) console.log(`[trace] ${on ? 'enabled' : 'disabled'}`);
}

export function isTracing(): boolean {
  return !!(globalThis as { __TRACE__?: boolean }).__TRACE__;
}
