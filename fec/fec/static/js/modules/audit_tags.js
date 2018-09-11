'use strict';

var $ = require('jquery');
var $auditCategoryTags = require('../templates/audit_tags.hbs');

function auditTags() {
  $('.data-container__tags').prepend($auditCategoryTags);
  $('.tag__category.sub').css('visibility', 'hidden');
  $('#primary_category_id').change(function() {
    var current_category = $('#primary_category_id option:selected').text();
    $('.tag__category.sub').css('visibility', 'hidden');
    $('.tag__item.primary').contents()[0].nodeValue =
      'Findings and issue category: ' + current_category;
    $('#primary_category_id').val() == 'all'
      ? $('.tag__item.primary button').hide()
      : $('.tag__item.primary button').show();
  });

  $('#sub_category_id').change(function() {
    var current_sub = $('#sub_category_id option:selected').text();
    $('.tag__item.sub').contents()[0].nodeValue =
      'Sub Category: ' + current_sub;
  });

  $('.js-close_sub').click(function() {
    $('#primary_category_id').trigger('change');
    $('#sub_category_id').val('all');
  });

  $('.js-close_primary').click(function() {
    $('#primary_category_id').val('all');
    $('#primary_category_id').trigger('change');
    $('.tag__item.primary button').hide();
  });
}

module.exports = auditTags;
