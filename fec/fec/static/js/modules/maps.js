import { default as chroma } from 'chroma-js';
import d3 from 'd3';
import { default as L } from 'leaflet';
import { feature } from 'topojson-client/dist/topojson-client.js';
import _, {
  chain as _chain,
  each as _each,
  find as _find,
  keys as _keys,
  last as _last,
  max as _max,
  min as _min,
  pluck as _pluck,
  reduce as _reduce,
  values as _values
} from 'underscore';
import 'leaflet-providers';

import { encodeDistrict, findDistrict } from './election-utils.js';
import { fipsByCode, fipsByState } from './fips.js';
import { buildUrl, currency } from './helpers.js';
import { default as states } from '../data/us-states-10m.json' assert { type: 'json' };
import { default as candidateStateMapTemplate } from '../templates/candidateStateMap.hbs';

const stateFeatures = feature(states, states.objects.states).features;
const stateFeatureMap = _.chain(stateFeatures)
  .map(function(feature) {
    return [feature.id, feature];
  })
  .object()
  .value();

export const colorZero = '#ffffff';
export const colorScale = ['#e2ffff', '#278887'];
const compactRules = [['B', 9], ['M', 6], ['k', 3], ['', 0]];
const MAX_MAPS = 2;

const template_tooltip = value => `
  <div class="tooltip__title">${value.name}</div>
  <div class="tooltip__value">${value.total}</div>
`;

function chooseRule(value) {
  return _find(compactRules, function(rule) {
    return value >= Math.pow(10, rule[1]);
  });
}

function compactNumber(value, rule) {
  const divisor = Math.pow(10, rule[1]);
  return d3.round(value / divisor, 1).toString() + rule[0];
}

export function stateMap($elm, data, width, height, min, max, addLegend, addTooltips) {
  const svg = d3
    .select($elm[0])
    .append('svg')
    .attr('width', width)
    .attr('height', height);
    const projection = d3.geo
    .albersUsa()
    .scale(450)
    .translate([220, 150]);
  const path = d3.geo.path().projection(projection);

  const results = _reduce(
    data.results,
    function(acc, val) {
      const row = fipsByState[val.state] || {};
      const code = row.STATE ? parseInt(row.STATE) : null;
      acc[code] = val.total;
      return acc;
    },
    {}
  );
  const quantiles = 4;
  const totals = _chain(data.results)
    .pluck('total')
    .filter(function(value) {
      return !!value;
    })
    .value();
  min = min || _min(totals);
  max = max || _max(totals);
  const scale = chroma.scale(colorScale).domain([min, max]);
  const quantize = d3.scale.linear().domain([min, max]);
  svg
    .append('g')
    .selectAll('path')
    .data(stateFeatures)
    .enter()
    .append('path')
    .attr('fill', function(d) {
      return results[d.id] ? scale(results[d.id]) : colorZero;
    })
    .attr('data-state', function(d) {
      return fipsByCode[d.id].STATE_NAME;
    })
    .attr('class', 'shape')
    .attr('d', path)
    .on('mouseover', function(d) {
      if (results[d.id]) {
        this.parentNode.appendChild(this);
        this.classList.add('state--hover');
      }
    });

  if (addLegend || typeof addLegend === 'undefined') {
    const legendSVG = d3.select('.legend-container svg');
    stateLegend(legendSVG, scale, quantize, quantiles);
  }

  if (addTooltips) {
    stateTooltips(svg, path, results);
  }
}

export function stateLegend(svg, scale, quantize, quantiles) {
  // Add legend swatches
  const legendWidth = 40;
  const legendBar = 35;
  const ticks = quantize.ticks(quantiles);
  const legend = svg
    .selectAll('g.legend')
    .data(ticks)
    .enter()
    .append('g')
    .attr('class', 'legend');
  legend
    .append('rect')
    .attr('x', function(d, i) {
      return i * legendWidth + (legendWidth - legendBar) / 2;
    })
    .attr('y', 0)
    .attr('width', legendBar)
    .attr('height', 20)
    .style('fill', function(d) {
      return scale(d);
    });

  // Add legend text
  const compactRule = chooseRule(ticks[Math.ceil(ticks.length / 2)]);
  legend
    .append('text')
    .attr('x', function(d, i) {
      return (i + 0.5) * legendWidth;
    })
    .attr('y', 30)
    .attr('width', legendWidth)
    .attr('height', 20)
    .attr('font-size', '10px')
    .attr('text-anchor', 'middle')
    .text(function(d) {
      return '$' + compactNumber(d, compactRule).toString();
    });
}

function stateTooltips(svg, path, results) {
  const tooltip = d3
    .select('body')
    .append('div')
    .attr('id', 'map-tooltip')
    .attr('class', 'tooltip tooltip--above tooltip--mouse')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('visibility', 'hidden');
  svg
    .selectAll('path')
    .on('mouseover', function(d) {
      this.parentNode.appendChild(this);
      const html = template_tooltip({
        name: fipsByCode[d.id].STATE_NAME,
        total: currency(results[d.id] || 0)
      });
      tooltip.style('visibility', 'visible').html(html);
      moveTooltip(tooltip);
    })
    .on('mouseout', function() {
      tooltip.style('visibility', 'hidden');
    })
    .on('mousemove', function() {
      moveTooltip(tooltip);
    });
}

function moveTooltip(tooltip) {
  const x = d3.event.pageX - tooltip[0][0].offsetWidth / 2;
  const y = d3.event.pageY - tooltip[0][0].offsetHeight;

  const bottomPointerHeight = '.8rem';

  let contentHeight = $('#map-tooltip .tooltip__title').innerHeight();
  contentHeight += $('#map-tooltip .tooltip__value').innerHeight();
  contentHeight += 30; // (padding)

  tooltip
    .style('left', x + 'px')
    .style('top', 'calc(' + y + 'px - ' + bottomPointerHeight + ')')
    .style('height', contentHeight + 'px');
}

export function highlightState($parent, state) {
  const rule = '[data-state="' + state + '"]';
  $parent.find('path:not(' + rule + ')').each(function(idx, elm) {
    elm.classList.remove('active');
  });
  const $path = $parent.find('path' + rule);
  if ($path.length) {
    $path[0].classList.add('active');
  }
}

export function DistrictMap(elm, style) {
  this.elm = elm;
  this.style = style;
  this.map = null;
  this.overlay = null;
}

DistrictMap.prototype.load = function(election) {
  let feature;
  if (election.district) {
    const encoded = encodeDistrict(election.state, election.district);
    feature = findDistrict(encoded);
  } else if (election.state) {
    const state = fipsByState[election.state.toUpperCase()];
    if (state) {
      feature = stateFeatureMap[state.STATE];
    }
  }
  feature && this.render(feature);
};

DistrictMap.prototype.render = function(data) {
  this.elm.setAttribute('aria-hidden', 'false');
  this.map = L.map(this.elm);
  L.tileLayer.provider('Stadia.StamenTonerLite').addTo(this.map);
  this.overlay = L.geoJson(data, { style: this.style }).addTo(this.map);
  this.map.fitBounds(this.overlay.getBounds());
};

function mapMin(cached) {
  return _chain(cached)
    .map(function(value) {
      return _chain(value)
        .values()
        .filter(function(value) {
          return !!value;
        })
        .min()
        .value();
    })
    .min()
    .value();
}

function mapMax(cached) {
  return _chain(cached)
    .map(function(value) {
      return _max(_values(value));
    })
    .max()
    .value();
}

function updateColorScale($container, cached) {
  $container = $container.closest('#state-maps');
  const displayed = $container
    .find('.state-map select')
    .map(function(_, select) {
      return $(select).val();
    })
    .get();
  _each(_keys(cached), function(key) {
    if (displayed.indexOf(key) === -1) {
      delete cached[key];
    }
  });
  const min = mapMin(cached);
  const max = mapMax(cached);
  const scale = chroma.scale(colorScale).domain([min, max]);
  const quantize = d3.scale.linear().domain([min, max]);
  $container.find('.state-map').each(function(_, elm) {
    const $elm = $(elm);
    const results = cached[$elm.find('select').val()];
    d3.select($elm.find('g')[0])
      .selectAll('path')
      .attr('fill', function(d) {
        return results[d.id] ? scale(results[d.id]) : colorZero;
      });
  });
  $container.find('.legend-container svg g').remove();
  const svg = d3.select($container.get(0)).select('.legend-container svg');
  if (isFinite(max)) {
    stateLegend(svg, scale, quantize, 4);
  }
}

function updateButtonsDisplay($parent) {
  const $maps = $parent.find('.state-map');
  const showAdd = $maps.length < MAX_MAPS ? 'block' : 'none';
  const showRemove = $maps.length > 1 ? 'block' : 'none';
  $parent.find('.js-add-map').css('display', showAdd);
  $parent.find('.js-remove-map').css('display', showRemove);
}

function appendStateMap($parent, results, cached) {
  const ids = _pluck(results, 'candidate_id');
  const displayed = $parent
    .find('.candidate-select')
    .map(function(_, select) {
      return $(select).val();
    })
    .get();
    const value =
    _find(ids, function(each) {
      return displayed.indexOf(each) === -1;
    }) || _last(ids);
  $parent.append(candidateStateMapTemplate(results));
  const $select = $parent.find('.state-map:last select');
  $select.val(value);
  $select.trigger('change');
  updateButtonsDisplay($parent);
  updateColorScale($parent, cached);
}

function drawStateMap($container, candidateId, cached) {
  const url = buildUrl(
    ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    {
      cycle: global.context.election.cycle,
      candidate_id: candidateId,
      per_page: 99,
      election_full: true
    }
  );
  const $map = $container.find('.state-map-choropleth');
  $map.html('');
  $.getJSON(url).done(function(data) {
    const results = _reduce(
      data.results,
      function(acc, val) {
        const state = val.state ? val.state.toUpperCase() : val.state;
        const row = fipsByState[state] || {};
        const code = row.STATE ? parseInt(row.STATE) : null;
        acc[code] = val.total;
        return acc;
      },
      {}
    );
    cached[candidateId] = results;
    updateColorScale($container, cached);
    const min = mapMin(cached);
    const max = mapMax(cached);
    stateMap($map, data, 400, 300, min, max, false, true);
  });
}

export function initStateMaps(results) {
  const cached = {};
  const $stateMaps = $('#state-maps');
  const $choropleths = $stateMaps.find('.choropleths');
  appendStateMap($choropleths, results, cached);

  $choropleths.on('change', 'select', function(e) {
    const $target = $(e.target);
    const $parent = $target.closest('.state-map');
    drawStateMap($parent, $target.val(), cached);
  });

  $choropleths.on('click', '.js-add-map', function() {
    appendStateMap($choropleths, results, cached);
  });

  $choropleths.on('click', '.js-remove-map', function(e) {
    const $target = $(e.target);
    const $parent = $target.closest('.state-map');
    const $container = $parent.closest('#state-maps');
    $parent.remove();
    updateButtonsDisplay($container);
    updateColorScale($container, cached);
  });
  $choropleths.find('.state-map').remove();
  appendStateMap($choropleths, results, cached);
}
