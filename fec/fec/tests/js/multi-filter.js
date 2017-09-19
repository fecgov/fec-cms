'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var MultiFilter = require('../../static/js/modules/filters/multi-filter').MultiFilter;

describe('MultiFilter', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div class="js-filter" data-name="category" data-filter="multi">'+
      '<button class="accordion__trigger" id="label-1">Reports</button>' +
      '<div class="accordion__content">' +
        '<div class="js-sub-filter" data-filter-label="label-1" data-name="category">' +
          '<input id="president" name="category" type="checkbox" value="m">' +
          '<label for="president">Monthly</label>' +
          '<input id="senate" name="category" type="checkbox" value="q">' +
          '<label for="senate">Quarterly</label>' +
        '</div>' +
      '</div>' +
      '<button class="accordion__trigger" id="label-2">Events</button>' +
      '<div class="accordion__content">' +
        '<div class="js-sub-filter" data-filter-label="label-2" data-name="category">' +
          '<input id="president" name="category" type="checkbox" value="o">' +
          '<label for="president">Open meeting</label>' +
          '<input id="senate" name="category" type="checkbox" value="w">' +
          '<label for="senate">Webinar</label>' +
        '</div>' +
      '</div>'
    );
    this.filter = new MultiFilter(this.$fixture.find('.js-filter'));
  });

  it('locates dom elements', function() {
    expect(this.filter.$elm.is('#fixtures .js-filter')).to.be.true;
  });

  it('finds all subfilters', function() {
    expect(this.filter.subfilters.length).to.equal(2);
  });

  it('sets the correct label for each subfilter', function() {
    var subfilter = this.filter.subfilters[0];
    var label = $('#label-1');
    expect(subfilter.$filterLabel.is(label)).to.be.true;
  });
});
