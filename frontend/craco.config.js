// frontend/craco.config.js
module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
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

      // Excluir archivos grandes del procesamiento (h5, bin, etc.)
      webpackConfig.module.rules.push({
        test: /\.(h5|hdf5|bin)$/,
        type: 'asset/resource',
        generator: {
          emit: false, // No emitir estos archivos
        },
      });

      // Aumentar límites de tamaño para archivos
      webpackConfig.performance = {
        ...webpackConfig.performance,
        maxAssetSize: 10000000, // 10MB
        maxEntrypointSize: 10000000, // 10MB
        hints: 'warning', // Cambiar a warning en lugar de error
      };

      // Configurar límites de parsing para evitar errores de buffer
      if (webpackConfig.module) {
        webpackConfig.module.parser = {
          ...webpackConfig.module.parser,
          javascript: {
            ...webpackConfig.module.parser?.javascript,
            maxModuleSize: 10000000, // 10MB
          },
        };
      }

      // Optimizar el manejo de archivos grandes
      if (webpackConfig.optimization) {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            ...webpackConfig.optimization.splitChunks,
            maxSize: 10000000, // 10MB
          },
        };
      }

      return webpackConfig;
    },
  },
};
