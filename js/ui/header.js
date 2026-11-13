import { TOTAL_EV, TITLE_SUFFIX } from '../core/config.js';
import { byId, formatNumber, formatReporting, shortName } from '../core/utils.js';
import { mountAvatar } from './avatar.js';

const refs = {
  title: byId('title'),
  sync: byId('sync'),
  syncText: byId('sync-text'),
  avatarGop: byId('avatar-gop'),
  avatarDem: byId('avatar-dem'),
  nameGop: byId('name-gop'),
  nameDem: byId('name-dem'),
  evGop: byId('ev-gop'),
  evDem: byId('ev-dem'),
  pvGop: byId('pv-gop'),
  pvDem: byId('pv-dem'),
  pvInd: byId('pv-ind'),
  barInd: byId('bar-ind'),
  nameInd: byId('name-ind'),
  indWrap: byId('ind-wrap'),
  reporting: byId('reporting'),
  barGop: byId('bar-gop'),
  barDem: byId('bar-dem')
};

let renderedNames = '';

export function setTitle(year) {
  const text = year ? `${year} ${TITLE_SUFFIX}` : TITLE_SUFFIX;
  refs.title.textContent = text;
  document.title = text;
}

export function setSync(result) {
  let state = 'local';
  let text = 'Saved results';
  if (result.source === 'sheet') {
    state = 'live';
    const stamp = result.updated ? new Date(result.updated) : new Date();
    text = `Synced with Google Sheets at ${stamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`;
  } else if (result.sheetFailed) {
    state = 'error';
    text = 'Sheet unreachable, showing saved results';
  }
  refs.sync.dataset.state = state;
  refs.syncText.textContent = text;
  refs.sync.title = result.failures && result.failures.length ? result.failures.join('\n') : text;
}

function animateValue(node, end, duration) {
  const start = Number(node.textContent.replace(/,/g, '')) || 0;
  if (start === end) {
    node.textContent = formatNumber(end);
    return;
  }
  let startTime = null;
  function frame(time) {
    if (startTime === null) {
      startTime = time;
    }
    const progress = Math.min((time - startTime) / duration, 1);
    node.textContent = formatNumber(Math.floor(start + (end - start) * progress));
    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      node.textContent = formatNumber(end);
    }
  }
  requestAnimationFrame(frame);
}

export function renderHeader(summary) {
  const gopName = summary.gopCandidate || 'Republican';
  const demName = summary.demCandidate || 'Democrat';
  const namesKey = `${gopName}|${demName}`;

  if (namesKey !== renderedNames) {
    renderedNames = namesKey;
    mountAvatar(refs.avatarGop, gopName, 'gop');
    mountAvatar(refs.avatarDem, demName, 'dem');
    refs.nameGop.textContent = shortName(gopName);
    refs.nameDem.textContent = shortName(demName);
    refs.nameInd.textContent = shortName(summary.indCandidate || 'Independent');
  }

  animateValue(refs.evGop, summary.gopEV, 600);
  animateValue(refs.evDem, summary.demEV, 600);

  const pct = value => (summary.totalPV > 0 ? (value / summary.totalPV) * 100 : 0);
  refs.pvGop.textContent = `${formatNumber(summary.gopPV)} votes · ${pct(summary.gopPV).toFixed(1)}%`;
  refs.pvDem.textContent = `${formatNumber(summary.demPV)} votes · ${pct(summary.demPV).toFixed(1)}%`;
  refs.pvInd.textContent = `${summary.indEV} EV · ${formatNumber(summary.indPV)} votes (${pct(summary.indPV).toFixed(1)}%)`;
  refs.indWrap.hidden = summary.indPV <= 0 && summary.indEV <= 0;

  const reporting =
    summary.totalExpected > 0 ? Math.min(100, (summary.totalPV / summary.totalExpected) * 100) : 0;
  refs.reporting.textContent = `${formatReporting(reporting)} of votes counted`;

  refs.barGop.style.width = `${(summary.gopEV / TOTAL_EV) * 100}%`;
  refs.barDem.style.width = `${(summary.demEV / TOTAL_EV) * 100}%`;
  refs.barInd.style.width = `${(summary.indEV / TOTAL_EV) * 100}%`;
  refs.barInd.style.right = `${(summary.demEV / TOTAL_EV) * 100}%`;
}
