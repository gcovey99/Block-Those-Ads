const AD_SELECTORS = [
  '[id*="ad-"]','[class*="ad-"]','[class*="ads-"]','[id*="ads-"]',
  '[class^="ad_"]','[class*="Ad"]','[data-ad]',
  'iframe[src*="ads"]','iframe[src*="doubleclick"]','iframe[src*="googlesyndication"]'
];

function nuke() {
  for (const sel of AD_SELECTORS) {
    document.querySelectorAll(sel).forEach(el => el.remove());
  }
}

// Run now + on future mutations
nuke();
new MutationObserver(nuke).observe(document.documentElement || document.body, {
  childList: true,
  subtree: true
});
