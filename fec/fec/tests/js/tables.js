// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
import sinon from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import { default as URI } from 'urijs';
import { extend as _extend } from 'underscore';

// require('datatables.net')();
// require('datatables.net-responsive')();

import { committeeColumn, supportOpposeColumn } from '../../static/js/modules/columns.js';
import { buildTotalLink } from '../../static/js/modules/column-helpers.js';
import { buildUrl } from '../../static/js/modules/helpers.js';

import { DataTable_FEC, drawComparison, getCycle, initSpendingTables, mapResponse, mapSort, yearRange } from '../../static/js/modules/tables.js';
import { init as initTablist } from '../../static/js/vendor/tablist.js';

import { default as context } from '../fixtures/context.js';
import { default as houseResults } from '../fixtures/house-results.js';
// const DataTable = DataTable_FEC;

describe('data table', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body')
      .empty()
      .append(this.$fixture);
    sinon.spy(DataTable.prototype, 'export');
  });

  after(function() {
    DataTable.prototype.export.restore();
  });

  beforeEach(function() {
    this.$fixture
      .empty()
      .append(
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
      columns: [{ data: 'name' }, { data: 'office' }, { data: 'party' }],
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
      expect(DataTable.prototype.export).not.to.have.been.called;
      this.table.$exportButton.click(); // TODO: jQuery deprecation
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
      _extend(this.table.opts, {
        path: ['path', 'to', 'endpoint'],
        query: { extra: 'true' }
      });
      this.table.filters = { party: 'DFL' };
      var data = {
        start: 60,
        length: 30,
        order: [{ column: 1, dir: 'desc' }]
      };
      var url = this.table.buildUrl(data);
      var expected = buildUrl(['path', 'to', 'endpoint'], {
        sort_hide_null: 'false',
        sort_nulls_last: 'true',
        party: 'DFL',
        sort: '-office',
        per_page: 30,
        page: 3,
        extra: 'true'
      });
      expect(URI(url).equals(expected)).to.be.true;
    });

    it('renders data', function() {
      var callback = sinon.stub();
      var resp = {
        results: [{ name: 'Jed Bartlet', office: 'President', party: 'DEM' }],
        pagination: { count: 42 }
      };
      this.table.fetch({}, callback);
      this.deferred.resolve(resp);
      expect(callback).to.have.been.calledWith(mapResponse(resp));
    });

    it('hides table on empty results', function() {
      this.table.opts.hideEmpty = true;
      var callback = sinon.stub();
      var resp = {
        results: [],
        pagination: { count: 0 }
      };
      this.table.fetch({}, callback);
      this.deferred.resolve(resp);
      expect($.fn.DataTable.isDataTable(this.table.api.table().node())).to.be
        .false;
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
          pagination: { count: 1000000 }
        };
        this.table.fetch({}, function() {});
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
        serialize: function() {
          return serialized;
        },
        fields: ['name', 'office', 'party']
      };
      this.table.filterSet.isValid = true;
      this.table.fetch({}, function() {});
      expect(this.table.filters).to.deep.equal(serialized);
      var params = URI.parseQuery(window.location.search);
      expect(params.name).to.equal('bartlet');
    });

    it('terminates ongoing ajax requests', function() {
      var xhr = (this.table.xhr = { abort: sinon.stub() });
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
      var serialized = { name: 'bartlet' };
      this.table.filterSet = {
        activateAll: function() {},
        serialize: function() {
          return serialized;
        }
      };
      this.table.filters = null;
      this.table.handlePopState();
      expect(this.table.api.ajax.reload).to.have.been.called;
    });

    it('does not call fetch on reload when state is unchanged', function() {
      var serialized = { name: 'bartlet' };
      this.table.filterSet = {
        activateAll: function() {},
        serialize: function() {
          return serialized;
        }
      };
      this.table.filters = serialized;
      this.table.handlePopState();
      expect(this.table.api.ajax.reload).to.have.not.been.called;
    });
  });

  describe('drawComparison', function() {
    before(function(done) {
      this.$fixture = $('<div id="fixtures"></div>');
      $('body')
        .empty()
        .append(this.$fixture);
      done();
    });

    after(function(done) {
      $('body').empty();
      this.$fixture = null;
      done();
    });

    beforeEach(function(done) {
      this.$fixture
        .empty()
        .append(
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
      drawComparison(houseResults, context);
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
      $('body')
        .empty()
        .append(this.$fixture);

      this.independentExpenditureColumns = [
        committeeColumn({ data: 'committee', className: 'all' }),
        supportOpposeColumn,
        candidateColumn({ data: 'candidate', className: 'all' }),
        {
          data: 'total',
          className: 'all column--number t-mono',
          orderable: true,
          orderSequence: ['desc', 'asc'],
          render: buildTotalLink(
            ['independent-expenditures'],
            function(data, type, row, meta) {
              return {
                data_type: 'processed',
                is_notice: 'false',
                support_oppose_indicator: row.support_oppose_indicator,
                candidate_id: row.candidate_id
              };
            }
          )
        }
      ];

      this.tableOpts = {
        'independent-expenditures': {
          path: ['schedules', 'schedule_e', 'by_candidate'],
          columns: this.independentExpenditureColumns,
          title: 'independent expenditures',
          order: [[3, 'desc']]
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
      this.$fixture
        .empty()
        .append(
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
      initTablist();
      done();
    });

    afterEach(function(done) {
      this.$fixture.empty();
      done();
    });

    it('should add and init the tables', function() {
      initSpendingTables('.data-table', context, this.tableOpts);
      $('[role="tab"]').trigger($.Event('click'));
      var toggle = $('.js-panel-toggle');
      expect(toggle.length).to.equal(1);
    });
  });

  describe('getCycle', function() {
    before(function(done) {
      this.spy = sinon.spy(getCycle);
      done();
    });

    after(function(done) {
      done();
    });

    it('should return an object when no table available', function() {
      var meta = { settings: { sTableId: 'notable' } };
      var results = this.spy(null, meta);
      this.spy.calledOnce;
      this.spy.returned({});
    });
  });

  describe('yearRange', function() {
    it('should return a single year when same', function() {
      var results = yearRange('2018', '2018');
      expect(results).to.equal('2018');
    });

    it('should return a year range with hyphen', function() {
      var results = yearRange('2018', '2020');
      expect(results).to.equal('2018 - 2020');
    });
  });

  describe('mapSort', function() {
    it('should return column name for ASC order', function() {
      var order = [{ column: 'test' }];
      var columns = { test: { data: 'hello' } };
      var expected = ['hello'];
      var results = mapSort(order, columns);
      expect(results).to.deep.equal(expected);
    });

    it('should return column name for DESC order', function() {
      var order = [{ column: 'test', dir: 'desc' }];
      var columns = { test: { data: 'hello' } };
      var expected = ['-hello'];
      var results = mapSort(order, columns);
      expect(results).to.deep.equal(expected);
    });
  });

  describe('mapResponse', function() {
    it('should return response pagination count', function() {
      var response = { pagination: { count: 501 }, results: 'test' };
      var expected = {
        recordsTotal: 501,
        recordsFiltered: 501,
        data: 'test'
      };
      var results = mapResponse(response);
      expect(results).to.deep.equal(expected);
    });

    it('should return round responses over 500000 to the nearest thousand', function() {
      var response = { pagination: { count: 512345 }, results: 'test' };
      var expected = {
        recordsTotal: 512000,
        recordsFiltered: 512000,
        data: 'test'
      };
      var results = mapResponse(response);
      expect(results).to.deep.equal(expected);
    });
  });

  describe('limit multiple filters for schedules A, B, and E', function() {
    beforeEach(function() {
      this.table.xhr = null;
      $('body').append(
        '<div id="committee_id-field"><ul class="dropdown__selected"></ul><input id="committee_id" /></div>',
        '<div id="candidate_id-field"><ul class="dropdown__selected"></ul><input id="candidate_id" /></div>',
        '<div id="contributor_name-field"><ul class="dropdown__selected"></ul><input id="contributor_name" /></div>',
        '<div id="recipient_name-field"><ul class="dropdown__selected"></ul><input id="recipient_name" /></div>',
        '<div id="contributor_zip-field"><ul class="dropdown__selected"></ul><input id="contributor_zip" /></div>',
        '<div id="contributor_city-field"><ul class="dropdown__selected"></ul><input id="contributor_city" /></div>',
        '<div id="recipient_city-field"><ul class="dropdown__selected"></ul><input id="recipient_city" /></div>',
        '<div id="contributor_employer-field"><ul class="dropdown__selected"></ul><input id="contributor_employer" /></div>',
        '<div id="contributor_occupation-field"><ul class="dropdown__selected"></ul><input id="contributor_occupation" /></div>'
      );
    });

    it('test filter errors with individual contributions', function() {
      var ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      var names = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
      var serialized = {
        committee_id: ids,
        candidate_id: ids,
        contributor_name: names,
        recipient_name: names,
        contributor_zip: ids,
        contributor_city: names,
        recipient_city: names,
        contributor_employer: names,
        contributor_occupation: names
      };
      this.table.opts.title = 'Individual contributions';
      this.table.filterSet = {
        serialize: function() {
          return serialized;
        },
        fields: [
          'committee_id',
          'candidate_id',
          'contributor_name',
          'recipient_name',
          'contributor_zip',
          'contributor_city',
          'recipient_city',
          'contributor_employer',
          'contributor_occupation'
        ]
      };
      this.table.filterSet.isValid = true;
      var callback = sinon.stub();
      this.table.fetch({}, callback);
      expect(this.table.filters).to.deep.equal(serialized);
      var self = this;
      var fields = Object.keys(serialized);
      fields.forEach(function(field) {
        expect(
          self.table.filters[field].length,
          'Expected greater than 10 items for ' + field
        ).to.be.above(10);
        expect(
          $('#' + field + '-field').length,
          'Expected ' + field + ' field to exist'
        ).to.be.above(0);
        expect(
          $('#exceeded_' + field + '_limit').length,
          'Expected error message to exist for ' + field
        ).to.be.above(0);
      });
    });

    it('test filters where data type is not processed', function() {
      var ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      var names = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
      var serialized = {
        committee_id: ids,
        recipient_name: names,
        recipient_city: names,
        data_type: 'raw'
      };
      this.table.opts.title = 'Disbursements';
      this.table.filterSet = {
        serialize: function() {
          return serialized;
        },
        fields: ['committee_id', 'recipient_name', 'recipient_city']
      };
      this.table.filterSet.isValid = true;
      var callback = sinon.stub();
      this.table.fetch({}, callback);
      expect(this.table.filters).to.deep.equal(serialized);
      expect(this.table.filters.data_type, 'Expected raw data type').to.equal('raw');
      var self = this;
      this.table.filterSet.fields.forEach(function(field) {
        expect(
          self.table.filters[field].length,
          'Expected field to be greater than 10: ' + field
        ).to.be.above(10);
        expect(
          $('#' + field + '-field').length,
          'Expected field to exist: ' + field
        ).to.be.above(0);
        expect(
          $('#exceeded_' + field + '_limit').length,
          'Expected error message to not exist: ' + field
        ).to.equal(0);
      });
    });
  });

  describe('Update to F24', function() {
    beforeEach(function() {
      this.table.xhr = null;
      $('body').append(
        '<div id="is_notice-toggle_processed"><ul class="dropdown__selected"></ul><input id="filing-form-f3x_processed" /></div>'
      );
    });

    it('filing form updates to F24 when is_notice is true', function() {
      var serialized = {
        is_notice: 'true',
        filing_form: ['F3X']
      };
      this.table.filterSet = {
        serialize: function() {
          return serialized;
        },
        fields: ['is_notice', 'filing_form']
      };
      this.table.filterSet.isValid = true;
      var callback = sinon.stub();
      this.table.fetch({}, callback);
      expect(this.table.filters).to.deep.equal(serialized);
      expect(
        this.table.filters.filing_form,
        'Expected filing form to be F24'
      ).to.deep.equal(['F24']);
    });
  });
});
