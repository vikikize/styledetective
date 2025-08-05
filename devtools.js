chrome.devtools.panels.create(
  "Selector Panel",        // Title
  "",                      // Icon (optional)
  "panel.html",            // Panel UI file
  function (panel) {
    console.log("Selector Panel created");
  }
);
