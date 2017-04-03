'use strict';

function Banner($elm) {
  this.$elm = $elm;
  this.$closeButton = this.$elm.find('.js-close-banner');
  this.$max = this.$elm.find('.js-banner-max');
  this.$min = this.$elm.find('.js-banner-min');

  this.$closeButton.on('click', this.minimize.bind(this));
  this.init();
}

Banner.prototype.init = function() {
  var wasClosed = window.sessionStorage.getItem('fecBannerIsClosed')
                    || window.localStorage.getItem('fecBannerIsClosed');
  if (!wasClosed) {
    this.maximize();
  }
}

Banner.prototype.minimize = function(e) {
  this.$max.attr('aria-hidden', true);
  this.$min.attr('aria-hidden', false);
  if ($(e.target).data('remember-closed')) {
    window.localStorage.setItem('fecBannerIsClosed', true);
  } else {
    window.sessionStorage.setItem('fecBannerIsClosed', true);
  }
};

Banner.prototype.maximize = function() {
  this.$max.attr('aria-hidden', false);
  this.$min.attr('aria-hidden', true);
};

module.exports = {Banner: Banner};
