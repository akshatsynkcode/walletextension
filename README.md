# Dubai Customs Wallet Extension 
![Dubai Customs Wallet Icon](./src/icons/icon128.png)

## Overview

The **Dubai Customs Wallet Extension** is a Chrome extension designed to interact with the Dubai Customs Blockchain. It allows users to create, import, and manage their Polkadot-based wallets, send and receive funds, and connect with decentralized applications (dApps) seamlessly. The extension offers a secure and user-friendly interface for handling blockchain transactions and connecting to blockchain-based services.

## Features

- **Create or Import Wallet**: Users can create a new wallet or import an existing wallet using a mnemonic phrase.
- **Send and Receive Funds**: Securely send and receive funds via the Dubai Customs Blockchain.
- **dApp Integration**: Seamless interaction with decentralized applications (dApps) such as Polkadot.js and custom dApps.
- **Balance Monitoring**: Real-time balance updates for your connected wallet.
- **Secure Storage**: Wallet information is securely stored using local browser storage.
- **Lock and Unlock Wallet**: Users can lock the wallet for additional security and unlock it with a password.

## How to Install in Firefox

1. Clone the repository and navigate to the root directory.
2. Run `npm install` to install all dependencies.
3. After the installation is complete, build the extension with `npm run build:firefox`.
4. A `dist` folder will be generated, and the `manifest.json` file will be inside that folder.
5. Open `about:debugging#/runtime/this-firefox` in your Firefox browser.
6. Click on **Load Temporary Add-on** and select the `manifest.json` file inside the `dist` folder.
7. To Check on how to submit it firstly go to the `dist` folder created and inside that please select all the files and folders with the help of ctrl+A or select all and then create a compressed zip of that and then upload it in the "about:debugging#/runtime/this-firefox" add on page


## Permissions

The extension requests the following permissions:

- **Storage**: To save wallet information locally, including wallet addresses and balances.
- **Tabs**: To manage and monitor multiple browser tabs during wallet interactions.

## How to Install On Windows
1. change the package.json change the build command with "build" : "node build-manifest.js chrome && cross-env TARGET=chrome webpack --config webpack.config.js" ,
2. npm install --save-dev cross-env


## How to Install in Chrome

1. Download the latest version of the **Dubai Customs Wallet Extension**.
2. Open `chrome://extensions/` in your Chrome browser.
3. Enable **Developer Mode**.
4. Click on **Load Unpacked** and select the `dist` folder of the extension.
5. The extension will be installed and available in your browser.

## How to Use

1. **Login to the wallet**: Use the "Login" option to dive inside the World of dubai customs.
3. **Connect to dApps**: Use the wallet extension to connect to all the dubai customs applications by approving connection requests.
4. **View Funds**: You can View all the transaction history and funds inside the wallet of that particular user.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
