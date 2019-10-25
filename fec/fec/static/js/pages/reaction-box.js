'use strict';

// THIS MODULE IS CURRENTLY NOT IN USE.
//
// This requires modifications to `/data/views.py` feedback view
// to post as a Github issue.
//
// Previously implemented here (needs a port to this Django project):
// https://github.com/18F/openFEC-web-app/blob/develop/openfecwebapp/views.py#L302

var $ = require('jquery');
var helpers = require('../modules/helpers');
var analytics = require('../modules/analytics'); // TODO - move this to Tag Manager?

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

  this.$element.on('click', '.js-reaction', this.submitReaction.bind(this));
  this.$element.on('click', '.js-reset', this.handleReset.bind(this));
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
    informative: 'Great! \n What did you learn?',
    confusing: "We’re sorry to hear that. What didn't make sense?",
    'not-interested': 'We’re sorry to hear that. What would you like to see?',
    none: 'How we can make this better?'
  };

  this.$step2.find('label').text(labelMap[this.reaction]);
};

ReactionBox.prototype.handleSubmit = function(token) {
  $.ajaxSetup({
    beforeSend: function(xhr, settings) {
      if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
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
    // 'success' : function(data) {
    //     console.log('Data: '+data);
    // },
    // 'error' : function(request,error)
    // {
    //     console.log("Request: "+JSON.stringify(request));
    // }
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

/*To add a reaction box, put add name/location arguments of your macro
as key/value in this object
*/
window.reactionBoxes = {
  election_map: 'landing',
  contributions_by_state: 'raising-by-the-numbers',
  raised: 'browse-data',
  spent: 'browse-data'
};

// window.submitReactioncontributions_by_state = function(token) {
//   window.reactionBoxes['contributions_by_state'].handleSubmit(token);
// };


$(document).ready(function() {

  //   window.reactionBoxes['contributions_by_state'] = new ReactionBox(
  //     '[data-name="contributions_by_state"][data-location="raising-by-the-numbers"]'
  //   );
  // });

  // window.submitReactionelection_map = function(token) {
  //   window.reactionBoxes['election_map'].handleSubmit(token);
  // };

  // $(document).ready(function() {
  //   window.reactionBoxes['election_map'] = new ReactionBox(
  //     '[data-name="election_map"][data-location="landing"]'
  //   );
  // });

  $.each(window.reactionBoxes, function(chart, page) {
    window.reactionBoxes[chart] = new ReactionBox(
      `[data-name="${chart}"][data-location="${page}"]`
    );

    window['submitReaction' + chart] = function(token) {
      window.reactionBoxes[chart].handleSubmit(token);
    };
  });
});

// var tabs = require('../vendor/tablist');
// window.submitReactionspent = function(token) {
//   window.reactionBoxes['spent'].handleSubmit(token);
// };

// window.submitReactionraised = function(token) {
//   window.reactionBoxes['raised'].handleSubmit(token);
// };

// $(document).ready(function() {
//   tabs.onShow($('#raising'), function() {
//     //new PlotChart('.js-raised-overview', 'raised', 1).init();
//     window.reactionBoxes['raised'] = new ReactionBox(
//       '[data-name="raised"][data-location="browse-data"]'
//     );
//   });

//   tabs.onShow($('#spending'), function() {
//     //new PlotChart('.js-spent-overview', 'spent', 2).init();
//     window.reactionBoxes['spent'] = new ReactionBox(
//       '[data-name="spent"][data-location="browse-data"]'
//     );
//   });
// });

new ReactionBox();

//module.exports = { ReactionBox: ReactionBox };
