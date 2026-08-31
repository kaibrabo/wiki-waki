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
      // the top of every function in src/; compiled out of production. Toggle via
      // setTrace() in src/lib/trace.ts.
      './babel-plugin-trace-calls.js',
    ],
  };
};
