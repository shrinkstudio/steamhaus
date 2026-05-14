// -----------------------------------------
// FORM VALIDATE — Client-side form validation
// -----------------------------------------
// Attributes:
//   [data-form-validate]          — form wrapper
//   [data-validate]               — field group (wraps input/select/textarea)
//   [data-submit]                 — custom submit button wrapper (hides real submit)
//   [data-radiocheck-group]       — radio/checkbox group (supports min/max attrs)
//
// Classes toggled on [data-validate] elements:
//   .is--filled   — field has a value
//   .is--success  — field passes validation
//   .is--error    — field fails validation (only after interaction)
//
// Validation rules:
//   input[min]/[max]   — character length bounds
//   input[type=email]  — email pattern
//   select             — rejects empty/disabled/null/false values
//   radio              — at least 1 checked
//   checkbox            — min/max checked count (attrs on [data-radiocheck-group])
//
// Spam guard: rejects submissions within 5s of page load

var instances = [];

function initInstance(formContainer, scope) {
  var startTime = new Date().getTime();
  var form = formContainer.querySelector('form');
  if (!form) return null;

  var validateFields = form.querySelectorAll('[data-validate]');
  var dataSubmit = form.querySelector('[data-submit]');
  if (!dataSubmit) return null;

  var realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
  if (!realSubmitInput) return null;

  var listeners = [];

  function on(el, evt, fn) {
    el.addEventListener(evt, fn);
    listeners.push({ el: el, evt: evt, fn: fn });
  }

  function isSpam() {
    return new Date().getTime() - startTime < 5000;
  }

  function isValid(fieldGroup) {
    var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

    if (radioCheckGroup) {
      var inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      var checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
      var min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
      var max = parseInt(radioCheckGroup.getAttribute('max')) || inputs.length;

      if (inputs[0].type === 'radio') return checkedCount >= 1;
      if (inputs.length === 1) return inputs[0].checked;
      return checkedCount >= min && checkedCount <= max;
    }

    var input = fieldGroup.querySelector('input, textarea, select');
    if (!input) return false;

    var value = input.value.trim();
    var length = value.length;
    var min = parseInt(input.getAttribute('min')) || 0;
    var max = parseInt(input.getAttribute('max')) || Infinity;

    if (input.tagName.toLowerCase() === 'select') {
      return value !== '' && value !== 'disabled' && value !== 'null' && value !== 'false';
    }

    if (input.type === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    if (input.hasAttribute('min') && length < min) return false;
    if (input.hasAttribute('max') && length > max) return false;
    return true;
  }

  function updateFieldStatus(fieldGroup) {
    var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

    if (radioCheckGroup) {
      var inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      var checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;

      fieldGroup.classList.toggle('is--filled', checkedCount > 0);

      if (isValid(fieldGroup)) {
        fieldGroup.classList.add('is--success');
        fieldGroup.classList.remove('is--error');
      } else {
        fieldGroup.classList.remove('is--success');
        var anyStarted = Array.from(inputs).some(function (i) { return i.__validationStarted; });
        fieldGroup.classList.toggle('is--error', anyStarted);
      }
      return;
    }

    var input = fieldGroup.querySelector('input, textarea, select');
    if (!input) return;

    fieldGroup.classList.toggle('is--filled', !!input.value.trim());

    if (isValid(fieldGroup)) {
      fieldGroup.classList.add('is--success');
      fieldGroup.classList.remove('is--error');
    } else {
      fieldGroup.classList.remove('is--success');
      fieldGroup.classList.toggle('is--error', !!input.__validationStarted);
    }
  }

  function validateAll() {
    var allValid = true;
    var firstInvalid = null;

    validateFields.forEach(function (fieldGroup) {
      var input = fieldGroup.querySelector('input, textarea, select');
      var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

      if (input) input.__validationStarted = true;
      if (radioCheckGroup) {
        radioCheckGroup.__validationStarted = true;
        radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function (i) {
          i.__validationStarted = true;
        });
      }

      updateFieldStatus(fieldGroup);

      if (!isValid(fieldGroup)) {
        allValid = false;
        if (!firstInvalid) firstInvalid = input || radioCheckGroup.querySelector('input');
      }
    });

    if (!allValid && firstInvalid) firstInvalid.focus();
    return allValid;
  }

  function handleSubmit() {
    if (!validateAll()) return;
    if (isSpam()) {
      alert('Form submitted too quickly. Please try again.');
      return;
    }
    realSubmitInput.click();
  }

  // Disable invalid select options
  validateFields.forEach(function (fieldGroup) {
    var select = fieldGroup.querySelector('select');
    if (!select) return;
    select.querySelectorAll('option').forEach(function (opt) {
      if (opt.value === '' || opt.value === 'disabled' || opt.value === 'null' || opt.value === 'false') {
        opt.setAttribute('disabled', 'disabled');
      }
    });
  });

  // Bind field-level listeners
  validateFields.forEach(function (fieldGroup) {
    var input = fieldGroup.querySelector('input, textarea, select');
    var radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

    if (radioCheckGroup) {
      var inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      inputs.forEach(function (inp) {
        inp.__validationStarted = false;

        on(inp, 'change', function () {
          requestAnimationFrame(function () {
            if (!inp.__validationStarted) {
              var checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
              var min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
              if (checkedCount >= min) inp.__validationStarted = true;
            }
            if (inp.__validationStarted) updateFieldStatus(fieldGroup);
          });
        });

        on(inp, 'blur', function () {
          inp.__validationStarted = true;
          updateFieldStatus(fieldGroup);
        });
      });
    } else if (input) {
      input.__validationStarted = false;

      if (input.tagName.toLowerCase() === 'select') {
        on(input, 'change', function () {
          input.__validationStarted = true;
          updateFieldStatus(fieldGroup);
        });
      } else {
        on(input, 'input', function () {
          var value = input.value.trim();
          var length = value.length;
          var min = parseInt(input.getAttribute('min')) || 0;
          var max = parseInt(input.getAttribute('max')) || Infinity;

          if (!input.__validationStarted) {
            if (input.type === 'email') {
              if (isValid(fieldGroup)) input.__validationStarted = true;
            } else if (
              (input.hasAttribute('min') && length >= min) ||
              (input.hasAttribute('max') && length <= max)
            ) {
              input.__validationStarted = true;
            }
          }

          if (input.__validationStarted) updateFieldStatus(fieldGroup);
        });

        on(input, 'blur', function () {
          input.__validationStarted = true;
          updateFieldStatus(fieldGroup);
        });
      }
    }
  });

  // Submit handlers
  on(dataSubmit, 'click', handleSubmit);

  on(form, 'keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleSubmit();
    }
  });

  return function destroy() {
    listeners.forEach(function (l) { l.el.removeEventListener(l.evt, l.fn); });
    listeners = [];
  };
}

export function initFormValidate(scope) {
  scope = scope || document;
  var forms = scope.querySelectorAll('[data-form-validate]');
  if (!forms.length) return;

  forms.forEach(function (formContainer) {
    var cleanup = initInstance(formContainer, scope);
    if (cleanup) instances.push(cleanup);
  });
}

export function destroyFormValidate() {
  instances.forEach(function (fn) { fn(); });
  instances = [];
}
