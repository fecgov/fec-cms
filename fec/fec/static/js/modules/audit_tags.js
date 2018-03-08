'use strict';

var $ = require('jquery');
var _ = require('underscore');

var helpers = require('./helpers');

var AuditCategorySubCategory = require('./audit-category-sub-category');

var $auditCategoryTags= require('../templates/audit_tags.hbs');


$('.data-container__tags').prepend($auditCategoryTags)
$('.tag__category.sub').css('visibility','hidden')
$('.tag__item.primary button').css('display','none').css('visibility','hidden')


$("#primary_category_id").change(function(){
    var current_category = $("#primary_category_id option:selected").text()
    $('.tag__category.sub').css('visibility','hidden')
    $('.tag__item.primary').contents()[0].nodeValue = "Primary Category: " + current_category
    $("#sub_category_id").prepend('<option selected value="all">Choose a sub-category</option>');
    $('.tag__item.primary button').show().css('visibility','visible')
})


$("#sub_category_id").change(function() {
    var current_sub = $("#sub_category_id option:selected").text()
    $('.tag__item.sub').contents()[0].nodeValue = "Sub Category: "+ current_sub;
})

$('.js-close_sub').click(function() {
    $("#primary_category_id").trigger('change')
    $("#sub_category_id").val("all")
})

$('.js-close_primary').click(function() {
   $("#primary_category_id").val("all")
   $("#primary_category_id").trigger('change')
   $('.tag__item.primary button').hide()
})

$(document).on({
    mouseenter: function () {
      if ($("#sub_category_id").html()==='') {
        $("#sub_category_id").after('<div class="tooltip tooltip--under tooltip--right sub-details message--alert" role="tooltip" style="background-position:1rem 1.5rem; width:90%; top:15%">Choose a primary category first</div>')
    }
  },
    mouseleave: function () {
       $(".sub-details").remove();
    }

}, "#sub_category_id");
