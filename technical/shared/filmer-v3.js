(function () {
  function accessibleName(element) {
    const text = element.textContent.replace(/\s+/g, ' ').trim();
    if (text) return text.slice(0, 80);
    if (element.title) return element.title;
    if (element.matches('.back')) return '返回';
    if (element.matches('.icon, .icon-btn')) return '页面操作';
    return '操作';
  }

  function syncPressedState(element) {
    if (element.matches('.tab, .chip, .spec, .filter-chip, .filter-item, .pay-type')) {
      element.setAttribute('aria-pressed', String(element.classList.contains('active')));
    }
  }

  function enhancePrototypeSemantics(root) {
    root.querySelectorAll('[onclick]:not(button):not(a)').forEach(element => {
      element.setAttribute('role', 'button');
      if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
      if (!element.hasAttribute('aria-label')) {
        element.setAttribute('aria-label', accessibleName(element));
      }
      syncPressedState(element);
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          element.click();
        }
      });
      element.addEventListener('click', () => {
        requestAnimationFrame(() => {
          syncPressedState(element);
          element.parentElement?.querySelectorAll('.active').forEach(syncPressedState);
        });
      });
    });

    root.querySelectorAll('button:not([aria-label])').forEach(button => {
      if (!button.textContent.trim()) button.setAttribute('aria-label', button.title || '操作');
    });

    document.body.dataset.designSystem = 'modern-silver';
  }

  const rootScreens = new Set([
    'screen-feed',
    'screen-publish',
    'screen-rental-home',
    'screen-shop-home',
    'screen-mine',
  ]);

  function reportActiveScreen() {
    if (window.parent === window) return;
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen?.id) return;
    window.parent.postMessage({
      type: 'filmer:screen',
      id: activeScreen.id,
      module: document.body.dataset.module,
      root: rootScreens.has(activeScreen.id),
    }, '*');
  }

  function observeScreenChanges() {
    if (window.parent === window) return;
    const observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => mutation.attributeName === 'class')) {
        reportActiveScreen();
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    reportActiveScreen();
  }

  function listenForChildScreens() {
    if (document.body.dataset.module !== 'shell') return;
    window.addEventListener('message', event => {
      if (event.data?.type !== 'filmer:screen') return;
      const activeFrame = document.querySelector('iframe.frame.active');
      if (!activeFrame || event.source !== activeFrame.contentWindow) return;
      const globalNav = document.querySelector('[data-global-nav]');
      if (!globalNav) return;
      globalNav.hidden = !event.data.root;
      document.body.dataset.childScreen = event.data.id;
      globalNav.querySelector('.publish-tab')?.classList.toggle('active', event.data.id === 'screen-publish');
    });
  }

  function init() {
    enhancePrototypeSemantics(document);
    observeScreenChanges();
    listenForChildScreens();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.enhancePrototypeSemantics = enhancePrototypeSemantics;
})();
