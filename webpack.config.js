const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/js/background.js',
    content: './src/js/content.js',
    welcome: './scripts/welcome.js',
    login: './scripts/login.js',
    lock: './scripts/lock.js',
    popup: './scripts/popup.js',
    profile: './scripts/profile.js',
    popupLogin: './scripts/popup-login.js' // Added the popup login script entry
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
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
  plugins: [
    new HtmlWebpackPlugin({
      template: './components/welcome.html',
      filename: 'welcome.html',
      chunks: ['welcome']
    }),
    new HtmlWebpackPlugin({
      template: './components/login.html',
      filename: 'login.html',
      chunks: ['login']
    }),
    new HtmlWebpackPlugin({
      template: './components/lock.html',
      filename: 'lock.html',
      chunks: ['lock']
    }),
    new HtmlWebpackPlugin({
      template: './components/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: './components/profile.html',
      filename: 'profile.html',
      chunks: ['profile']
    }),
    new HtmlWebpackPlugin({
      template: './components/popup-login.html', // Added popup-login.html
      filename: 'popup-login.html',
      chunks: ['popupLogin']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json', to: 'manifest.json' },
        { from: './src/icons', to: 'icons' }
      ]
    })
  ]
};
