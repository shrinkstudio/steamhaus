// -----------------------------------------
// HUBSPOT — copy Webflow form submissions to HubSpot
// -----------------------------------------
// Webflow still receives every submission; HubSpot gets a copy through the
// Forms API. Nothing runs until the form has its HubSpot form ID.
//
// Markup (Webflow):
//   form[data-hubspot-form="<HubSpot form GUID>"]
//   optional: data-hubspot-portal / data-hubspot-region on the form
//   optional: data-hubspot-field="<property>" on any input to map it directly
//
// Ticked checkboxes that aren't mapped (the "reason for contacting" options)
// are added to the top of the message, so no custom HubSpot property is needed.

const DEFAULT_PORTAL = '146587444';
const DEFAULT_REGION = 'eu1';

// Webflow field name (lowercase) → HubSpot property
const FIELD_MAP = {
  'first-name': 'firstname',
  'last-name': 'lastname',
  email: 'email',
  message: 'message',
  company: 'company',
  'company-name': 'company',
  phone: 'phone',
};

function endpoint(portal, region, guid) {
  const host = region && region !== 'na1' ? `api-${region}.hsforms.com` : 'api.hsforms.com';
  return `https://${host}/submissions/v3/integration/submit/${portal}/${guid}`;
}

function hutk() {
  const m = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return m ? m[1] : undefined;
}

function labelText(input) {
  const label = input.closest('label');
  const span = label && label.querySelector('.w-form-label, .radiocheck-label');
  return ((span || label) ? (span || label).textContent : input.name).replace(/\*/g, '').trim();
}

function collect(form) {
  const fields = {};
  const reasons = [];

  form.querySelectorAll('input, textarea, select').forEach((el) => {
    if (el.type === 'submit' || el.type === 'hidden') return;
    const prop = el.getAttribute('data-hubspot-field') || FIELD_MAP[(el.name || '').toLowerCase()];

    if (el.type === 'checkbox' || el.type === 'radio') {
      if (!el.checked) return;
      if (prop) fields[prop] = el.type === 'checkbox' ? 'true' : el.value;
      else if (!/terms|consent|privacy/i.test(el.name)) reasons.push(labelText(el));
      return;
    }
    if (prop && el.value.trim()) fields[prop] = el.value.trim();
  });

  if (reasons.length) {
    const prefix = 'Reason: ' + reasons.join(', ');
    fields.message = fields.message ? prefix + '\n\n' + fields.message : prefix;
  }
  return Object.keys(fields).map((name) => ({ name, value: fields[name] }));
}

function send(form) {
  const guid = form.getAttribute('data-hubspot-form');
  if (!guid) return;
  const portal = form.getAttribute('data-hubspot-portal') || DEFAULT_PORTAL;
  const region = form.getAttribute('data-hubspot-region') || DEFAULT_REGION;
  const context = { pageUri: location.href, pageName: document.title };
  const token = hutk();
  if (token) context.hutk = token;

  // keepalive so the request survives Webflow swapping in the success message
  fetch(endpoint(portal, region, guid), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: collect(form), context }),
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) res.text().then((t) => console.warn('[hubspot] rejected', res.status, t));
    })
    .catch((err) => console.warn('[hubspot] failed', err));
}

export function initHubspot(scope) {
  (scope || document).querySelectorAll('form[data-hubspot-form]').forEach((form) => {
    if (form.__hubspotInit) return;
    form.__hubspotInit = true;
    // Capture phase, so it runs before Webflow's own submit handler
    form.addEventListener('submit', () => send(form), true);
  });
}
