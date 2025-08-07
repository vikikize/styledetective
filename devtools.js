chrome.devtools.panels.create(
  "Style Detective",        // Title
  "",                      // Icon (optional)
  "panel.html",            // Panel UI file
  function (panel) {
    console.log("Selector Panel created");
  }
);
