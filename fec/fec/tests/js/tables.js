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

var helpers = require('../../static/js/modules/helpers');
var tables = require('../../static/js/modules/tables');
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
});
