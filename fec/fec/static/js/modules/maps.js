'use strict';

const $ = require('jquery');
const _ = require('underscore');
const d3 = Object.assign(
  {},
  require('d3-geo'), // d3.geo, etc
  require('d3-scale'), // d3.scaleTime
  require('d3-selection') // d3.select, d3.event
);
const chroma = require('chroma-js');
const topojson = require('topojson');

const L = require('leaflet');
require('leaflet-providers');

const fips = require('./fips');
const helpers = require('./helpers');
const utils = require('./election-utils');

const states = require('../data/us-states-10m.json');

const candidateStateMapTemplate = require('../templates/candidateStateMap.hbs');

const stateFeatures = topojson.feature(states, states.objects.states).features;
const stateFeatureMap = _.chain(stateFeatures)
  .map(function(feature) {
    return [feature.id, feature];
  })
  .object()
  .value();

const colorZero = '#ffffff';
const colorScale = ['#e2ffff', '#278887'];
const compactRules = [['B', 9], ['M', 6], ['k', 3], ['', 0]];
const MAX_MAPS = 2;

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

function chooseRule(value) {
  return _.find(compactRules, function(rule) {
    return value >= Math.pow(10, rule[1]);
  });
}

function compactNumber(value, rule) {
  let divisor = Math.pow(10, rule[1]);
  return d3.round(value / divisor, 1).toString() + rule[0];
}

function stateMap($elm, data, width, height, min, max, addLegend, addTooltips) {
  let svg = d3
    .select($elm[0])
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  let projection = d3.geo
    .albersUsa()
    .scale(450)
    .translate([220, 150]);
  let path = d3.geoPath().projection(projection);

  let results = _.reduce(
    data.results,
    function(acc, val) {
      let row = fips.fipsByState[val.state] || {};
      let code = row.STATE ? parseInt(row.STATE) : null;
      acc[code] = val.total;
      return acc;
    },
    {}
  );
  let quantiles = 4;
  let totals = _.chain(data.results)
    .pluck('total')
    .filter(function(value) {
      return !!value;
    })
    .value();
  min = min || _.min(totals);
  max = max || _.max(totals);
  let scale = chroma.scale(colorScale).domain([min, max]);
  let quantize = d3.scaleLinear().domain([min, max]);
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
      return fips.fipsByCode[d.id].STATE_NAME;
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
    let legendSVG = d3.select('.legend-container svg');
    stateLegend(legendSVG, scale, quantize, quantiles);
  }

  if (addTooltips) {
    stateTooltips(svg, path, results);
  }
}

function stateLegend(svg, scale, quantize, quantiles) {
  // Add legend swatches
  let legendWidth = 40;
  let legendBar = 35;
  let ticks = quantize.ticks(quantiles);
  let legend = svg
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
  let compactRule = chooseRule(ticks[Math.ceil(ticks.length / 2)]);
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

let tooltipTemplate = _.template(
  '<div class="tooltip__title">{{ name }}</div>' +
    '<div class="tooltip__value">{{ total }}</div>'
);

function stateTooltips(svg, path, results) {
  let tooltip = d3
    .select('body')
    .append('div')
    .attr('id', 'map-tooltip')
    .attr('class', 'tooltip tooltip--above tooltip--mouse')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('display', 'none');
  svg
    .selectAll('path')
    .on('mouseover', function(d) {
      this.parentNode.appendChild(this);
      let html = tooltipTemplate({
        name: fips.fipsByCode[d.id].STATE_NAME,
        total: helpers.currency(results[d.id] || 0)
      });
      tooltip.style('display', 'block').html(html);
      moveTooltip(tooltip);
    })
    .on('mouseout', function() {
      tooltip.style('display', 'none');
    })
    .on('mousemove', function() {
      moveTooltip(tooltip);
    });
}

function moveTooltip(tooltip) {
  let x = d3.event.pageX - tooltip[0][0].offsetWidth / 2;
  let y = d3.event.pageY - tooltip[0][0].offsetHeight;

  let bottomPointerHeight = '.8rem';

  let contentHeight = $('#map-tooltip .tooltip__title').innerHeight();
  contentHeight += $('#map-tooltip .tooltip__value').innerHeight();
  contentHeight += 30; // (padding)

  tooltip
    .style('left', x + 'px')
    .style('top', 'calc(' + y + 'px - ' + bottomPointerHeight + ')')
    .style('height', contentHeight + 'px');
}

function highlightState($parent, state) {
  let rule = '[data-state="' + state + '"]';
  $parent.find('path:not(' + rule + ')').each(function(idx, elm) {
    elm.classList.remove('active');
  });
  let $path = $parent.find('path' + rule);
  if ($path.length) {
    $path[0].classList.add('active');
  }
}

function DistrictMap(elm, style) {
  this.elm = elm;
  this.style = style;
  this.map = null;
  this.overlay = null;
}

DistrictMap.prototype.load = function(election) {
  let feature;
  if (election.district) {
    let encoded = utils.encodeDistrict(election.state, election.district);
    feature = utils.findDistrict(encoded);
  } else if (election.state) {
    let state = fips.fipsByState[election.state.toUpperCase()];
    if (state) {
      feature = stateFeatureMap[state.STATE];
    }
  }
  feature && this.render(feature);
};

DistrictMap.prototype.render = function(data) {
  this.elm.setAttribute('aria-hidden', 'false');
  this.map = L.map(this.elm);
  L.tileLayer.provider('Stamen.TonerLite').addTo(this.map);
  this.overlay = L.geoJson(data, { style: this.style }).addTo(this.map);
  this.map.fitBounds(this.overlay.getBounds());
};

function mapMin(cached) {
  return _.chain(cached)
    .map(function(value) {
      return _.chain(value)
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
  return _.chain(cached)
    .map(function(value) {
      return _.max(_.values(value));
    })
    .max()
    .value();
}

function updateColorScale($container, cached) {
  $container = $container.closest('#state-maps');
  let displayed = $container
    .find('.state-map select')
    .map(function(_, select) {
      return $(select).val();
    })
    .get();
  _.each(_.keys(cached), function(key) {
    if (displayed.indexOf(key) === -1) {
      delete cached[key];
    }
  });
  let min = mapMin(cached);
  let max = mapMax(cached);
  let scale = chroma.scale(colorScale).domain([min, max]);
  let quantize = d3.scaleLinear().domain([min, max]);
  $container.find('.state-map').each(function(_, elm) {
    let $elm = $(elm);
    let results = cached[$elm.find('select').val()];
    d3.select($elm.find('g')[0])
      .selectAll('path')
      .attr('fill', function(d) {
        return results[d.id] ? scale(results[d.id]) : colorZero;
      });
  });
  $container.find('.legend-container svg g').remove();
  let svg = d3.select($container.get(0)).select('.legend-container svg');
  if (isFinite(max)) {
    stateLegend(svg, scale, quantize, 4);
  }
}

function updateButtonsDisplay($parent) {
  let $maps = $parent.find('.state-map');
  let showAdd = $maps.length < MAX_MAPS ? 'block' : 'none';
  let showRemove = $maps.length > 1 ? 'block' : 'none';
  $parent.find('.js-add-map').css('display', showAdd);
  $parent.find('.js-remove-map').css('display', showRemove);
}

function appendStateMap($parent, results, cached) {
  let ids = _.pluck(results, 'candidate_id');
  let displayed = $parent
    .find('.candidate-select')
    .map(function(_, select) {
      return $(select).val();
    })
    .get();
  let value =
    _.find(ids, function(each) {
      return displayed.indexOf(each) === -1;
    }) || _.last(ids);
  $parent.append(candidateStateMapTemplate(results));
  let $select = $parent.find('.state-map:last select');
  $select.val(value);
  $select.trigger('change');
  updateButtonsDisplay($parent);
  updateColorScale($parent, cached);
}

function drawStateMap($container, candidateId, cached) {
  let url = helpers.buildUrl(
    ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    {
      cycle: context.election.cycle,
      candidate_id: candidateId,
      per_page: 99,
      election_full: true
    }
  );
  let $map = $container.find('.state-map-choropleth');
  $map.html('');
  $.getJSON(url).done(function(data) {
    let results = _.reduce(
      data.results,
      function(acc, val) {
        let state = val.state ? val.state.toUpperCase() : val.state;
        let row = fips.fipsByState[state] || {};
        let code = row.STATE ? parseInt(row.STATE) : null;
        acc[code] = val.total;
        return acc;
      },
      {}
    );
    cached[candidateId] = results;
    updateColorScale($container, cached);
    let min = mapMin(cached);
    let max = mapMax(cached);
    stateMap($map, data, 400, 300, min, max, false, true);
  });
}

function initStateMaps(results) {
  let cached = {};
  let $stateMaps = $('#state-maps');
  let $choropleths = $stateMaps.find('.choropleths');
  appendStateMap($choropleths, results, cached);

  $choropleths.on('change', 'select', function(e) {
    let $target = $(e.target);
    let $parent = $target.closest('.state-map');
    drawStateMap($parent, $target.val(), cached);
  });

  $choropleths.on('click', '.js-add-map', function() {
    appendStateMap($choropleths, results, cached);
  });

  $choropleths.on('click', '.js-remove-map', function(e) {
    let $target = $(e.target);
    let $parent = $target.closest('.state-map');
    let $container = $parent.closest('#state-maps');
    $parent.remove();
    updateButtonsDisplay($container);
    updateColorScale($container, cached);
  });
  $choropleths.find('.state-map').remove();
  appendStateMap($choropleths, results, cached);
}

module.exports = {
  stateMap: stateMap,
  colorZero: colorZero,
  colorScale: colorScale,
  stateLegend: stateLegend,
  highlightState: highlightState,
  DistrictMap: DistrictMap,
  initStateMaps: initStateMaps
};
