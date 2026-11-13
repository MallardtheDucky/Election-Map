import { byId, clamp, el, formatNumber, formatPercent, formatReporting, shortName } from '../core/utils.js';
import { createAvatar } from './avatar.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TRI = { gop: [12, 152], dem: [188, 152], ind: [100, 20] };

const stage = byId('stage');
const popup = byId('popup');
const tooltip = byId('tooltip');

function place(node, point, offset) {
  const bounds = stage.getBoundingClientRect();
  node.style.left = '0px';
  node.style.top = '0px';
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  let x = point[0] + offset;
  let y = point[1] + offset;
  if (x + width > bounds.width - 8) {
    x = point[0] - width - offset;
  }
  if (y + height > bounds.height - 8) {
    y = point[1] - height - offset;
  }
  node.style.left = `${clamp(x, 8, Math.max(8, bounds.width - width - 8))}px`;
  node.style.top = `${clamp(y, 8, Math.max(8, bounds.height - height - 8))}px`;
}

function candidateRow(name, party, votes, share, fraction, isLeader) {
  const row = el('div', `candidate-row ${party}${isLeader ? ' winner' : ''}`);
  row.appendChild(createAvatar(name, party, 'avatar-sm'));
  const info = el('div', 'candidate-info');
  info.appendChild(el('strong', null, name));
  info.appendChild(el('small', null, `${formatNumber(votes)} votes`));
  const track = el('span', 'candidate-track');
  const fill = el('span', 'candidate-fill');
  fill.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
  track.appendChild(fill);
  info.appendChild(track);
  row.appendChild(info);
  row.appendChild(el('strong', 'candidate-share', share));
  return row;
}

function statusLine(state) {
  if (state.total <= 0) {
    return { text: 'Waiting for votes', side: 'none' };
  }
  const names = {
    GOP: state.gopCandidate || 'Republican',
    DEM: state.demCandidate || 'Democrat',
    IND: state.indCandidate || 'Independent'
  };
  if (state.leader === 'Tossup') {
    return { text: 'Tied', side: 'none' };
  }
  const name = shortName(names[state.leader] || '');
  const side = state.leader.toLowerCase();
  return state.called
    ? { text: `${name} wins`, side, called: true }
    : { text: `${name} leads by ${formatPercent(state.margin)}`, side };
}

function svgNode(tag, attributes, text) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.keys(attributes).forEach(key => node.setAttribute(key, attributes[key]));
  if (text) {
    node.textContent = text;
  }
  return node;
}

function triangleChart(state) {
  const total = state.votesGop + state.votesDem + state.votesInd;
  const gop = total > 0 ? state.votesGop / total : 0;
  const dem = total > 0 ? state.votesDem / total : 0;
  const ind = total > 0 ? state.votesInd / total : 0;

  const wrapper = el('div', 'triangle-container');
  let title = 'Awaiting results';
  if (total > 0) {
    title = state.leader === 'IND' ? 'Independent leads' : state.status;
  }
  wrapper.appendChild(el('h4', null, title));

  const svg = svgNode('svg', { viewBox: '0 0 200 170', class: 'triangle-chart' });
  const points = [TRI.gop, TRI.dem, TRI.ind].map(point => point.join(',')).join(' ');
  svg.appendChild(svgNode('polygon', { points, class: 'triangle-shape' }));

  const guides = [
    [TRI.gop, [(TRI.dem[0] + TRI.ind[0]) / 2, (TRI.dem[1] + TRI.ind[1]) / 2]],
    [TRI.dem, [(TRI.gop[0] + TRI.ind[0]) / 2, (TRI.gop[1] + TRI.ind[1]) / 2]],
    [TRI.ind, [(TRI.gop[0] + TRI.dem[0]) / 2, (TRI.gop[1] + TRI.dem[1]) / 2]]
  ];
  guides.forEach(([from, to]) => {
    svg.appendChild(
      svgNode('line', { x1: from[0], y1: from[1], x2: to[0], y2: to[1], class: 'triangle-guide' })
    );
  });

  svg.appendChild(svgNode('text', { x: TRI.gop[0], y: 167, 'text-anchor': 'start', class: 'triangle-label gop' }, `GOP ${(gop * 100).toFixed(1)}%`));
  svg.appendChild(svgNode('text', { x: TRI.dem[0], y: 167, 'text-anchor': 'end', class: 'triangle-label dem' }, `DEM ${(dem * 100).toFixed(1)}%`));
  svg.appendChild(svgNode('text', { x: TRI.ind[0], y: 11, 'text-anchor': 'middle', class: 'triangle-label ind' }, `IND ${(ind * 100).toFixed(1)}%`));

  if (total > 0) {
    const x = TRI.gop[0] * gop + TRI.dem[0] * dem + TRI.ind[0] * ind;
    const y = TRI.gop[1] * gop + TRI.dem[1] * dem + TRI.ind[1] * ind;
    svg.appendChild(svgNode('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: 5, class: 'triangle-dot' }));
  }

  wrapper.appendChild(svg);
  return wrapper;
}

export function showTooltip(state, point) {
  const summary = state.hasData
    ? `${state.electoralVotes} EV · ${state.called ? 'Called' : 'Not called'}`
    : 'No electoral votes';
  tooltip.replaceChildren(el('strong', null, state.name), el('span', null, summary));
  tooltip.classList.add('show');
  place(tooltip, point, 14);
}

export function hideTooltip() {
  tooltip.classList.remove('show');
}

export function showPopup(state, point) {
  hideTooltip();

  const line = statusLine(state);
  const header = el('div', `popup-header ${line.side}`);
  header.appendChild(el('h3', null, state.name));

  const close = el('button', 'popup-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  close.addEventListener('click', hidePopup);
  header.appendChild(close);

  const meta = state.hasData
    ? `${state.electoralVotes} electoral votes · ${formatReporting(state.reporting)} counted`
    : 'No electoral votes';
  header.appendChild(el('div', 'popup-meta', meta));
  if (state.hasData) {
    header.appendChild(el('div', `popup-status-pill ${line.side}${line.called ? ' called' : ''}`, line.text));
  }

  const body = el('div', 'popup-body');
  if (state.hasData) {
    const base = state.total;
    const frac = value => (base > 0 ? value / base : 0);
    body.appendChild(
      candidateRow(
        state.gopCandidate || 'Republican',
        'gop',
        state.votesGop,
        formatPercent(frac(state.votesGop)),
        frac(state.votesGop),
        state.leader === 'GOP'
      )
    );
    body.appendChild(
      candidateRow(
        state.demCandidate || 'Democrat',
        'dem',
        state.votesDem,
        formatPercent(frac(state.votesDem)),
        frac(state.votesDem),
        state.leader === 'DEM'
      )
    );
    if (state.votesInd > 0) {
      body.appendChild(
        candidateRow(
          state.indCandidate || 'Independent',
          'ind',
          state.votesInd,
          formatPercent(frac(state.votesInd)),
          frac(state.votesInd),
          state.leader === 'IND'
        )
      );
    }
  } else {
    body.appendChild(el('div', 'popup-status', 'This region does not take part in the election.'));
  }

  const parts = [header, body];
  if (state.hasData && state.votesInd > 0) {
    parts.push(triangleChart(state));
  }
  popup.replaceChildren(...parts);
  popup.classList.add('show');
  place(popup, point, 18);
}

export function hidePopup() {
  popup.classList.remove('show');
}

export function isPopupOpen() {
  return popup.classList.contains('show');
}
