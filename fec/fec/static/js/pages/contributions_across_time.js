'use strict';

// TODO - add a loading animation of some kind? Something to tell users that it's official but still loading?
// TODO - When adding the small implementations (i.e., with no controls), reference #2803 for designs

// Editable vars
const stylesheetPath = '/static/css/widgets/aggregate-totals.css';
// const breakpointToXS = 0; // retaining just in case
const breakpointToSmall = 430;
const breakpointToMedium = 675;
const breakpointToLarge = 700;
const breakpointToXL = 860;

const isModernBrowser = 'fetch' in window && 'assign' in Object;

// Includes
import analytics from '../modules/analytics';
import { buildUrl } from '../modules/helpers';
import { currency } from '../modules/helpers';

/**
 * Handles the functionality for the aggregate totals box(es).
 * Loads, creates an <aside> with {@see init()}, then makes itself visible (with {@see displayUpdatedData_grandTotal}) after it has some data to show.
 * @param {String} office - Can be set through data-office for the <script> or collected from the target specified with data-office-control.
 * @param {String} election_year - Can be set through data-election-year for the <script> or collected from the target specied with data-year-control.
 * @param {String} officeControl - Set with data-office-control on <script> but not required if data-office is set.
 * @param {String} yearControl - Set with data-year-control on <script> but not required if data-election-year is set.
 * @param {String} action - Can be 'raised' or 'spending'
 * @param {Boolean} doInitialNumberBuild - Should we animate the first value or just display it and be done? {@default false}.
 * TODO - ^ update these ^
 */
function AcrossTime() {
  this.action = 'raised'; // Whether we should display 'raised' or 'spending'
  this.layout = 'full'; // Shortcut to know what elements we're offering. Options
  this.descriptionField; // The HTML element that holds the explanation
  this.element; // The HTML element of this box
  this.officeControl; // The HTML Element to change the office
  this.partiesHolder; // The HTML Element that holds the parties' <meter> elements
  this.scriptElement; // The <script>
  this.valueField; // The HTML element that holds the value
  this.yearControl; // The HTML element to change the year
  // Where to find the big number:
  this.basePath_officeTotal = ['candidates', 'totals', 'by_office'];
  // Where to find the party numbers:
  //this.basePath_partyTotals = ['candidates', 'totals', 'by_office', 'by_party'];
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




/**
 * Called by {@see loadData} to parse and display the data
 * @param {Response} queryResponse - The successful API reply
 */
AcrossTime.prototype.displayUpdatedData = function(queryResponse) {

  //NOT USING THIS RIGHT NOW
  // Get the office value from the <script>
  this.baseQuery.office = queryResponse.results[0].office;


  let valuesToCompare ='total_receipts';

  let theResults = queryResponse.results;

  //make a copy of results array so we are not sorting in-place
  let theResultsTemp = Array.from(theResults)

  //sort to get the  max value
  const theResultsSort = function()  {
  theResultsTemp.sort((obj1, obj2) => {
    // We want the larger values first
    if (obj1[valuesToCompare] < obj2[valuesToCompare]) return 1;
    else if (obj1[valuesToCompare] > obj2[valuesToCompare]) return -1;
    else return 0;
  });
  return theResultsTemp 
  }

  let maxValue = theResultsSort()[0][valuesToCompare]
  

  let theMeters = this.element.querySelectorAll('meter');
  for (let i = 0; i < theMeters.length; i++) {

    let total = theResults[i][valuesToCompare];
    let adjustedTotal = Math.max(
      total,
      theResults[0][valuesToCompare] * 0.01
    );

    let electionYear = theResults[i].election_year 
    let starYear = electionYear - 1 
    let end_year = electionYear
    let  twoYearPeriod = `${starYear} - ${end_year}`


    let thisRowTitleCell = this.element.querySelectorAll(
      '.js-total-period'
    )[i];
    let thisRowValueCell = this.element.querySelectorAll(
      '.js-total-value'
    )[i];

    thisRowTitleCell.innerHTML = twoYearPeriod;
    thisRowValueCell.innerHTML = currency(total);

    theMeters[i].min = 0;
    theMeters[i].max = maxValue;
    theMeters[i].value = adjustedTotal;
  
  
  }
}


  // this.animVars.startingValue = this.animVars.valueTotal;

  // this.animVars.valueTotal =
  //   this.action == 'raised'
  //     ? queryResponse.results[0].total_receipts
  //     : queryResponse.results[0].total_disbursements;

  // this.startAnimation();

  // Set the description text
  // this.descriptionField.innerHTML = `Total ${this.action} by all ${
  //   this.baseQuery.office == 'P'
  //     ? 'presidential'
  //     : officeDefs[this.baseQuery.office] // lowercase for President but keep the others capped
  // } candidates running in&nbsp;${this.baseQuery.election_year}`;

  // Start the opening animation
  // $(this.element).slideDown();


// /**
//  * Called by {@see loadData} to parse and display the data
//  * @param {Response} queryResponse - The successful API reply
//  */
// AggregateTotalsBox.prototype.displayUpdatedData_office = function(
//   queryResponse
// ) {
//   // which values will we compare?
//   let valuesToCompare =
//     this.action == 'raised' ? 'total_receipts' : 'total_disbursements';

//   // Let's sort the arrays
//   let theResults = queryResponse.results;
//   theResults.sort((obj1, obj2) => {
//     // We want the larger values first
//     if (obj1[valuesToCompare] < obj2[valuesToCompare]) return 1;
//     else if (obj1[valuesToCompare] > obj2[valuesToCompare]) return -1;
//     else return 0;
//   });

//   let theMeters = this.partiesHolder.querySelectorAll('meter');
//   for (let i = 0; i < theMeters.length; i++) {
//     // 1) We'll grab the actual value / numbers to display
//     // 2) But we'll set the value of the meter to the greater of its own value
//     //    or 1% of the max value so the smaller parties show up on the graph at all
//     //    i.e. we want the meters to display at least a pixel for the smaller parties
//     let thisPartyTotal = theResults[i][valuesToCompare];
//     let thisPartyAdjustedTotal = Math.max(
//       thisPartyTotal,
//       theResults[0][valuesToCompare] * 0.01
//     );

//     let thisPartyLongName = theResults[i].party;
//     // If we know it's DEM or REP, we'll give them their proper names. ('Other' isn't abbreviated)
//     if (thisPartyLongName == 'DEM') thisPartyLongName = 'Dem.';
//     else if (thisPartyLongName == 'REP') thisPartyLongName = 'Rep.';

//     let thisRowTitleCell = this.partiesHolder.querySelectorAll(
//       '.js-party-title'
//     )[i];
//     let thisRowValueCell = this.partiesHolder.querySelectorAll(
//       '.js-party-value'
//     )[i];

//     thisRowTitleCell.innerHTML = thisPartyLongName;
//     thisRowValueCell.innerHTML = formatAsCurrency(thisPartyTotal);

//     theMeters[i].min = 0;
//     theMeters[i].max = theResults[0][valuesToCompare];
//     theMeters[i].value = thisPartyAdjustedTotal;
//     theMeters[i].dataset['party'] = theResults[i].party;
//   }
// };

/**
 * Called from the constructor, sets up its vars and starts {@see loadData}
 */
AcrossTime.prototype.init = function() {
  // Save self
  let instance = this;
  this.element = document.getElementById('contributions-over-time')
  this.minYearControl = this.element.querySelector('.js-min-period-select');
  this.maxYearControl = this.element.querySelector('.js-max-period-select');

  this.minYearControl.addEventListener('change', this.handleYearChange.bind(this));
  this.maxYearControl.addEventListener('change', this.handleYearChange.bind(this));


  this.loadData(this.baseQuery);


}

//   // The <script> on the page:
//   // (Starting with a polyfill if !document.currentScript support)
//   if (document.currentScript) this.scriptElement = document.currentScript;
//   else this.scriptElement = document.querySelector('#gov_fec_agg_tots_script');
//   // TODO -- figure out this ID :up:

//   // We're going to be checking the dataset several times
//   let dataset = this.scriptElement.dataset;

//   // If we're coming from an <iframe>, we need to inherit the dataset from window.frameElement
//   // Let's grab each item in the dataset for the <iframe></iframe> and copy it to the <script>
//   if (window.frameElement && window.frameElement.dataset) {
//     for (var item in window.frameElement.dataset) {
//       if (!dataset[item]) dataset[item] = window.frameElement.dataset[item];
//       // TODO - Could we use something like Object.assign here?
//     }
//   }

//   // Should we look at receipts or disbursements?
//   this.action = dataset['action'];

//   // If there are default values for office or year, let's grab them
//   if (dataset.office) this.baseQuery.office = dataset.office;
//   if (dataset.year) this.baseQuery.election_year = dataset.year;

//   // What kinds of office control should we offer?
//   if (dataset.officeControl == 'none') {
//     // If explicitly 'none', we're done with this
//     this.officeControl = 'none';
//   } else if (
//     dataset.officeControl &&
//     document.querySelector(dataset.officeControl)
//   ) {
//     // else if there's a value for officeControl and we can find the element in the page
//     this.officeControl = document.querySelector(dataset.officeControl);
//     // Save the external control's value to our base_query so we're in sync w/ the rest of the page
//     this.baseQuery.office = this.officeControl.value;
//     // TODO - add a class to indicate we have an external?
//   } else {
//     // else we'll build and internal office control
//     this.officeControl = 'internal';
//     // TODO - add class for this ?
//   }

//   // Initialize the year data
//   // If we aren't supposed to have a yearControl, don't
//   if (dataset.yearControl == 'none') {
//     this.yearControl = 'none';
//   } else if (
//     dataset.yearControl &&
//     document.querySelector(dataset.yearControl)
//   ) {
//     // If we have a year control and we can find it (it's inside our frame), listen to it
    // this.minYearControl = document.querySelector('min-yearControl');
    // this.maxYearControl = document.querySelector('max-yearControl');
    // Save the external control's value to our base_query so we're in sync w/ the rest of the page
    //this.baseQuery.election_year = this.yearControl.value;
//     // TODO - Add a class to indicate that we have a year control?
//   } else {
//     // Otherwise, we'll build a year control
//     this.yearControl = 'internal';
//   }

//   // Build the element (likely <aside>)
//   this.element = buildElement(instance, this.scriptElement);

//   // Now that we have an element
//   // Find the large value element and save it
//   this.valueField = this.element.querySelector('.js-value-large');
//   // And find its description
//   this.descriptionField = this.element.querySelector('.js-value-large-desc');

//   // Find the parties (meters) holder
//   this.partiesHolder = this.element.querySelector('.js-parties-holder');

//   // If we have an office control, save it
//   if (this.officeControl == 'internal') {
//this.officeControl = this.element.querySelector('.js-select-office');
//   }

//   // If we have an officeControl, listen to it
//   if (this.officeControl && this.officeControl != 'none') {
//     this.officeControl.addEventListener(
//       'change',
//       this.handleOfficeChange.bind(this)
//     );
//   }

//   // If we have a year control, save it
//   if (this.yearControl == 'internal') {

AcrossTime.prototype.handleYearChange = function(e) {


     this.baseQuery.min_election_year = this.minYearControl.value;
     this.baseQuery.max_election_year = this.maxYearControl.value;


     this.baseQuery.office = office

     this.loadData(this.baseQuery)


}
//     // Since it's internal, populate its options before we add listeners
//     this.refreshYearsSelect(
//       this.baseQuery.office,
//       this.baseQuery.election_year
//     );
//   }

//   // If we have a year control, listen to it
//   if (this.yearControl && this.yearControl != 'none') {
//     this.yearControl.addEventListener(
//       'change',
//       this.handleElectionYearChange.bind(this)
//     );
//   }

//   // If we have officeControl buttons / pills / radios,
//   let thePills = this.element.querySelectorAll('.js-election-radios');
//   thePills.forEach(element => {
//     element.addEventListener('click', this.handleRadiosClick.bind(this));
//   });

//   // Let's add classes so we can change the layout based on which controls are present
//   if (thePills.length > 0) {
//     // If we only have the buttons/pills/radios
//     this.element.classList.add('controls-office-only');
//   } else if (
//     // Else if we explictly have no controls,
//     // or both controls are external/outside this.element
//     (this.yearControl == 'none' && this.officeControl == 'none') ||
//     (!this.element.contains(this.officeControl) &&
//       !this.element.contains(this.yearControl))
//   ) {
//     this.element.classList.add('controls-none');
//   }

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

  // window
  //   .fetch(buildUrl(this.basePath_partyTotals, query), {
  //     cache: 'no-cache',
  //     mode: 'cors'
  //   })
  //   .then(function(response) {
  //     if (response.status !== 200)
  //       throw new Error('The network rejected the parties totals request.');
  //     // else if (response.type == 'cors') throw new Error('CORS error');
  //     response.json().then(data => {
  //       instance.displayUpdatedData_parties(data);
  //     });
  //   })
  //   .catch(function() {
  //     // TODO - handle catch
  //   });
};

/**
 * Event handler for when the office control is changed.
 * The target is specified in <script data-office-control />
 * @param Event e - the change event
 */
// AggregateTotalsBox.prototype.handleOfficeChange = function(e) {
//   e.preventDefault();
//   this.baseQuery.office = e.target.value; // Save the updated value

//   // If it's now a Presidential election, but not a presidential election year
//   if (e.target.value == 'P' && this.baseQuery.election_year % 4) {
//     // Do nothing—lean on refreshYearsSelect();
//   } else {
//     // Otherwise, it's cool to load the data now
//     this.loadData(this.baseQuery);
//   }
//   this.refreshYearsSelect(e.target.value, this.baseQuery.election_year);
// };

/**
 * Event handler for when the election year control changes.
 * The target is specified in <script data-year-control />
 * @param {Event} e - The change event
 */
AcrossTime.prototype.handleElectionYearChange = function(e) {
  e.preventDefault();
  this.baseQuery.election_year = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
};

/**
 * TODO -
 */
// AggregateTotalsBox.prototype.handleRadiosClick = function(e) {
//   e.preventDefault();
//   this.element.parentElement
//     .querySelectorAll('.js-election-radios')
//     .forEach(element => {
//       element.removeAttribute('disabled');
//     });
//   e.currentTarget.setAttribute('disabled', 'disabled');
//   this.baseQuery.office = e.currentTarget.value;
//   this.loadData(this.baseQuery); // Reload the data
// };

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

/**
 * Called from {@see handleOfficeChange} when it's been changed
 * Updates baseQuery.election_year in case there's a discrepancy
 * Causes the yearControl to fire a change event
 */
// AggregateTotalsBox.prototype.refreshYearsSelect = function() {
//   // If it's an internal control, we have the only listeners on that object so we're free to change it
//   // Otherwise, if it's an external control, let's have it trigger a change event
//   // TODO - is it important for an external control to fire a change event?
//   // TODO - Should we go ahead and try to change external <select> values?
//   if (this.element.contains(this.yearControl)) {
//     this.yearControl.innerHTML = electionYearsOptions(
//       this.baseQuery.office,
//       this.baseQuery.election_year
//     );
//     // Sync the new value back to baseQuery in case there's a difference
//     this.baseQuery.election_year = this.yearControl.value;
//   }
//   // Change events only fire when a user interacts with the control so we need to fire one ourselves
//   //
//   // If the browser uses createEvent, init and dispatch the event
//   // Otherwise, fire a generic onchange event
//   if ('createEvent' in document) {
//     let e = document.createEvent('HTMLEvents');
//     e.initEvent('change', false, true);
//     this.yearControl.dispatchEvent(e);
//   } else {
//     this.yearControl.fireEvent('onchange');
//   }

//   logUsage(this.baseQuery.office, this.baseQuery.election_year);
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
 * Returns the next valid election cycle, particularly for presidential races
 * @param {String, Number} year - The year to scrub / correct
 * @param {String} office - The office of that cycle
 * @returns {Number} - Either `office` or the next valid election year
 * TODO - Could probably combine this with widget-vars/getNextPresidentialElectionYear() for something like getNextElectionYear('P')
 */

/**
 * Creates the <aside> and its elements.
 * Inserts the element into the page, according to domAnchor (or scriptElement)
 * Adds a <link> to the <head>, pointing to {@see stylesheetPath}
 * @param {AggregateTotalsBox} callingInstance - Where to find the this values like baseQuery
 * @param {HTMLScriptElement} scriptElement - The <script> where this file lives
 * @returns {HTMLElement} - The new <aside>, in the page
 */
// function buildElement(callingInstance, scriptElement) {
//   let toReturn = document.createElement('aside');
//   toReturn.setAttribute(
//     'id',
//     'gov_fec_at_' + Math.floor(Math.random() * 10000)
//   ); // Random so we can have multiple on a page, if needed

//   let theme = scriptElement.dataset.theme;

//   // Should we add a class for ancient browsers?
//   let browserClass = isModernBrowser ? '' : 'no-meters';

//   // Set its class
//   toReturn.setAttribute(
//     'class',
//     'aggr-totals theme-' + theme + ' ' + browserClass
//   );

//   // Let's build its html
//   let theInnerHTML = ``;
//   if (callingInstance.officeControl == 'internal') {
//     theInnerHTML += `<div class="controls-wrapper">`;

//     // If we're supposed to have an office control,
//     if (callingInstance.officeControl == 'internal') {
//       // If we don't have a YEAR control or it's specifically set to 'none'
//       if (callingInstance.yearControl == 'none') {
//         // Let's only build the tabbed content, not the pull-down
//         let theRadiosString = '';
//         for (var def in officeDefs) {
//           if (def == 'P' && callingInstance.baseQuery.election_year % 4 > 0) {
//             // Skip the President button if we're looking at a non-presidential year
//           } else {
//             theRadiosString +=
//               '<button value="' +
//               def +
//               '" ' +
//               (def == callingInstance.baseQuery.office
//                 ? 'disabled="disabled" '
//                 : '') +
//               'class="election-radios js-election-radios">' +
//               officeDefs[def] +
//               '</button>';
//           }
//         }
//         theInnerHTML += `<fieldset class="pills">${theRadiosString}</fieldset>`;
//       } else {
//         // Otherwise, build the <select>
//         let theOptionsString = '';
//         for (def in officeDefs) {
//           theOptionsString += `<option value="${def}"${
//             def == callingInstance.baseQuery.office ? ' selected' : ''
//           }>${officeDefs[def]} candidates</option>`;
//         }
//         theInnerHTML += `<fieldset class="select">
//             <label for="top-category" class="breakdown__title label t-inline-block">How much has been ${
//               callingInstance.action == 'raised' ? 'raised' : 'spent'
//             } by:</label>
//             <select id="top-category" name="top_category" class="js-select-office form-element--inline" aria-controls="top-table">
//               ${theOptionsString}
//             </select>
//           </fieldset>`;
//       }
//     }
//     if (callingInstance.yearControl == 'internal') {
//       theInnerHTML += `<fieldset class="select">
//           <label for="election-year" class="breakdown__title label t-inline-block">Running in: </label>
//           <select id="election-year" name="cycle" class="js-select-year form-element--inline" aria-controls="top-table"></select>
//         </fieldset>`;
//     }
//     theInnerHTML += `</div>`;
//   }
//   theInnerHTML += `<div class="main-content-wrapper">`;
//   theInnerHTML += `
//       <div class="total-wrapper">
//         <h1 class="value js-value-large"></h1>
//         <h2 class="description js-value-large-desc"></h2>
//       </div>`;
//   theInnerHTML += `<div class="visual-divider" role="presentation"></div>`;
//   theInnerHTML += `
//       <div class="parties-wrapper">
//         <div class="simple-table--responsive js-parties-holder" role="grid">
//           <div class="simple-table__row" role="row">
//             <div role="cell" class="simple-table__cell js-party-title"></div>
//             <div role="cell" class="simple-table__cell js-party-value t-mono-stacked-currency"></div>
//             <div role="cell" class="simple-table__cell">
//               <meter min="0" max="" value="" title="US Dollars" data-party=""></meter>
//               <!-- DO WE NEED THIS FOR IE?
//               <div class="bar-container">
//                 <div class="value-bar" data-value="64701975.35" data-party="REP" style="width: 100%;"></div>
//               </div> //-->
//             </div>
//           </div>
//           <div class="simple-table__row" role="row">
//             <div role="cell" class="simple-table__cell js-party-title"></div>
//             <div role="cell" class="simple-table__cell js-party-value t-mono-stacked-currency"></div>
//             <div role="cell" class="simple-table__cell">
//               <meter min="0" max="" value="" title="US Dollars" data-party=""></meter>
//               <!-- DO WE NEED THIS FOR IE?
//               <div class="bar-container">
//                 <div class="value-bar" data-value="64701975.35" data-party="DEM" style="width: 90%;"></div>
//               </div> //-->
//             </div>
//           </div>
//           <div class="simple-table__row" role="row">
//             <div role="cell" class="simple-table__cell js-party-title"></div>
//             <div role="cell" class="simple-table__cell js-party-value t-mono-stacked-currency"></div>
//             <div role="cell" class="simple-table__cell">
//               <meter min="0" max="" value="" title="US Dollars"  data-party=""></meter>
//               <!-- DO WE NEED THIS FOR IE?
//               <div class="bar-container">
//                 <div class="value-bar" data-value="64701975.35" data-party="Other" style="width: 20%;"></div>
//               </div> //-->
//             </div>
//           </div>
//         </div>
//       </div>`;
//   theInnerHTML += `</div>`; // Close main-content-wrapper
  // TODO - This will come back when we activate the <iframe> functionality
  // let theNow = new Date(); // TODO - Make the timestamp update
  // let theDateString = theNow.toLocaleDateString('en-US', {
  //   month: 'long',
  //   day: '2-digit',
  //   year: 'numeric'
  // });
  // theInnerHTML += `
  //     <footer>
  //       <div class="timestamp">Updated as of <time datetime="${theNow}">${theDateString}</time></div>
  //       <a class="gov-fec-seal" href="https://www.fec.gov" target="_blank">
  //         <img class="theme-light" src="/static/img/seal.svg" alt="Seal of the Federal Election Commission | United States of America">
  //         <img class="theme-dark" src="/static/img/seal--inverse.svg" alt="Seal of the Federal Election Commission | United States of America">
  //       </a>
  //     </footer>
  //   `;
  //toReturn.innerHTML = theInnerHTML;

//   let disclaimer = document.createElement('span');
//   disclaimer.setAttribute('class', 't-note');
//   disclaimer.innerHTML =
//     'Newly filed summary data may not appear for up to 48 hours.';
//   toReturn.appendChild(disclaimer);

//   // Add the stylesheet to the document <head>
//   let head = document.head;
//   let linkElement = document.createElement('link');
//   linkElement.type = 'text/css';
//   linkElement.rel = 'stylesheet';
//   linkElement.href = stylesheetPath;
//   head.appendChild(linkElement);

//   // The default in-page element to replace
//   let domElementToReplace = document.querySelector('div.gov-fec-agg-tots');

//   // If there's a default element to replace
//   // else put it in the page right before this <script>
//   if (domElementToReplace) domElementToReplace.replaceWith(toReturn);
//   else scriptElement.parentElement.insertBefore(toReturn, scriptElement);

//   return toReturn;
// }

/**
 * Handles the usage analytics for this module
 * @todo - Decide how to gather usage insights while embedded
 * @param {String} officeAbbrev - The user-selected election office
 * @param {*} electionYear - String or Number, the user-selected election year
 */
function logUsage(officeAbbrev, electionYear) {
  analytics.customEvent({
    event: 'Widget Interaction',
    eventName: `widgetInteraction`,
    eventCategory: 'Widget-AggregateTotals',
    eventAction: 'interaction',
    eventLabel: officeAbbrev + ',' + electionYear
  });
}

new AcrossTime();
