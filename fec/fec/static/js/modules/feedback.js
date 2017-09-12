'use strict';

var $ = require('jquery');
var _ = require('underscore');

var accessibility = require('./accessibility');
var helpers = require('./helpers');

var feedback = require('../templates/feedback.hbs');

var statusClasses = {
  success: 'message--success',
  error: 'message--error'
};

/**
 * Feedback widget
 * @constructor
 * @param {String} url - AJAX URL
 * @param {String} parent - Optional parent selector; defaults to 'body'
 */
function Feedback(url, parent) {
  this.url = url;
  this.isOpen = false;
  this.$feedback = $(feedback());

  $(parent || 'body').append(this.$feedback);

  this.$button = this.$feedback.find('.js-feedback');
  this.$reset = this.$feedback.find('.js-reset');
  this.$box = this.$feedback.find('.js-feedback-box');
  this.$status = this.$box.find('.js-status');
  this.$message = this.$box.find('.js-message');
  this.$form = this.$feedback.find('form');

  this.$button.on('click', this.toggle.bind(this));
  this.$reset.on('click', this.reset.bind(this));
  this.$form.on('submit', this.submit.bind(this));

  accessibility.removeTabindex(this.$box);

  $(document.body).on('feedback:open', this.show.bind(this));
}

Feedback.prototype.toggle = function() {
  var method = this.isOpen ? this.hide : this.show;
  method.apply(this);
};

Feedback.prototype.show = function() {
  this.$box.attr('aria-hidden', 'false');
  this.$button.attr('aria-expanded', 'true');
  this.isOpen = true;

  accessibility.restoreTabindex(this.$box);
};

Feedback.prototype.hide = function() {
  this.$box.attr('aria-hidden', 'true');
  this.$button.attr('aria-expanded', 'false');
  this.isOpen = false;

  accessibility.removeTabindex(this.$box);
};

Feedback.prototype.submit = function(e) {
  /**
   * setup JQuery's AJAX methods to setup CSRF token in the request before sending it off.
   * http://stackoverflow.com/questions/5100539/django-csrf-check-failing-with-an-ajax-post-request
   */
  $.ajaxSetup({
     beforeSend: function(xhr, settings) {
       if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
           // Only send the token to relative URLs i.e. locally.
           xhr.setRequestHeader('X-CSRFToken', helpers.getCookie('csrftoken'));
       }
     }
  });

  e.preventDefault();

  var data = _.chain(this.$box.find('textarea'))
    .map(function(elm) {
      var $elm = $(elm);
      return [$elm.attr('name'), $elm.val()];
    })
    .object()
    .value();

  if (!_.some(_.values(data))) {
    var message =
      '<h2 class="feedback__title">Input required</h2>' +
      '<p>Please fill out at least one field.</p>';
    var buttonText = 'Try again';
    this.message(message, buttonText, 'error');
    return;
  }

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

Feedback.prototype.handleSuccess = function(response) {
  var message =
    '<h2 class="feedback__title">Thanks for helping us improve</h2>' +
    '<p>This information has been reported on GitHub, where it\'s publicly visible. ' +
    '<a href="' + response.html_url + '">Track the status of your feedback</a>.</p>';
  var buttonText = 'Submit another issue';
  this.$box.find('textarea').val('');
  this.message(message, buttonText, 'success');
};

Feedback.prototype.handleError = function() {
  var message =
    '<h2 class="feedback__title">There was an error</h2>' +
    '<p>Please try submitting your issue again.</p>';
  var buttonText = 'Try again';
  this.message(message, buttonText, 'error');
};

Feedback.prototype.message = function(text, buttonText, style) {
  var self = this;
  this.$form.attr('aria-hidden', true);
  this.$status.attr('aria-hidden', false);
  this.$reset.text(buttonText);
  _.each(statusClasses, function(value) {
    self.$message.removeClass(value);
  });
  this.$message.html(text).addClass(statusClasses[style]);
};

Feedback.prototype.reset = function() {
  this.$form.attr('aria-hidden', false);
  this.$status.attr('aria-hidden', true);
};

module.exports = {Feedback: Feedback};
