const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    content: './src/content.js',
    welcome: './scripts/welcome.js',
    onboarding: './scripts/onboarding.js',
    createwallet: './scripts/createwallet.js',
    importwallet: './scripts/importwallet.js',
    password: './scripts/password.js',
    lock: './scripts/lock.js',
    popup: './scripts/popup.js',
    connectWalletPopup: './scripts/connectWalletPopup.js',
    resetpassword: './scripts/resetpassword.js',
    profile: './scripts/profile.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/dist/',
  },
  watch: true,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
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
      template: './components/onboarding.html',
      filename: 'onboarding.html',
      chunks: ['onboarding']
    }),
    new HtmlWebpackPlugin({
      template: './components/createWallet.html',
      filename: 'createWallet.html',
      chunks: ['createwallet']
    }),
    new HtmlWebpackPlugin({
      template: './components/importWallet.html',
      filename: 'importWallet.html',
      chunks: ['importwallet']
    }),
    new HtmlWebpackPlugin({
      template: './components/password.html',
      filename: 'password.html',
      chunks: ['password']
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
      template: './components/connectWalletPopup.html',
      filename: 'connectWalletPopup.html',
      chunks: ['connectWalletPopup']
    }),
    new HtmlWebpackPlugin({
      template: './components/resetpassword.html',
      filename: 'resetpassword.html',
      chunks: ['resetpassword']
    }),
    new HtmlWebpackPlugin({
      template: './components/profile.html',
      filename: 'profile.html',
      chunks: ['profile']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/manifest.json', to: 'manifest.json' },
        { from: './src/icons', to: 'icons' }
      ]
    })
  ]
};
