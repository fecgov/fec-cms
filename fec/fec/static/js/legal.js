'use strict';

function Legal(feedbackWidget, feedbackSelector) {
  $(feedbackSelector).click(function(e) {
    e.preventDefault();
    feedbackWidget.show();
  });
}

module.exports = {Legal: Legal};
