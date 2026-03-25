// Background service worker for Mon CV extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Mon CV] Extension installed');
});

// Message handler (for future use)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Mon CV] Background received message:', message);

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

console.log('[Mon CV] Background service worker started');
