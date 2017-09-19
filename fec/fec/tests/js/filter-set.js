'use strict';

var chai = require('chai');
var expect = chai.expect;

var $ = require('jquery');

require('./setup')();

var FilterSet = require('../../static/js/modules/filters/filter-set').FilterSet;

describe('FilterSet', function() {
  describe('basic filter set', function() {
    before(function() {
      this.$fixture = $('<div id="fixtures"></div>');
      $('body').empty().append(this.$fixture);
    });

    beforeEach(function() {
      this.$fixture.empty().append(
        '<form>' +
          '<div class="js-filter" data-filter="text">' +
            '<input name="name">' +
            '<button></button>' +
          '</div>' +
          '<div class="js-filter" data-filter="checkbox">' +
            '<input name="cycle" type="checkbox" value="2012" />' +
            '<input name="cycle" type="checkbox" value="2014" />' +
            '<input name="cycle" type="checkbox" value="2016" />' +
          '</div>' +
        '</form>'
      );
      this.filterSet = new FilterSet(this.$fixture.find('form'));
    });

    it('locates dom elements', function() {
      expect(this.filterSet.$body.is('#fixtures form')).to.be.true;
      expect(this.filterSet.filters).to.deep.equal({});
      expect(this.filterSet.fields).to.deep.equal([]);
    });

    it('activates nested fields', function() {
      this.filterSet.activateAll();
      expect(this.filterSet.filters).to.include.keys('name', 'cycle');
      expect(this.filterSet.fields).to.deep.equal(['name', 'cycle']);
    });

    it('sets initial values on nested fields', function() {
      window.history.replaceState({}, null, '?cycle=2012&cycle=2014');
      this.filterSet.activateAll();
      expect(
        this.filterSet.filters.cycle.$input.filter(function(idx, elm) {
          return $(elm).is(':checked');
        }).map(function(idx, elm) {
          return $(elm).val();
        }).get()
      ).to.deep.equal(['2012', '2014']);
    });

    it('serializes form values', function() {
      this.filterSet.activateAll();
      this.filterSet.filters.cycle.setValue(['2012', '2014']);
      expect(this.filterSet.serialize()).to.deep.equal({
        cycle: ['2012', '2014']
      });
    });

    it('clears form values', function() {
      this.filterSet.activateAll();
      this.filterSet.filters.name.setValue('jed');
      this.filterSet.filters.cycle.setValue(['2012', '2014']);
      this.filterSet.clear();
      expect(this.filterSet.serialize()).to.deep.equal({});
    });
  });

  describe('efiling filter set', function() {
    before(function() {
      this.$fixture = $('<div id="fixtures"></div>');
      $('body').append(this.$fixture);
    });

    beforeEach(function() {
      this.$fixture.empty().append(
        '<form data-efiling-filters="true">' +
        '<div class="js-processed-filters">' +
          '<div class="js-filter" data-filter="text">' +
            '<input name="name">' +
            '<button></button>' +
          '</div>' +
          '<div class="js-filter" data-filter="checkbox">' +
            '<input name="cycle" type="checkbox" value="2012" />' +
            '<input name="cycle" type="checkbox" value="2014" />' +
            '<input name="cycle" type="checkbox" value="2016" />' +
          '</div>' +
        '</div>' +
        '<div class="js-efiling-filters">' +
          '<div class="js-filter" data-filter="checkbox">' +
            '<input name="cycle" type="checkbox" value="2012" />' +
            '<input name="cycle" type="checkbox" value="2014" />' +
            '<input name="cycle" type="checkbox" value="2016" />' +
          '</div>' +
        '</div>' +
        '</form>'
      );
      this.filterSet = new FilterSet(this.$fixture.find('form'));
    });

    it('activates and stores processed filters', function() {
      this.filterSet.activateProcessed();
      expect(Object.keys(this.filterSet.processedFilters)).to.deep.equal(['name', 'cycle']);
      expect(Object.keys(this.filterSet.filters)).to.deep.equal(['name', 'cycle']);
    });

    it('activates and stores the efiling filters', function() {
      this.filterSet.activateEfiling();
      expect(Object.keys(this.filterSet.efilingFilters)).to.deep.equal(['cycle']);
      expect(Object.keys(this.filterSet.filters)).to.deep.equal(['cycle']);
    });


    it('does not activate filters if it has efiling filters', function() {
      this.filterSet.activateAll();
      expect(this.filterSet.fields).to.deep.equal([]);
    });

    it('toggles the visibility of filter panels', function() {
      this.filterSet.switchFilters('efiling');
      expect(this.filterSet.$body.find('.js-processed-filters')
        .attr('aria-hidden')).to.equal('true');
      expect(this.filterSet.$body.find('.js-efiling-filters')
        .attr('aria-hidden')).to.equal('false');
    });

    it('loads the toggled filters with relevant query params', function() {
      window.history.replaceState({}, null, '?cycle=2012');
      this.filterSet.activateEfiling();
      this.filterSet.activateSwitchedFilters('efiling');
      expect(this.filterSet.firstLoad).to.be.false;
      expect(this.filterSet.$body.find('.js-efiling-filters input[value="2012"]').is(':checked')).to.be.true;
    });
  });
});
