'use strict';

// Editable vars
const stylesheetPath = '/static/css/widgets/aggregate-totals.css';

// Includes
const $ = require('jquery'); // TODO - Do we need to import it all here?
import { buildUrl } from '../modules/helpers';
import {
  defaultElectionYear,
  electionYearsList,
  officeDefs
} from './widget-vars';

// TODO: - UPDATE ALL COMMENTS AND JSDOC CONTENT
// TODO - add a loading animation of some kind? Something to tell users that it's official but still loading?
/**
 * Handles the functionality for the aggregate totals box(es).
 * Loads, creates an <aside> with {@link init}, then makes itself visible (with {@link displayUpdatedData}) after it has some data to show.
 * @param {String} office - Required. Can be set through data-office for the <script> or collected from the target specified with data-office-control.
 * @param {String} election_year - Required. Can be set through data-election-year for the <script> or collected from the target specied with data-year-control.
 * @param {String} officeControl - Required. Set with data-office-control on <script> but not required if data-office is set.
 * @param {String} yearControl - Required. Set with data-year-control on <script> but not required if data-election-year is set.
 * @param {String} action - Required. Can be 'raised' or 'spending'? 'spent'?
 * @param {Boolean} doInitialNumberBuild - Should we animate the first value or just display it and be done? Default: false.
//  * @param {String} layout - // TODO full or mini
//  * @param {String} theme - // TODO light or dark
 */
function AggregateTotalsBox() {
  this.action; // Whether we should display 'raised' or 'spending'
  this.descriptionField; // The HTML element that holds the explanation
  this.element; // The HTML element of this box
  // this.layout; // The layout version, either full or mini. Full has its own controls included
  this.officeControl; // The HTML Element to change the office
  this.scriptElement; // The <script>
  // this.theme = 'light'; // The style theme, only used for when {@link layout} is 'full'
  this.valueField; // The HTML element that holds the value
  this.yearControl; // The HTML element to change the year

  this.basePath = ['candidates', 'totals', 'by_office'];
  this.baseQuery = {
    office: 'P',
    per_page: 20,
    is_active_candidate: false,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1,
    election_year: defaultElectionYear()
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
 * Called by {@link loadData} to parse and display the data
 * @param {Response} queryResponse - The successful API reply
 */
AggregateTotalsBox.prototype.displayUpdatedData = function(queryResponse) {
  console.log('displayUpdatedData! queryResponse:');
  console.log(queryResponse);
  // Get the office value from the <script>
  this.baseQuery.office = queryResponse.results[0].office;
  // Get the office value from the <script>, but scrub it
  this.baseQuery.election_year = scrubElectionYear(
    queryResponse.results[0].election_year,
    this.baseQuery.office
  );

  this.animVars.startingValue = this.animVars.valueTotal;
  this.animVars.valueTotal =
    this.action == 'raised'
      ? queryResponse.results[0].total_receipts
      : queryResponse.results[0].total_disbursements;

  this.startAnimation();

  // Set the description text
  this.descriptionField.innerHTML =
    'Total ' +
    this.action +
    ' by all ' +
    officeDefs[this.baseQuery.office] +
    ' candidates running in&nbsp;' +
    this.baseQuery.election_year;

  // Start the opening animation
  // $(this.element).slideDown();
};

/**
 * Called from the constructor, sets up its vars and starts {@link loadData}
 */
AggregateTotalsBox.prototype.init = function() {
  this.scriptElement = document.currentScript; // The <script> on the page

  // If we're coming from an <iframe>, we need to inherit the dataset from window.frameElement
  if (window.frameElement && window.frameElement.dataset) {
    for (var item in window.frameElement.dataset) {
      if (!this.scriptElement.dataset[item]) {
        this.scriptElement.dataset[item] = window.frameElement.dataset[item];
      }
    }
  }

  // We're going to be checking the dataset several times
  let dataset = this.scriptElement.dataset;

  // In case something goes wrong and we can't show anything,
  // TODO - Do we still need this?
  let allSet = true;

  // Initialize the office data (H, P, or S)
  // If we aren't supposed to use an interface, remember that we don't need to build one
  if (dataset.officeControl == 'none') {
    this.officeControl = 'none';
  } else if (dataset.officeControl && dataset.officeControl != 'none') {
    if (document.querySelector(dataset.officeControl)) {
      this.officeControl = document.querySelector(dataset.officeControl);
    }
    // TODO - add a class to indicate we have an external
  } else {
    // Else if we have an office specified,
    // Else build the office control inside self
    this.officeControl = 'internal';
    // TODO - add class for this
  }

  // Initialize the year data
  // If we aren't supposed to have a yearControl, don't
  if (dataset.yearControl == 'none') {
    this.yearControl = 'none';
    // If we have a year control and we can find it (it's inside our frame), listen to it.
  } else if (dataset.yearControl) {
    if (document.querySelector(dataset.yearControl)) {
      this.yearControl = document.querySelector(dataset.yearControl);
    }
    // TODO - Add a class to indicate that we have a year control
  } else {
    this.yearControl = 'internal';
    // TODO - what if we don't want a year control and only want to show a single year's elections?
    // TODO - ... add a different value (e.g. "internal") to yearControl?
  }

  /* TODO
  TODO
  TODO
  TODO
  TODO
  TODO
  */

  // Should we look at receipts or disbursements?
  this.action = this.scriptElement.dataset['action'];
  if (!this.action) allSet = false;

  // If we're missing something, stop here
  if (!allSet && this.action) return;

  // Build the actual element (the <aside>)
  let instance = this;
  this.element = buildElement(instance, this.scriptElement, this.scriptElement);

  // Find the large value and save it
  this.valueField = this.element.querySelector('.js-value-large');
  // And find its description
  this.descriptionField = this.element.querySelector('.js-value-large-desc');

  if (this.officeControl == 'internal') {
    this.officeControl = this.element.querySelector('.js-select-office');
  }
  // If we have an officeControl, listen to it
  if (this.officeControl && this.officeControl != 'none') {
    this.officeControl.addEventListener(
      'change',
      this.handleOfficeChange.bind(this)
    );
  }

  if (this.yearControl == 'internal') {
    this.yearControl = this.element.querySelector('.js-select-year');
  }
  // If we have a year control, listen to it
  if (this.yearControl && this.yearControl != 'none') {
    this.yearControl.addEventListener(
      'change',
      this.handleElectionYearChange.bind(this)
    );
  }

  // If we have officeControl pills,
  let thePills = this.element.querySelectorAll('.js-election-radios');
  thePills.forEach((currentValue, currentIndex, listObj) => {
    currentValue.addEventListener('click', this.handleRadiosClick);
  }, this.instance);

  // Start the initial data load
  this.loadData(this.baseQuery);
};

/**
 * Starts the data load, called by {@link init}
 * @param {Object} query - The data object for the query, {@link baseQuery}
 */
AggregateTotalsBox.prototype.loadData = function(query) {
  let instance = this;

  // console.log('would have called ' + buildUrl(this.basePath, query));

  // window
  //   .fetch(buildUrl(this.basePath, query))
  //   .then(response => {
  //     // console.log('response: ', response);
  //     if (!response.ok) throw new Error('Network response was not ok.');
  //   })
  //   // .then(res => {
  //   //   console.log('then() res: ', res);
  //   //   res.json();
  //   // })
  //   .then(response => {
  //     // console.log('then() response: ', response);
  //     instance.displayUpdatedData(response);
  //   })
  //   .catch(error => {
  //     //
  //     console.log('CATCH - error: ', error);
  //   });

  $.getJSON(buildUrl(this.basePath, query)).done(response => {
    instance.displayUpdatedData(response);
  });
};

/**
 * Event handler for when the office control is changed.
 * The target is specified in <script data-office-control />
 * @param Event e - the change event
 */
AggregateTotalsBox.prototype.handleOfficeChange = function(e) {
  e.preventDefault();
  this.baseQuery.office = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
};

/**
 * Event handler for when the election year control changes.
 * The target is specified in <script data-year-control />
 * @param {Event} e - The change event
 */
AggregateTotalsBox.prototype.handleElectionYearChange = function(e) {
  e.preventDefault();
  this.baseQuery.election_year = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
};

/**
 * TODO -
 */
AggregateTotalsBox.prototype.handleRadiosClick = function(e) {
  e.preventDefault();
  this.parentElement
    .querySelectorAll('.js-election-radios')
    .forEach(element => {
      element.removeAttribute('disabled');
    });
  e.currentTarget.setAttribute('disabled', 'disabled');
  // TODO this.baseQuery.office = e.currentTarget.value
  // TODO - reload data
};

/**
 * Formats the given value and puts it into the dom element.
 * @param {Element} instance - The dom element whose valueField will hold the text
 * @param {Number} passedValue - The number to format and plug into the element
 */
AggregateTotalsBox.prototype.displayValue = function(instance, passedValue) {
  let valString =
    '$' + passedValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'); // Format for US dollars and cents
  instance.valueField.innerHTML = valString;
};

/**
 * Starts the timers to update the displayed value from one to the next (not part of the initial display)
 * Called by {@link displayUpdatedData} when the displayed value should changed.
 */
AggregateTotalsBox.prototype.startAnimation = function() {
  let instance = this;
  // If there's an existing interval, clear it
  if (instance.animVars.interval) {
    window.clearInterval(instance.animVars.interval);
  }
  instance.animVars.interval = window.setInterval(function() {
    let nextVal = getNextValue(
      instance.animVars.valueTemp,
      instance.animVars.valueTotal
    );
    instance.animVars.valueTemp = nextVal; // Save for next loop
    instance.displayValue(instance, nextVal); // Update the element

    // If our values match, we can stop the animations
    if (instance.animVars.valueTemp == instance.animVars.valueTotal) {
      window.clearInterval(instance.animVars.interval);
    }
  }, 25);
};

/**
 * Returns the next value to step from `currentValue` to `goalValue`, when animating each place from current to goal.
 * e.g. changes the ones position from current toward goal, then changes the tens position value from current toward goal, then hundreds, thousands, etc.
 * @param {*} currentValue
 * @param {*} goalValue
 * @returns {Number} - The next value, one step more from currentValue toward goalValue
 */
function getNextValue(currentValue, goalValue) {
  // Convert the values to strings to split them apart into arrays
  // Multiplying by 100 to get rid of the decimal
  let currentValArr = Math.round(currentValue * 100)
    .toString()
    .split('');
  let goalValArr = Math.round(goalValue * 100)
    .toString()
    .split('');

  // Reversing them will make it easier for us to loop starting with 1-cents, then 10-cents, then 1-dollars, 10-dollars, etc.
  currentValArr.reverse();
  goalValArr.reverse();

  // Let's add leading zeroes so the lengths are the same
  while (goalValArr.length < currentValArr.length) {
    goalValArr.push('0');
  }
  while (currentValArr.length < goalValArr.length) {
    currentValArr.push('0');
  }

  for (let i = 0; i < goalValArr.length; i++) {
    let currentDigitVal = parseInt(currentValArr[i], 10);
    let goalDigitVal = parseInt(goalValArr[i], 10);

    if (currentDigitVal == goalDigitVal) {
      // do nothing, just loop
    } else {
      // The new digit is one lower than the current one if the goal is lower, but one higher if the goal is higher
      if (currentDigitVal > goalDigitVal) currentDigitVal--;
      else if (currentDigitVal < goalDigitVal) currentDigitVal++;

      currentValArr[i] = currentDigitVal.toString();

      // Reverse the array back to normal (no longer need goalValArr)
      currentValArr.reverse();

      // Make it back into a number
      // Dividing by 100 to add the decimal back
      let newTempVal = parseInt(currentValArr.join(''), 10) / 100;
      newTempVal = Number(newTempVal.toFixed(2));
      return newTempVal;
    }
  }
  // If there's some kind of error, just return the goal
  return goalValue;
}

/**
 * Returns the next valid election cycle, particularly for presidential races
 * @param {String, Number} year - The year to scrub / correct
 * @param {String} office - The office of that cycle
 * @returns {Number} - Either `office` or the next valid election year
 */
function scrubElectionYear(year, office) {
  let toReturn = year;
  if (office.toLowerCase() == 'p') {
    toReturn = parseInt(toReturn);
    // If election year isn't cleanly divisble by four,
    // we need to increment it by the difference between its modulus and four
    if (toReturn % 4) toReturn += 4 - (toReturn % 4);
  }
  return toReturn;
}

/**
 *
 * @param {HTMLObjectElement} callingInstance -
 * @param {Elem} domAnchor -
 * @param {String} elementType -
 */
function buildElement(callingInstance, scriptElement, domAnchor) {
  let toReturn = document.createElement('aside');
  toReturn.setAttribute(
    'id',
    'gov_fec_at_' + Math.floor(Math.random() * 10000)
  ); // Random so we can have multiple on a page, if needed

  let theme = scriptElement.dataset.theme;
  // Set its class
  toReturn.setAttribute('class', 'aggr-totals theme-' + theme);

  // Let's build its html
  let theInnerHTML = ``;
  if (callingInstance.officeControl == 'internal') {
    theInnerHTML += `<div class="controls-wrapper">`;

    // If we're supposed to have an office control,
    if (callingInstance.officeControl == 'internal') {
      // If we don't have a YEAR control or it's specifically set to 'none'
      if (callingInstance.yearControl == 'none') {
        // Let's only build the tabbed content, not the pull-down
        let theRadiosString = '';
        for (var def in officeDefs) {
          theRadiosString +=
            '<button value="' +
            def +
            '" class="election-radios js-election-radios">' +
            officeDefs[def] +
            '</button>';
        }
        theInnerHTML += `<fieldset class="pills">${theRadiosString}</fieldset>`;
      } else {
        // Otherwise, build the <select>
        let theOptionsString = '';
        for (def in officeDefs) {
          theOptionsString +=
            '<option value="' + def + '">' + officeDefs[def] + '</option>';
        }
        theInnerHTML += `<fieldset class="select">
            <label for="top-category" class="breakdown__title label t-inline-block">How much has been raised by:</label>
            <select id="top-category" name="top_category" class="js-select-office form-element--inline" aria-controls="top-table">
              ${theOptionsString}
            </select>
          </fieldset>`;
      }
    }
    // If we have an election year and a list of possible years
    // TODO - make this a different test

    if (callingInstance.yearControl == 'internal') {
      theInnerHTML += `<fieldset class="select">
          <label for="election-year" class="breakdown__title label t-inline-block">Running in: </label>
          <select id="election-year" name="cycle" class="js-select-year form-element--inline" aria-controls="top-table">
            ${electionYearsList().map(item => {
              return (
                '<option value="' +
                item +
                '"' +
                (item == callingInstance.baseQuery.election_year
                  ? ' selected'
                  : '') +
                '>' +
                item +
                '</option>'
              );
            })}
          </select>
        </fieldset>`;
    }
    theInnerHTML += `</div>`;
  }
  theInnerHTML += `
      <div class="total-wrapper">
        <h1 class="value js-value-large"></h1>
        <h2 class="description js-value-large-desc"></h2>
      </div>`;
  theInnerHTML += `
      <div class="parties-wrapper">
        <div class="simple-table--responsive" role="grid">
          <div class="simple-table__row" role="row">
            <div role="cell" class="simple-table__cell">Republican</div>
            <div role="cell" class="simple-table__cell t-mono-stacked-currency">$64,701,975</div>
            <div role="cell" class="simple-table__cell">
              <meter min="0" max="64701975.35" value="64701975.35" title="US Dollars" data-party="REP"></meter>
              <!-- <div class="bar-container">
                <div class="value-bar" data-value="64701975.35" data-party="REP" style="width: 100%;"></div>
              </div> //-->
            </div>
          </div>
          <div class="simple-table__row" role="row">
            <div role="cell" class="simple-table__cell">Democrat</div>
            <div role="cell" class="simple-table__cell t-mono-stacked-currency">$51,111,111</div>
            <div role="cell" class="simple-table__cell">
              <meter min="0" max="64701975.35" value="51111111" title="US Dollars" data-party="DEM"></meter>
              <!-- <div class="bar-container">
                <div class="value-bar" data-value="64701975.35" data-party="DEM" style="width: 90%;"></div>
              </div> //-->
            </div>
          </div>
          <div class="simple-table__row" role="row">
            <div role="cell" class="simple-table__cell">Other</div>
            <div role="cell" class="simple-table__cell t-mono-stacked-currency">$12,000,000</div>
            <div role="cell" class="simple-table__cell">
              <meter min="0" max="64701975.35" value="12000000" title="US Dollars"  data-party="O"></meter>
              <!-- <div class="bar-container">
                <div class="value-bar" data-value="64701975.35" data-party="O" style="width: 20%;"></div>
              </div> //-->
            </div>
          </div>
        </div>
      </div>`;
  let theNow = new Date(); // TODO - Make the timestamp update
  let theDateString = theNow.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  });
  theInnerHTML += `
      <footer>
        <div class="timestamp">Updated as of <time datetime="${theNow}">${theDateString}</time></div>
        <a class="gov-fec-seal" href="https://www.fec.gov" target="_blank">
          <img class="theme-light" src="/static/img/seal.svg" alt="Seal of the Federal Election Commission | United States of America">
          <img class="theme-dark" src="/static/img/seal--inverse.svg" alt="Seal of the Federal Election Commission | United States of America">
        </a>
      </footer>
    `;
  toReturn.innerHTML = theInnerHTML;

  // It's not visible yet, but let's make sure it doesn't show up until we have something to show
  // $(toReturn).slideUp(0);

  // Add the stylesheet to the document <head>
  let head = document.head;
  let linkElement = document.createElement('link');
  linkElement.type = 'text/css';
  linkElement.rel = 'stylesheet';
  linkElement.href = stylesheetPath;
  head.appendChild(linkElement);

  // If the in-page placeholder and <script> are the same,
  if (scriptElement == domAnchor) {
    // Put it in the page right before this <script>
    domAnchor.parentElement.insertBefore(toReturn, domAnchor);
  } else {
    // Otherwise, replace the anchor element
    domAnchor.replaceWith(toReturn);
  }

  // Create the value element
  // this.valueField = document.createElement('h1');
  // this.valueField.setAttribute('class', 'value');
  // Create the description element
  // this.descriptionField = document.createElement('h2');
  // this.descriptionField.setAttribute('class', 'description');
  // Put the value and description in the <aside>
  // this.element.appendChild(this.valueField);
  // this.element.appendChild(this.descriptionField);

  // If the script element is the anchor element, we'll put the new element right before the <script>.

  return toReturn; // TODO
}

new AggregateTotalsBox();
