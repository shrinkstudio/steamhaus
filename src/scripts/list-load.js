// -----------------------------------------
// LIST LOAD — Paginated CMS list loading
// -----------------------------------------
// Fetches paginated Webflow CMS pages and appends items to the
// current collection list. Replaces Finsweet CMS Load.
//
// Attributes (on .w-dyn-list):
//   [data-list-load="more|all|infinite"]  — loading mode
//   [data-list-stagger]                   — reveal stagger in ms (optional, default: 0)
//   [data-list-loading-class]             — class during fetch (optional, default: "is-loading")
//   [data-list-instance="x"]              — instance ID for multi-list pages (optional)
//
// Attributes (anywhere in scope, matched by instance if set):
//   [data-list-element="button"]          — load-more trigger (mode: more)
//   [data-list-element="loader"]          — loading indicator (mode: infinite)
//   [data-list-element="visible-count"]   — visible item count

var pageCache = {};
var cleanups = [];

function fetchDoc(url) {
  if (pageCache[url]) return pageCache[url];
  var p = fetch(url, { credentials: 'omit' })
    .then(function (r) {
      if (!r.ok) throw new Error('list-load: ' + r.status);
      return r.text();
    })
    .then(function (html) {
      return new DOMParser().parseFromString(html, 'text/html');
    });
  pageCache[url] = p;
  return p;
}

function getNextUrl(context) {
  var link = context.querySelector('.w-pagination-next');
  return link ? link.getAttribute('href') : null;
}

function findEl(scope, name, instance) {
  var sel = '[data-list-element="' + name + '"]';
  if (instance) sel += '[data-list-instance="' + instance + '"]';
  return scope.querySelector(sel);
}

function findMatchingList(doc, instance) {
  var lists = doc.querySelectorAll('[data-list-load]');
  if (instance) {
    for (var i = 0; i < lists.length; i++) {
      if (lists[i].getAttribute('data-list-instance') === instance) return lists[i];
    }
    return null;
  }
  return lists[0] || null;
}

function animateItems(items, staggerMs) {
  if (!staggerMs || typeof gsap === 'undefined' || !items.length) return;
  gsap.set(items, { autoAlpha: 0, y: 20 });
  gsap.to(items, {
    autoAlpha: 1,
    y: 0,
    duration: 0.4,
    stagger: staggerMs / 1000,
    ease: 'steamhaus',
  });
}

function refreshLayout() {
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  if (window.__steamhausLenis) window.__steamhausLenis.resize();
}

function initInstance(listEl, scope) {
  var mode = listEl.getAttribute('data-list-load');
  var itemContainer = listEl.querySelector('.w-dyn-items');
  var paginationWrap = listEl.querySelector('.w-pagination-wrapper');
  if (!itemContainer) return null;

  var nextUrl = getNextUrl(listEl);
  var loadingClass = listEl.getAttribute('data-list-loading-class') || 'is-loading';
  var stagger = parseInt(listEl.getAttribute('data-list-stagger') || '0', 10);
  var instance = listEl.getAttribute('data-list-instance') || null;
  var isLoading = false;
  var destroyed = false;
  var observer = null;
  var buttonHandler = null;
  var buttonEl = null;

  // Hide native pagination
  if (paginationWrap) paginationWrap.style.display = 'none';

  var totalVisible = itemContainer.querySelectorAll(':scope > .w-dyn-item').length;

  function updateCount() {
    var el = findEl(scope, 'visible-count', instance);
    if (el) el.textContent = totalVisible;
  }

  function appendItems(newItems) {
    if (destroyed || !newItems.length) return;
    var frag = document.createDocumentFragment();
    newItems.forEach(function (item) { frag.appendChild(item); });
    itemContainer.appendChild(frag);
    totalVisible += newItems.length;
    updateCount();
    if (stagger) animateItems(newItems, stagger);
    refreshLayout();
  }

  function loadNextPage() {
    if (isLoading || !nextUrl || destroyed) return Promise.resolve(false);
    isLoading = true;
    listEl.classList.add(loadingClass);

    return fetchDoc(nextUrl)
      .then(function (doc) {
        if (destroyed) return false;

        var fetchedList = findMatchingList(doc, instance);
        if (!fetchedList) {
          nextUrl = null;
          return false;
        }

        var c = fetchedList.querySelector('.w-dyn-items');
        var items = c ? Array.from(c.querySelectorAll(':scope > .w-dyn-item')) : [];
        nextUrl = getNextUrl(fetchedList);
        appendItems(items);
        return items.length > 0;
      })
      .catch(function (err) {
        console.warn('list-load:', err);
        return false;
      })
      .then(function (result) {
        isLoading = false;
        listEl.classList.remove(loadingClass);
        return result;
      });
  }

  function loadAllPages() {
    return loadNextPage().then(function (hadItems) {
      if (hadItems && nextUrl && !destroyed) return loadAllPages();
    });
  }

  // --- Mode: all ---
  if (mode === 'all') {
    loadAllPages();
  }

  // --- Mode: more ---
  if (mode === 'more') {
    buttonEl = findEl(scope, 'button', instance);

    if (buttonEl) {
      if (!nextUrl) buttonEl.style.display = 'none';

      buttonHandler = function (e) {
        e.preventDefault();
        loadNextPage().then(function () {
          if (!nextUrl && buttonEl) buttonEl.style.display = 'none';
        });
      };
      buttonEl.addEventListener('click', buttonHandler);
    }
  }

  // --- Mode: infinite ---
  if (mode === 'infinite') {
    var loaderEl = findEl(scope, 'loader', instance);

    // Create sentinel if no loader element
    var sentinel = loaderEl;
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.setAttribute('data-list-sentinel', '');
      sentinel.style.height = '1px';
      listEl.appendChild(sentinel);
    }

    if (!nextUrl && loaderEl) loaderEl.style.display = 'none';

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && nextUrl && !isLoading) {
            loadNextPage().then(function () {
              if (!nextUrl) {
                if (loaderEl) loaderEl.style.display = 'none';
                if (observer) observer.disconnect();
              }
            });
          }
        });
      },
      { rootMargin: '0px 0px 200px 0px' }
    );

    observer.observe(sentinel);
  }

  updateCount();

  return function destroy() {
    destroyed = true;
    if (observer) observer.disconnect();
    if (buttonEl && buttonHandler) buttonEl.removeEventListener('click', buttonHandler);
    var sentinel = listEl.querySelector('[data-list-sentinel]');
    if (sentinel) sentinel.remove();
  };
}

export function initListLoad(scope) {
  scope = scope || document;
  var lists = scope.querySelectorAll('[data-list-load]');
  if (!lists.length) return;

  lists.forEach(function (listEl) {
    var cleanup = initInstance(listEl, scope);
    if (cleanup) cleanups.push(cleanup);
  });
}

export function destroyListLoad() {
  cleanups.forEach(function (fn) { fn(); });
  cleanups = [];
  pageCache = {};
}
