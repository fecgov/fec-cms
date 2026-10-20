const draftKey = 'fec.regulationSearchDrafts';

export default function initRegulationSearchMethods(container) {
  const selector = container.querySelector('[data-search-method-selector]');
  const choices = Array.from(selector.querySelectorAll('input[type="radio"]'));
  const forms = Array.from(container.querySelectorAll('form[data-search-method]'));
  let drafts = {};
  try {
    drafts = JSON.parse(window.sessionStorage.getItem(draftKey)) || {};
  } catch (error) {
    // Switching methods still preserves values when storage is unavailable.
  }

  // URL values, including validation errors, always take precedence over drafts.
  const params = new URLSearchParams(window.location.search);
  forms.forEach(form => {
    const method = form.dataset.searchMethod;
    const input = form.elements[method];
    if (!params.has(method) && !input.value && typeof drafts[method] === 'string') {
      input.value = drafts[method];
    }
  });

  function saveDrafts() {
    const values = {};
    forms.forEach(form => {
      const method = form.dataset.searchMethod;
      values[method] = form.elements[method].value;
    });
    try {
      window.sessionStorage.setItem(draftKey, JSON.stringify(values));
    } catch (error) {
      // In-memory form values remain usable without session storage.
    }
  }

  function selectMethod(method) {
    choices.forEach(choice => { choice.checked = choice.value === method; });
    forms.forEach(form => { form.hidden = form.dataset.searchMethod !== method; });
  }

  choices.forEach(choice => {
    choice.addEventListener('change', () => {
      if (choice.checked) {
        saveDrafts();
        selectMethod(choice.value);
      }
    });
  });
  forms.forEach(form => {
    form.addEventListener('input', saveDrafts);
    form.addEventListener('submit', () => {
      // The Boolean dialog submits the keyword form, even on an AO/MUR results URL.
      selectMethod(form.dataset.searchMethod);
      saveDrafts();
    });
  });
  selectMethod(choices.find(choice => choice.checked)?.value || 'search');
  selector.hidden = false;
}
