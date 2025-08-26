const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { override, addWebpackPlugin } = require('customize-cra');

// Bundle analyzer configuration
const addBundleAnalyzer = () => (config) => {
  if (process.env.ANALYZE) {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        analyzerHost: 'localhost',
        analyzerPort: 8888,
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
        logLevel: 'info'
      })
    );
  }
  return config;
};

// Webpack optimizations
const addOptimizations = () => (config) => {
  // Enable tree shaking
  config.optimization = {
    ...config.optimization,
    usedExports: true,
    sideEffects: false,
    
    // Split chunks for better caching
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        router: {
          test: /[\\/]node_modules[\\/]react-router-dom[\\/]/,
          name: 'router',
          chunks: 'all',
          priority: 15
        }
      }
    }
  };

  // Add performance hints
  config.performance = {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 512000, // 500kb
    maxAssetSize: 512000 // 500kb
  };

  return config;
};

// Compression and minification
const addCompressionOptimizations = () => (config) => {
  if (process.env.NODE_ENV === 'production') {
    // Enable gzip compression
    const CompressionPlugin = require('compression-webpack-plugin');
    
    config.plugins.push(
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      })
    );

    // Optimize CSS
    const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
    config.optimization.minimizer.push(
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          map: {
            inline: false,
            annotation: true
          }
        }
      })
    );
  }

  return config;
};

// Service worker for caching
const addServiceWorker = () => (config) => {
  if (process.env.NODE_ENV === 'production') {
    const { GenerateSW } = require('workbox-webpack-plugin');
    
    config.plugins.push(
      new GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      })
    );
  }

  return config;
};

module.exports = override(
  addBundleAnalyzer(),
  addOptimizations(),
  addCompressionOptimizations(),
  addServiceWorker()
);