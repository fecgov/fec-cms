// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
import { stub } from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import { default as URI } from 'urijs';

import CycleSelect from '../../static/js/modules/cycle-select.js';

function trim(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ');
}

function expectDisabled($elm, disabled) {
  const $input = $elm.find('input');
  const $span = $elm.find('span');
  if (disabled) {
    expect($input.prop('disabled')).to.be.ok;
    expect($span.hasClass('is-disabled')).to.be.true;
  } else {
    expect($input.prop('disabled')).not.to.be.ok;
    expect($span.hasClass('is-disabled')).to.be.false;
  }
}

describe('cycle select', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').empty().append(this.$fixture);
  });

  beforeEach(function() {
    stub(CycleSelect.prototype, 'setUrl');
  });

  afterEach(function() {
    CycleSelect.prototype.setUrl.restore();
  });

  describe('query cycle select', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<select class="cycle-select" data-cycle-location="query">' +
          '<option value="2012"></option>' +
          '<option value="2014"></option>' +
          '<option value="2016"></option>' +
        '</select>'
      );
      this.cycleSelect = CycleSelect.build($('#fixtures select'));
    });

    it('renders static two-year period', function() {
      expect(trim(this.cycleSelect.$cycles.text())).to.equal('Time period: 2011–2012');
    });

    it('changes the query string on change', function() {
      this.cycleSelect.$elm.val('2014').trigger('change');
      expect(CycleSelect.prototype.setUrl).to.have.been.calledWith(window.location.href + '?cycle=2014');
    });
  });

  describe('election query cycle select', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<select id="cycle-1" class="cycle-select" data-duration="4" data-cycle-location="query">' +
          '<option value="2016"></option>' +
          '<option value="2012"></option>' +
          '<option value="2008"></option>' +
        '</select>'
      );
      this.cycleSelect = CycleSelect.build($('#fixtures select'));
    });

    it('renders two-year period select', function() {
      var $cycles = this.cycleSelect.$cycles.find('span');
      expect($cycles.length).to.equal(3);
      var labels = ['All years: 2013–2016', '2013–2014', '2015–2016'];
      expect(
        $cycles.map(function(idx, elm) {
          return trim($(elm).text());
        }).get()
      ).to.deep.equal(labels);
    });

    it('changes the query string on change', function() {
      this.cycleSelect.$cycles.find('[name="cycle-toggle-cycle-1"]').val('2014').trigger('change');
      expect(
        CycleSelect.prototype.setUrl
      ).to.have.been.calledWith(
        window.location.href + '?cycle=2014&election_full=false'
      );
    });

    it('disables cycles not included in context', function() {
      window.context = { cycles: [2016] };
      this.cycleSelect.initCyclesMulti(2016);
      var labels = this.cycleSelect.$cycles.find('label');
      expectDisabled(labels.eq(0), false);
      expectDisabled(labels.eq(1), true);
      expectDisabled(labels.eq(2), false);
    });

    it('disables all two year periods if context cycles is null', function() {
      window.context = { cycles: null };
      this.cycleSelect.initCyclesMulti(null);
      var labels = this.cycleSelect.$cycles.find('label');
      expectDisabled(labels.eq(0), false);
      expectDisabled(labels.eq(1), true);
      expectDisabled(labels.eq(2), true);
    });
  });

  describe('path cycle select', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<select class="cycle-select" data-cycle-location="path">' +
          '<option value="2012"></option>' +
          '<option value="2014"></option>' +
          '<option value="2016"></option>' +
        '</select>'
      );
      this.cycleSelect = CycleSelect.build($('#fixtures select'));
    });

    it('changes the query string on change', function() {
      this.cycleSelect.$elm.val('2014').trigger('change');
      var url = URI(window.location.href);
      url.path('2014/');
      expect(CycleSelect.prototype.setUrl).to.have.been.calledWith(url.toString());
    });
  });
});
