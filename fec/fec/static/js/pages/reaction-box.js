'use strict';

/**
 * This calls `reactionFeedback(request)` in `/data/views.py `to post as a Github issue.
 * Previously implemented here (ported to this Django project):
 * https://github.com/18F/openFEC-web-app/blob/develop/openfecwebapp/views.py#L302
 */
var $ = require('jquery');
var helpers = require('../modules/helpers');
//var analytics = require('../modules/analytics');

const loadRecaptcha = require('../modules/load-recaptcha').loadRecaptcha;

function ReactionBox(selector) {
  this.$element = $(selector);
  this.$form = this.$element.find('form');
  this.$textarea = this.$element.find('textarea');

  this.$step1 = this.$element.find('.js-reaction-step-1');
  this.$step2 = this.$element.find('.js-reaction-step-2');
  this.$success = this.$element.find('.js-reaction-success');
  this.$error = this.$element.find('.js-reaction-error');

  this.name = this.$element.data('name');
  this.location = this.$element.data('location');
  this.path = window ? window.location.pathname : null;
  this.url = helpers.buildAppUrl(['issue', 'reaction']);
  // eslint-disable-next-line no-console
  console.log('this.url', this.url);

  this.$element.on('click', '.js-reaction', this.submitReaction.bind(this));
  this.$element.on('click', '.js-reset', this.handleReset.bind(this));

  loadRecaptcha();
}
/**
 * Submits step1 of the reaction form with the button chosen.
 * @param {e} event
 * captures value of button clicked as `reaction`
 * passes `location` and `name` along
 */

ReactionBox.prototype.submitReaction = function(e) {
  this.reaction = $(e.target).data('reaction');
  // analytics.customEvent({
  //   eventName: 'fecCustomEvent',
  //   eventCategory: 'Reactions',
  //   eventAction: this.location + '-' + this.name + ': ' + this.reaction,
  //   eventValue: 1
  // });
  this.showTextarea();
};

/**
 * Show step2 of reaction form, the textarea.
 */
ReactionBox.prototype.showTextarea = function() {
  this.$step1.attr('aria-hidden', true);
  this.$step2.attr('aria-hidden', false);
  // eslint-disable-next-line no-console
  console.log('this.url', this.url);

  var labelMap = {
    informative: 'Great! \n What did you learn?',
    confusing: 'We’re sorry to hear that. What didn\'t make sense?',
    'not-interested': 'We’re sorry to hear that. What would you like to see?',
    none: 'How we can make this better?'
  };

  this.$step2.find('label').text(labelMap[this.reaction]);
};

/**
 * Submits step2 of the reaction form with the recaptcha token.
 * @param {token} csrf token
 * passes `feedback` :textarea.val
 * passes `reaction` : from step1
 * captures `path` : window.location.pathname || null
 */
ReactionBox.prototype.handleSubmit = function(token) {
  $.ajaxSetup({
    beforeSend: function(xhr, settings) {
      if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
        // eslint-disable-next-line no-console
        console.log('URL:', settings.url);
        // Only send the token to relative URLs i.e. locally.
        xhr.setRequestHeader(
          'X-CSRFToken',
          $('input[name="csrfmiddlewaretoken"]').val()
        );
      }
    }
  });
  var chartLocation = this.path || this.location;

  var data = {
    name: this.name ? this.name : '',
    location: chartLocation ? chartLocation : '',
    reaction: this.reaction ? this.reaction : '',
    feedback: this.$textarea.val(),
    userAgent: navigator.userAgent
  };
  // explicitly set token as g-recaptcha-response
  data['g-recaptcha-response'] = token;

  var promise = $.ajax({
    method: 'POST',
    url: this.url,
    data: JSON.stringify(data),
    contentType: 'application/json',
    dataType: 'json'
  });

  promise.done(this.handleSuccess.bind(this));
  promise.fail(this.handleError.bind(this));
};

ReactionBox.prototype.handleSuccess = function() {
  this.$step2.attr('aria-hidden', true);
  this.$success.attr('aria-hidden', false);
};

ReactionBox.prototype.handleError = function() {
  this.$step2.attr('aria-hidden', true);
  this.$error.attr('aria-hidden', false);
};

ReactionBox.prototype.handleReset = function() {
  this.$error.attr('aria-hidden', true);
  this.$step2.attr('aria-hidden', false);
  this.$textarea.val('');
};

/**
 * To implement a reaction box:
 * Add a reaction-box jinja macro to a template
 * Include a reference to this JS file in the parent template(preferably in extra JS block)
 * (The below function will use the name/location values of any
 *  reaction box on the page to initiate it as a new ReactionBox())
 */

/**
 * Document ready function called when document is loaded
 */
$(document).ready(function() {
  //find any reaction box(es) on the page
  var reactionBoxes = document.querySelectorAll('.reaction-box');
  var names = [];
  //iterate over the reaction box(es)
  for (var box of reactionBoxes) {
    var name = box.getAttribute('data-name');
    var location = box.getAttribute('data-location');
    //push name to names array
    names.push(name);
    //inititailize new ReactionBox
    window[name] = new ReactionBox(
      `[data-name="${name}"][data-location="${location}"]`
    );
  }
  //use names array to define the submitReaction*() for each
  names.forEach(function(nm) {
    window['submitReaction' + nm] = function(token) {
      window[nm].handleSubmit(token);
    };
  });
});

