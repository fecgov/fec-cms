'use strict';

// Editable vars
// // const breakpointToXS = 0; // retaining just in case
// const breakpointToSmall = 430;
// const breakpointToMedium = 675;
// const breakpointToLarge = 700;
// const breakpointToXL = 860;

// const isModernBrowser = 'fetch' in window && 'assign' in Object;

// Includes
//import analytics from '../modules/analytics';
import { buildUrl,  buildAppUrl, dollar } from '../modules/helpers';
// import { buildAppUrl } from '../modules/helpers';
// import { currency } from '../modules/helpers';

function AcrossTime() {
  this.element; // The HTML element of this feature
  this.dataSections;
  this.minYearControl; // The HTML element to change beginning year
  this.maxYearControl; // The HTML element to change ending year
  // Where to find the totals:
  this.basePath_officeTotal = ['candidates', 'totals', 'by_office'];
  this.baseQuery = {
    office: context.office_code,
    //election_year: window.DEFAULT_ELECTION_YEAR,
    //The min/max vals shouold probably be strings
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

/* eslint-disable no-console */

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
   //make a copy of results array so we are not sorting resilts in-place
  let theResultsTemp = Array.from(theResults);

  // Get the dataType from the data-total-type attribute of thr html sectoions
  let dataType = dataSection.dataset.totalType;

    // Sort  values for dataType each year and push the largest to largestValuesArray
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

    console.log('maxValue: ', maxValue);

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
    

    // Get the dataTotalType from the data-total-type attribute of thr html sectoions
    let dataTotalType = dataSection.dataset.totalType;

    // Iterate the results json
    for (let i = 0 ; i < theResults.length; i++) {
      

      let total = theResults[i][dataTotalType];

      // adjust the value 
      let adjustedTotal = Math.max(
        total,
        maxValue * 0.01
      );
       
      // Convert value for display pn page 
      let textValue = dollar(total);
      
      // Get start/end years for display pn page
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

      // Create object for creating querystring on link for each value
      let searchFilters = {
        two_year_transaction_period: electionYear,
        recipient_committee_type: context.office_code,
        line_number: lineNumbers[line]
      };

      // Generate the querystring for link from the searcFilters object
      // Could be done more efficiently with URLSearchParams(), but since MS Edge-legacy does not support, we'll do this for now
      let queryString = Object.keys(searchFilters).map(function(key) {
      return key + '=' + searchFilters[key]
     }).join('&');
      console.log('queryString:', queryString)

      //  Build the link for each value on displayed on page
      let totalUrl = buildAppUrl(['receipts']) + `?${queryString}`;


      console.log('totalUrl: ', totalUrl);

      // HTML for each result row
      let theInnerHTML =
          `<div class="simple-table__row" role="row">
            <div role="cell" class="simple-table__cell js-total-period">${twoYearPeriod}</div>
            <div role="cell" class="simple-table__cell">
              <meter min="0" max="${maxValue}" value="0" title="US Dollars"></meter>
            </div>
            <div role="cell" class="simple-table__cell js-total-value t-mono-stacked-currency"><a href=${totalUrl}>${textValue}</a></div>
          </div>`;

    // Create an HTML node to put the rows in 
    let periodWrapper = document.createElement('div');
    periodWrapper.classList.add('simple-table--responsive');
    periodWrapper.setAttribute('role', 'grid');
    periodWrapper.innerHTML = theInnerHTML;
    
    // Append each row to the section on the page
    dataSection.appendChild(periodWrapper);


    // Push  each adjustedTotal to  adjustedTotals array for animating later
    adjustedTotalArray.push(adjustedTotal);

    // Now find each meter that was created above in theInnerHTML
    let meterElement = periodWrapper.getElementsByTagName('meter');//querySelectorAll('meter')
    console.log('meterElement: ', meterElement);

    // Push each meterElement to meterElements array
    meterElements.push(meterElement);

    }

  });

  console.log('METERELEMENTS:', meterElements);
  console.log('adjustedTotalArray', adjustedTotalArray);

  // Iterate each meter element and animate the value from 0
  for (let j = 0; j < meterElements.length; j++) {
    console.log('meterElements[j]: ', meterElements[j]);

   

// Self invoking timeoput that starts  animationn and stops calling itself when total is reached (setInterval and requestAnimationFromen also work but this was simpllest and smothest animation)
  let animVar = adjustedTotalArray[j]/500;//100000;
     (function loop(){
       setTimeout(function() {
          if (animVar < adjustedTotalArray[j]) { 
        meterElements[j].item(0).value = animVar;
        //animVar = animVar + 10000000.00
       animVar = animVar + adjustedTotalArray[j]/500;
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

  this.buildSelects()

};

AcrossTime.prototype.handleYearChange = function(e) {

     e.preventDefault();

     // Set action (min or max) based on which select was changed.
     let action = e.target.dataset.period;
     console.log('e.target.dataset.period', e.target.dataset.period);
     //this.baseQuery.min_election_cycle = e.target.value; // Save the updated value
     console.log('e.target.value', e.target.value);
    

     // Determins which select was changed 
     let beginning = action == 'min' ? e.target.value : this.minYearControl.value;
     let ending = action == 'max' ? e.target.value : this.maxYearControl.value;

     // Trsanspose min/max innn call to data if value of min select is  > value of max select
     // API will not return data is `min_election_cycle is > than max_election_cycle
     this.baseQuery.min_election_cycle = Math.min(beginning, ending);
     this.baseQuery.max_election_cycle = Math.max(beginning, ending);

     console.log('this.baseQuery.min_election_cycle' , this.baseQuery.min_election_cycle );
     console.log('this.baseQuery.max_election_cycle' , this.baseQuery.max_election_cycle );

     // Get the  officce from the URL passed from view
     this.baseQuery.office = context.office_code;

     // Load data based on baseQuery
     this.loadData(this.baseQuery);

};


////Buile  both selects (min/max) going back 9 two-year-periods from DEFAULT_ELECTION_YEAR
AcrossTime.prototype.buildSelects = function() {
    var theSelects = this.element.querySelectorAll( 'select[data-period]' )
    
    //  Set last select option 9 years  back
    let finalElectionYear = window.DEFAULT_ELECTION_YEAR - 9
    const theSelect =  this.maxYearControl
    theSelects.forEach(function(theSelect) {
      // Iterate 18 (9 two year periods)
      for (let i = 0; i < 18; i+=2) {

       let year = window.DEFAULT_ELECTION_YEAR - i 
       let startYear = year - 1
       
       //srart with 6 years back selected( i = 4 because the iteration is 0, 2, 4...)
       let selected
       if (theSelect.dataset.period == 'max') {
         selected = i == 4  ? ' selected' : '';
         }
       
       //  Populate the select options
       let option = `<option value="${year}"${selected}>${startYear} - ${year}</option>`
       theSelect.innerHTML += option

      }

    })

}

/**
 * Starts the data load, called by {@see init}
 * @param {Object} query - The data object for the query, {@see baseQuery}
 */
AcrossTime.prototype.loadData = function(query) {
  let instance = this;
  console.log('LOAD DATA');

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

 

new AcrossTime();
