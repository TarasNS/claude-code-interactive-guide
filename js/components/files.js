(function () {
  'use strict';
  var Lab = (window.Lab = window.Lab || {});
  Lab.ui = Lab.ui || {};

  // Client-side only: nothing leaves the browser.
  function downloadText(name, text, say) {
    try {
      var blob = new Blob([text], { type: 'text/markdown' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      if (say) say('info', 'Your browser blocked the download. Use Copy instead.');
    }
  }

  function copyText(text, selectEl, say) {
    function fallback() {
      try {
        var range = document.createRange();
        range.selectNodeContents(selectEl);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) { /* selection unavailable */ }
      if (say) say('info', 'The text is selected. Press Ctrl+C (or Cmd+C) to copy it.');
    }
    try {
      navigator.clipboard.writeText(text).then(function () { if (say) say('info', 'Copied to the clipboard.'); }, fallback);
    } catch (e) {
      fallback();
    }
  }

  Lab.ui.files = { downloadText: downloadText, copyText: copyText };
})();
