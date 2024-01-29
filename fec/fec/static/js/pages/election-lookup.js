var lookup = require('../modules/election-search');

$(document).ready(function() {
  new lookup.ElectionSearch('#election-lookup', true);
});
