const AD_SELECTORS = [
  '[id^="ad-"]',
  '[id$="-ad"]',
  '[id^="google_ads"]',
  '[class^="ad-"]',
  '[class$="-ad"]',
  '[data-ad]',
  'iframe[src*="ads"]'
];

function removeAds() {
  AD_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.remove();
    });
  });
}

new MutationObserver(removeAds).observe(document.body, {
  childList: true,
  subtree: true
});

removeAds();
