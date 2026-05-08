// -----------------------------------------
// CMS NEST — Fetch and inject nested CMS collections
// -----------------------------------------
// Attributes (on the page with the parent collection):
//   [data-nest="link"]            — link element pointing to the CMS item page (href used to fetch)
//   [data-nest="target"]          — div where nested items will be injected
//   [data-nest-instance="x"]      — instance name linking target to source (e.g. "deliverables")
//
// Attributes (on the CMS template page):
//   [data-nest="source"]          — collection list wrapper containing items to clone
//   [data-nest-instance="x"]      — must match the target's instance name
//
// Optional:
//   [data-nest-loading-class]     — class added to target while fetching (default: "is-loading")

var cache = {};
var injectedNodes = [];

function fetchPage(url) {
  if (cache[url]) return cache[url];

  var promise = fetch(url, { credentials: 'omit' })
    .then(function (res) {
      if (!res.ok) throw new Error('cms-nest: fetch failed ' + res.status);
      return res.text();
    })
    .then(function (html) {
      var parser = new DOMParser();
      return parser.parseFromString(html, 'text/html');
    });

  cache[url] = promise;
  return promise;
}

function nestItem(target) {
  var instance = target.getAttribute('data-nest-instance');
  if (!instance) return Promise.resolve();

  var item = target.closest('[data-nest="item"]') || target.parentElement;
  var link = item ? item.querySelector('[data-nest="link"]') : null;
  if (!link || !link.href) return Promise.resolve();

  var loadingClass = target.getAttribute('data-nest-loading-class') || 'is-loading';
  target.classList.add(loadingClass);

  return fetchPage(link.href).then(function (doc) {
    var source = doc.querySelector('[data-nest="source"][data-nest-instance="' + instance + '"]');
    if (!source) {
      target.classList.remove(loadingClass);
      return;
    }

    var children = source.children;
    for (var i = 0; i < children.length; i++) {
      var clone = children[i].cloneNode(true);
      target.appendChild(clone);
      injectedNodes.push(clone);
    }

    target.classList.remove(loadingClass);
  }).catch(function (err) {
    console.warn(err);
    target.classList.remove(loadingClass);
  });
}

function refreshLayout() {
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh();
  }
  if (window.__steamhausLenis) {
    window.__steamhausLenis.resize();
  }
}

export function initCmsNest(scope) {
  scope = scope || document;
  var targets = scope.querySelectorAll('[data-nest="target"]');
  if (!targets.length) return;

  var promises = [];
  targets.forEach(function (target) {
    promises.push(nestItem(target));
  });

  Promise.all(promises).then(refreshLayout);
}

export function destroyCmsNest() {
  injectedNodes.forEach(function (node) {
    if (node.parentNode) node.parentNode.removeChild(node);
  });
  injectedNodes = [];
  cache = {};
}
