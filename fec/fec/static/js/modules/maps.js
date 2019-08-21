'use strict';

const d3 = require('d3');
const $ = require('jquery');
// const _ = require('underscore');
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
let stateFeatureMap = {};
for (let i = 0; i < stateFeatures.length; i++) {
  let thisID = stateFeatures[i].id;
  stateFeatureMap[thisID] = stateFeatures[i];
}

const colorZero = '#ffffff';
const colorScale = ['#e2ffff', '#278887'];
const compactRules = [['B', 9], ['M', 6], ['k', 3], ['', 0]];
const MAX_MAPS = 2;

function chooseRule(value) {
  return compactRules.find(rule => {
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
  let path = d3.geo.path().projection(projection);

  let results = data.results.reduce((acc, val) => {
    var row = fips.fipsByState[val.state] || {};
    var code = row.STATE ? parseInt(row.STATE) : null;
    acc[code] = val.total;
    return acc;
  }, {});

  let quantiles = 4;
  let totals = data.results
    .map(value => value['total'])
    .filter(value => {
      return !!value;
    });
  min = min || Math.min(...totals);
  max = max || Math.max(...totals);

  let scale = chroma.scale(colorScale).domain([min, max]);
  let quantize = d3.scale.linear().domain([min, max]);
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

function tooltipTemplate(obj) {
  return `<div class="tooltip__title">${obj.name}</div>
    <div class="tooltip__value">${obj.total}</div>`;
}

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
  let allMapsMinimumValues = [];
  for (let mapCandidateID in cached) {
    // Push to the list of all values
    allMapsMinimumValues.push(
      // The values in this map
      // but filter it so we're only looking at values that are truthy
      ...Object.values(cached[mapCandidateID]).filter(value => {
        return !!value; // Need to filter based on truthy because 0=false=null=undefined while $0 is legit
      })
    );
  }
  // Return the smallest of the maps' values
  return Math.min(...allMapsMinimumValues);
}

function mapMax(cached) {
  let allMapsMaximumValues = [];
  for (let mapCandidateID in cached) {
    // Push to the list of all values
    allMapsMaximumValues.push(
      // The values in this map
      ...Object.values(cached[mapCandidateID])
    );
  }
  return Math.max(...allMapsMaximumValues);
}

function updateColorScale($container, cached) {
  $container = $container.closest('#state-maps');
  let displayed = $container
    .find('.state-map select')
    .map(function(_, select) {
      return $(select).val();
    })
    .get();
  // _.each(_.keys(cached), function(key) {
  //   if (displayed.indexOf(key) === -1) {
  //     delete cached[key];
  //   }
  // });
  // TODO - test whether this ES6 is working
  let theCachedKeys = Object.keys(cached);
  if (theCachedKeys && theCachedKeys.foreach) {
    theCachedKeys.foreach(key => {
      if (displayed.indexOf(key) === -1) {
        delete cached[key];
      }
    });
  }
  let min = mapMin(cached);
  let max = mapMax(cached);
  let scale = chroma.scale(colorScale).domain([min, max]);
  let quantize = d3.scale.linear().domain([min, max]);
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
  // let ids = _.pluck(results, 'candidate_id');
  let ids = results.map(value => value['candidate_id']);
  let displayed = $parent
    .find('.candidate-select')
    .map(function(_, select) {
      return $(select).val();
    })
    .get();
  let value =
    ids.find(each => {
      return displayed.indexOf(each) === -1;
    }) || ids[ids.length - 1];
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
    let theDataResults = data.results;
    let results = theDataResults.reduce((acc, val) => {
      let state = val.state ? val.state.toUpperCase() : val.state;
      let row = fips.fipsByState[state] || {};
      let code = row.STATE ? parseInt(row.STATE) : null;
      acc[code] = val.total;
      return acc;
    }, {});
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
  stateMap,
  colorZero,
  colorScale,
  stateLegend,
  highlightState,
  DistrictMap,
  initStateMaps
};
