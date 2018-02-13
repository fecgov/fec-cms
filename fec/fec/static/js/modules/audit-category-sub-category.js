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

var $span = $("<span>", {id: "selected-category", class: "t-bold"}).appendTo('.data-container__tags');
var $subspan = $("<span>", {id: "selected-sub-category", class: "t-bold"}).insertAfter('#selected-category');
$("#sub_category_id").css({'width': '75%','position': 'relative','right': '-25%'});

var primary_selected

$("#primary_category_id").change(function(event){
  var $select = $('#sub_category_id');
  $.getJSON(helpers.buildUrl(['audit-category'],{'primary_category_id': $('#primary_category_id').val(), 'per_page': 100}), function(data){
    $select.html('');
    $.each(data.results[0].sub_category_list, function(key, val){
      $select.append('<option value="' + val.sub_category_id + '">' + val.sub_category_name + '</option>');
    });

    $select.prepend('<option selected value="">Choose a sub-category</option>');
  })

  if ($("#primary_category_id").val() == -1){
  	$("#sub_category_id").val("-2");
  }
  primary_selected = $("#primary_category_id option:selected").text()
  $('#selected-category').html("Primary category: "+ primary_selected + "<br>")
})

function show_sub_category(){
    var sub_selected = $("#sub_category_id option:selected").text()
    //var target = "li ol li:contains('" + sub_selected + "')";
    var target =
      $('.list--numbered li ol li').filter(function() {
      return $(this).text() === sub_selected;
       });

    var target_parent =
       $('.list--numbered li').filter(function() {
       return $($(this).contents()[0]).text() === primary_selected;
    });

    $(".list--numbered").find(target_parent).find(target).css({'background-color':'#f6f9a4', 'border-radius':'6pc'});
    $('#selected-sub-category').html("  Subcategory: <span>"+ sub_selected +"</span>")
    sub_selected == "Choose a sub-category" ? $('#selected-sub-category span').css('color',"red") : $('#selected-sub-category span').css('color',"#000")

}

$(document).bind('ready ajaxComplete', '#sub_category_id', _.debounce(show_sub_category, 250));


