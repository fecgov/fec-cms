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
import { buildUrl, buildAppUrl } from '../modules/helpers';
import { currency } from '../modules/helpers';

function AcrossTime() {
  this.element; // The HTML element of this feature
  this.dataSections;
  this.minYearControl; // The HTML element to change beginning year
  this.maxYearControl; // The HTML element to change ending year
  this.futurePast;
  // Where to find the totals:
  this.basePath_officeTotal = ['candidates', 'totals', 'by_office'];
  this.baseQuery = {
    office: context.office_code,
    //election_year: window.DEFAULT_ELECTION_YEAR,
    min_election_cycle: 2018,
    max_election_cycle: 2022, //window.DEFAULT_ELECTION_YEAR (?)
    is_active_candidate: true,
    per_page: 20,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1
  }; // Vars for data load
  this.animVars = {
    valueTotal: 0, // This instance's current value, only used for animation
    valueTemp: 0,
    stepCount: 0,
    interval: null
  };

  this.init();
}

/* eslint-disable no-console */

/**
 * Called by {@see loadData} to parse and display the data
 * @param {Response} queryResponse - The successful API reply
 */
AcrossTime.prototype.displayUpdatedData = function(queryResponse) {
  let instance = this;
  //DO I NEED  THIS?
  //let office_code = this.baseQuery.office_code;

  //NOT USING THIS RIGHT NOW
  // Get the office value from the <script>
  //this.baseQuery.office = queryResponse.results[0].office;

  let theResults = queryResponse.results;

  //make a copy of results array so we are not sorting in-place
  //let theResultsTemp = Array.from(theResults);

  let largestValuesArray = [];

  //MOVE TO OWN SEPARATE FUMCTION???
    //sort to get the  max value
  this.dataSections.forEach(function(dataSection) {
   //make a copy of results array so we are not sorting in-place
  let theResultsTemp = Array.from(theResults);
  let dataType = dataSection.dataset.totalType;

    theResultsTemp.sort((obj1, obj2) => {
      // We want the larger values first
      if (obj1[dataType] < obj2[dataType]) return 1;
      else if (obj1[dataType] > obj2[dataType]) return -1;
      else return 0;
    });
    largestValuesArray.push(theResultsTemp[0][dataType]);

   });

  const theResultsSort = function() {

    largestValuesArray.sort((obj1, obj2) => {
      // We want the larger values first
      if (obj1 < obj2) return 1;
      else if (obj1 > obj2) return -1;
      else return 0;
    });
         return largestValuesArray;
     };

    let maxValue = theResultsSort()[0];
    console.log('maxValue: ', maxValue);

  //let dataSections = this.element.querySelectorAll('.js-across-time');
  let directionSpans = this.element.querySelectorAll('.js-direction');

  const lineNumbers = {
    total_individual_itemized_contributions: 'F3-11AI',
    total_transfers_from_other_: 'F3-12',
    total_other_political_committee_contributions: 'F3-11C'
    };

    theResults = instance.futurePast == 'forward' ? theResults.reverse() : theResults;

  this.dataSections.forEach(function(dataSection) {
     dataSection.innerHTML = '';

    console.log('dataSection', dataSection);
    let dataTotalType = dataSection.dataset.totalType;
    console.log('dataTotalType', dataTotalType);

    // //make a copy of results array so we are not sorting in-place
    // let theResultsTemp = Array.from(theResults);

    // //sort to get the  max value
    // const theResultsSort = function() {
    // theResultsTemp.sort((obj1, obj2) => {
    //   // We want the larger values first
    //   if (obj1[dataTotalType] < obj2[dataTotalType]) return 1;
    //   else if (obj1[dataTotalType] > obj2[dataTotalType]) return -1;
    //   else return 0;
    // });
    // return theResultsTemp;
    // };

    // let maxValue = theResultsSort()[0][dataTotalType];

    //theResults = instance.futurePast == 'forward' ? theResults.reverse() : theResults;

    //TODO: PROBABLY DON'T NEED futurePast AND forwardBack, CAN HAVE  JUST ONE AND USE THE TEXT VALUE
    //let forwardBack = '(Going ' + (self.futurePast == 'future' ? 'forward' : 'back') + ' in time)';
    let forwardBack = `(Going ${instance.futurePast} in time)`;
    console.log('forwardBack: ', forwardBack);
    for (let directionSpan of directionSpans) {
      directionSpan.textContent = forwardBack;
    }

    for (let i = 0; i < theResults.length; i++) {

    //let theMeters = dataSection.querySelectorAll('meter');
    //for (let i = 0; i < theMeters.length; i++) {

      let total = theResults[i][dataTotalType];
      let adjustedTotal = Math.max(
        total,
        maxValue * 0.01
      );
      let textValue = currency(total);

      let electionYear = theResults[i].election_year;
      let starYear = electionYear - 1;
      let end_year = electionYear;
      let twoYearPeriod = `${starYear} - ${end_year}`;

//EXAMPLE QUERYSTRING: ?recipient_committee_type=S&two_year_transaction_period=2022&line_number=F3-11AI&line_number=F3-12&line_number=F3-11C

////NEW

let sub = 'au';
let subConcnat = `${sub}thorized_committee`;
let splitString= dataTotalType.toString().split(subConcnat).join('');

let line = dataTotalType.indexOf('transfers') !== -1 ? splitString : dataTotalType;

let searchFilters = {
  two_year_transaction_period: electionYear,
  recipient_committee_type: context.office_code,
  line_number: lineNumbers[line]
};

let totalUrl = buildAppUrl(['receipts'])
    + `?${buildQueryString(searchFilters)}`;

console.log('totalUrl: ', totalUrl);

      let theInnerHTML =
          `<div class="simple-table__row" role="row">
            <div role="cell" class="simple-table__cell js-total-period">${twoYearPeriod}</div>
            <div role="cell" class="simple-table__cell">
              <meter min="0" max="${maxValue}" value="${adjustedTotal}" title="US Dollars"></meter>
            </div>
            <div role="cell" class="simple-table__cell js-total-value  t-mono-stacked-currency"><a href=${totalUrl}>${textValue}</a></div>

          </div>`;

    let periodWrapper = document.createElement('div');
    periodWrapper.classList.add('simple-table--responsive');
    periodWrapper.setAttribute('role', 'grid');
    periodWrapper.innerHTML = theInnerHTML;

    dataSection.appendChild(periodWrapper);

    }
  });
};

AcrossTime.prototype.init = function() {
  // Save self
  let instance = this;
  this.element = document.getElementById('contributions-over-time');
  this.dataSections = this.element.querySelectorAll('.js-across-time');
  this.minYearControl = this.element.querySelector('.js-min-period-select');

  console.log('instance.baseQuery.min_election_cycle:', instance.baseQuery.min_election_cycle);
  // const options = Array.from(this.minYearControl.options);
  // options.forEach((option) => {
  //    if (option.value == instance.baseQuery.min_election_cycle) {
  //     //instance.minYearControl.selectedIndex = i;
  //     option.selected = 'selected';
  //    }
  //   });

  this.maxYearControl = this.element.querySelector('.js-max-period-select');

  this.minYearControl.addEventListener('change', this.handleYearChange.bind(this));
  this.maxYearControl.addEventListener('change', this.handleYearChange.bind(this));

  this.futurePast = 'back';

  this.loadData(this.baseQuery);

};

AcrossTime.prototype.handleYearChange = function(e) {

     e.preventDefault();
     let action = e.target.dataset.period;
     console.log('e.target.dataset.period', e.target.dataset.period);
     //this.baseQuery.min_election_cycle = e.target.value; // Save the updated value
     console.log('e.target.value', e.target.value);

     let beginning = action == 'min' ? e.target.value : this.minYearControl.value;
     let ending = action == 'max' ? e.target.value : this.maxYearControl.value;

     //trsanspose begining and ending if begining > ending
     this.baseQuery.min_election_cycle = Math.min(beginning, ending);
     this.baseQuery.max_election_cycle = Math.max(beginning, ending);

     this.futurePast = beginning > ending ? 'back' : 'forward';

     //this.baseQuery.min_election_cycle = action == 'min' ? e.target.value : this.minYearControl.value;
     //this.baseQuery.max_election_cycle = action == 'max' ? e.target.value :this.maxYearControl.value;
     console.log('this.baseQuery.min_election_cycle' , this.baseQuery.min_election_cycle );
     console.log('this.baseQuery.max_election_cycle' , this.baseQuery.max_election_cycle );

     this.baseQuery.office = context.office_code;

     this.loadData(this.baseQuery);

};

  // Listen for resize events
  //window.addEventListener('resize', this.handleResize.bind(this));
  // Call for a resize on init
  //this.handleResize();

  // Start the initial data load
  //this.loadData(this.baseQuery);
//};

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

function buildQueryString (data) {
  return new URLSearchParams(data).toString();
}

/**
 * Handles when the window changes size, but only looks at the relevant element's size.
 * Toggles classes for the element based on {@see breakpointToSmall, @see breakpointToMedium, @see breakpointToLarge, @see breakpointToXL}
 */
// AggregateTotalsBox.prototype.handleResize = function(e = null) {
//   if (e) e.preventDefault();

//   let newWidth = this.element.offsetWidth;

//   if (newWidth < breakpointToSmall) {
//     // It's XS
//     this.element.classList.remove('w-s');
//     this.element.classList.remove('w-m');
//     this.element.classList.remove('w-l');
//     this.element.classList.remove('w-xl');
//   } else if (newWidth < breakpointToMedium) {
//     // It's small
//     this.element.classList.add('w-s');
//     this.element.classList.remove('w-m');
//     this.element.classList.remove('w-l');
//     this.element.classList.remove('w-xl');
//   } else if (newWidth < breakpointToLarge) {
//     // It's medium
//     this.element.classList.remove('w-s');
//     this.element.classList.add('w-m');
//     this.element.classList.remove('w-l');
//     this.element.classList.remove('w-xl');
//   } else if (newWidth < breakpointToXL) {
//     // It's large
//     this.element.classList.remove('w-s');
//     this.element.classList.remove('w-m');
//     this.element.classList.add('w-l');
//     this.element.classList.remove('w-xl');
//   } else {
//     // It's XL
//     this.element.classList.remove('w-s');
//     this.element.classList.remove('w-m');
//     this.element.classList.remove('w-l');
//     this.element.classList.add('w-xl');
//   }
// };

// /**
//  * Starts the timers to update the displayed value from one to the next (not part of the initial display)
//  * Called by {@see displayUpdatedData_grandTotal} when the displayed value should changed.
//  */
// AggregateTotalsBox.prototype.startAnimation = function() {
//   let instance = this;
//   // If there's an existing interval, clear it
//   if (instance.animVars.interval) {
//     window.clearInterval(instance.animVars.interval);
//   }
//   instance.animVars.interval = window.setInterval(function() {
//     let nextVal = getNextValue(
//       instance.animVars.valueTemp,
//       instance.animVars.valueTotal
//     );
//     instance.animVars.valueTemp = nextVal; // Save for next loop
//     instance.valueField.innerHTML = formatAsCurrency(nextVal); // Update the element
//     // instance.formatAsCurrency(nextVal); // Update the element

//     // If our values match, we can stop the animations
//     if (instance.animVars.valueTemp == instance.animVars.valueTotal) {
//       window.clearInterval(instance.animVars.interval);
//     }
//   }, 25);
// };

// *
//  * Formats the given value and puts it into the dom element.
//  * @param {Number} passedValue - The number to format and plug into the element
//  * @param {Boolean} roundToWhole - Should we drop the cents or no?
//  * @returns {String} A string of the given value formatted with a dollar sign, commas, and (if roundToWhole === false) decimal

// function formatAsCurrency(passedValue, roundToWhole = true) {
//   // Format for US dollars and cents
//   if (roundToWhole)
//     return '$' + passedValue.toFixed().replace(/\d(?=(\d{3})+$)/g, '$&,');
//   else return '$' + passedValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
// }

// /**
//  * Returns the next value to step from `currentValue` to `goalValue`, when animating each place from current to goal.
//  * e.g. changes the ones position from current toward goal, then changes the tens position value from current toward goal, then hundreds, thousands, etc.
//  * @param {*} currentValue
//  * @param {*} goalValue
//  * @returns {Number} - The next value, one step more from currentValue toward goalValue
//  */
// function getNextValue(currentValue, goalValue) {
//   // Convert the values to strings to split them apart into arrays
//   // Multiplying by 100 to get rid of the decimal
//   let currentValArr = Math.round(currentValue * 100)
//     .toString()
//     .split('');
//   let goalValArr = Math.round(goalValue * 100)
//     .toString()
//     .split('');

//   // Reversing them will make it easier for us to loop starting with 1-cents, then 10-cents, then 1-dollars, 10-dollars, etc.
//   currentValArr.reverse();
//   goalValArr.reverse();

//   // Let's add leading zeroes so the lengths are the same
//   while (goalValArr.length < currentValArr.length) {
//     goalValArr.push('0');
//   }
//   while (currentValArr.length < goalValArr.length) {
//     currentValArr.push('0');
//   }

//   for (let i = 0; i < goalValArr.length; i++) {
//     let currentDigitVal = parseInt(currentValArr[i], 10);
//     let goalDigitVal = parseInt(goalValArr[i], 10);

//     if (currentDigitVal == goalDigitVal) {
//       // do nothing, just loop
//     } else {
//       // The new digit is one lower than the current one if the goal is lower, but one higher if the goal is higher
//       if (currentDigitVal > goalDigitVal) currentDigitVal--;
//       else if (currentDigitVal < goalDigitVal) currentDigitVal++;

//       currentValArr[i] = currentDigitVal.toString();

//       // Reverse the array back to normal (no longer need goalValArr)
//       currentValArr.reverse();

//       // Make it back into a number
//       // Dividing by 100 to add the decimal back
//       let newTempVal = parseInt(currentValArr.join(''), 10) / 100;
//       newTempVal = Number(newTempVal.toFixed(2));
//       return newTempVal;
//     }
//   }
//   // If there's some kind of error, just return the goal
//   return goalValue;
// }

/**
 * Handles the usage analytics for this module
 * @todo - Decide how to gather usage insights while embedded
 * @param {String} officeAbbrev - The user-selected election office
 * @param {*} electionYear - String or Number, the user-selected election year
 */
// function logUsage(officeAbbrev, electionYear) {
//   analytics.customEvent({
//     event: 'Widget Interaction',
//     eventName: `widgetInteraction`,
//     eventCategory: 'Widget-AggregateTotals',
//     eventAction: 'interaction',
//     eventLabel: officeAbbrev + ',' + electionYear
//   });
// }

new AcrossTime();
