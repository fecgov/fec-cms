'use strict';

var $ = require('jquery');
var _ = require('underscore');

var helpers = require('./helpers');

var AuditCategorySubCategory = require('./audit-category-sub-category');

//var calendarTooltip = require('./calendar-tooltip');
//var calendarHelpers = require('./calendar-helpers');
//require('./calendar-list-view');


var $auditCategoryTags= require('../templates/audit_tags.hbs');


//Handlebars.registerHelper(helpers.helpers);
/*This is the template itself*/
// var context = {
//   author: {firstName: "Alan", lastName: "Johnson"},
//   body: "I Love Handlebars",
//   comments: [{
//     author: {firstName: "Yehuda", lastName: "Katz"},
//     body: "Me too!"
//   }]
// };


//var primary_selected = $("#primary_category_id option:selected").text()


//getPrimaryCategory()


$('.data-container__tags').prepend($auditCategoryTags,)
$('.tag__category.sub').css('visibility','hidden')


$("#primary_category_id").change(function(){
    $("#sub_category_id").val("all")//maybe move this to audit-cat-subcat.js file-needed to clear sub cat each time
    var latest = $("#primary_category_id option:selected").text()
    $('.tag__category.sub').css('visibility','hidden')
    $('.tag__item.primary').contents()[0].nodeValue = "Primary Category: " + latest
})


$("#sub_category_id").change(function(){
  var latest_sub = $("#sub_category_id option:selected").text()
  //$('.tag__category.sub').css('visibility','visible');//show().css('border','1px solid #f90')
  $('.tag__item.sub').contents()[0].nodeValue = "Sub Category: "+ latest_sub;
})

$('.js-close_sub').click(function(){
  $("#primary_category_id").trigger('change')
  $("#sub_category_id").val("all")

})

$('.js-close_primary').click(function(){
   $("#primary_category_id").val("all")
  //$("#sub_category_id").val("-2")
  //$("#sub_category_id").html('')
  $("#primary_category_id").trigger('change')

  //$("#primary_category_id").val("-1")

  //$("#sub_category_id").attr('selectedIndex', -2);
  //$("#sub_category_id").trigger('change')
})

$(document).on({

    mouseenter: function () {
      if ($("#sub_category_id").html()==''){
        $("#sub_category_id").after('<div class="tooltip tooltip--under tooltip--right sub-details message--alert" role="tooltip" style="background-position:1rem 1.5rem; width:90%; top:15%">Choose a primary category first</div>')
    }
  },

    mouseleave: function () {
       $(".sub-details").remove();
    }

}, "#sub_category_id");



// on('click', function(){
// if ($("#sub_category_id").html()==''){
//   $("#sub_category_id").after('<div class="tooltip tooltip--left cal-details" role="tooltip">Choose a primary category first</div>')
// }

// })

// function showHideSubTag(){

//}
//$(document).bind('ready ajaxComplete', '#sub_category_id', _.debounce(ShowSubCategory, 250));
//tooltipContent: calendarHelpers.mapCategoryDescription(event.category);


/////////

