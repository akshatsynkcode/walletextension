console.log("Content script running...");
window.addEventListener('message', function(event) {
    if (event.source !== window) return;

    // Check the action and send it to the background script
    if (event.data.action === 'connect_wallet') {
        chrome.runtime.sendMessage({ action: 'connect_wallet' }, function(response) {
            console.log("Message sent:", response);
        });
    }
    else if(event.data.action === 'check_extension') {
        chrome.runtime.sendMessage({ action: 'check_extension' }, function(response) {
            console.log("Message sent:", response);
            // Sending back the response to the webpage
            window.postMessage({ extensionStatus: response.status }, '*');
        });
    }
});

// Listen for messages from the dApp or the extension
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "connect_wallet") {
//     console.log("Received connection request from dApp");
//     // Handle wallet connection requests from dApps
//       connectWallet(sendResponse);
//   } else if (request.action === "sign_transaction") {
//       // Handle transaction signing from dApps
//       signTransaction(request.transactionDetails, sendResponse);
//   }
//   return true; // Indicate asynchronous response
// });

// // Function to connect the wallet
// function connectWallet(sendResponse) {
//   chrome.storage.local.get(["address"], function(result) {
//       if (result.address) {
//           // If the wallet is already connected, return the address
//           sendResponse({ success: true, address: result.address });
//       } else {
//           // If the wallet is not connected, open the extension popup for the user to connect
//           chrome.runtime.sendMessage({ action: "request_connection" }, (response) => {
//               if (response && response.success) {
//                   sendResponse({ success: true, address: response.address });
//               } else {
//                   sendResponse({ success: false, message: "Wallet not connected" });
//               }
//           });
//       }
//   });
// }

// Function to handle transaction signing
function signTransaction(transactionDetails, sendResponse) {
  chrome.storage.local.get(["mnemonic"], function(result) {
      if (result.mnemonic) {
          // Use Polkadot's JS libraries here to sign the transaction
          const signedTransaction = signWithMnemonic(result.mnemonic, transactionDetails);
          sendResponse({ success: true, signedTransaction });
      } else {
          // If the wallet is not connected, prompt the user to connect via the popup
          chrome.runtime.sendMessage({ action: "request_connection" }, (response) => {
              if (response && response.success) {
                  // After connection, sign the transaction
                  const signedTransaction = signWithMnemonic(response.mnemonic, transactionDetails);
                  sendResponse({ success: true, signedTransaction });
              } else {
                  sendResponse({ success: false, message: "Please connect the wallet" });
              }
          });
      }
  });
}

// Function to sign the transaction using the mnemonic
async function signWithMnemonic(mnemonic, transactionDetails) {
  const { Keyring } = await import('@polkadot/api');
  const { mnemonicToMiniSecret } = await import('@polkadot/util-crypto');

  const keyring = new Keyring({ type: 'sr25519' });
  const seed = mnemonicToMiniSecret(mnemonic);
  const pair = keyring.addFromSeed(seed);

  // Assuming transactionDetails contains the actual payload to be signed
  const signedData = pair.sign(transactionDetails);

  return signedData;  // Return the signed transaction data
}
