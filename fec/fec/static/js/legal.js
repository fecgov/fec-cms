'use strict';

function Legal(feedbackWidget, feedbackSelector, ethnioSelector) {
  $(feedbackSelector).click(function(e) {
    e.preventDefault();
    feedbackWidget.show()
  });

  $(ethnioSelector).click(function(e) {
    e.preventDefault();
    Ethnio.close();
    Ethnio.show();
  })
}

module.exports = {Legal: Legal}
