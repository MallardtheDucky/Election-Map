import { byId, el, formatPercent } from '../core/utils.js';

const content = byId('ticker-content');

export function renderTicker(states) {
  const close = states
    .filter(state => state.total > 0 && state.margin < 0.05)
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 12);

  const build = () => {
    if (!close.length) {
      return [el('span', 'ticker-item', 'No close races right now')];
    }
    return close.map(state => {
      const item = el('span', 'ticker-item');
      const name = el('strong', `ticker-name ${state.leader.toLowerCase()}`, state.name);
      item.appendChild(name);
      item.appendChild(
        el('span', 'ticker-margin', state.leader === 'Tossup' ? ' Tied' : ` ${state.leader} +${formatPercent(state.margin)}`)
      );
      return item;
    });
  };

  content.replaceChildren(...build(), ...build());
  content.classList.toggle('still', !close.length);
}
