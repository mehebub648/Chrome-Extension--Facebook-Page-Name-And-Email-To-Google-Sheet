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
}

async function saveSettings() {
  const endpoint = endpointEl.value.trim();
  const sheetId = sheetIdEl.value.trim();
  const sheetName = sheetNameEl.value.trim();
  await chrome.storage.local.set({ endpoint, sheetId, sheetName });
  setStatus('Settings saved.');
  setTimeout(() => setStatus(''), 1800);
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

async function onDoSave() {
  setStatus('Working...');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    const data = await collectData(tab.id);
    await sendToAppsScript(data);
    setStatus('Saved.');
    setTimeout(() => setStatus(''), 2000);
  } catch (e) {
    console.error(e);
    setStatus(String(e.message || e), true);
  }
}

saveSettingsBtn.addEventListener('click', saveSettings);
doSaveBtn.addEventListener('click', onDoSave);
document.addEventListener('DOMContentLoaded', loadSettings);
loadSettings();
