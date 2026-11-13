import { byId, el } from '../core/utils.js';

const loader = byId('loader');
const content = byId('loader-content');

function render(nodes) {
  content.replaceChildren(...nodes);
}

export function showLoader(message = 'Loading the election map') {
  loader.classList.remove('fade');
  loader.classList.remove('hidden');
  render([el('div', 'spinner'), el('div', 'loader-text', message)]);
}

export function hideLoader() {
  loader.classList.add('fade');
  setTimeout(() => {
    if (loader.classList.contains('fade')) {
      loader.classList.add('hidden');
    }
  }, 500);
}

export function showLoaderError(title, detail, hint) {
  loader.classList.remove('fade');
  loader.classList.remove('hidden');
  const nodes = [
    el('div', 'loader-error-title', title),
    el('div', 'loader-error-detail', detail)
  ];
  if (hint) {
    nodes.push(el('div', 'loader-error-hint', hint));
  }
  const retry = el('button', 'btn-text', 'Try again');
  retry.type = 'button';
  retry.addEventListener('click', () => window.dispatchEvent(new CustomEvent('aprp:retry')));
  nodes.push(retry);
  render(nodes);
}
