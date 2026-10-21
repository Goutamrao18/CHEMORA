// Plain-JS anti-flicker delayed loading controller for static pages
(function () {
  window.chemoraDelayedLoading = function (onStateChange, options) {
    var delay = (options && options.delay) || 200;
    var minDuration = (options && options.minDuration) || 400;
    var shownAt = null;
    var delayTimer = null;
    var hideTimer = null;
    var isVisible = false;

    return {
      start: function () {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
        if (!isVisible && !delayTimer) {
          delayTimer = setTimeout(function () {
            shownAt = Date.now();
            isVisible = true;
            delayTimer = null;
            onStateChange(true);
          }, delay);
        }
      },
      stop: function () {
        if (delayTimer) {
          clearTimeout(delayTimer);
          delayTimer = null;
        }
        if (isVisible) {
          var elapsed = shownAt ? Date.now() - shownAt : minDuration;
          var remaining = Math.max(0, minDuration - elapsed);
          hideTimer = setTimeout(function () {
            isVisible = false;
            shownAt = null;
            hideTimer = null;
            onStateChange(false);
          }, remaining);
        } else {
          onStateChange(false);
        }
      }
    };
  };

  // Global document visibility observer to pause animations in inactive tabs
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      document.documentElement.setAttribute('data-chem-hidden', 'true');
    } else {
      document.documentElement.removeAttribute('data-chem-hidden');
    }
  });
})();
