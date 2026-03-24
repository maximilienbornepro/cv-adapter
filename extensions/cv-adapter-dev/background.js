// Background service worker for CV Adapter extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[CV Adapter] Extension installed');
});

// Message handler (for future use)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CV Adapter] Background received message:', message);

  // Handle any background-specific actions here
  switch (message.action) {
    case 'getTabInfo':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          sendResponse({
            url: tabs[0].url,
            title: tabs[0].title,
          });
        } else {
          sendResponse({ error: 'No active tab' });
        }
      });
      return true; // Keep channel open for async response

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

console.log('[CV Adapter] Background service worker started');
