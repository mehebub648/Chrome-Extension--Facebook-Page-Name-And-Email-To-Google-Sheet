// Background service worker for reliable data saving
let isProcessing = false;

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-data') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        console.error('No active tab found');
        return;
      }
      await saveDataFromTab(tab.id, 'shortcut');
    } catch (error) {
      console.error('Error handling keyboard shortcut:', error);
    }
  }
});

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveData') {
    const tabId = request.tabId || sender.tab?.id;
    handleSaveDataRequest(tabId)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  } else if (request.action === 'getStatus') {
    sendResponse({ isProcessing });
  }
});

// Handle alarm for retry mechanism
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'retryFailedRequests') {
    await processFailedRequests();
  }
});

async function handleSaveDataRequest(tabId) {
  if (!tabId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    tabId = tab.id;
  }
  return await saveDataFromTab(tabId, 'popup');
}

async function saveDataFromTab(tabId, source = 'unknown') {
  if (isProcessing) {
    throw new Error('Already processing a save request');
  }
  
  isProcessing = true;
  try {
    console.log(`[Background] Starting save from ${source} for tab ${tabId}`);
    
    // Collect data from the tab
    const data = await collectData(tabId);
    console.log('[Background] Collected data:', data);
    
    // Queue the request for reliable delivery
    await queueDataRequest(data);
    
    // Try to send immediately
    await processFailedRequests();
    
    return { success: true, data };
  } catch (error) {
    console.error('[Background] Save failed:', error);
    throw error;
  } finally {
    isProcessing = false;
  }
}

async function collectData(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: () => {
      try {
        // --- NAME ---
        const nameFromClass = (() => {
          const nodes = document.querySelectorAll(".xjkpybl.x1xlr1w8.xzsf02u.x1yc453h");
          if (!nodes || nodes.length !== 1) return null; // accept only exactly one
          const t = (nodes[0].innerText || "").trim();
          return t || null;
        })();

        const name = nameFromClass ?? (() => {
          const h1s = Array.from(document.querySelectorAll("h1"));
          if (h1s.length === 0) return null;
          const t = (h1s[h1s.length - 1].innerText || "").trim();
          return t || null;
        })();

        // --- EMAIL ---
        const emailFromScan = (() => {
          let firstEmail = null;
          const emailContainers = document.querySelectorAll('.x1b0d499.xuo83w3');
          for (const el of emailContainers) {
            const text = el.parentElement?.parentElement?.innerText || '';
            const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
            if (match) {
              firstEmail = match[0].replace(/[.,;:)]+$/, '');
              break;
            }
          }
          return firstEmail;
        })();

        const email = emailFromScan ?? (() => {
          const sel = 'img[src^="https://static.xx.fbcdn.net/rsrc.php/v4/yE/r/2PIcyqpptfD.png"]';
          return document
            .querySelector(sel)
            ?.parentElement?.parentElement?.innerText?.trim() || null;
        })();

        const data = { name, email, link: location.href };
        console.log('[Save Data]', data);
        return data;
      } catch (e) {
        return { error: String(e) };
      }
    },
  });
  if (result?.error) throw new Error(result.error);
  return result;
}

async function queueDataRequest(data) {
  const timestamp = Date.now();
  const requestId = `req_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { failedRequests = [] } = await chrome.storage.local.get(['failedRequests']);
  
  const newRequest = {
    id: requestId,
    data,
    timestamp,
    attempts: 0,
    maxAttempts: 5
  };
  
  failedRequests.push(newRequest);
  await chrome.storage.local.set({ failedRequests });
  
  console.log('[Background] Queued request:', requestId);
  return requestId;
}

async function processFailedRequests() {
  const { failedRequests = [] } = await chrome.storage.local.get(['failedRequests']);
  
  if (failedRequests.length === 0) {
    return;
  }
  
  console.log(`[Background] Processing ${failedRequests.length} failed requests`);
  
  const stillFailed = [];
  
  for (const request of failedRequests) {
    if (request.attempts >= request.maxAttempts) {
      console.warn('[Background] Max attempts reached for request:', request.id);
      continue; // Skip this request, it will be removed
    }
    
    try {
      request.attempts += 1;
      await sendToAppsScript(request.data);
      console.log('[Background] Successfully sent request:', request.id);
      
      // Show success notification
      await showSuccessNotification(request.data);
      
      // Don't add to stillFailed - it succeeded
    } catch (error) {
      console.error(`[Background] Failed to send request ${request.id} (attempt ${request.attempts}):`, error);
      stillFailed.push(request);
    }
  }
  
  // Update storage with remaining failed requests
  await chrome.storage.local.set({ failedRequests: stillFailed });
  
  // Schedule retry if there are still failed requests
  if (stillFailed.length > 0) {
    chrome.alarms.create('retryFailedRequests', { delayInMinutes: 1 });
    console.log('[Background] Scheduled retry in 1 minute');
  }
}

async function sendToAppsScript(payload) {
  const { endpoint, sheetId, sheetName } = await chrome.storage.local.get(['endpoint', 'sheetId', 'sheetName']);
  if (!endpoint || !sheetId || !sheetName) {
    throw new Error('Missing settings: endpoint / sheetId / sheetName');
  }
  
  const body = JSON.stringify({ ...payload, sheetId, sheetName });
  
  // Use text/plain to avoid CORS preflight with Apps Script
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Endpoint error: ' + res.status + ' ' + text);
  }
  
  let json = null;
  try { json = await res.json(); } catch {}
  return json || { ok: true };
}

async function showSuccessNotification(data) {
  try {
    // Create a notification to inform user of successful data sending
    const notificationId = `success_${Date.now()}`;
    const notificationOptions = {
      type: 'basic',
      iconUrl: 'icons/icon512.png',
      title: 'Data Sent Successfully!',
      message: `Facebook page data sent to Google Sheets${data.name ? ` for "${data.name}"` : ''}.`
    };
    
    await chrome.notifications.create(
      notificationId,
      notificationOptions
    );
    
    // Auto-clear notification after 5 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 5000);
    
    console.log('[Background] Success notification shown');
  } catch (error) {
    console.error('[Background] Failed to show notification:', error);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('success_')) {
    chrome.notifications.clear(notificationId);
  }
});

// Initialize: process any existing failed requests on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Background] Service worker started, processing failed requests');
  await processFailedRequests();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Background] Extension installed/updated, processing failed requests');
  await processFailedRequests();
});

console.log('[Background] Service worker initialized');