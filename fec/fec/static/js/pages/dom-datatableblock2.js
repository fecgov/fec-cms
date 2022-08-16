'use strict';

//TEMPORARY ESLINT FIXES
/* eslint-disable no-debugger, no-console */
// $ not defined ERROR WITHOUT THIS GOBAL...NEED TO RESEARCH ALTERNATIVES
/* global $ */ 

//**IT IS ALSO PREFERRABLE TO `dom-datatableblock` BECAUE IT DOES NOT NEED THE TEMPLATETAG ADDED TO THE PAGE...
//...BECAUSE IT GET `sort_info` from `partials/tableblock_to_datatable.html` USING DJANGO {{}} TAGS...
//...AND CREATES `th_array` FROM EACH TABLES HEADERS ON THE PAGE.


//var tables = require('../modules/tables');
//require('../modules/import-dtables'); //ANOTHER OPTOION THAT COULD BE A SEPATATE IMPORT-SCRIPT

//var $ = require('jquery');

//require('datatables.net');
require('datatables.net-responsive');

var convert_for_sort = function(type, value) {
//function  convert_for_sort(type, value) {

      if (type == 'date') {
      //Assumes mm/dd/yyyy format is being supplied
      //pattern = /\d{2}\/\d{2}\/\d{4}/i; //not using this line
      var dateString = value.replace(/(\d{2})\/(\d{2})\/(\d{4})/, `$2/$1/$3` );
      console.log('dateString:'+ dateString);

      var dateParts = dateString.split('/');

      // month is 0-based, that's why we need dataParts[1] - 1
      var date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);

      //var timestampInMs = date.getTime();

      var unixTimestamp = Math.floor(date.getTime() / 1000);

      console.log(unixTimestamp); //

      return unixTimestamp;

      }

      else if (type == 'currency') {
        //Assumes format: '$1,234.56'
        //pattern = /^\$|,/i //Remove $ and commas
        var amount_converted = value.replace(/^\$|,/,'');

        //does this need to be a float or integer ot string?
        return amount_converted;
      }

      //type == 'numeric or alphabetical')
      else {

       return value;

      }

  };

$(function() {

//How `sort_info` comes from Python templatetag, but building it below (if exists) in JS instead, using Django {{}} in partials/tableblock_to_datatable.html
//sort_info =
// [
//  [{'column': 'Date', 'sort_format': 'date'}, {'column': 'Number of Pages', 'sort_format': 'numeric'}]
//  ,
//  [{}],
//  [{'column': 'Document Date', 'sort_format': 'date'}, {'column': 'Amount', 'sort_format': 'currency'}]
// ]

//`sort_column_object` built below for each table using `sort_info`
//EXAMPLE:
// {
//     "1": "numeric",
//     "2": "date"
// }

//{}

// {
//     "1": "date",
//     "2": "currency"
// }

// In jQuery , 'this' is the table, 'index' is the iterator (0, 1, 2 etc...)
$('.block-datatable_block table').each(function(index){

 console.log ('index', index);
 console.log ('(this):', this);

//Create the sort_info array of from the user-sumitted Sort fields for this table (if any was submutted).
  let sort_info;
  //Find the sort info span for this table, if exists
  let sort_script = $(this).closest('.block-datatable_block').find('.sorting')[0];
  //If user submitted Sort fields in Wagtail...
  if (sort_script) {
    let sort_txt = sort_script.innerHTML;
    sort_info = JSON.parse(sort_txt);
    }
  //...else just use an empty list
  else {
       sort_info= [{}];
    }

  console.log ('sort_info:', sort_info);

 let th_array = [];
 //TODO: CAN I JUST ITERATE  `th_array` HERE NOW?
 //Iterate the cells in first row (header row) of current table, i.e. (this).
  for(let c=0; c < (this).rows[0].cells.length; c++) {

  //Create an array the current tables header text
   let th_text = this.rows[0].cells[c].innerText;
  console.log ('th_text:', th_text);
   th_array.push(th_text);
  }

/////////////////START APPLY HTML5 data-order ATTR TO CELLS USING `sort_info`////////////////

//***TODO: COULD JUST ITERATE ROWS[0].CELLS ONCE, FINDING A SORT INFO ITEME, MAKING THE CONVERSION AND SET DATA-ATTR...
//... THEN ITERATE THE NEXT ONE RATHER THAN ITERATING ROWS AGAIN BELOW ??
let sort_columns_object = {};
let initial_sort_column;
let initial_sort_order;

//Iterate the cells in first row (headers) of current table (index)
for(let i=0; i < (this).rows[0].cells.length; i++) {


     //Now,iterate sort_info for current table to determine sort columns
     for(let j=0; j < sort_info.length; j++) {

      //Create a sort_columns_object to use below to decide which cells get a converted data-order attr.
      if ((this).rows[0].cells[i].innerText == sort_info[j].column) {
        let column_index = th_array.indexOf(sort_info[j].column);
        let sort_format = sort_info[j]['sort_format'];
        sort_columns_object[column_index] = sort_format;

        }
     }

}
console.log( 'sort_columns_object:', sort_columns_object);

  //Determine the initial_sort column and initial sort order using sort_info object

  //Get the index position of column in the first item submitted by user in Wagtail Sort fields
  let order_index = th_array.indexOf(sort_info[0]['column']);
  //If the index is -1(non-existent), use default; otherwise, return it
  initial_sort_column = order_index == -1 ? 0 : order_index;
  console.log( 'initial_sort_column:', initial_sort_column);
  //Get the initial sort order from order value in the first item submitted by user in Wagtail Sort fields
  initial_sort_order = sort_info[0]['order'] || 'asc';
  console.log( 'initial_sort_order:', initial_sort_order);

//TODO: COULD SET CURRENT CELL AS A VAR SO I DONT HAVE TO KEEP SAYING '(this).rows[k].cells[l]'

//iterate all rows in current table
for(let k=0; k < (this).rows.length; k++) {

  //iterate all cells in current row
  for(let l=0; l < (this).rows[k].cells.length; l++) {
      
      //If the number of the current iterator (l) is in the `sort_columns_object`
      if(Object.prototype.hasOwnProperty.call(sort_columns_object, l)) {
      //if (sort_columns_object.hasOwnProperty(l)) { //(This gets ESLINT error, so using above)
        let sort_type = sort_columns_object[l];
        let sort_value = (this).rows[k].cells[l].innerText; //or use col_text var above?
        let number_for_sort = convert_for_sort(sort_type, sort_value);
        console.log('number_for_sort:', number_for_sort);

        //NOTE: THIS WAS BROKEN B/C OF (this) INSTEAD OF this (parens broke it) IF USING PARENS '(this)', ALWAYS US SEMICOLON ON PREV LINE
        //Set the data-order(sort) attr for cells that require it in sort_columns_object
        (this).rows[k].cells[l].setAttribute('data-order',number_for_sort);

      }

   }

}

/////////////////END APPLY HTML5 data-order ATTR TO CELLS USING `sort_info`////////////////

  (this).id = `dtable-block-${index}`;
  (this).classList.add('data-table', 'data-table--heading-borders', 'scrollX', 'simple-table' , 'u-no-border');

 //THIS ONE JUST APPLIES jQuery datatables to the existing html table on page and give its intial ordering

        $(`#dtable-block-${index}`).DataTable({
          order: [[initial_sort_column ,initial_sort_order]] //from js above
        });

 }); // /end $('.block-datatable_block table').each(function

}); //end $(document.ready function.

