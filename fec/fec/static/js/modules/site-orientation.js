'use strict';

var $ = require('jquery');
var introJs = require('../vendor/intro');
var URI = require('urijs');

var helpers = require('./helpers');

var uri = window.location.toString();
var uriQuery = helpers.sanitizeQueryParams(URI.parseQuery(window.location.search));

// Use a fresh localstorage item once we're in production
var STORAGE_ITEM;
if (window.CANONICAL_BASE === 'https://www.fec.gov') {
  STORAGE_ITEM = 'FEC_BANNER_COLLAPSED_PROD';
} else {
  STORAGE_ITEM = 'FEC_BANNER_COLLAPSED';
}

function SiteOrientation(selector) {
  this.$selector = $(selector);

  this.isMobile = $('.js-nav-toggle').is(':visible');

  this.$banner = this.$selector.find('.banner');
  this.$bannerToggleSection = this.$banner.find('.toggle');
  this.$bannerToggleLink = this.$banner.find('.toggle-text');
  this.$bannerMoreText = this.$bannerToggleLink.find('.more');
  this.$bannerLessText = this.$bannerToggleLink.find('.less');

  this.$tourHeader = this.$selector.find('.tour__header');

  this.$startTourLink = this.$selector.find('.tour__start__button');
  this.$startTourLink.on('click', this.startTour.bind(this));

  if (this.$selector.length) {
    if (uriQuery.tour) {
      this.startTour();
    }
    else {
      this.initBanner();
    }
  }
}

SiteOrientation.prototype.initBanner = function () {
  this.$banner.attr('aria-hidden', 'false').show();

  // anonymous feedback tool click
  this.$selector.on('click', '.js-feedback', function () {
    $(document.body).trigger('feedback:open');
  });

  if (localStorage.getItem(STORAGE_ITEM) === 'true') {
    this.minimizeBanner();
  }

  // unbind to prevent multiple click actions
  this.$bannerToggleLink.unbind().on('click', this.toggleBanner.bind(this));
};

SiteOrientation.prototype.toggleBanner = function () {
  if (this.$bannerToggleSection.is(':visible')) {
    this.minimizeBanner();
  }
  else {
    this.openBanner();
  }
};

SiteOrientation.prototype.openBanner = function () {
  this.$bannerToggleSection.show().attr('aria-hidden', 'false');
  this.$bannerLessText.attr('aria-hidden', 'false').show();
  this.$bannerMoreText.attr('aria-hidden', 'true').hide();
  this.$bannerToggleLink.attr('aria-expanded', 'true');

  this.$bannerToggleLink.find('.less').focus();

  localStorage.setItem(STORAGE_ITEM, 'true');
};

SiteOrientation.prototype.minimizeBanner = function () {
  this.$bannerToggleSection.attr('aria-hidden', 'true').hide();
  this.$bannerLessText.attr('aria-hidden', 'true').hide();
  this.$bannerMoreText.attr('aria-hidden', 'false').show();
  this.$bannerToggleLink.attr('aria-expanded', 'false');

  this.$bannerToggleLink.find('.more').focus();

  localStorage.setItem(STORAGE_ITEM, 'true');
};

SiteOrientation.prototype.tourPageCheck = function () {
  // make sure tour window starts on top
  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  };

  // if the user clicks "start a tour" on a page without tooltips
  // then it will take them to the homepage and start the tour
  if (typeof TOUR_PAGE == 'undefined') {
    window.location.href = CMS_URL + '/?tour=true';
    return;
  }
};

SiteOrientation.prototype.setupTourHeader = function () {
  var currentPage = this.$tourHeader.find('.tour-' + TOUR_PAGE);

  this.$banner.attr('aria-hidden', 'true').hide();
  this.$tourHeader.attr('aria-hidden', 'false').show();

  // set top padding for fixed tour header
  $('body').css('padding-top', this.$tourHeader.outerHeight());

  // highlight current tour page on header and turn off link
  currentPage.addClass('is-active').find('a').click(function (e) {
    e.preventDefault();
  });

  this.nextSectionLink = currentPage.next().find('a').attr('href');
};

SiteOrientation.prototype.setupTourPoints = function () {
  if (this.isMobile) {
    // remove desktop only tour points
    $('.masthead .tour__point, .js-sticky-side .tour__point').remove();
  }

  // display tour dots relative to their nearest element
  $('.tour__point').css('display', 'inline-block').parent().css('position', 'relative');
  $('.tour__point--middle').css('display', 'block');
};

SiteOrientation.prototype.startTour = function () {
  var self = this;
  var tour = introJs.introJs();
  var tourPrevLabel = '<i class="icon icon--small i-arrow-left"></i> Back';
  var tourNextLabel = 'Next <i class="icon icon--small i-arrow-right"></i>';
  var tourLastLabel = 'Next section <i class="icon icon--small i-arrow-right"></i>';
  var lastTourPage = 'legal-resources';

  this.tourPageCheck();
  this.setupTourHeader();
  this.setupTourPoints();

  if (TOUR_PAGE === lastTourPage) {
    // Last tooltip (tour.onexit) opens modal
    tourLastLabel = 'Next <i class="icon icon--small i-arrow-right"></i>';
  }

  tour.setOptions({
    showStepNumbers: false,
    tooltipClass: 'tour__tooltip',
    prevLabel: tourPrevLabel,
    nextLabel: tourNextLabel,
    doneLabel: tourLastLabel,
    overlayOpacity: 0,
    exitOnEsc: false
  });

  // native intro.js behavior scrolls longer tooltips offscreen
  // so this scrolls to tooltip with some padding
  tour.onchange(function (target) {
    $(window).scrollTop($(target).offset().top - 200);
  });

  tour.oncomplete(function () {
    if (TOUR_PAGE == lastTourPage) {
      self.exitTour();

      var tourEndCurtain = $('<div />', {'class': 'tour__end__curtain'});
      var tourEndModal = $('<div />', {
        'class': 'tour__end__modal',
        'html': '<h5><i class="icon icon-star"></i> Congratulations!</h5>' +
        'You\'ve completed our tour of new features!' +
        '<a role="button" class="tour__end__button tour__end__button--home" href="' +
        CMS_URL + '/">Return home</a>' +
        '<p>Send us your questions and feedback anonymously from any page using our ' +
        '<a class="js-feedback">feedback tool</a>.</p>' +
        '<button class="tour__end__button tour__end__button--close">Close tour</button>'
      });

      self.$selector.prepend(tourEndCurtain, tourEndModal);

      $('.tour__end__button--home').focus();

      $('.tour__end__button--close').on('click', function () {
        tourEndCurtain.remove();
        tourEndModal.remove();
      });
    }
    else {
      window.location.href = self.nextSectionLink;
    }
  });

  tour.onexit(function () {
    self.exitTour();
  });

  // begin intro.js functionality
  tour.start();

  // click ESC to end tour
  $(document).keyup(function (e) {
    if (e.keyCode == 27) {
      tour.exit();
    }
  });

  this.$selector.find('.exit-tour').on('click', function () {
    tour.exit();
  });

  // removes native intro.js curtain to not close tooltip
  $('.introjs-overlay').remove();
};

SiteOrientation.prototype.exitTour = function () {
  this.$tourHeader.attr('aria-hidden', 'true').hide();
  this.initBanner();

  // removes top padding for fixed tour header
  $('body').removeAttr('style');

  this.minimizeBanner();

  $('.tour__point').hide();
  $('.introjs-helperLayer, .introjs-tooltipReferenceLayer').remove();

  // remove ?tour=true querystring
  if (uri.indexOf('?') > 0) {
    var clean_uri = uri.substring(0, uri.indexOf('?'));
    window.history.replaceState({}, document.title, clean_uri);
  }
};

module.exports = {
  SiteOrientation: SiteOrientation
};
