'use strict';

var $ = require('jquery');
var _ = require('underscore');

window.$ = window.jQuery = $;

var Filter = require('./filter-base.js').Filter;
var cyclesTemplate = require('../../templates/election-cycles.hbs');

function ElectionFilter(elm) {
  Filter.call(this, elm);

  this.duration = parseInt(this.$elm.data('duration'));
  this.cycleName = this.$elm.data('cycle-name');
  this.fullName = this.$elm.data('full-name');
  this.defaultCycle = this.$elm.data('default-cycle');

  this.$election = this.$elm.find('.js-election');
  this.$cycles = this.$elm.find('.js-cycles');
  this.$cycle = this.$elm.find(
    'input[type="hidden"][name="' + this.cycleName + '"]'
  );
  this.$full = this.$elm.find(
    'input[type="hidden"][name="' + this.fullName + '"]'
  );

  this.loadedOnce = false;
  this.$election.on('change', this.handleElectionChange.bind(this));
  this.$cycles.on('change', this.handleCycleChange.bind(this));

  this.fields = [this.name, this.cycleName, this.fullName];
}

ElectionFilter.prototype = Object.create(Filter.prototype);
ElectionFilter.constructor = ElectionFilter;

ElectionFilter.prototype.fromQuery = function(query) {
  var election = query[this.name] || this.defaultCycle;
  var cycle = query[this.cycleName] || election;
  var full = query[this.fullName] !== null ? query[this.fullName] : true;
  if (election) {
    this.$election.val(election);
    this.handleElectionChange({ target: this.$election });
    this.$cycles
      .find('input[value="' + cycle + ':' + full + '"]')
      .prop('checked', true)
      .change();
  }
  return this;
};

ElectionFilter.prototype.handleChange = function() {};

ElectionFilter.prototype.handleElectionChange = function(e) {
  if (this.duration === 2) {
    return;
  }
  var election = parseInt($(e.target).val());
  var cycles = _.range(election - this.duration + 2, election + 2, 2);
  var bins = _.map(
    cycles,
    function(cycle) {
      return {
        name: this.name,
        cycle: cycle,
        min: cycle - 1,
        max: cycle,
        full: false
      };
    }.bind(this)
  );
  bins.unshift({
    name: this.name,
    cycle: election,
    min: election - this.duration + 1,
    max: election,
    full: true
  });
  this.$cycles.html(cyclesTemplate(bins));
  this.$cycles
    .find('input')
    .eq(0)
    .prop('checked', true)
    .change();
};

ElectionFilter.prototype.handleCycleChange = function(e) {
  var selected = $(e.target)
    .val()
    .split(':');
  this.$cycle
    .val(selected[0])
    .change()
    .attr('checked', true);
  this.$full.val(selected[1]).change();
  this.setTag();
};

ElectionFilter.prototype.setTag = function() {
  var election = this.$election.val();
  var cycle = this.$cycles.find(':checked').data('display-value');
  var value = election + ' election: ' + cycle;
  var eventName = this.loadedOnce ? 'filter:renamed' : 'filter:added';
  this.$election.trigger(eventName, [
    {
      key: 'election',
      value: value,
      nonremovable: true,
      removeOnSwitch: false
    }
  ]);
  this.loadedOnce = true;
};

module.exports = { ElectionFilter: ElectionFilter };
