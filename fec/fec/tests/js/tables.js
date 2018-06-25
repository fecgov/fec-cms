'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');
var URI = require('urijs');
var _ = require('underscore');

require('./setup')();
require('datatables.net')();
require('datatables.net-responsive')();

var columns = require('../../static/js/modules/columns');
var columnHelpers = require('../../static/js/modules/column-helpers');
var helpers = require('../../static/js/modules/helpers');
var tables = require('../../static/js/modules/tables');
var tablist = require('../../static/js/vendor/tablist');
var context = require('../fixtures/context');
var houseResults = require('../fixtures/house-results');
var DataTable = tables.DataTable;

describe('data table', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').empty().append(this.$fixture);
    sinon.spy(DataTable.prototype, 'export');
  });

  after(function() {
    DataTable.prototype.export.restore();
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div class="js-data-widgets"></div>' +
      '<table id="table">' +
        '<thead>' +
          '<tr>' +
            '<th>Name</th>' +
            '<th>Office</th>' +
            '<th>Party</th>' +
          '</tr>' +
        '</thead>' +
      '</table>'
    );
    this.deferred = $.Deferred();
    sinon.stub($, 'ajax').returns(this.deferred);
    this.table = new DataTable('table', {
      columns: [
        {data: 'name'},
        {data: 'office'},
        {data: 'party'},
      ],
      useExport: true
    });
  });

  afterEach(function() {
    $.ajax.restore();
    this.table.destroy();
  });

  describe('constructor()', function() {
    it('locates dom elements', function() {
      expect(this.table.$body.is('#table')).to.be.true;
    });

    it('adds self to registry', function() {
      expect(DataTable.registry.table).to.equal(this.table);
    });

    it('adds hidden loading widget', function() {
      this.table.ensureWidgets();
      this.deferred.reject();
      var prev = this.table.$body.prev('.is-loading');
      expect(prev.length).to.equal(1);
      expect(prev.is(':visible')).to.be.false;
    });

    it('adds export widget', function() {
      this.table.ensureWidgets();
      this.deferred.reject();
      var $exportButton = $('.js-export');
      expect($exportButton.length).to.equal(1);
    });

    it('only adds widgets once', function() {
      this.table.ensureWidgets();
      this.table.ensureWidgets();
      var $exportButton = $('.js-export');
      expect($exportButton.length).to.equal(1);
    });
  });

  describe('disables exporting', function() {
    beforeEach(function() {
      this.table.disableExport({});
    });

    it('adds a disabled class', function() {
      expect(this.table.$exportButton.hasClass('is-disabled')).to.be.true;
    });

    it('does nothing on click', function() {
      this.table.$exportButton.click();
      expect(DataTable.prototype.export).not.to.have.been.called;
    });
  });

  describe('enables exporting', function() {
    beforeEach(function() {
      this.table.enableExport();
    });

    it('removes the disabled class', function() {
      expect(this.table.$exportButton.hasClass('is-disabled')).to.be.false;
    });

    it('adds starts an export when clicked', function() {
      this.table.$exportButton.trigger('click');
      expect(DataTable.prototype.export).to.have.been.called;
    });

    it('does not show the message', function() {
      expect(this.table.$exportMessage.attr('aria-hidden')).to.equal('true');
    });
  });

  describe('fetches data', function() {
    beforeEach(function() {
      this.table.xhr = null;
    });

    it('builds URLs', function() {
      _.extend(this.table.opts, {
        path: ['path', 'to', 'endpoint'],
        query: {extra: 'true'}
      });
      this.table.filters = {party: 'DFL'};
      var data = {
        start: 60,
        length: 30,
        order: [{column: 1, dir: 'desc'}]
      };
      var url = this.table.buildUrl(data);
      var expected = helpers.buildUrl(
        ['path', 'to', 'endpoint'],
        {sort_hide_null: 'true', party: 'DFL', sort: '-office', per_page: 30, page: 3, extra: 'true'}
      );
      expect(URI(url).equals(expected)).to.be.true;
    });

    it('renders data', function() {
      var callback = sinon.stub();
      var resp = {
        results: [
          {name: 'Jed Bartlet', office: 'President', party: 'DEM'},
        ],
        pagination: {count: 42}
      };
      this.table.fetch({}, callback);
      this.deferred.resolve(resp);
      expect(callback).to.have.been.calledWith(tables.mapResponse(resp));
    });

    it('hides table on empty results', function() {
      this.table.opts.hideEmpty = true;
      var callback = sinon.stub();
      var resp = {
        results: [],
        pagination: {count: 0}
      };
      this.table.fetch({}, callback);
      this.deferred.resolve(resp);
      expect(
        $.fn.DataTable.isDataTable(this.table.api.table().node())
      ).to.be.false;
    });

    describe('post-fetch', function() {
      beforeEach(function() {
        sinon.spy(this.table, 'disableExport');
        sinon.spy(this.table, 'enableExport');
      });

      afterEach(function() {
        this.table.disableExport.restore();
        this.table.enableExport.restore();
      });

      it('disables export button if too many results', function() {
        var resp = {
          results: [],
          pagination: {count: 1000000}
        };
        this.table.fetch({}, function(){});
        this.deferred.resolve(resp);
        expect(this.table.disableExport).to.have.been.called;
        expect(this.table.enableExport).not.to.have.been.called;
      });
    });

    it('pushes filter parameters to window location', function() {
      var serialized = {
        name: 'bartlet',
        office: 'president',
        party: 'democrat'
      };
      this.table.filterSet = {
        serialize: function() { return serialized; },
        fields: ['name', 'office', 'party']
      };
      this.table.filterSet.isValid = true;
      this.table.fetch({}, function() {});
      expect(this.table.filters).to.deep.equal(serialized);
      var params = URI.parseQuery(window.location.search);
      expect(params.name).to.equal('bartlet');
    });

    it('terminates ongoing ajax requests', function() {
      var xhr = this.table.xhr = {abort: sinon.stub()};
      this.table.fetch({}, function() {});
      expect(xhr.abort).to.have.been.called;
    });
  });

  describe('listens to window state', function() {
    beforeEach(function() {
      sinon.stub(this.table.api.ajax, 'reload');
    });

    afterEach(function() {
      this.table.api.ajax.reload.restore();
    });

    it('calls fetch on reload', function() {
      var serialized = {name: 'bartlet'};
      this.table.filterSet = {
        activateAll: function() {},
        serialize: function() { return serialized; }
      };
      this.table.filters = null;
      this.table.handlePopState();
      expect(this.table.api.ajax.reload).to.have.been.called;
    });

    it('does not call fetch on reload when state is unchanged', function() {
      var serialized = {name: 'bartlet'};
      this.table.filterSet = {
        activateAll: function() {},
        serialize: function() { return serialized; }
      };
      this.table.filters = serialized;
      this.table.handlePopState();
      expect(this.table.api.ajax.reload).to.have.not.been.called;
    });
  });

  describe('drawsComparison', function() {
    before(function(done) {
      this.$fixture = $('<div id="fixtures"></div>');
      $('body').empty().append(this.$fixture);
      done();
    });

    after(function(done) {
      $('body').empty()
      this.$fixture = null;
      done();
    });

    beforeEach(function(done) {
      this.$fixture.empty().append(
        '<div id="comparison"></div>' +
          '<table class="data-table data-table--heading-borders scrollX" data-type="by-size">' +
            '<thead>' +
              '<th scope="col">Candidate</th>' +
              '<th scope="col">$200 and under</th>' +
              '<th scope="col">$200.01—$499.99</th>' +
              '<th scope="col">$500—$999.99</th>' +
              '<th scope="col">$1,000—$1,999.99</th>' +
              '<th scope="col">$2,000 and over</th>' +
            '</thead>' +
          '</table>' +
          '<table class="data-table data-table--heading-borders scrollX panel-toggle-element" data-type="by-state" aria-hidden="false">' +
            '<thead><tr></tr></thead>' +
          '</table>'
      );
      tables.drawComparison(houseResults, context);
      done();
    });

    afterEach(function(done) {
      this.$fixture.empty();
      done();
    });

    it('should draw tables dropdowns for comparison', function(done) {
      var dropdowns = $('.dropdown__item');
      expect(dropdowns.length).to.equal(houseResults.length);
      done();
    });

    it('should draw tables for comparison and show by-size by default', function(done) {
      var tables = $('#fixtures');
      done();
    });
  });

  describe('initSpendingTables', function() {
    before(function(done) {
      this.$fixture = $('<div id="fixtures"></div>');
      $('body').empty().append(this.$fixture);

      this.independentExpenditureColumns = [
        columns.committeeColumn({data: 'committee', className: 'all'}),
        columns.supportOpposeColumn,
        columns.candidateColumn({data: 'candidate', className: 'all'}),
        {
          data: 'total',
          className: 'all column--number',
          orderable: true,
          orderSequence: ['desc', 'asc'],
          render: columnHelpers.buildTotalLink(['independent-expenditures'], function(data, type, row, meta) {
              return {
                data_type: 'processed',
                is_notice: 'false',
                support_oppose_indicator: row.support_oppose_indicator,
                candidate_id: row.candidate_id
              };
          })
        },
      ];

      this.tableOpts = {
        'independent-expenditures': {
          path: ['schedules', 'schedule_e', 'by_candidate'],
          columns: this.independentExpenditureColumns,
          title: 'independent expenditures',
          order: [[3, 'desc']],
        }
      };
      done();
    });

    after(function(done) {
      $('body').empty();
      this.$fixture = null;
      done();
    });

    beforeEach(function(done) {
      this.$fixture.empty().append(
        '<div class="tab-interface">' +
          '<ul role="tablist" data-name="tab">' +
            '<li><a role="tab" data-name="tab0" href="#section-0">0</a></li>' +
          '</ul>' +
          '<section id="section-0" role="tabpanel" aria-hidden="true">' +
            '<div id="init-spending"></div>' +
            '<table ' +
              'class="data-table data-table--heading-borders scrollX" ' +
              'data-type="independent-expenditures"' +
            '>' +
              '<thead>' +
                '<th scope="col">Spent by</th>' +
                '<th scope="col">Support/Oppose</th>' +
                '<th scope="col">Candidate</th>' +
                '<th scope="col">Aggregate amount</th>' +
              '</thead>' +
            '</table>' +
          '</section>' +
        '</div>'
      );
      tablist.init();
      done();
    });

    afterEach(function(done) {
      this.$fixture.empty();
      done();
    });

    it('should add and init the tables', function() {
      tables.initSpendingTables('.data-table', context, this.tableOpts);
      $('[role="tab"]').trigger($.Event('click'));
      var toggle = $('.js-panel-toggle');
      expect(toggle.length).to.equal(1);
    });
  });

  describe('getCycle', function() {

    before(function(done) {
      this.spy = sinon.spy(tables.getCycle);
      done();
    });

    after(function(done) {
      done();
    });

    it('should return an object when no table available', function() {
      var meta = {settings: {sTableId: 'notable'}};
      var results = this.spy(null, meta);
      this.spy.calledOnce;
      this.spy.returned({});
    });

  });

  describe('yearRange', function() {

    it('should return a single year when same', function() {
      var results = tables.yearRange('2018', '2018');
      expect(results).to.equal('2018');
    });

    it('should return a year range with hyphen', function() {
      var results = tables.yearRange('2018', '2020');
      expect(results).to.equal('2018 - 2020');
    });
  });

  describe('mapSort', function() {

    it('should return column name for ASC order', function() {
      var order = [{column: 'test'}];
      var columns = {test: { data: 'hello'}};
      var expected = ['hello'];
      var results = tables.mapSort(order, columns);
      expect(results).to.deep.equal(expected);
    });

    it('should return column name for DESC order', function() {
      var order = [{column: 'test', dir: 'desc'}];
      var columns = {test: { data: 'hello'}};
      var expected = ['-hello'];
      var results = tables.mapSort(order, columns);
      expect(results).to.deep.equal(expected);
    });
  });

  describe('mapResponse', function() {

    it('should return response pagination count', function() {
      var response = { pagination: { count: 501 }, results: 'test'};
      var expected = {
        recordsTotal: 501,
        recordsFiltered: 501,
        data: 'test'
      };
      var results = tables.mapResponse(response);
      expect(results).to.deep.equal(expected);
    });

    it('should return round responses over 1000 to the nearest thousand', function() {
      var response = { pagination: { count: 1500 }, results: 'test'};
      var expected = {
        recordsTotal: 2000,
        recordsFiltered: 2000,
        data: 'test'
      };
      var results = tables.mapResponse(response);
      expect(results).to.deep.equal(expected);
    });
  });
});
