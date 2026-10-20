const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const source = readFileSync(path.join(__dirname, '../../static/js/modules/regulation-search-methods.js'), 'utf8');
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

// Minimal form/event fixtures: these checks exercise state handling without a browser.
function events(object) {
  const listeners = {};
  return Object.assign(object, {
    addEventListener(name, callback) { listeners[name] = callback; },
    emit(name) { listeners[name]?.(); }
  });
}

async function setup({ selected = 'search', values = {}, query = '', stored = null, blocked = false } = {}) {
  let saved = stored;
  global.window = {
    location: { search: query },
    sessionStorage: {
      getItem() { if (blocked) throw new Error('Storage blocked'); return saved; },
      setItem(key, value) { if (blocked) throw new Error('Storage blocked'); saved = value; }
    }
  };
  const methods = ['search', 'ao_number', 'mur_number'];
  const choices = methods.map(value => events({ value, checked: value === selected }));
  const forms = methods.map(method => events({
    dataset: { searchMethod: method },
    elements: { [method]: { value: values[method] || '' } },
    hidden: false
  }));
  const selector = { hidden: true, querySelectorAll: () => choices };
  const container = { querySelector: () => selector, querySelectorAll: () => forms };
  (await modulePromise).default(container);
  return {
    forms, choices, selector,
    saved: () => saved,
    choose(method) {
      choices.forEach(choice => { choice.checked = choice.value === method; });
      choices.find(choice => choice.checked).emit('change');
    }
  };
}

test('switching methods preserves draft values and does not submit a search', async () => {
  const ui = await setup();
  let submitted = false;
  ui.forms.forEach(form => { form.submit = () => { submitted = true; }; });
  ui.forms[0].elements.search.value = 'loans + bank';
  ui.choose('ao_number');
  ui.forms[1].elements.ao_number.value = '2024-01';
  ui.choose('mur_number');
  ui.forms[2].elements.mur_number.value = '8253';
  ui.choose('search');
  assert.equal(ui.forms[0].elements.search.value, 'loans + bank');
  assert.deepEqual(ui.forms.map(form => form.hidden), [false, true, true]);
  assert.deepEqual(JSON.parse(ui.saved()), { search: 'loans + bank', ao_number: '2024-01', mur_number: '8253' });
  assert.equal(submitted, false);
  assert.equal(ui.selector.hidden, false);
});

test('URL-selected method and server value win over older saved drafts', async () => {
  const ui = await setup({
    selected: 'mur_number', query: '?mur_number=8253', values: { mur_number: '8253' },
    stored: JSON.stringify({ search: 'loans', mur_number: '1111' })
  });
  assert.deepEqual(ui.forms.map(form => form.hidden), [true, true, false]);
  assert.equal(ui.forms[2].elements.mur_number.value, '8253');
  assert.equal(ui.forms[0].elements.search.value, 'loans');
});

test('explicitly cleared URL input does not resurrect a saved value', async () => {
  const ui = await setup({ query: '?search=', stored: JSON.stringify({ search: 'old query' }) });
  assert.equal(ui.forms[0].elements.search.value, '');
});

test('keyword submission from AO results selects keyword and saves all drafts', async () => {
  const ui = await setup({ selected: 'ao_number', query: '?ao_number=2024-01', values: { ao_number: '2024-01' } });
  ui.forms[0].elements.search.value = '(bank + loans) -personal';
  ui.forms[0].emit('submit');
  assert.equal(ui.choices[0].checked, true);
  assert.deepEqual(JSON.parse(ui.saved()), { search: '(bank + loans) -personal', ao_number: '2024-01', mur_number: '' });
});

test('method switching works with blocked storage or malformed saved drafts', async () => {
  for (const options of [{ blocked: true }, { stored: '{broken' }]) {
    const ui = await setup(options);
    ui.forms[0].elements.search.value = 'loans';
    ui.choose('mur_number');
    ui.choose('search');
    assert.equal(ui.forms[0].elements.search.value, 'loans');
    assert.equal(ui.forms[0].hidden, false);
  }
});
