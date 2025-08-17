const endpointEl = document.getElementById('endpoint');
const sheetIdEl = document.getElementById('sheetId');
const sheetNameEl = document.getElementById('sheetName');
const saveSettingsBtn = document.getElementById('saveSettings');
const doSaveBtn = document.getElementById('doSave');
const statusEl = document.getElementById('status');

function setStatus(msg, isError=false) {
  statusEl.textContent = msg || '';
  statusEl.style.color = isError ? '#ffb4b4' : '#a7d3ff';
}

async function loadSettings() {
  const { endpoint, sheetId, sheetName } = await chrome.storage.local.get(['endpoint', 'sheetId', 'sheetName']);
  if (endpoint) endpointEl.value = endpoint;
  if (sheetId) sheetIdEl.value = sheetId;
  if (sheetName) sheetNameEl.value = sheetName;
  
  // Check for pending/failed requests
  const { failedRequests = [] } = await chrome.storage.local.get(['failedRequests']);
  if (failedRequests.length > 0) {
    setStatus(`${failedRequests.length} pending request(s) will retry automatically`, false);
  }
}

async function saveSettings() {
  const endpoint = endpointEl.value.trim();
  const sheetId = sheetIdEl.value.trim();
  const sheetName = sheetNameEl.value.trim();
  await chrome.storage.local.set({ endpoint, sheetId, sheetName });
  setStatus('Settings saved.');
  setTimeout(() => setStatus(''), 1800);
}

async function onDoSave() {
  setStatus('Working...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    
    // Send message to background script to handle saving
    const response = await chrome.runtime.sendMessage({
      action: 'saveData',
      tabId: tab.id
    });
    
    if (response.success) {
      setStatus('Saved! Data queued reliably.');
      setTimeout(() => setStatus(''), 3000);
    } else {
      throw new Error(response.error || 'Unknown error');
    }
  } catch (e) {
    console.error(e);
    if (e.message.includes('Could not establish connection')) {
      setStatus('Extension reloading... Please try again.', true);
    } else {
      setStatus(String(e.message || e), true);
    }
  }
}

saveSettingsBtn.addEventListener('click', saveSettings);
doSaveBtn.addEventListener('click', onDoSave);
document.addEventListener('DOMContentLoaded', loadSettings);
loadSettings();
