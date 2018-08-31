'use strict';

var _ = require('underscore');
var $ = require('jquery');
var helpers = require('./helpers');


var committee_type_desc = {
    'C': 'Communication cost',
    'D': 'Delegate committee',
    'E': 'Electioneering communication',
    'H': 'House',
    'I': 'Independent expenditure filer (not a committee)',
    'N': 'PAC - nonqualified',
    'O': 'Super PAC (independent expenditure only)',
    'P': 'Presidential',
    'Q': 'PAC - qualified',
    'S': 'Senate',
    'U': 'Single candidate independent expenditure',
    'V': 'PAC with non-contribution account - nonqualified',
    'W': 'PAC with non-contribution account - qualified',
    'X': 'Party - nonqualified',
    'Y': 'Party - qualified',
    'Z': 'National party nonfederal account'
}


var spender_committee_types = {
    2018: ['D', 'E', 'H', 'I', 'N', 'O', 'P', 'Q', 'S', 'U', 'W', 'V', 'X', 'Y'],
    2016: ['D', 'E', 'H', 'N', 'O', 'P', 'Q', 'S', 'U', 'V', 'W', 'X', 'Y'],
    2014: ['D', 'E', 'H', 'N', 'O', 'P', 'Q', 'S', 'U', 'V', 'W', 'X', 'Y'],
    2012: ['D', 'E', 'H', 'N', 'O', 'P', 'Q', 'S', 'U', 'V', 'W', 'X', 'Y'],
    2010: ['E', 'H', 'N', 'O', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    2008: ['D', 'E', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    2006: ['C', 'E', 'H', 'I', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    2004: ['C', 'D', 'E', 'H', 'I', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y', 'Z'],
    2002: ['C', 'D', 'H', 'I', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y', 'Z'],
    2000: ['D', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y', 'Z'],
    1998: ['H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y', 'Z'],
    1996: ['D', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y', 'Z'],
    1994: ['H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y', 'Z'],
    1992: ['H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y', 'Z'],
    1990: ['H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    1988: ['D', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    1986: ['D', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    1984: ['D', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    1982: ['C', 'D', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    1980: ['C', 'D', 'H', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    1978: ['H', 'I', 'N', 'P', 'Q', 'S', 'U', 'X', 'Y'],
    1976: ['H', 'N', 'P', 'Q', 'S', 'X', 'Y']
}

var $spenderTypeTags= require('../templates/spender_tags.hbs');
$('.js-filter-tags').prepend($spenderTypeTags)

/**
 * When two-year-transaction-period on change,
 * trigger committee_type dropdown to change  options list
 */
$(function(){
 $(document).on('change',"#two-year-transaction-period",function(event) {
  var two_year_transaction_period = this.value;
  var $select = $('#committee_type');
  var committee_types_list = spender_committee_types[two_year_transaction_period]
  console.log(two_year_transaction_period)
  console.log('Length:'+committee_types_list.length+' / Types:'+committee_types_list)
  $("#committee_type").val("null")
  $('.tag__category.type').hide()
  $select.html('<option value="null" selected>More</option>');
   $(committee_types_list).each(function(i,v) {
     $select.append(
        '<option value='+ v +'>'+ committee_type_desc[v] + '</option>'
     )
   })
  })
 })

$("#committee_type").change(function(){
    var current_type = $("#committee_type option:selected").text()
    $('.tag__item.type').contents()[0].nodeValue = "Spender type: " + current_type
    $("#committee_type").val() == 'null'
     ? $('.tag__category.type').hide()
     : $('.tag__category.type').show()
});

$('.js-close_type').click(function() {
   $("#committee_type").val("null")
   $("#two-year-transaction-period").trigger('change')
   $('.tag__category.type').hide()
})



