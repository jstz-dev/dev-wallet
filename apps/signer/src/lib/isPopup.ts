export function isPopup() {
  const views = chrome.extension.getViews({ type: "popup" });
  return views.includes(window);
}
