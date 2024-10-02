const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/js/background.js',
    content: './src/js/content.js',
    welcome: './scripts/welcome.js',
    login: './scripts/login.js',
    popup: './scripts/popup.js',
    profile: './scripts/profile.js',
    popupLogin: './scripts/popup-login.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/' // Automatically clean the dist folder before each build
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  optimization: {
    minimize: true, // Enable minimization
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs
          drop_debugger: true // Remove debugger statements
        },
        output: {
          comments: false // Remove comments
        }
      }
    })],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './components/welcome.html',
      filename: 'welcome.html',
      chunks: ['welcome', 'vendors'] // Include vendor chunk
    }),
    new HtmlWebpackPlugin({
      template: './components/login.html',
      filename: 'login.html',
      chunks: ['login', 'vendors'] // Include vendor chunk
    }),
    new HtmlWebpackPlugin({
      template: './components/popup.html',
      filename: 'popup.html',
      chunks: ['popup', 'vendors'] // Include vendor chunk
    }),
    new HtmlWebpackPlugin({
      template: './components/profile.html',
      filename: 'profile.html',
      chunks: ['profile', 'vendors'] // Include vendor chunk
    }),
    new HtmlWebpackPlugin({
      template: './components/popup-login.html',
      filename: 'popup-login.html',
      chunks: ['popupLogin', 'vendors'] // Include vendor chunk
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json', to: 'manifest.json' },
        { from: './src/icons', to: 'icons' },
        { from: './src/css', to: 'css' },
        { from: './src/js', to: 'js' }
      ]
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false
    })
  ],
  performance: {
    hints: 'warning', // Set hints to warn if assets exceed size limits
    maxAssetSize: 500000, // Set asset size limit
    maxEntrypointSize: 500000 // Set entry point size limit
  }
};
