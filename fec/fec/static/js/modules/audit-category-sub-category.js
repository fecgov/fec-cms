'use strict';
var _ = require('underscore');

/**
 * two dropdowns:#primary_category_id and #sub_category_id
 * when select one option from #primary_category_id dropdown, trigger change function
 * to make a ajax call (api: audit-category) ,get sub_category_list(JSON type)back
 * dynamically update the #sub_category_id dropdown list value.
 */
var $ = require('jquery');
var helpers = require('./helpers');

$("#primary_category_id").change(function(event) {

  var $select = $('#sub_category_id');
  $.getJSON(helpers.buildUrl(['audit-category'],{'primary_category_id': $('#primary_category_id').val(), 'per_page': 100}), function(data){
    $select.html('<option selected value="all">All</option>')
    $(".sub--filter--indent").css('opacity','.5').css({pointerEvents: "none"})

    if (data.results[0]){
    $.each(data.results[0].sub_category_list, function(key, val){
      $select.append('<option value="' + val.sub_category_id + '">' + val.sub_category_name + '</option>');
    });
     $(".sub--filter--indent").css('opacity','1').css({pointerEvents: "auto"})
     //$select.prepend('<option selected value="all">Choose sub category</option>');
    }
  })
})

//for cub category filter-tag and results
function showSubCategory(){
    var sub_selected = $("#sub_category_id option:selected").text()
    sub_selected == ("Choose a sub-category")  || ($("#sub_category_id").val() == "all")
     ? $('.tag__category.sub').css('visibility','hidden')
     : $('.tag__category.sub').css('visibility','visible')

}

$(document).bind('ready ajaxComplete', '#sub_category_id', showSubCategory);


