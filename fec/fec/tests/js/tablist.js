import { expect } from 'chai';

import { init as tablistInit } from '../../static/js/vendor/tablist.js';

describe('tablist', function() {
  var fixture;
  before(function() {
    fixture = $('<div id="fixtures"></div>');
    $('body').append(fixture);
  });

  describe('init', function() {
    it('should show first tab if there\'s no query', function() {
      fixture.empty().append(
        '<div class="tab-interface">' +
          '<ul role="tablist" data-name="tab">' +
            '<li><a role="tab" data-name="tab0" href="#section-0">0</a></li>' +
            '<li><a role="tab" data-name="tab1" href="#section-1">1</a></li>' +
          '</ul>' +
          '<section id="section-0" role="tabpanel" aria-hidden="true">' +
          '</section>' +
          '<section id="section-1" role="tabpanel"></section>' +
        '</div>'
      );

      tablistInit();

      expect($('[data-name="tab0"]').attr('aria-selected')).to.be.eql('true');
      expect($('[data-name="tab1"]').attr('aria-selected')).to.be.undefined;
      expect($('#section-0').attr('aria-hidden')).to.be.undefined;
      expect($('#section-1').attr('aria-hidden')).to.be.eql('true');
    });
  });
});
