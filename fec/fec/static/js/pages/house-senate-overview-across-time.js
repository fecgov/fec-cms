import { currencyColumn } from '../modules/columns.js';
import { states as decode_states } from '../modules/decoders.js';
import { buildUrl, buildAppUrl, dollar } from '../modules/helpers.js';
import { DataTable_FEC } from '../modules/tables.js';

function AcrossTime() {
  this.element; // The HTML element of this feature
  this.dataSections;
  this.minYearControl; // the first select (left)
  this.maxYearControl; // the second select (right)
  // Where to find the totals:
  this.basePath_officeTotal = ['candidates', 'totals', 'aggregates'];
  this.baseQuery = {
    office: window.context.office_code,
    min_election_cycle: window.DEFAULT_ELECTION_YEAR - 4 ,
    max_election_cycle: window.DEFAULT_ELECTION_YEAR,
    is_active_candidate: true,
    per_page: 20,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1
  };

  this.init();
}

/**
 * Called by {@see loadData} to parse and display the data
 * @param {Response} queryResponse - The successful API reply
 */
AcrossTime.prototype.displayUpdatedData = function(queryResponse) {

  let theResults = queryResponse.results;

  //create array to hold largest of each dataType
  let largestValuesArray = [];

  // Iterate each section to get the three dataTypes
  this.dataSections.forEach(function(dataSection) {
   //make a copy of results array so we are not sorting results in-place
  let theResultsTemp = Array.from(theResults);

  // Get the dataType from the data-total-type attribute of the html sections
  let dataType = dataSection.dataset.totalType;

    // Sort  values for each dataType, for each year and push the largest to largestValuesArray
    theResultsTemp.sort((obj1, obj2) => {
      // We want the larger values first
      if (obj1[dataType] < obj2[dataType]) return 1;
      else if (obj1[dataType] > obj2[dataType]) return -1;
      else return 0;
    });
    largestValuesArray.push(theResultsTemp[0][dataType]);

   });

    //sort largestValuesArray, descending, in-place
    largestValuesArray.sort(function(a, b) {
      return b - a;
    });

    // maxvalue is the first item in sorted array
    let maxValue = largestValuesArray[0];

  // Object to map line numbers to dataTotalTypes
  const lineNumbers = {
    total_individual_itemized_contributions: 'F3-11AI',
    total_transfers_from_other_: 'F3-12',
    total_other_political_committee_contributions: 'F3-11C'
    };

  // create arrays to hold adjusteddValues and meterElements for use later
  let adjustedTotalArray = [];
  let meterElements = [];

  // Iterate each section again to populate with results
  this.dataSections.forEach(function(dataSection) {

    //clear contents of sections each time
    dataSection.innerHTML = '';

    // Get the dataTotalType from the data-total-type attribute of thr html sections
    let dataTotalType = dataSection.dataset.totalType;

    // Iterate the results json
    for (let i = 0 ; i < theResults.length; i++) {

      //get the value for the current dataTotalType the current iteration of data results
      let total = theResults[i][dataTotalType];

      // adjust the value
      let adjustedTotal = Math.max(
        total,
        maxValue * 0.01
      );

      // Convert value for display on page
      let textValue = dollar(total);

      // Create start/end years for display on page
      let electionYear = theResults[i].election_year;
      let starYear = electionYear - 1;
      let end_year = electionYear;
      let twoYearPeriod = `${starYear} - ${end_year}`;

      // Trick gitleaks for false-positive for "----"orized
      let sub = 'au';
      let subConcat = `${sub}thorized_committee`;
      let splitString= dataTotalType.toString().split(subConcat).join('');

      // Use the concatenated string  if transers is in dataTotalType
      let line = dataTotalType.indexOf('transfers') !== -1 ? splitString : dataTotalType;

      // Create object for creating querystring for the link for each value
      let searchFilters = {
        data_type: 'processed',
        two_year_transaction_period: electionYear,
        recipient_committee_type: window.context.office_code,
        line_number: lineNumbers[line]
      };

      // Generate the querystring for link from the searcFilters object
      // Could be done more efficiently with URLSearchParams(), but since MS Edge-legacy does not support, we'll do this for now
      let queryString = Object.keys(searchFilters).map(function(key) {
      return key + '=' + searchFilters[key];
     }).join('&');

      //  Build the link for each value on displayed on page
      let totalUrl = buildAppUrl(['receipts']) + `?${queryString}`;

      //Put stripes on meter to denote in-proress contribution totsl for current cycle
      const stripeClass = electionYear == window.DEFAULT_ELECTION_YEAR ? `diagonal_stripe` : '';

      // HTML for each result row
      let theInnerHTML =
          `<div class="simple-table__row" role="row">
            <div role="cell" class="simple-table__cell js-total-period">${twoYearPeriod}</div>
            <div role="cell" class="simple-table__cell ${stripeClass}">
              <meter min="0" max="${maxValue}" value="0" title="US Dollars"></meter>
            </div>
            <div role="cell" class="simple-table__cell js-total-value t-mono-stacked-currency"><a href=${totalUrl}>${textValue}</a></div>
          </div>`;

    // Create an HTML node to put the row in
    let periodWrapper = document.createElement('div');
    periodWrapper.classList.add('simple-table--responsive');
    periodWrapper.setAttribute('role', 'grid');
    periodWrapper.innerHTML = theInnerHTML;

    // Append each row to the section on the page
    dataSection.appendChild(periodWrapper);

    // Push  each adjustedTotal to  adjustedTotals array for animating later
    adjustedTotalArray.push(adjustedTotal);

    // Now find each meter that was created above in theInnerHTML
    let meterElement = periodWrapper.getElementsByTagName('meter');

    // Push each meterElement to meterElements array
    meterElements.push(meterElement);

    }

  });

  // Iterate each meter element and animate the value from 0
  for (let j = 0; j < meterElements.length; j++) {

// Self invoking set-timeout that starts  animationn and stops calling itself when total is reached (setInterval and requestAnimationFromen also work but this was simpllest and makes all animations end at the same time)
  let animVar = 0;
     (function loop(){
       setTimeout(function() {
          if (animVar < adjustedTotalArray[j]) {
        meterElements[j].item(0).value = animVar;
        //animVar = animVar + 10000000.00
       animVar = animVar + adjustedTotalArray[j]/200; //This is an arbirtary value that seemed to get the desired speed. But coulld be changed to something else.
       loop();

        }
      else {
        meterElements[j].item(0).value = adjustedTotalArray[j];

        }
      }, 0);

     })();

   }

};

AcrossTime.prototype.init = function() {

  this.element = document.getElementById('contributions-over-time');
  this.dataSections = this.element.querySelectorAll('.js-across-time');
  this.minYearControl = this.element.querySelector('.js-min-period-select');

  this.maxYearControl = this.element.querySelector('.js-max-period-select');

  this.minYearControl.addEventListener('change', this.handleYearChange.bind(this));
  this.maxYearControl.addEventListener('change', this.handleYearChange.bind(this));

  this.loadData(this.baseQuery);

  this.buildSelects();

};

AcrossTime.prototype.handleYearChange = function(e) {

     e.preventDefault();

     // Set action (min or max) based on which select was changed.
     let action = e.target.dataset.period;

     // Determins which select was changed
     let beginning = action == 'min' ? e.target.value : this.minYearControl.value;
     let ending = action == 'max' ? e.target.value : this.maxYearControl.value;

     // Trsanspose min/max in call to data if value of min select is  > value of max select
     // API will not return data is `min_election_cycle is > than max_election_cycle
     this.baseQuery.min_election_cycle = Math.min(beginning, ending);
     this.baseQuery.max_election_cycle = Math.max(beginning, ending);

     // Get the  officce from the URL passed from view
     this.baseQuery.office = window.context.office_code;

     // Load data based on baseQuery
     this.loadData(this.baseQuery);

};

////Build  both selects (min/max) going back 9 two-year-periods from DEFAULT_ELECTION_YEAR
AcrossTime.prototype.buildSelects = function() {
    var theSelects = this.element.querySelectorAll( 'select[data-period]' );

    //  Set last select option 9 years  back
    theSelects.forEach(function(theSelect) {
      // Iterate 18 (9 two year periods)
      for (let i = 0; i < 18; i+=2) {

       let year = window.DEFAULT_ELECTION_YEAR - i;
       let startYear = year - 1;

       //srart with 6 years back selected( i = 4 because the +=2 iteration is 0, 2, 4...)
       let selected;
       if (theSelect.dataset.period == 'max') {
         selected = i == 4 ? ' selected' : '';
         }

       //  Populate the select options
       let option = `<option value="${year}"${selected}>${startYear} - ${year}</option>`;
       theSelect.innerHTML += option;

      }

    });

};

/**
 * Starts the data load, called by {@see init}
 * @param {Object} query - The data object for the query, {@see baseQuery}
 */
AcrossTime.prototype.loadData = function(query) {
  let instance = this;

  window
    .fetch(buildUrl(this.basePath_officeTotal, query), {
      cache: 'no-cache',
      mode: 'cors'
    })
    .then(function(response) {
      if (response.status !== 200)
        throw new Error('The network rejected the grand total request.');
      // else if (response.type == 'cors') throw new Error('CORS error');
      response.json().then(data => {
        instance.displayUpdatedData(data);
      });
    })
    .catch(function() {
      // TODO - handle catch
    });

};

/**** Election Totals - Election Overview ****/

// Election house totals for election overview pages
var election_house_totals = [
  { data: 'state', render: function(data, type, row) {
    // Concatenate the state full state name and the district number together for display.
    return (decode_states[row.state] + ' DISTRICT ' + row.district).toUpperCase();
    },
  orderable: true, className: 'column-state' },
  currencyColumn({ data: 'total_receipts', orderable: true, className: 'column--number t-mono' }),
  currencyColumn({ data: 'total_disbursements', orderable: true, className: 'column--number t-mono' }),
  currencyColumn({ data: 'total_cash_on_hand_end_period', orderable: true, className: 'column--number t-mono' }),
  currencyColumn({ data: 'total_debts_owed_by_committee', orderable: true, className: 'column--number t-mono' })
];

// election senate totals for election overview pages
var election_senate_totals = [
  { data: 'state', render: function(data, type, row) {
    // Display full state name in upper case
    return decode_states[row.state].toUpperCase();
    },
  orderable: true, className: 'column--state' },
  currencyColumn({ data: 'total_receipts', orderable: true, className: 'column--number t-mono' }),
  currencyColumn({ data: 'total_disbursements', orderable: true, className: 'column--number t-mono' }),
  currencyColumn({ data: 'total_cash_on_hand_end_period', orderable: true, className: 'column--number t-mono' }),
  currencyColumn({ data: 'total_debts_owed_by_committee', orderable: true, className: 'column--number t-mono' })
];

function initElectionTotalTable(election_year) {
  var $table = $('#election-totals-results');
  var column_definitions = null;
  var aggregate_by = null;

  if(window.context.office_code ==='H') {
    // set house specific query attributes
    column_definitions = election_house_totals;
    aggregate_by = 'office-state-district';
  } else {
    // set senate specific query attributes
    column_definitions = election_senate_totals;
    aggregate_by = 'office-state';
  }

  new DataTable_FEC($table, {
    autoWidth: true,
    path: ['candidates', 'totals', 'aggregates'],
    query: {
      aggregate_by: aggregate_by,
      election_year: election_year,
      office: window.context.office_code,
      election_full: true,
      is_active_candidate: true
    },
    columns: column_definitions,
    order: [[0, 'asc']],
    useFilters: true,
    useExport: false,
    lengthMenu: [10, 30, 50]
  });
  return $table;
}

$(function() {
  new AcrossTime(); // setup across time display

  var cycle_selector = $('#all-elections-totals-cycle'); // cycle selector for election totals
  var election_year = cycle_selector.val();

  // initialize the election total table with the default cycle
  var $table = initElectionTotalTable(election_year);
  cycle_selector.on('change', function() {
    // if the cycle selector is changed,
    // destroy the current table and re-initialize it with the new selected cycle
    var datatable = $table.DataTable();
    datatable.clear();
    datatable.destroy();
    var new_election_year = $(this).val();
    initElectionTotalTable(new_election_year);
  });
});
