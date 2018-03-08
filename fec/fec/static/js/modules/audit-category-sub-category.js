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

var primary_selected//how can we remove this global variable !?

$("#primary_category_id").change(function(event) {
  $("#sub_category_id").val("all");//do we need explicity set this here first is it is set below?
  if(("#primary_category_id") == 'all'){
  $("#sub_category_id").val("all");
  }

  var $select = $('#sub_category_id');
  $.getJSON(helpers.buildUrl(['audit-category'],{'primary_category_id': $('#primary_category_id').val(), 'per_page': 100}), function(data){
    $select.html('');
    if (data.results[0]){
    $.each(data.results[0].sub_category_list, function(key, val){
      $select.append('<option value="' + val.sub_category_id + '">' + val.sub_category_name + '</option>');
    });

    $select.prepend('<option selected value="all">Choose a sub-category</option>');
    }
  })

  primary_selected = $("#primary_category_id option:selected").text()
})

//for cub category filter-tag and results highlighting(remove hghighting for MVP?)
function showSubCategory(){
    var sub_selected = $("#sub_category_id option:selected").text()
    var target =
      $('.list--numbered li ol li').filter(function() {
      return $(this).text() === sub_selected;
       });

    var target_parent =
       $('.list--numbered li').filter(function() {
       return $($(this).contents()[0]).text() === primary_selected;
    });

    $(".list--numbered").find(target_parent).find(target).css({'background-color':'#f9fcc0', 'border-radius':'3px'});

    sub_selected == ("Choose a sub-category")  || ($("#sub_category_id").val() == "all") || ($("#sub_category_id").html()=='')
     ? $('.tag__category.sub').css('visibility','hidden')
     : $('.tag__category.sub').css('visibility','visible')

}

$(document).bind('ready ajaxComplete', '#sub_category_id', showSubCategory);


