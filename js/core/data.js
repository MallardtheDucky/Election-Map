import {
  GEOMETRY_URL,
  LOCAL_RESULTS_URL,
  SHEET_URL,
  EXCLUDED_REGIONS
} from './config.js';

const INLINE = window.APRP_INLINE || null;

function sheetUrl() {
  const fromAddress = new URLSearchParams(window.location.search).get('sheet');
  return (fromAddress || SHEET_URL || '').trim();
}

async function fetchJson(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Reply was not JSON (check that the web app access is set to Anyone)');
  }
}

function toRecord(raw) {
  const name = raw.name || raw.NAME || raw.STATE_NAME;
  if (!name) {
    return null;
  }
  return {
    name,
    abbr: raw.abbr || '',
    electoralVotes: Number(raw.electoral_votes) || 0,
    votesGop: Number(raw.votes_gop) || 0,
    votesDem: Number(raw.votes_dem) || 0,
    votesInd: Number(raw.votes_ind) || 0,
    reporting: Number(raw.reporting) || 0,
    called: typeof raw.called === 'boolean' ? raw.called : null,
    gopCandidate: raw.gop_candidate || '',
    demCandidate: raw.dem_candidate || '',
    indCandidate: raw.ind_candidate || ''
  };
}

function parseResults(payload) {
  if (payload && payload.error) {
    throw new Error(payload.error);
  }
  let rows = [];
  if (payload && payload.type === 'FeatureCollection' && Array.isArray(payload.features)) {
    rows = payload.features.map(feature => feature.properties || {});
  } else if (payload && Array.isArray(payload.states)) {
    rows = payload.states;
  } else if (Array.isArray(payload)) {
    rows = payload;
  } else {
    throw new Error('Results are not in a recognised format');
  }
  const records = rows.map(toRecord).filter(Boolean);
  if (!records.length) {
    throw new Error('Results contain no states');
  }
  return {
    records,
    year: payload && payload.year ? payload.year : null,
    updated: payload && payload.updated ? payload.updated : null
  };
}

export async function loadResults() {
  const failures = [];
  const live = sheetUrl();

  if (live) {
    try {
      const joiner = live.includes('?') ? '&' : '?';
      const payload = await fetchJson(`${live}${joiner}t=${Date.now()}`);
      return { ...parseResults(payload), source: 'sheet' };
    } catch (error) {
      failures.push(`Google Sheet: ${error.message}`);
    }
  }

  try {
    const payload = INLINE && INLINE.results ? INLINE.results : await fetchJson(LOCAL_RESULTS_URL);
    return { ...parseResults(payload), source: 'local', sheetFailed: Boolean(live), failures };
  } catch (error) {
    failures.push(`Saved copy: ${error.message}`);
  }
  throw new Error(failures.join(' | '));
}

export async function loadGeometry() {
  const topology = INLINE && INLINE.geo ? INLINE.geo : await fetchJson(GEOMETRY_URL);
  const objectName = Object.keys(topology.objects)[0];
  const collection = topojson.feature(topology, topology.objects[objectName]);
  const features = collection.features
    .filter(feature => !EXCLUDED_REGIONS.includes(feature.properties.shapeName))
    .map(feature => ({
      type: 'Feature',
      id: feature.properties.shapeISO,
      properties: { name: feature.properties.shapeName, iso: feature.properties.shapeISO },
      geometry: feature.geometry
    }));
  return { type: 'FeatureCollection', features };
}
