// -----------------------------------------
// FILTER BASIC — show/hide filter for grouped items
// -----------------------------------------
// Attributes:
//   [data-filter-group]                 — wrapper (one per filter instance)
//   [data-filter-target="<name|all>"]   — button; toggles visibility
//   [data-filter-name="<name>"]         — item; shown when its name matches target
//   [data-filter-delay="150"]           — optional transition delay in ms (default 150)
//
// Status attributes (set by module, hook CSS to these):
//   On items + buttons:
//     data-filter-status="active"         — visible / pressed
//     data-filter-status="not-active"     — hidden / unpressed
//     data-filter-status="transition-out" — item is fading out (only on items)
//   On items:
//     aria-hidden="true|false"
//   On buttons:
//     aria-pressed="true|false"

var instances = [];

function initInstance(group) {
  var buttons = group.querySelectorAll('[data-filter-target]');
  var items = group.querySelectorAll('[data-filter-name]');
  if (!buttons.length || !items.length) return null;

  var transitionDelay = parseInt(group.getAttribute('data-filter-delay'), 10);
  if (isNaN(transitionDelay)) transitionDelay = 250;

  var listeners = [];
  var timers = [];

  function on(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el: el, evt: evt, fn: fn });
  }

  function schedule(fn, delay) {
    var t = setTimeout(fn, delay);
    timers.push(t);
    return t;
  }

  function setItem(el, active) {
    el.setAttribute('data-filter-status', active ? 'active' : 'not-active');
    el.setAttribute('aria-hidden', active ? 'false' : 'true');
  }

  function setButton(el, active) {
    el.setAttribute('data-filter-status', active ? 'active' : 'not-active');
    el.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function handleFilter(target) {
    items.forEach(function (item) {
      var matches = target === 'all' || item.getAttribute('data-filter-name') === target;
      var current = item.getAttribute('data-filter-status');
      // Absent status is treated as active (CMS items render with no status)
      var isCurrentlyActive = !current || current === 'active';

      if (isCurrentlyActive && !matches) {
        // Fade out, then hide
        item.setAttribute('data-filter-status', 'transition-out');
        schedule(function () { setItem(item, false); }, transitionDelay);
      } else if (!isCurrentlyActive && matches) {
        // Show after the outgoing items have left (avoids layout flicker)
        schedule(function () { setItem(item, true); }, transitionDelay);
      }
      // else: state is correct, leave alone
    });

    buttons.forEach(function (button) {
      setButton(button, button.getAttribute('data-filter-target') === target);
    });
  }

  // Initial state — buttons only. Items default to visible via CSS (no status needed).
  buttons.forEach(function (button) {
    if (!button.getAttribute('data-filter-status')) setButton(button, false);
  });
  var allBtn = group.querySelector('[data-filter-target="all"]');
  if (allBtn && !group.querySelector('[data-filter-target][data-filter-status="active"]')) {
    setButton(allBtn, true);
  }

  buttons.forEach(function (button) {
    on(button, 'click', function () {
      if (button.getAttribute('data-filter-status') === 'active') return;
      handleFilter(button.getAttribute('data-filter-target'));
    });
  });

  return function destroy() {
    listeners.forEach(function (l) { l.el.removeEventListener(l.evt, l.fn); });
    timers.forEach(function (t) { clearTimeout(t); });
    listeners = [];
    timers = [];
  };
}

export function initFilterBasic(scope) {
  scope = scope || document;
  var groups = scope.querySelectorAll('[data-filter-group]');
  if (!groups.length) return;

  groups.forEach(function (group) {
    var cleanup = initInstance(group);
    if (cleanup) instances.push(cleanup);
  });
}

export function destroyFilterBasic() {
  instances.forEach(function (fn) { fn(); });
  instances = [];
}
