export const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxdhd2e15iRDB0KKSy0Z6girhkIYRptpxofJWVGD7d8LSiW1kkyUmf1Gy2mUiJcbFdK/exec';

export const TITLE_SUFFIX = 'Election Center';

export const WIN_NUMBER = 270;
export const TOTAL_EV = 538;

export const GEOMETRY_URL = 'data/geo/geoBoundaries-USA-ADM1_simplified.topojson';
export const LOCAL_RESULTS_URL = 'data/results.json';

export const AUTO_REFRESH_MS = 30000;

export const EXCLUDED_REGIONS = [
  'American Samoa',
  'Commonwealth of the Northern Mariana Islands',
  'Guam',
  'Puerto Rico',
  'United States Virgin Islands'
];

export const CANDIDATE_IMAGES = {
  'Jay Rockefeller': 'images/Jay_Rockefeller_portrait (3).jpg'
};

export const SMALL_STATES = ['VT', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'DC'];

export const ZOOM = {
  min: 1,
  max: 10,
  stateMax: 8,
  padding: 0.82
};

export const COLORS = {
  'Solid GOP': '#c0283a',
  'Likely GOP': '#d8505a',
  'Lean GOP': '#e5808a',
  'Tilt GOP': '#f0b0b6',
  'Tilt DEM': '#a9c9f1',
  'Lean DEM': '#75a8e8',
  'Likely DEM': '#3f82d9',
  'Solid DEM': '#1f5fbf',
  'Tilt IND': '#d3c1ee',
  'Lean IND': '#b498df',
  'Likely IND': '#9570cf',
  'Solid IND': '#7347b4',
  Tossup: '#e2b64a',
  Uncalled: '#3a4766',
  'No Data': '#18203a'
};
