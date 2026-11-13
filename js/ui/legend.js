import { COLORS } from '../core/config.js';
import { byId, el } from '../core/utils.js';

const panel = byId('legend-panel');

function ramp(label, side) {
  const row = el('div', 'legend-ramp');
  row.appendChild(el('span', 'legend-ramp-label', label));
  const chips = el('span', 'legend-chips');
  ['Tilt', 'Lean', 'Likely', 'Solid'].forEach(level => {
    const chip = el('span', 'legend-chip');
    chip.style.background = COLORS[`${level} ${side}`];
    chip.title = level;
    chips.appendChild(chip);
  });
  row.appendChild(chips);
  return row;
}

function single(label, color, className) {
  const row = el('div', 'legend-item');
  const dot = el('span', `legend-dot ${className || ''}`.trim());
  if (color) {
    dot.style.background = color;
  }
  row.appendChild(dot);
  row.appendChild(document.createTextNode(label));
  return row;
}

export function initLegend() {
  const scale = el('div', 'legend-scale');
  scale.appendChild(el('span'));
  ['Tilt', 'Lean', 'Likely', 'Solid'].forEach(level => scale.appendChild(el('span', null, level)));

  panel.replaceChildren(
    el('div', 'legend-title', 'Margin of lead'),
    scale,
    ramp('Republican', 'GOP'),
    ramp('Democrat', 'DEM'),
    ramp('Independent', 'IND'),
    el('div', 'legend-rule'),
    single('Tied', COLORS.Tossup),
    single('Waiting for votes', COLORS.Uncalled),
    single('Hatched: not called yet', null, 'legend-hatch')
  );
  byId('legend-btn').addEventListener('click', () => panel.classList.toggle('show'));
}
