import { COLORS, SMALL_STATES, ZOOM } from '../core/config.js';

function largestPolygon(feature) {
  const geometry = feature.geometry;
  if (geometry.type !== 'MultiPolygon') {
    return feature;
  }
  let best = null;
  let bestArea = -1;
  geometry.coordinates.forEach(coordinates => {
    const polygon = { type: 'Feature', geometry: { type: 'Polygon', coordinates } };
    const area = d3.geoArea(polygon);
    if (area > bestArea) {
      bestArea = area;
      best = polygon;
    }
  });
  return best;
}

function labelColor(fill) {
  return d3.lab(fill).l > 68 ? '#0f172a' : '#ffffff';
}

export function createMap(container, geometry, handlers) {
  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'map-svg')
    .attr('role', 'img')
    .attr('aria-label', 'United States election map');

  const defs = svg.append('defs');
  const hatch = defs
    .append('pattern')
    .attr('id', 'hatch')
    .attr('width', 7)
    .attr('height', 7)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', 'rotate(45)');
  hatch.append('rect').attr('width', 7).attr('height', 7).attr('fill', 'transparent');
  hatch.append('rect').attr('width', 2.2).attr('height', 7).attr('fill', 'rgba(10, 15, 30, 0.26)');

  const background = svg.append('rect').attr('class', 'map-background');
  const viewport = svg.append('g').attr('class', 'viewport');
  const statesLayer = viewport.append('g').attr('class', 'states');
  const hatchLayer = viewport.append('g').attr('class', 'hatches');
  const labelsLayer = svg.append('g').attr('class', 'labels');

  const projection = d3.geoAlbersUsa();
  const path = d3.geoPath(projection);

  let width = 0;
  let height = 0;
  let transform = d3.zoomIdentity;
  let stateByName = new Map();
  const stateFor = feature => stateByName.get(feature.properties.name.toLowerCase());
  let selectedName = null;
  let geometryCache = new Map();

  const zoom = d3
    .zoom()
    .scaleExtent([ZOOM.min, ZOOM.max])
    .on('zoom', event => {
      transform = event.transform;
      viewport.attr('transform', transform.toString());
      positionLabels();
    });

  svg.call(zoom).on('dblclick.zoom', null);

  const paths = statesLayer
    .selectAll('path')
    .data(geometry.features, feature => feature.id)
    .join('path')
    .attr('class', 'state')
    .attr('data-iso', feature => feature.id)
    .on('mouseenter mousemove', (event, feature) => {
      const state = stateFor(feature);
      if (state) {
        handlers.onHover(state, d3.pointer(event, container));
      }
    })
    .on('mouseleave', () => handlers.onHover(null))
    .on('click', (event, feature) => {
      event.stopPropagation();
      const state = stateFor(feature);
      if (state) {
        handlers.onSelect(state, d3.pointer(event, container));
      }
    });

  background.on('click', () => handlers.onSelect(null));

  const hatches = hatchLayer
    .selectAll('path')
    .data(geometry.features, feature => feature.id)
    .join('path')
    .attr('class', 'state-hatch')
    .attr('fill', 'url(#hatch)')
    .attr('opacity', 0);

  const labels = labelsLayer
    .selectAll('text')
    .data(geometry.features, feature => feature.id)
    .join('text')
    .attr('class', 'label')
    .attr('text-anchor', 'middle');

  function layout() {
    const box = container.getBoundingClientRect();
    width = Math.max(box.width, 1);
    height = Math.max(box.height, 1);

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);
    background.attr('width', width).attr('height', height);

    const padX = Math.max(12, width * 0.02);
    const padTop = Math.max(12, height * 0.04);
    const padBottom = Math.max(12, height * 0.06);
    projection.fitExtent(
      [
        [padX, padTop],
        [width - padX, height - padBottom]
      ],
      geometry
    );

    geometryCache = new Map();
    geometry.features.forEach(feature => {
      const bounds = path.bounds(feature);
      const anchor = path.centroid(largestPolygon(feature));
      geometryCache.set(feature.id, { bounds, anchor });
    });

    paths.attr('d', path);
    hatches.attr('d', path);

    zoom
      .extent([
        [0, 0],
        [width, height]
      ])
      .translateExtent([
        [0, 0],
        [width, height]
      ]);

    positionLabels();
  }

  function fillFor(feature) {
    const state = stateFor(feature);
    return COLORS[state ? state.status : 'No Data'] || COLORS['No Data'];
  }

  function positionLabels() {
    labels.each(function (feature) {
      const node = d3.select(this);
      const cache = geometryCache.get(feature.id);
      const state = stateFor(feature);
      if (!cache || !state || !state.hasData || !state.abbr || !isFinite(cache.anchor[0])) {
        node.attr('display', 'none');
        return;
      }
      const spanX = (cache.bounds[1][0] - cache.bounds[0][0]) * transform.k;
      const spanY = (cache.bounds[1][1] - cache.bounds[0][1]) * transform.k;
      const span = Math.min(spanX, spanY * 1.6);
      const minimum = SMALL_STATES.includes(state.abbr) ? 64 : 26;
      if (span < minimum) {
        node.attr('display', 'none');
        return;
      }
      const showVotes = span >= 44;
      const x = transform.applyX(cache.anchor[0]);
      const y = transform.applyY(cache.anchor[1]);
      node
        .attr('display', null)
        .attr('transform', `translate(${x},${y})`)
        .attr('fill', labelColor(fillFor(feature)))
        .attr('data-tone', d3.lab(fillFor(feature)).l > 68 ? 'dark' : 'light');
      node.selectAll('tspan').remove();
      node
        .append('tspan')
        .attr('class', 'label-abbr')
        .attr('x', 0)
        .attr('dy', showVotes ? '-0.15em' : '0.35em')
        .text(state.abbr);
      if (showVotes) {
        node
          .append('tspan')
          .attr('class', 'label-ev')
          .attr('x', 0)
          .attr('dy', '1.15em')
          .text(state.electoralVotes);
      }
    });
  }

  function update(states) {
    stateByName = new Map(states.map(state => [state.name.toLowerCase(), state]));
    paths
      .transition()
      .duration(600)
      .attr('fill', fillFor);
    hatches
      .transition()
      .duration(600)
      .attr('opacity', feature => {
        const state = stateFor(feature);
        return state && state.hasData && state.total > 0 && !state.called ? 1 : 0;
      });
    positionLabels();
  }

  function select(name) {
    selectedName = name;
    paths.classed('selected', feature => feature.properties.name.toLowerCase() === (name || '').toLowerCase());
    if (name) {
      paths.filter(feature => feature.properties.name.toLowerCase() === name.toLowerCase()).raise();
    }
  }

  function zoomToState(name, insetRight = 0) {
    const feature = geometry.features.find(item => item.properties.name.toLowerCase() === name.toLowerCase());
    const cache = feature ? geometryCache.get(feature.id) : null;
    if (!cache) {
      return;
    }
    const [[x0, y0], [x1, y1]] = cache.bounds;
    const availableWidth = Math.max(width - insetRight, width * 0.4);
    const dx = Math.max(x1 - x0, 1);
    const dy = Math.max(y1 - y0, 1);
    const scale = Math.min(
      ZOOM.stateMax,
      ZOOM.padding / Math.max(dx / availableWidth, dy / height)
    );
    const target = d3.zoomIdentity
      .translate(availableWidth / 2 - scale * ((x0 + x1) / 2), height / 2 - scale * ((y0 + y1) / 2))
      .scale(scale);
    svg.transition().duration(750).call(zoom.transform, target);
  }

  function zoomBy(factor) {
    svg.transition().duration(300).call(zoom.scaleBy, factor);
  }

  function reset() {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  }

  function selectedState() {
    return selectedName;
  }

  layout();

  return { update, select, zoomToState, zoomBy, reset, layout, selectedState };
}
