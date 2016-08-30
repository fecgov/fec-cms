'use strict';

function Legal(feedbackWidget, feedbackSelector, ethnioSelector) {
  $(feedbackSelector).click(function(e) {
    e.preventDefault();
    feedbackWidget.show()
  });

  $(ethnioSelector).click(function(e) {
    e.preventDefault();
    Ethnio.force_display = true;
    Ethnio.close();
    Ethnio.show();
    Ethnio.force_display = false;
  })
}

module.exports = {Legal: Legal}
