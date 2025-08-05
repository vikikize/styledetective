// Listen for the custom event dispatched by injected page script
window.addEventListener('my-extension-selected-elements', (event) => {
  const details = event.detail;

  chrome.runtime.sendMessage({
    type: 'elementsSelected',
    details
  });
});
