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

## Permissions

The extension requests the following permissions:

- **Storage**: To save wallet information locally, including wallet addresses and balances.
- **Active Tab**: To monitor wallet interactions across various tabs and ensure the correct dApp connection.
- **Scripting**: To inject content scripts for interacting with dApps.
- **Tabs**: To manage and monitor multiple browser tabs during wallet interactions.
- **Web Navigation**: To navigate to dApps and handle interactions with blockchain-enabled websites.

## How to Install

1. Download the latest version of the **Dubai Customs Wallet Extension**.
2. Go to `chrome://extensions/` in your Chrome browser.
3. Enable **Developer Mode**.
4. Click on **Load Unpacked** and select the `dist` folder of the extension.
5. The extension will be installed and available in your browser.

## How to Use

1. **Create a Wallet**: Use the "Create Wallet" option to generate a new mnemonic phrase and Polkadot address.
2. **Import a Wallet**: If you already have a wallet, use the "Import Wallet" feature to restore it.
3. **Connect to dApps**: Use the wallet extension to connect to Polkadot.js and other dApps by approving connection requests.
4. **Send Funds**: Enter the recipient's address and the amount of funds you want to transfer securely through the blockchain.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.

