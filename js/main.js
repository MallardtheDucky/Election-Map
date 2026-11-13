import { WIN_NUMBER, AUTO_REFRESH_MS } from './core/config.js';
import { loadGeometry, loadResults } from './core/data.js';
import { evaluate, summarize } from './core/election.js';
import { byId } from './core/utils.js';
import { createMap } from './ui/map.js';
import { setTitle, setSync, renderHeader } from './ui/header.js';
import { initSidebar, renderSidebar, toggleSidebar, setSidebar, isSidebarOpen } from './ui/sidebar.js';
import { renderTicker } from './ui/ticker.js';
import { initLegend } from './ui/legend.js';
import { checkWinner } from './ui/winner.js';
import { showTooltip, hideTooltip, showPopup, hidePopup, isPopupOpen } from './ui/popup.js';
import { renderSmallStates, highlightSmallState } from './ui/smallStates.js';
import { showLoader, hideLoader, showLoaderError } from './ui/loader.js';

const SIDEBAR_WIDTH = 300;
const MOBILE_BREAKPOINT = 600;

let geometry = null;
let map = null;
let states = [];
let busy = false;

function sidebarInset() {
  return isSidebarOpen() && window.innerWidth > MOBILE_BREAKPOINT ? SIDEBAR_WIDTH : 0;
}

function clearSelection() {
  hidePopup();
  hideTooltip();
  map.select(null);
  highlightSmallState(null);
}

function selectState(state, point) {
  if (!state) {
    clearSelection();
    return;
  }
  map.select(state.name);
  highlightSmallState(state.name);
  showPopup(state, point);
}

function focusState(state) {
  const stage = byId('stage').getBoundingClientRect();
  map.select(state.name);
  highlightSmallState(state.name);
  map.zoomToState(state.name, sidebarInset());
  hidePopup();
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    setSidebar(false);
  }
  return stage;
}

function render(result) {
  setTitle(result.year);
  setSync(result);
  states = result.records.map(evaluate);
  const summary = summarize(states);
  map.update(states);
  renderHeader(summary);
  renderSidebar(states);
  renderTicker(states);
  renderSmallStates(states, (state, point) => selectState(state, point));
  highlightSmallState(map.selectedState());
  checkWinner(summary, WIN_NUMBER);
}

async function refresh() {
  if (busy) {
    return;
  }
  busy = true;
  const icon = document.querySelector('#btn-refresh .icon');
  icon.classList.add('spin');
  try {
    render(await loadResults());
  } catch (error) {
    console.error(error);
  } finally {
    setTimeout(() => icon.classList.remove('spin'), 800);
    busy = false;
  }
}

async function start() {
  showLoader();
  try {
    const [geo, results] = await Promise.all([
      geometry ? Promise.resolve(geometry) : loadGeometry(),
      loadResults()
    ]);
    geometry = geo;

    if (!map) {
      map = createMap(byId('map'), geometry, {
        onHover: (state, point) => {
          if (state && !isPopupOpen()) {
            showTooltip(state, point);
          } else {
            hideTooltip();
          }
        },
        onSelect: selectState
      });
    }

    render(results);
    hideLoader();
  } catch (error) {
    console.error(error);
    showLoaderError(
      'The election data did not load',
      error.message,
      'Serve this folder over HTTP (for example: python3 -m http.server) rather than opening index.html directly.'
    );
  }
}

function bindControls() {
  byId('btn-reset').addEventListener('click', () => {
    clearSelection();
    map.reset();
  });
  byId('btn-refresh').addEventListener('click', refresh);
  byId('btn-sidebar').addEventListener('click', toggleSidebar);
  byId('zoom-in').addEventListener('click', () => map.zoomBy(1.6));
  byId('zoom-out').addEventListener('click', () => map.zoomBy(1 / 1.6));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      clearSelection();
    }
  });

  let resizeFrame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (map) {
        map.layout();
      }
    });
  }).observe(byId('map'));

  window.addEventListener('aprp:retry', start);
}

setTitle(null);
initLegend();
initSidebar({ onPick: focusState });
bindControls();
start();

if (AUTO_REFRESH_MS > 0) {
  setInterval(refresh, AUTO_REFRESH_MS);
}
