// popup.js

// ---- Element refs ----
const domainInput = document.getElementById('domainInput');
const addBtn       = document.getElementById('addBtn');
const siteList     = document.getElementById('siteList');

// ---- Render the saved list ----
function renderList() {
  chrome.storage.sync.get({ allowedSites: [] }, ({ allowedSites }) => {
    siteList.innerHTML = '';
    allowedSites.forEach(origin => {
      const li = document.createElement('li');
      li.textContent = origin;

      const rm = document.createElement('button');
      rm.textContent = 'Remove';
      rm.style.marginLeft = '8px';
      rm.addEventListener('click', () => removeSite(origin));

      li.appendChild(rm);
      siteList.appendChild(li);
    });
  });
}

// ---- Add a new site ----
function addSite() {
  let url = domainInput.value.trim();
  if (!url) return;

  // Normalize to origin + wildcard
  try {
    const u = new URL(url);
    url = `${u.origin}/*`;
  } catch {
    return alert('Please enter a valid URL (e.g. https://example.com)');
  }

  chrome.permissions.request({ origins: [url] }, granted => {
    if (!granted) return alert('Permission denied for ' + url);

    chrome.storage.sync.get({ allowedSites: [] }, ({ allowedSites }) => {
      if (!allowedSites.includes(url)) {
        allowedSites.push(url);
        chrome.storage.sync.set({ allowedSites }, () => {
          renderList();
          domainInput.value = '';
        });
      }
    });
  });
}

// ---- Remove a site ----
function removeSite(origin) {
  chrome.permissions.remove({ origins: [origin] }, removed => {
    if (!removed) return alert('Couldn’t revoke permission for ' + origin);

    chrome.storage.sync.get({ allowedSites: [] }, ({ allowedSites }) => {
      const updated = allowedSites.filter(o => o !== origin);
      chrome.storage.sync.set({ allowedSites: updated }, renderList);
    });
  });
}

// ---- Initialize on popup open ----
document.addEventListener('DOMContentLoaded', () => {
  renderList();

  // Pre-fill with current tab’s origin
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]?.url) return;
    try {
      const origin = new URL(tabs[0].url).origin;
      domainInput.value = `${origin}/*`;
    } catch {
      // ignore parse errors
    }
  });

  addBtn.addEventListener('click', addSite);
});
