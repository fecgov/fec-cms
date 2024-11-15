import { expect } from 'chai';
import { stub } from 'sinon/pkg/sinon-esm';
import './setup.js';

import FilterPanel from '../../static/js/modules/filters/filter-panel.js';
import FilterSet from '../../static/js/modules/filters/filter-set.js';
import * as helpers from '../../static/js/modules/helpers.js';

function expectOpen(panel) {
  expect(panel.isOpen).to.be.true;
  expect(panel.$body.hasClass('is-open')).to.be.true;
  expect($('body').hasClass('is-showing-filters')).to.be.true;
}

function expectClosed(panel) {
  expect(panel.isOpen).to.be.false;
  expect(panel.$body.hasClass('is-open')).to.be.false;
  expect($('body').hasClass('is-showing-filters')).to.be.false;
}

describe('filter panel', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    this.$fixture
      .empty()
      .append(
        '<div id="filters" class="filters">' +
          '<button class="js-filter-toggle js-filter-header"></button>' +
          '<div class="filters__content">' +
          '<form id="category-filters">' +
          '</form>' +
          '</div>' +
          '</div>'
      );
    this.panel = new FilterPanel();
  });

  // TODO: sinon's .stub() has been changed so this needs to be addressed
  // helpers.getWindowWidth is non-configurable and non-writable
  /* it('should start off closed', function() {
    expectClosed(this.panel);
  });*/

  // TODO: sinon's .stub() has been changed so this needs to be addressed
  // helpers.getWindowWidth is non-configurable and non-writable
  /* it('should toggle on click', function() {
    this.panel.$toggle.trigger('click');
    expectOpen(this.panel);
    this.panel.$toggle.trigger('click');
    expectClosed(this.panel);
  });
  */

  // TODO: sinon's .stub() has been changed so this needs to be addressed
  // helpers.getWindowWidth is non-configurable and non-writable
  /* describe('for wide windows', function() {
    beforeEach(function() {
      let width = 861;

      sinon.stub(helpers, 'getWindowWidth').returns(width);
      $('body').width(width);
    });

    afterEach(function() {
      $('body').width(960);
      // helpers.getWindowWidth.restore();
    });

    it('should start off open on wide windows', function() {
      const panel = new FilterPanel();
      expectOpen(panel);
    });
  }); */

  // TODO: DO WE STILL NEED THIS TEST NOW THAT THE it HAS BEEN REMOVED?
  describe('interaction with filterset', function() {
    beforeEach(function() {
      stub(FilterSet.prototype, 'serialize').returns({ name: 'jed' });
    });

    afterEach(function() {
      FilterSet.prototype.serialize.restore();
    });
  });

  describe('handleAddEvent()', function() {
    it('adds the count on the first event', function() {
      this.panel.handleAddEvent({}, {});
      expect(this.panel.$filterHeader.find('.filter-count').length).to.equal(1);
    });

    it('increments the count after 1', function() {
      this.panel.handleAddEvent({}, {});
      this.panel.handleAddEvent({}, {});
      expect(this.panel.$filterHeader.find('.filter-count').text()).to.equal(
        '2'
      );
    });

    it('does nothing if told to ignore count', function() {
      this.panel.handleAddEvent({}, { ignoreCount: true });
      expect(this.panel.$filterHeader.find('.filter-count').length).to.equal(0);
    });
  });

  describe('handleRemoveEvent()', function() {
    it('does nothing if the filters were not loaded once', function() {
      this.panel.handleAddEvent({}, {});
      this.panel.handleAddEvent({}, {});
      this.panel.handleRemoveEvent({}, { loadedOnce: false });
      expect(this.panel.$filterHeader.find('.filter-count').text()).to.equal(
        '2'
      );
    });

    it('decrements the count if greater than 1', function() {
      this.panel.handleAddEvent({}, {});
      this.panel.handleAddEvent({}, {});
      this.panel.handleRemoveEvent({}, { loadedOnce: true });
      expect(this.panel.$filterHeader.find('.filter-count').text()).to.equal(
        '1'
      );
    });

    it('removes the count when lower than 1', function() {
      this.panel.handleAddEvent({}, {});
      this.panel.handleRemoveEvent({}, { loadedOnce: true });
      expect(this.panel.$filterHeader.find('.filter-count').length).to.equal(0);
    });
  });
});
