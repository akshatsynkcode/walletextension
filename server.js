const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { mnemonicGenerate, mnemonicValidate } = require('@polkadot/util-crypto');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const wsProvider = new WsProvider('wss://contract-node.finloge.com'); // Private node
let api;

// Initialize Polkadot API connection
const initApi = async () => {
  api = await ApiPromise.create({ provider: wsProvider });
  console.log('Connected to Substrate node');
};

// Format balance to human-readable format with 3 decimal places
const formatBalance = (balance) => {
  const DECIMALS = 12;
  const divisor = BigInt(Math.pow(10, DECIMALS));
  const balanceNumber = BigInt(balance);
  const formattedBalance = (Number(balanceNumber) / Number(divisor)).toFixed(3);
  return `AED ${formattedBalance}`;
};

// Fetch balance function
const fetchBalance = async (address) => {
  try {
    const { data: { free: balance } } = await api.query.system.account(address);
    return formatBalance(balance.toString()); // Format balance and return
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
};

// Function to get the account address from mnemonic
const getAddressFromMnemonic = (mnemonic) => {
  if (!mnemonicValidate(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }

  const keyring = new Keyring({ type: 'sr25519' });
  const account = keyring.addFromUri(mnemonic);

  return account;
};

// Event listener for balance changes
const watchBalance = async (address) => {
  let previousBalance = await fetchBalance(address);

  api.query.system.account(address, ({ data: { free: newBalance } }) => {
    const newBalanceFormatted = formatBalance(newBalance.toString());
    if (newBalanceFormatted !== previousBalance) {
      console.log(`Balance updated: ${newBalanceFormatted}`);
      previousBalance = newBalanceFormatted;
    }
  });
};

// Endpoint to create a new wallet (generate mnemonic and address)
app.post('/create-wallet', async (req, res) => {
  try {
    const mnemonic = mnemonicGenerate(); // Generate a new 12-word mnemonic
    const account = getAddressFromMnemonic(mnemonic);
    const address = account.address;

    const balance = await fetchBalance(address);
    await watchBalance(address);

    res.json({ mnemonic, address, balance });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// Endpoint to import an existing wallet using a mnemonic
app.post('/import-wallet', async (req, res) => {
  const { mnemonic } = req.body;

  if (!mnemonic) {
    return res.status(400).json({ error: 'Mnemonic is required' });
  }

  try {
    const account = getAddressFromMnemonic(mnemonic);
    const address = account.address;

    const balance = await fetchBalance(address);
    await watchBalance(address);

    res.json({ address, balance });
  } catch (error) {
    console.error('Error importing wallet:', error);
    res.status(500).json({ error: 'Failed to import wallet' });
  }
});

// Endpoint to check balance of a specific address
app.get('/check-balance/:address', async (req, res) => {
  const { address } = req.params;

  try {
    const balance = await fetchBalance(address);
    if (balance === null) {
      res.status(404).json({ error: 'Address not found or balance could not be fetched' });
    } else {
      res.json({ address, balance });
    }
  } catch (error) {
    console.error('Error fetching balance for address:', error);
    res.status(500).json({ error: 'Failed to fetch balance for address' });
  }
});

// Endpoint to send funds
app.post('/send-funds', async (req, res) => {
  const { mnemonic, recipientAddress, amount } = req.body;

  if (!mnemonic || !recipientAddress || !amount) {
    return res.status(400).json({ error: 'Mnemonic, recipient address, and amount are required' });
  }

  try {
    const sender = getAddressFromMnemonic(mnemonic);
    
    // Convert amount to Plancks (assuming it's in DOT format)
    const amountInPlancks = BigInt(amount * 1e12);

    // Create and sign the transaction
    const transfer = api.tx.balances.transfer(recipientAddress, amountInPlancks);

    const unsub = await transfer.signAndSend(sender, (result) => {
      if (result.status.isInBlock) {
        console.log(`Transaction included in block ${result.status.asInBlock}`);
        res.json({ message: 'Funds sent successfully!' });
        unsub();
      } else if (result.status.isFinalized) {
        console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
      }
    });
  } catch (error) {
    console.error('Error sending funds:', error);
    res.status(500).json({ error: 'Failed to send funds' });
  }
});

app.listen(3000, async () => {
  await initApi();
  console.log('Server is running on port 3000');
});
