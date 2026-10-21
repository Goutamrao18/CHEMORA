(function () {
  'use strict';
  function initDock() {
    var dock = document.querySelector('.chemora-mobile-dock');
    var askPill = document.querySelector('.chemora-floating-ask');
    if (!dock) return;
    var blob = dock.querySelector('.chemora-dock-blob');
    var items = dock.querySelectorAll('.chemora-dock-item');
    if (!items.length) return;
    function updateBlob(animate) {
      if (!blob) return;
      var activeIdx = 0;
      for (var i = 0; i < items.length; i++) {
        if (items[i].getAttribute('aria-current') === 'page') {
          activeIdx = i;
          break;
        }
      }
      var trackWidth = dock.clientWidth - 6; // minus padding
      var itemWidth = trackWidth / items.length;
      var targetX = 3 + (activeIdx * itemWidth);
      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        blob.style.transition = 'none';
        blob.style.transform = 'translateX(' + targetX + 'px)';
        blob.style.width = itemWidth + 'px';
      } else {
        blob.style.willChange = 'transform';
        blob.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), width 260ms cubic-bezier(0.16, 1, 0.3, 1)';
        blob.style.transform = 'translateX(' + targetX + 'px)';
        blob.style.width = itemWidth + 'px';
        setTimeout(function () {
          blob.style.willChange = 'auto';
        }, 300);
      }
    }
    updateBlob(false);
    window.addEventListener('resize', function () {
      updateBlob(false);
    }, { passive: true });
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click', function () {
        for (var k = 0; k < items.length; k++) {
          items[k].removeAttribute('aria-current');
        }
        this.setAttribute('aria-current', 'page');
        updateBlob(true);
      });
    }
    var lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
    var ticking = false;
    var scrollIdleTimer = null;
    function onScroll() {
      var currentY = window.pageYOffset || document.documentElement.scrollTop;
      if (askPill) {
        askPill.classList.add('chemora-ask--collapsed');
        if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
        scrollIdleTimer = setTimeout(function () {
          askPill.classList.remove('chemora-ask--collapsed');
        }, 550);
      }
      if (currentY <= 40) {
        dock.classList.remove('chemora-dock--hidden');
        if (askPill) askPill.classList.remove('chemora-ask--hidden');
        lastScrollY = currentY;
        ticking = false;
        return;
      }
      var delta = currentY - lastScrollY;
      if (Math.abs(delta) > 8) {
        if (delta > 0 && currentY > 80) {
          dock.classList.add('chemora-dock--hidden');
          if (askPill) askPill.classList.add('chemora-ask--hidden');
        } else {
          dock.classList.remove('chemora-dock--hidden');
          if (askPill) askPill.classList.remove('chemora-ask--hidden');
        }
        lastScrollY = currentY;
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    function isTextInput(el) {
      if (!el || !el.tagName) return false;
      var tag = el.tagName.toLowerCase();
      if (tag === 'textarea') return true;
      if (tag === 'input') {
        var type = (el.getAttribute('type') || 'text').toLowerCase();
        return ['text', 'search', 'email', 'password', 'number', 'tel', 'url'].indexOf(type) !== -1;
      }
      return false;
    }
    document.addEventListener('focusin', function (e) {
      if (isTextInput(e.target)) {
        dock.classList.add('chemora-dock--hidden');
        if (askPill) askPill.classList.add('chemora-ask--hidden');
      }
    }, { passive: true });
    document.addEventListener('focusout', function (e) {
      if (isTextInput(e.target)) {
        setTimeout(function () {
          var active = document.activeElement;
          if (!isTextInput(active)) {
            dock.classList.remove('chemora-dock--hidden');
            if (askPill) askPill.classList.remove('chemora-ask--hidden');
          }
        }, 120);
      }
    }, { passive: true });
    window.__chemoraUpdateDock = function () {
      updateBlob(true);
    };
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDock);
  } else {
    initDock();
  }
})();
