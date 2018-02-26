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
$("#sub_category_id").css({'width': '70%','position': 'relative','right': '-5%'});
$("label[for=sub_category_id]").css({'width': '70%','position': 'relative','right': '-5%'});
$("div[data-modifies-filter=sub_category_id]").css({'border-left': '2px solid #000','margin-left': '25%'});
var primary_selected

$("#primary_category_id").change(function(event){
// when user choses a primary_category_id, inital sub_category_id=all,
// in order to get all sub categorys based on this primary category.
  if(("#primary_category_id") == 'all'){
  $("#sub_category_id").val("all");
  }
  $("#sub_category_id").val("all");

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

//for highlighting
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

    sub_selected == ("Choose a sub-category")  || ($("#sub_category_id").val() == "all") || ($("#sub_category_id").html()=='')
     ? $('.tag__category.sub').css('visibility','hidden')
     : $('.tag__category.sub').css('visibility','visible')

}

$(document).bind('ready ajaxComplete', '#sub_category_id', _.debounce(show_sub_category, 250));


