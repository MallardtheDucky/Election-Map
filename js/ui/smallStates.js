import { COLORS, SMALL_STATES } from '../core/config.js';
import { byId, el } from '../core/utils.js';

const container = byId('small-states');

export function renderSmallStates(states, onPick) {
  const byAbbr = new Map(states.map(state => [state.abbr, state]));
  const tiles = SMALL_STATES.map(abbr => byAbbr.get(abbr))
    .filter(Boolean)
    .map(state => {
      const tile = el('button', `small-tile${state.hasData && !state.called ? ' pending' : ''}`);
      tile.type = 'button';
      tile.title = `${state.name} • ${state.status}`;
      tile.dataset.name = state.name;
      tile.style.setProperty('--tile', COLORS[state.status] || COLORS['No Data']);
      tile.appendChild(el('span', 'small-abbr', state.abbr));
      tile.appendChild(el('span', 'small-ev', state.electoralVotes));
      tile.addEventListener('click', event => {
        const stage = byId('stage').getBoundingClientRect();
        const rect = tile.getBoundingClientRect();
        onPick(state, [rect.left - stage.left, rect.top - stage.top + rect.height / 2], event);
      });
      return tile;
    });
  container.replaceChildren(el('div', 'small-title', 'Small states'), ...tiles);
}

export function highlightSmallState(name) {
  container.querySelectorAll('.small-tile').forEach(tile => {
    tile.classList.toggle('selected', tile.dataset.name === name);
  });
}
