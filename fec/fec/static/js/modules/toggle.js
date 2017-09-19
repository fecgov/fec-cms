'use strict';

/* global require, module, document */
var $ = require('jquery');

module.exports = {
  init: function() {
    $(document).ready(function() {
      $('.js-toggles input').each(function(){
        $(this).attr('aria-controls', $(this).attr('value'));
      });

      $('.js-panel-toggle-control').on('change', function(e) {
        var $elm = $(e.target);
        $('[name="' + $elm.attr('name') + '"]').each(function(idx, input) {
          var $input = $(input);
          $('#' + $input.attr('value')).attr('aria-hidden','true');
        });
        $('#' + $elm.attr('value')).attr('aria-hidden','false');
      });
    });
  }
};
