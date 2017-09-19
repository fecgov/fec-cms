'use strict';

/* global context */

var $ = require('jquery');
var _ = require('underscore');
var URI = require('urijs');

var cycleTemplate = require('../templates/electionCycle.hbs');
var cyclesTemplate = require('../templates/electionCycles.hbs');

function CycleSelect(elm) {
  this.$elm = $(elm);
  this.duration = this.$elm.data('duration');
  this.cycleId = this.$elm.attr('id');

  this.$elm.on('change', this.handleChange.bind(this));

  this.initCycles();
}

CycleSelect.prototype.initCycles = function() {
  this.$cycles = $('<div class="subcycle-select"></div>');
  this.$cycles.insertAfter(this.$elm.closest('.js-cycle-select'));

  var selected = parseInt(this.$elm.val());
  if (this.duration > 2) {
    this.initCyclesMulti(selected);
  } else {
    this.initCyclesSingle(selected);
  }
};

CycleSelect.prototype.initCyclesMulti = function(selected) {
  var cycles = _.range(selected - this.duration + 2, selected + 2, 2);
  var params = this.getParams();
  var selectedCycle;
  var cycleId = this.cycleId;

  var bins = _.map(cycles, function(cycle) {
    return {
      min: cycle - 1,
      max: cycle,
      electionFull: false,
      cycleId: cycleId,
      active: typeof context !== 'undefined' && context.cycles ?
        context.cycles.indexOf(cycle) !== -1 :
        true,
      checked: cycle.toString() === params.cycle &&
        params.electionFull === 'false'
    };
  });
  bins.unshift({
    min: selected - this.duration + 1,
    max: selected,
    electionFull: true,
    cycleId: cycleId,
    active: true,
    checked: true,
  });
  this.$cycles.html(cyclesTemplate(bins));
  this.$cycles.on('change', this.handleChange.bind(this));

  selectedCycle = _.filter(bins, function(bin) {
    return bin.checked === true;
  });

  this.setTimePeriod(selectedCycle[0].min, selectedCycle[0].max);
};

CycleSelect.prototype.initCyclesSingle = function(selected) {
  var min = selected - 1;
  var max = selected;
  this.setTimePeriod(min, max);
  this.$cycles.html(cycleTemplate({min: min, max: max}));
};

CycleSelect.prototype.setTimePeriod = function(min, max) {
  // Defines a timePeriod property on the global context object in order
  // to easily get a time period string without having to calculate it every time
  context.timePeriod = min.toString() + '–' + max.toString();
};

CycleSelect.build = function($elm) {
  var location = $elm.data('cycle-location');
  if (location === 'query') {
    return new QueryCycleSelect($elm);
  } else if (location === 'path') {
    return new PathCycleSelect($elm);
  }
};

CycleSelect.prototype.handleChange = function(e) {
  var $target = $(e.target);
  var cycle = $target.val();
  var electionFull = $target.data('election-full');
  if (electionFull === undefined && this.duration > 2) {
    electionFull = 'true';
  }
  this.setUrl(this.nextUrl(cycle, electionFull));
};

CycleSelect.prototype.setUrl = function(url) {
  window.location.href = url;
};

function QueryCycleSelect() {
  CycleSelect.apply(this, _.toArray(arguments));
}

QueryCycleSelect.prototype = Object.create(CycleSelect.prototype);

QueryCycleSelect.prototype.getParams = function() {
  var query = URI.parseQuery(window.location.search);
  return {
    cycle: query.cycle,
    electionFull: query.election_full
  };
};

QueryCycleSelect.prototype.nextUrl = function(cycle, electionFull) {
  return URI(window.location.href)
    .removeQuery('cycle')
    .removeQuery('election_full')
    .addQuery({
      cycle: cycle,
      election_full: electionFull
    })
    .toString();
};

function PathCycleSelect() {
  CycleSelect.apply(this, _.toArray(arguments));
}

PathCycleSelect.prototype = Object.create(CycleSelect.prototype);

PathCycleSelect.prototype.getParams = function() {
  var query = URI.parseQuery(window.location.search);
  var cycle = window.location.pathname
    .replace(/\/$/, '')
    .split('/')
    .pop();
  return {
    cycle: cycle,
    electionFull: query.election_full
  };
};

PathCycleSelect.prototype.nextUrl = function(cycle, electionFull) {
  var uri = URI(window.location.href);
  var path = uri.path()
    .replace(/^\/|\/$/g, '')
    .split('/')
    .slice(0, -1)
    .concat([cycle])
    .join('/')
    .concat('/');
  return uri.path(path)
    .search({election_full: electionFull})
    .toString();
};

module.exports = {CycleSelect: CycleSelect};
