'use strict';

/* global module, ga */

var $ = require('jquery');
var helpers = require('./helpers');
var analytics = require('fec-style/js/analytics');

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

  this.url = helpers.buildAppUrl(['issue']);

  this.$element.on('click', '.js-reaction', this.submitReaction.bind(this));
  this.$element.on('click', '.js-skip', this.handleSuccess.bind(this));
  this.$element.on('click', '.js-reset', this.handleReset.bind(this));

  this.$form.on('submit', this.handleSubmit.bind(this));
}

ReactionBox.prototype.submitReaction = function(e) {
  this.reaction = $(e.target).data('reaction');
  if (analytics.trackerExists()) {
    var gaEventData = {
      eventCategory: 'Reactions',
      eventAction: this.location + '-' + this.name + ': ' + this.reaction,
      eventValue: 1
    };
    ga('notDAP.send', 'event', gaEventData);
  }

  this.showTextarea();
};

ReactionBox.prototype.showTextarea = function() {
  this.$step1.attr('aria-hidden', true);
  this.$step2.attr('aria-hidden', false);

  var labelMap = {
    'informative': 'Great! \n What did you learn?',
    'confusing': 'We’re sorry to hear that. What didn\'t make sense?',
    'not-interested': 'We’re sorry to hear that. What would you like to see?',
    'none': 'How we can make this better?'
  };

  this.$step2.find('label').text(labelMap[this.reaction]);
};

ReactionBox.prototype.handleSubmit = function(e) {
  e.preventDefault();
  var data = {
    chart_reaction: this.reaction,
    chart_name: this.name,
    chart_location: this.location,
    chart_comment: this.$textarea.val()
  };

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

module.exports = { ReactionBox: ReactionBox };

