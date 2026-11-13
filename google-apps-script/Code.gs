const SHEET_NAME = 'Sheet1';
const CACHE_SECONDS = 10;

function doGet() {
  let body;
  try {
    const cache = CacheService.getScriptCache();
    body = cache.get('results');
    if (!body) {
      body = JSON.stringify(buildResults_());
      cache.put('results', body, CACHE_SECONDS);
    }
  } catch (error) {
    body = JSON.stringify({ error: String(error && error.message ? error.message : error), states: [] });
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function buildResults_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME) || book.getSheets()[0];
  const values = sheet.getDataRange().getValues();
  const header = values[0].map(function (h) { return String(h).trim().toUpperCase(); });

  const need = function (name) {
    const index = header.indexOf(name);
    if (index === -1) throw new Error('Column "' + name + '" not found in row 1 of ' + sheet.getName());
    return index;
  };
  const col = {
    year: need('YEAR'),
    abbr: need('ABBREVIATIONS'),
    name: need('STATES'),
    ev: need('ELECTORAL VOTES'),
    candA: need('CANDIDATE A'),
    candB: need('CANDIDATE B'),
    gop: need('GOP VOTES'),
    dem: need('DNC VOTES'),
    counted: need('REPORTING'),
    total: need('TOTAL VOTES'),
    winner: need('WINNER'),
    candC: header.indexOf('CANDIDATE C'),
    ind: header.indexOf('IND VOTES')
  };

  const num = function (v) { const n = Number(v); return isFinite(n) ? n : 0; };

  let rows = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const abbr = String(r[col.abbr]).trim().toUpperCase();
    if (abbr === 'NATIONAL') break;
    if (abbr.length !== 2 || !String(r[col.name]).trim()) continue;
    rows.push(r);
  }


  const year = rows.reduce(function (max, r) { return Math.max(max, num(r[col.year])); }, 0);
  if (year) rows = rows.filter(function (r) { return num(r[col.year]) === year; });

  const states = rows.map(function (r) {
    const gop = Math.round(num(r[col.gop]));
    const dem = Math.round(num(r[col.dem]));
    const ind = col.ind === -1 ? 0 : Math.round(num(r[col.ind]));
    const total = num(r[col.total]);
    const counted = num(r[col.counted]) || gop + dem + ind;
    const reporting = total > 0 ? Math.min(100, Math.round((counted / total) * 10000) / 100) : 0;
    const candA = String(r[col.candA]).trim();
    const candB = String(r[col.candB]).trim();
    const candC = col.candC === -1 ? 'Independent' : String(r[col.candC]).trim() || 'Independent';
    const winner = String(r[col.winner]).trim().toLowerCase();
    const called = winner !== '' && [candA, candB, candC].some(function (name) { return name.toLowerCase() === winner; });

    return {
      name: titleCase_(String(r[col.name])),
      abbr: String(r[col.abbr]).trim().toUpperCase(),
      electoral_votes: num(r[col.ev]),
      votes_gop: gop,
      votes_dem: dem,
      votes_ind: ind,
      reporting: reporting,
      gop_candidate: candA,
      dem_candidate: candB,
      ind_candidate: candC,
      called: called
    };
  });

  return { year: year || null, updated: new Date().toISOString(), states: states };
}

function titleCase_(text) {
  return text.trim().toLowerCase().replace(/\b[a-z]+/g, function (word) {
    return word === 'of' ? word : word.charAt(0).toUpperCase() + word.slice(1);
  });
}
