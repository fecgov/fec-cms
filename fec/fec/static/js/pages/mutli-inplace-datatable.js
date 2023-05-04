'use strict';

/* eslint-disable no-debugger, no-console */
/* global $ */

//***NOTE: THIS ONE JUST CREATES A DATATABLE FROM ANY GENERIC `tableblocks`  ON PAGE TARGETTED BY `$('.block-table table')`...
/// USED FOR FOR EXISTNNG TABLES ON audit-reports PAGES THAT HAVE SPECIFIC TABLE STRUCTURE.

//var $ = require('jquery');
require('datatables.net-responsive');

$(function() {

/////////////////START HTML5 SORT SUPPORT////////////////

//Determine which col is the 'Date' col to add the `data-sort`` attr in next function
//TODO: This could be a named function that returns the index number of date col
var theTable = document.querySelector('.block-table table'); //gets only the first element
console.log ('theTable:', theTable);
$('.block-table table').each(function(index){

console.log ('index', index);
 console.log ('(this):', this);
 console.log ('(this):'+ this);

let date_col;
for(let i=0; i < (this).rows[0].cells.length; i++) {

    if ((this).rows[0].cells[i].innerText == 'Date') {
       date_col = i;
       console.log ('date_col:'+ date_col);

    }
}

//Set the data-order(sort) attr for the date cells with UNIX timestamp. Assumes mm/dd/yyyy format
for(let i=0; i < (this).rows.length; i++) {

      var dateText = (this).rows[i].cells[date_col].textContent;

      //Assumes mm/dd/yyyy format is being supplied
      //Pattern = /\d{2}\/\d{2}\/\d{4}/i; //not using this line
      var dateString = dateText.replace(/(\d{2})\/(\d{2})\/(\d{4})/, `$2/$1/$3` );
        console.log('dateString:'+ dateString);

      var dateParts = dateString.split('/');

      // month is 0-based, that's why we need dataParts[1] - 1
      var date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);

      //var timestampInMs = date.getTime();

      var unixTimestamp = Math.floor(date.getTime() / 1000);
      console.log(unixTimestamp); //

      (this).rows[i].cells[date_col].setAttribute('data-order',unixTimestamp);
}

  (this).id = `dtable-${index}`;
  (this).classList.add('data-table', 'data-table--heading-borders', 'scrollX', 'simple-table' , 'u-no-border');

/////////////////END HTML5 DATE SUPPORT////////////////

 // JUST APPLY jQuery datatables to the existing table
        //$('.block-table table').DataTable({
        $(`#dtable-${index}`).DataTable({
          order: [[date_col, 'asc']]
        });

 }); // /end theTable.each(function(){

//This is a bit much, I think. Probably just add some CSS/SCSS to existing stylesheets
// Create an empty "constructed" stylesheet
const sheet = new CSSStyleSheet();
// Apply a rule to the sheet
sheet.replaceSync(' .dataTables_length { width: 20%; display: inline-block; float: left; padding: 1rem 1rem 2rem 0 !important;} .dataTables_filter { width: 80%; float: left; display: inline-block; padding: 1rem 0rem 4.5rem 0 !important; }');

// Apply the stylesheet to a document
document.adoptedStyleSheets = [sheet];

}); //end $(document.ready function.
