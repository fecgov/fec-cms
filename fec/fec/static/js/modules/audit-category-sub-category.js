'use strict';
/**
 * two dropdowns:#primary_category_id and #sub_category_id
 * when select one option from #primary_category_id dropdown, trigger change function
 * to make a ajax call (api: audit-category) ,get sub_category_list(JSON type)back
 * dynamically update the #sub_category_id dropdown list value.
 */
var $ = require('jquery');
var helpers = require('./helpers');

$("#primary_category_id").change(function(event){
  var $select = $('#sub_category_id');
  $.getJSON(helpers.buildUrl(['audit-category'],{'primary_category_id': $('#primary_category_id').val(), 'per_page': 100}),function(data){
    $select.html('');
    $.each(data.results[0].sub_category_list, function(key, val){
      $select.append('<option id="' + val.sub_category_id + '">' + val.sub_category_name + '</option>');
    });
  });
});