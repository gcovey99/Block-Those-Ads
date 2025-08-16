// Elements
const domainInput = document.getElementById('domainInput');
const addBtn = document.getElementById('addBtn');
const siteList = document.getElementById('siteList');

function normalizeToOriginPattern(value) {
  const u = new URL(value);
  return `${u.origin}/*`;
}

function renderList() {
  chrome.storage.sync.get({ allowedSites: [] }, ({ allowedSites }) => {
    siteList.innerHTML = '';
    allowedSites.forEach(origin => {
      const li = document.createElement('li');
      li.textContent = origin;
      const rm = document.createElement('button');
      rm.textContent = 'Remove';
      rm.style.marginLeft = '8px';
      rm.onclick = () => removeSite(origin);
      li.appendChild(rm);
      siteList.appendChild(li);
    });
  });
}

function addSite() {
  const raw = domainInput.value.trim();
  if (!raw) return;
  let originPattern;
  try { originPattern = normalizeToOriginPattern(raw); }
  catch { return alert('Enter a valid URL like https://example.com'); }

  chrome.permissions.request({ origins: [originPattern] }, granted => {
    if (!granted) return alert('Permission denied');
    chrome.storage.sync.get({ allowedSites: [] }, ({ allowedSites }) => {
      if (!allowedSites.includes(originPattern)) {
        allowedSites.push(originPattern);
        chrome.storage.sync.set({ allowedSites }, () => {
          domainInput.value = '';
          renderList();
        });
      }
    });
  });
}

function removeSite(originPattern) {
  chrome.permissions.remove({ origins: [originPattern] }, removed => {
    if (!removed) return;
    chrome.storage.sync.get({ allowedSites: [] }, ({ allowedSites }) => {
      chrome.storage.sync.set({
        allowedSites: allowedSites.filter(o => o !== originPattern)
      }, renderList);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderList();
  
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.url?.startsWith('http')) return;
    try { domainInput.value = normalizeToOriginPattern(tab.url); } catch {}
  });
  addBtn.addEventListener('click', addSite);
});
