// -----------------------------------------
// HUBSPOT — send Webflow form submissions to HubSpot
// -----------------------------------------
// Keeps the Webflow forms (design + form-validate.js) and posts a copy of each
// submission to the HubSpot Forms API. Webflow still receives the submission
// too, so nothing is lost if HubSpot is unreachable.
//
// Markup (Webflow):
//   form[data-hubspot-form="<form GUID>"]       — on the <form> element
//     input[data-hubspot-field="firstname"]     — optional; otherwise the
//                                                 field name is mapped below
//     [data-hubspot-field="contact_reason"]     — on a checkbox group wrapper:
//                                                 checked labels, joined with ;
//
// Portal + region default to Steamhaus's HubSpot; override per form with
// data-hubspot-portal / data-hubspot-region.

const DEFAULT_PORTAL = '146587444';
const DEFAULT_REGION = 'eu1';

// Webflow field name → HubSpot internal property name
const FIELD_MAP = {
  'first-name': 'firstname',
  'last-name': 'lastname',
  email: 'email',
  message: 'message',
  'company-name': 'company',
  company: 'company',
  phone: 'phone',
};

let instances = [];

function endpoint(portal, region, guid) {
  const host = region && region !== 'na1' ? `api-${region}.hsforms.com` : 'api.hsforms.com';
  return `https://${host}/submissions/v3/integration/submit/${portal}/${guid}`;
}

function hutk() {
  const m = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return m ? m[1] : undefined;
}

function checkboxLabel(input) {
  const label = input.closest('label');
  const text = label ? label.textContent.trim() : '';
  return text || input.name.replace(/^[^-]+-/, '');
}

function collectFields(form) {
  const fields = [];
  const grouped = new Set();

  // Checkbox groups → one multi-value property
  form.querySelectorAll('[data-hubspot-field]:not(input):not(textarea):not(select)').forEach((group) => {
    const checked = Array.from(group.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked'));
    group.querySelectorAll('input').forEach((i) => grouped.add(i));
    if (checked.length) {
      fields.push({ name: group.getAttribute('data-hubspot-field'), value: checked.map(checkboxLabel).join(';') });
    }
  });

  form.querySelectorAll('input, textarea, select').forEach((el) => {
    if (grouped.has(el) || el.type === 'submit' || el.type === 'hidden' && !el.hasAttribute('data-hubspot-field')) return;
    if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
    const name = el.getAttribute('data-hubspot-field') || FIELD_MAP[(el.name || '').toLowerCase()];
    if (!name || !el.value) return;
    fields.push({ name, value: el.type === 'checkbox' ? 'true' : el.value.trim() });
  });
  return fields;
}

function send(form) {
  const guid = form.getAttribute('data-hubspot-form');
  if (!guid) return;
  const portal = form.getAttribute('data-hubspot-portal') || DEFAULT_PORTAL;
  const region = form.getAttribute('data-hubspot-region') || DEFAULT_REGION;
  const body = {
    fields: collectFields(form),
    context: { hutk: hutk(), pageUri: location.href, pageName: document.title },
  };
  if (!body.context.hutk) delete body.context.hutk;

  // keepalive so the request survives Webflow swapping in the success state
  fetch(endpoint(portal, region, guid), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) res.text().then((t) => console.warn('[hubspot] submission rejected', res.status, t));
    })
    .catch((err) => console.warn('[hubspot] submission failed', err));
}

export function initHubspot(scope) {
  scope = scope || document;
  scope.querySelectorAll('form[data-hubspot-form]').forEach((form) => {
    if (form.__hubspotInit) return;
    form.__hubspotInit = true;
    // Capture phase: runs before Webflow's own submit handler
    const fn = () => send(form);
    form.addEventListener('submit', fn, true);
    instances.push(() => {
      form.removeEventListener('submit', fn, true);
      form.__hubspotInit = false;
    });
  });
}

export function destroyHubspot() {
  instances.forEach((fn) => fn());
  instances = [];
}
