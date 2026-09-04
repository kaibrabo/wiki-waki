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
          // Runtime styling in dev avoids needing a generated CSS file.
          disableExtraction: process.env.NODE_ENV === 'development',
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
