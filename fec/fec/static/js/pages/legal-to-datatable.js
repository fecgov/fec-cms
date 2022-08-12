'use strict';

/* eslint-disable no-debugger, no-console */
/* global $ */

//var $ = require('jquery');
//var tables = require('../modules/tables');;

//require('datatables.net');
require('datatables.net-responsive');

//Sorting and ordering definitions for legal cononacal tables
const legal_docs_sorting =
{
  'af-disposition': {
       '1': 'currency',
       '2': 'date',
       ordering: {
         column: '2',
         direction: 'desc'
       }
        },
  'af-documents': {
       '0': 'date',
        ordering: {
         column: '0',
         direction: 'desc'
       }
        },
  'ao-final-opinion': {
       '0': 'date',
       ordering: {
         column: '0',
         direction: 'asc'
       }
        },
  'ao-entities': {
    ordering: {
         column: '1',
         direction: 'asc'
       }
  },
  //CAN'T DO THESE WITHOUT POSSIBLY USING THE ROW-GROUP PLUGIN
  // 'archived-mur-documents': {

  // },
  // 'archived-mur-participants': {

  // },
  // 'current-mur-disposition': {
     //1 : 'currency',
     // 'ordering': {
     //     'column': '1',
     //     'direction':'asc'
     //   },
  //},
  //'current-mur-documents': {
    //1:'date',
    // 'ordering': {
    //      'column': '1',
    //      'direction':'asc'
    //    },
  //},
  //  'current-mur-participants': {

  // },
  // 'adr-disposition:': {
  //    1 : 'currency',
  //    'ordering': {
  //        'column': '1',
  //        'direction':'asc'
  //      },
  //       },
  // 'adr-documents': {

  // },
   'adr-participants': {
      ordering: {
         column: '1',
         direction: 'asc'
       }

  }
};

const covert_for_sort = function(type, value) {

      if (type == 'date') {
      //Assumes mm/dd/yyyy format is being supplied
      //pattern = /\d{2}\/\d{2}\/\d{4}/i; ne
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

      //type == 'numeric')
      else {

       return value;

      }

  };

$(function() {

///////////////START HTML5 DATE SORT SUPPORT////////////////

//THIS FUNCTION ONLY WORKS FOR APPLYING DATATABLES DIRECTLY TO TABLE)

//const tables = $('table')

const tables = document.getElementsByTagName('table');
console.log ('Tables:', tables);

let table_id;
//First iterate all tables on page:
Array.from(tables).forEach(table => {
  //$('table').each(function(index, value){
   table_id = table.getAttribute('id');

   console.log('table_id' + table_id);

   //****TO DO: SHOULD I  DO AN IF ELSE RETURN SO IT DOES NOT HAVE TO ITERATE A TABLE WITHOUT SORT VALS?
   if(Object.prototype.hasOwnProperty.call(legal_docs_sorting, table_id)) {
   //if (legal_docs_sorting.hasOwnProperty(table_id)) { //(This gets ESLINT error, so using above)

      //Inside this iteration(table), now iterate all rows
      for(let i=0; i < table.rows.length; i++) {

          for(let j=0; j < table.rows[i].cells.length; j++) {
        //***TODO: COULD ALSO JUST LEAVE OUT TABLE IDS THAT DONT HAVE SORT IN ABOVE IF STMT, DO I NEED BOTH?
        console.log ('legal_docs_sorting[table_id]:'+ legal_docs_sorting[table_id]);
            if(Object.prototype.hasOwnProperty.call(legal_docs_sorting[table_id], j)) {
            //if (legal_docs_sorting[table_id].hasOwnProperty(j)) { //(This gets ESLINT error, so using above)

            let sort_type = legal_docs_sorting[table_id][j];
            let sort_value = table.rows[i].cells[j].textContent;
            let number_for_sort = covert_for_sort(sort_type,sort_value);

            table.rows[i].cells[j].setAttribute('data-order',number_for_sort);
         }

      }

    }

      let order_col;
      let order_dir;
      if(Object.prototype.hasOwnProperty.call(legal_docs_sorting[table_id], 'ordering')) {
      //if (legal_docs_sorting[table_id].hasOwnProperty('ordering')) { //(This gets ESLINT error, so using above)
         order_col = legal_docs_sorting[table_id].ordering.column;//['ordering']['column']
         order_dir = legal_docs_sorting[table_id].ordering.direction;//['ordering']['direction']

        }
      else {
        order_col = '0';
        order_dir = 'asc';
       }

       //$(myTable).addClass("data-table")
       //myTable.classList.add("data-table",  "data-table--heading-borders",  "scrollX",  "simple-table" , "u-no-border")

//THIS ONE JUST APPLIES jQuery datatables to the existing table
        $(`#${table_id}`).DataTable({
          order: [[order_col, order_dir]]

        });

//document.getElementsByClassName('block-table')[0].remove()
    } //EMD if (legal_docs_sorting.hasOwnProperty(table_id))...
  });
});//end $(document.ready function.

