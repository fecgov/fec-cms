export default function initRegulationHistory(container) {
  const details = Array.from(container.querySelectorAll('details'));
  const toggle = container.querySelector('[data-history-toggle]');
  const tools = container.querySelector('[data-history-tools]');
  if (!tools) return;

  // The server renders everything open so all history is available without JS.
  details.forEach(item => { item.open = false; });
  tools.hidden = !details.length;
  toggle.hidden = !details.length;

  function updateToggle() {
    toggle.textContent = details.every(item => item.open) ? 'Collapse all E&Js' : 'Expand all E&Js';
  }

  toggle.addEventListener('click', () => {
    const open = !details.every(item => item.open);
    details.forEach(item => { item.open = open; });
    updateToggle();
  });
  details.forEach(item => item.addEventListener('toggle', updateToggle));

  function focusTarget() {
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch (error) {
      return;
    }
    const target = document.getElementById(id);
    if (!target || !container.contains(target)) return;
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', focusTarget);
  focusTarget();

  let beforePrint;
  window.addEventListener('beforeprint', () => {
    beforePrint = details.map(item => item.open);
    details.forEach(item => { item.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (beforePrint) details.forEach((item, index) => { item.open = beforePrint[index]; });
  });
}
