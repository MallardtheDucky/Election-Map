import { byId, el, formatPercent, formatReporting } from '../core/utils.js';

const sidebar = byId('sidebar');
const list = byId('state-list');
const search = byId('state-search');

let onPick = () => {};

export function initSidebar(handlers) {
  onPick = handlers.onPick;
  search.addEventListener('input', applyFilter);
  byId('sidebar-close').addEventListener('click', () => setSidebar(false));
}

export function isSidebarOpen() {
  return sidebar.classList.contains('open');
}

export function setSidebar(open) {
  sidebar.classList.toggle('open', open);
  document.body.classList.toggle('sidebar-open', open);
  window.dispatchEvent(new CustomEvent('aprp:sidebar', { detail: open }));
}

export function toggleSidebar() {
  setSidebar(!isSidebarOpen());
}

function applyFilter() {
  const term = search.value.trim().toLowerCase();
  list.querySelectorAll('.state-item').forEach(item => {
    item.classList.toggle('hidden', !item.dataset.name.includes(term));
  });
}

function splitBar(state) {
  const bar = el('span', 'state-split');
  const gop = el('span', 'split-gop');
  const ind = el('span', 'split-ind');
  const dem = el('span', 'split-dem');
  const part = value => (state.total > 0 ? (value / state.total) * 100 : 0);
  gop.style.width = `${part(state.votesGop)}%`;
  ind.style.width = `${part(state.votesInd)}%`;
  dem.style.width = `${part(state.votesDem)}%`;
  bar.append(gop, ind, dem);
  return bar;
}

export function renderSidebar(states) {
  const sorted = states
    .filter(state => state.hasData)
    .slice()
    .sort((a, b) => {
      const am = a.total > 0 ? a.margin : 999;
      const bm = b.total > 0 ? b.margin : 999;
      return am - bm || a.name.localeCompare(b.name);
    });

  const items = sorted.map(state => {
    const item = el('li', 'state-item');
    item.dataset.name = state.name.toLowerCase();
    item.tabIndex = 0;

    const info = el('div', 'state-info');
    info.appendChild(el('span', 'state-name', state.name));
    const status = state.called ? 'Called' : 'Not called';
    info.appendChild(
      el(
        'span',
        'state-meta',
        `${formatReporting(state.reporting)} in · ${state.electoralVotes} EV · ${status}`
      )
    );
    info.appendChild(splitBar(state));

    let marginClass = 'margin-tossup';
    if (state.leader === 'GOP') {
      marginClass = 'margin-gop';
    } else if (state.leader === 'DEM') {
      marginClass = 'margin-dem';
    } else if (state.leader === 'IND') {
      marginClass = 'margin-ind';
    }
    let marginText = '--';
    if (state.total > 0) {
      marginText = state.leader === 'Tossup' ? 'Tied' : `${state.leader} +${formatPercent(state.margin)}`;
    }

    item.appendChild(info);
    item.appendChild(el('div', `state-margin ${marginClass}`, marginText));

    const pick = () => onPick(state);
    item.addEventListener('click', pick);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pick();
      }
    });
    return item;
  });

  list.replaceChildren(...items);
  applyFilter();
}
