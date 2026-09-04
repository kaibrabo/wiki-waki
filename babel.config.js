module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          // Extraction is DISABLED everywhere (not just dev). Tamagui's compile-time
          // style extraction drops some CSS-logical shorthands (justify/items/text)
          // in production, so layouts that relied on them rendered left-aligned in
          // Release while looking correct in dev. Runtime styling makes Release match
          // dev. The perf cost is negligible for an app this size.
          disableExtraction: true,
        },
      ],
      // Dev-only call tracer. Injects a __DEV__/__TRACE__-guarded console.log at
      // the top of every function in src/. DISABLED: it mis-transforms some
      // functions (arrow bodies / object returns), producing broken code that
      // failed the dev bundle and is suspected of corrupting the Release build
      // (alarms stopped scheduling). Re-enable only after fixing the plugin.
      // './babel-plugin-trace-calls.js',
    ],
  };
};
