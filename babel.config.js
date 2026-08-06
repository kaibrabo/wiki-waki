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
    ],
  };
};
