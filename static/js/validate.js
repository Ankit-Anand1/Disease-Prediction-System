/**
 * Real-time range validation for DiseasePredict forms
 * Shows inline errors and colors inputs as user types
 */
(function () {
  const form = document.getElementById('mainForm');
  if (!form) return;

  function validate(input) {
    const group = input.closest('.field-group');
    if (!group) return;

    const val = parseFloat(input.value);
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    const isEmpty = input.value === '';

    group.classList.remove('is-valid', 'is-invalid');

    if (isEmpty) return;

    if (isNaN(val) || (!isNaN(min) && val < min) || (!isNaN(max) && val > max)) {
      group.classList.add('is-invalid');
    } else {
      group.classList.add('is-valid');
    }
  }

  // Live validation on input
  form.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => validate(input));
    input.addEventListener('blur',  () => validate(input));
  });

  // Validate all on submit attempt
  form.addEventListener('submit', function (e) {
    let hasError = false;
    form.querySelectorAll('input[type="number"]').forEach(input => {
      validate(input);
      if (input.closest('.field-group').classList.contains('is-invalid')) {
        hasError = true;
      }
    });
    if (hasError) {
      e.preventDefault();
      // Scroll to first error
      const first = form.querySelector('.field-group.is-invalid input');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();
