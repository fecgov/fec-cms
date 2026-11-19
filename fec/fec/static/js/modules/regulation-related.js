export default function loadRegulationRelated(container) {
  const label = container.dataset.regulationRelatedLabel;
  const fallback = container.querySelector('a').cloneNode(true);
  container.setAttribute('aria-busy', 'true');
  container.textContent = 'Loading ' + label + '...';

  return fetch(container.dataset.regulationRelatedUrl)
    .then(response => {
      if (!response.ok) throw new Error('Related content unavailable');
      return response.text();
    })
    .then(content => {
      container.innerHTML = content;
    })
    .catch(() => {
      container.textContent = 'Unable to load ' + label + '. ';
      container.appendChild(fallback);
    })
    .finally(() => container.setAttribute('aria-busy', 'false'));
}
