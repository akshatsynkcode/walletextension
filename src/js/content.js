// Listen for messages from the dApp or the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "connect_wallet") {
      // Handle wallet connection requests from dApps
      connectWallet(sendResponse);
  } else if (request.action === "sign_transaction") {
      // Handle transaction signing from dApps
      signTransaction(request.transactionDetails, sendResponse);
  }
  return true; // Indicate asynchronous response
});

// Function to connect the wallet
function connectWallet(sendResponse) {
  chrome.storage.sync.get(["address"], function(result) {
      if (result.address) {
          // If the wallet is already connected, return the address
          sendResponse({ success: true, address: result.address });
      } else {
          // If the wallet is not connected, open the extension popup for the user to connect
          chrome.runtime.sendMessage({ action: "request_connection" }, (response) => {
              if (response && response.success) {
                  sendResponse({ success: true, address: response.address });
              } else {
                  sendResponse({ success: false, message: "Wallet not connected" });
              }
          });
      }
  });
}

window.addEventListener("message", (event) => {
    if (
      event.source !== window ||
      !event.data ||
      event.data.type !== "TO_EXTENSION"
    ) {
      return;
    }

    const { action, payload, requestId } = event.data;
    chrome.runtime.sendMessage(
      { action, ...payload },
      (response) => {
        window.postMessage(
          {
            type: "FROM_EXTENSION",
            payload: response,
            error: chrome.runtime.lastError?.message,
            requestId: requestId !== undefined ? requestId : null
          },
          "*"
        );
      }
    );
  });
  