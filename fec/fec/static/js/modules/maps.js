'use strict';

var d3 = require('d3');
var $ = require('jquery');
var _ = require('underscore');
var chroma = require('chroma-js');
var topojson = require('topojson-client');

var L = require('leaflet');
require('leaflet-providers');

var fips = require('./fips');
var helpers = require('./helpers');
var utils = require('./election-utils');

var states = require('../data/us-states-10m.json');

var candidateStateMapTemplate = require('../templates/candidateStateMap.hbs');

var stateFeatures = topojson.feature(states, states.objects.states).features;
var stateFeatureMap = _.chain(stateFeatures)
  .map(function(feature) {
    return [feature.id, feature];
  })
  .object()
  .value();

var colorZero = '#ffffff';
var colorScale = ['#e2ffff', '#278887'];
var compactRules = [['B', 9], ['M', 6], ['k', 3], ['', 0]];
var MAX_MAPS = 2;

const template_tooltip = value => `
  <div class="tooltip__title">${value.name}</div>
  <div class="tooltip__value">${value.total}</div>
`;

function chooseRule(value) {
  return _.find(compactRules, function(rule) {
    return value >= Math.pow(10, rule[1]);
  });
}

function compactNumber(value, rule) {
  var divisor = Math.pow(10, rule[1]);
  return d3.round(value / divisor, 1).toString() + rule[0];
}

function stateMap($elm, data, width, height, min, max, addLegend, addTooltips) {
  var svg = d3
    .select($elm[0])
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  var projection = d3.geo
    .albersUsa()
    .scale(450)
    .translate([220, 150]);
  var path = d3.geo.path().projection(projection);

  var results = _.reduce(
    data.results,
    function(acc, val) {
      var row = fips.fipsByState[val.state] || {};
      var code = row.STATE ? parseInt(row.STATE) : null;
      acc[code] = val.total;
      return acc;
    },
    {}
  );
  var quantiles = 4;
  var totals = _.chain(data.results)
    .pluck('total')
    .filter(function(value) {
      return !!value;
    })
    .value();
  min = min || _.min(totals);
  max = max || _.max(totals);
  var scale = chroma.scale(colorScale).domain([min, max]);
  var quantize = d3.scale.linear().domain([min, max]);
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
    var legendSVG = d3.select('.legend-container svg');
    stateLegend(legendSVG, scale, quantize, quantiles);
  }

  if (addTooltips) {
    stateTooltips(svg, path, results);
  }
}

function stateLegend(svg, scale, quantize, quantiles) {
  // Add legend swatches
  var legendWidth = 40;
  var legendBar = 35;
  var ticks = quantize.ticks(quantiles);
  var legend = svg
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
  var compactRule = chooseRule(ticks[Math.ceil(ticks.length / 2)]);
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
  var tooltip = d3
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
      var html = template_tooltip({
        name: fips.fipsByCode[d.id].STATE_NAME,
        total: helpers.currency(results[d.id] || 0)
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
  var x = d3.event.pageX - tooltip[0][0].offsetWidth / 2;
  var y = d3.event.pageY - tooltip[0][0].offsetHeight;

  var bottomPointerHeight = '.8rem';

  var contentHeight = $('#map-tooltip .tooltip__title').innerHeight();
  contentHeight += $('#map-tooltip .tooltip__value').innerHeight();
  contentHeight += 30; // (padding)

  tooltip
    .style('left', x + 'px')
    .style('top', 'calc(' + y + 'px - ' + bottomPointerHeight + ')')
    .style('height', contentHeight + 'px');
}

function highlightState($parent, state) {
  var rule = '[data-state="' + state + '"]';
  $parent.find('path:not(' + rule + ')').each(function(idx, elm) {
    elm.classList.remove('active');
  });
  var $path = $parent.find('path' + rule);
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
  var feature;
  if (election.district) {
    var encoded = utils.encodeDistrict(election.state, election.district);
    feature = utils.findDistrict(encoded);
  } else if (election.state) {
    var state = fips.fipsByState[election.state.toUpperCase()];
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
  var displayed = $container
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
  var min = mapMin(cached);
  var max = mapMax(cached);
  var scale = chroma.scale(colorScale).domain([min, max]);
  var quantize = d3.scale.linear().domain([min, max]);
  $container.find('.state-map').each(function(_, elm) {
    var $elm = $(elm);
    var results = cached[$elm.find('select').val()];
    d3.select($elm.find('g')[0])
      .selectAll('path')
      .attr('fill', function(d) {
        return results[d.id] ? scale(results[d.id]) : colorZero;
      });
  });
  $container.find('.legend-container svg g').remove();
  var svg = d3.select($container.get(0)).select('.legend-container svg');
  if (isFinite(max)) {
    stateLegend(svg, scale, quantize, 4);
  }
}

function updateButtonsDisplay($parent) {
  var $maps = $parent.find('.state-map');
  var showAdd = $maps.length < MAX_MAPS ? 'block' : 'none';
  var showRemove = $maps.length > 1 ? 'block' : 'none';
  $parent.find('.js-add-map').css('display', showAdd);
  $parent.find('.js-remove-map').css('display', showRemove);
}

function appendStateMap($parent, results, cached) {
  var ids = _.pluck(results, 'candidate_id');
  var displayed = $parent
    .find('.candidate-select')
    .map(function(_, select) {
      return $(select).val();
    })
    .get();
  var value =
    _.find(ids, function(each) {
      return displayed.indexOf(each) === -1;
    }) || _.last(ids);
  $parent.append(candidateStateMapTemplate(results));
  var $select = $parent.find('.state-map:last select');
  $select.val(value);
  $select.trigger('change');
  updateButtonsDisplay($parent);
  updateColorScale($parent, cached);
}

function drawStateMap($container, candidateId, cached) {
  var url = helpers.buildUrl(
    ['schedules', 'schedule_a', 'by_state', 'by_candidate'],
    {
      cycle: context.election.cycle,
      candidate_id: candidateId,
      per_page: 99,
      election_full: true
    }
  );
  var $map = $container.find('.state-map-choropleth');
  $map.html('');
  $.getJSON(url).done(function(data) {
    var results = _.reduce(
      data.results,
      function(acc, val) {
        var state = val.state ? val.state.toUpperCase() : val.state;
        var row = fips.fipsByState[state] || {};
        var code = row.STATE ? parseInt(row.STATE) : null;
        acc[code] = val.total;
        return acc;
      },
      {}
    );
    cached[candidateId] = results;
    updateColorScale($container, cached);
    var min = mapMin(cached);
    var max = mapMax(cached);
    stateMap($map, data, 400, 300, min, max, false, true);
  });
}

function initStateMaps(results) {
  var cached = {};
  var $stateMaps = $('#state-maps');
  var $choropleths = $stateMaps.find('.choropleths');
  appendStateMap($choropleths, results, cached);

  $choropleths.on('change', 'select', function(e) {
    var $target = $(e.target);
    var $parent = $target.closest('.state-map');
    drawStateMap($parent, $target.val(), cached);
  });

  $choropleths.on('click', '.js-add-map', function() {
    appendStateMap($choropleths, results, cached);
  });

  $choropleths.on('click', '.js-remove-map', function(e) {
    var $target = $(e.target);
    var $parent = $target.closest('.state-map');
    var $container = $parent.closest('#state-maps');
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
