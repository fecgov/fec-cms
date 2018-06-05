'use strict';

var chai = require('chai');
var expect = chai.expect;
var columnHelpers = require('../../static/js/modules/column-helpers');

function stringToElement(str) {
  var div = document.createElement('div');
  div.innerHTML = str;

  return div.firstChild;
}

describe('column helpers', function() {
  var data = '100';
  var type = 'test';
  var row = {committee_id: 1, cycle: 2018};
  var meta = {row: '1'};

  describe('barColumn', function() {
    it('should return a default formatted object', function() {
      var barColumn = columnHelpers.barColumn();
      var results = barColumn({});
      expect(results).to.be.an('object');
      expect(results).to.have.all.keys('render','orderSequence');
    });

    it('should render an element', function() {
      var barColumn = columnHelpers.barColumn();
      var results = barColumn({});
      var renderResults = results.render(data, type, row, meta);
      var element = stringToElement(renderResults);
      expect(element.getAttribute('data-value')).to.equal(data);
      expect(element.getAttribute('data-row')).to.equal(meta.row);
    });
  });

  describe('buildAggregateUrl', function() {
    it('should return min and max cycle date', function() {
      var results = columnHelpers.buildAggregateUrl(2018);
      expect(results).to.be.an('object');
      expect(results).to.have.all.keys('min_date', 'max_date');
      expect(results.min_date).to.equal('01-01-2017');
      expect(results.max_date).to.equal('12-31-2018');
    });

    it('should return two year transaction period', function() {
      var results = columnHelpers.buildAggregateUrl(2018, true);
      expect(results).to.be.an('object');
      expect(results).to.have.all.keys('two_year_transaction_period');
      expect(results.two_year_transaction_period).to.equal(2018);
    });
  });

  describe('buildEntityLink', function() {
    var input = 'data';
    var url = 'http://example.com';
    var category = 'test';

    it('should return default entity link', function() {
      var results = columnHelpers.buildEntityLink(input, url, category, {});
      var element = stringToElement(results);
      expect(results).to.be.a('string');
      expect(element.getAttribute('href')).to.equal(url);
      expect(element.getAttribute('title')).to.equal(input);
      expect(element.getAttribute('data-category')).to.equal(category);
    });

    it('should return entity link with is-incumbent class', function() {
      var results = columnHelpers.buildEntityLink(input, url, category, {isIncumbent: true});
      var element = stringToElement(results);
      expect(results).to.be.a('string');
      expect(element.getAttribute('href')).to.equal(url);
      expect(element.getAttribute('title')).to.equal(input);
      expect(element.getAttribute('data-category')).to.equal(category);
      expect(element.getAttribute('class')).to.equal('is-incumbent')
    });
  });

  describe('buildTotalLink', function() {
    function getNoParams() {
      return undefined;
    }

    function getParams(data, type, row, meta) {
      return {
        params: {
          data: data,
          type: type,
          row: row,
          meta: meta
        }
      };
    }

    var path = 'http://example.com/test';
    var pathReceipts = 'http://example.com/receipts';
    var title = 'Show individual transactions';
    var context = '$'+data+'.00';

    it('should return default total link with no params', function() {
      var buildTotalLink = columnHelpers.buildTotalLink(path, getNoParams);
      var results = buildTotalLink(data, type, row, meta);
      var element = stringToElement(results);
      expect(results).to.be.a('string');
      expect(element.getAttribute('data-value')).to.equal(data);
      expect(element.getAttribute('data-row')).to.equal(meta.row);
    });

    it('should return default total link with params', function() {
      var buildTotalLink = columnHelpers.buildTotalLink(path, getParams);
      var results = buildTotalLink(data, type, row, meta);
      var element = stringToElement(results);
      var a = element.firstChild;
      expect(results).to.be.a('string');
      expect(element.getAttribute('data-value')).to.equal(data);
      expect(element.getAttribute('data-row')).to.equal(meta.row);
      expect(a.getAttribute('title')).to.equal(title);
      expect(a.getAttribute('href')).to.be.a('string');
      expect(a.innerHTML).to.equal(context);
    });

    it('should return receipts total link with params', function() {
      var buildTotalLink = columnHelpers.buildTotalLink(pathReceipts, getParams);
      var results = buildTotalLink(data, type, row, meta);
      var element = stringToElement(results);
      var a = element.firstChild;
      var includeTransactions = a.getAttribute('href').indexOf('two_year_transaction_period') > -1;
      expect(includeTransactions).to.be.true;
    });
  });

  describe('formattedColumn', function() {
    function format(data, type, row, meta) {
      return {
        data: data, type: type, row: row, meta: meta
      };
    }

    it('should return a default formatting object', function() {
      var formattedColumn = columnHelpers.formattedColumn(function(){});
      var results = formattedColumn({});
      expect(results).to.be.an('object');
      expect(results).to.have.all.keys('render');
      expect(results.render).to.be.a('function');
    });

    it('should render a formatting function', function() {
      var formattedColumn = columnHelpers.formattedColumn(format);
      var results = formattedColumn();
      var renderResults = results.render(data, type, row, meta);
      expect(renderResults).to.be.an('object');
      expect(renderResults).to.deep.equal({
        data: data,
        type: type,
        row: row,
        meta: meta
      });
    });
  });

  describe('getColumns', function() {
    it('should return an array of column objects', function() {
      var keys = ['a', 'b', 'c'];
      var columns = {
        a: {
          name: 'a',
          'type': 'int'
        },
        b: {
          name: 'b',
          'type': 'int'
        }
      };

      var results = columnHelpers.getColumns(columns, keys);
      expect(results).to.be.an('array');
      expect(results).to.have.length(3);
    });
  });

  describe('getSizeParams', function() {
    it('should return an object with min and max', function() {
      var results = columnHelpers.getSizeParams(0);
      expect(results).to.have.all.keys('min_amount', 'max_amount');
    });

    it('should return an object with min', function() {
      var results = columnHelpers.getSizeParams(2000);
      expect(results).to.have.all.keys('min_amount');
    });
  });

  describe('sizeInfo', function() {
    it('should be a constants object', function() {
      var results = columnHelpers.sizeInfo;
      expect(results).to.be.an('object');
    });
  });

  describe('urlColumn', function() {
    it('should return a default object', function() {
      var results = columnHelpers.urlColumn('test');
      expect(results).to.be.an('object');
      expect(results).to.have.all.keys('render');
      expect(results.render).to.be.a('function');
    });

    it('should have render an element', function() {
      var results = columnHelpers.urlColumn('committee_id');
      var renderResults = results.render(data, type, row, meta);
      var element = stringToElement(renderResults);
      expect(renderResults).to.be.a('string');
      expect(element.getAttribute('href')).to.equal(row.committee_id.toString());
    });

    it('should have render data', function() {
      var results = columnHelpers.urlColumn('test');
      var renderResults = results.render(data, type, row, meta);
      expect(renderResults).to.equal(data);
    });
  });
});
