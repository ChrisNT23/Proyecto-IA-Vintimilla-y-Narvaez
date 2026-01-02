// frontend/craco.config.js
module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.ignoreWarnings = [
          function ignoreSourceMapWarnings(warning) {
            return (
              warning.message &&
              warning.message.includes("Failed to parse source map") &&
              warning.message.includes("face-api.js")
            );
          },
        ];
        return webpackConfig;
      },
    },
  };
  