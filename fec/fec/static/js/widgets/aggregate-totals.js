'use strict';

// Editable vars
const doInitialNumberBuild = false;
const stylesheetPath = '/static/css/widgets/aggregate-totals.css';
const breakPointsAndHeights = [
  { widthLTE: 600, height: 600 },
  { widthLTE: 700, height: 300 }
];

// Includes
const $ = require('jquery'); // TODO - Do we need to import it all here?
// const helpers = require('./helpers'); // TODO - Slim this down
import { buildUrl } from '../modules/helpers';
import { timingSafeEqual } from 'crypto';

// TODO: - UPDATE ALL COMMENTS AND JSDOC CONTENT

/**
 * Handles the functionality for the aggregate totals box(es).
 * Loads, creates an <aside> with {@link init}, then makes itself visible (with {@link displayUpdatedData}) after it has some data to show.
 * @param {String} office - Required. Can be set through data-office for the <script> or collected from the target specified with data-office-control.
 * @param {String} election_year - Required. Can be set through data-election-year for the <script> or collected from the target specied with data-year-control.
 * @param {String} officeControl - Required. Set with data-office-control on <script> but not required if data-office is set.
 * @param {String} yearControl - Required. Set with data-year-control on <script> but not required if data-election-year is set.
 * @param {String} action - Required. Can be 'raised' or 'spending'? 'spent'?
 * @param {Boolean} doInitialNumberBuild - Should we animate the first value or just display it and be done? Default: false.
 * @param {String} layout - // TODO full or mini
 * @param {String} theme - // TODO light or dark
 */
function AggregateTotalsBox() {
  console.log('AggregateTotalsBox()');
  this.scriptElement; // The <script>
  this.element; // The HTML element of this box
  this.descriptionField; // The HTML element that holds the explanation
  this.valueField; // The HTML element that holds the value
  this.theme; // The style theme, only used for when {@link layout} is 'full'
  this.layout; // The layout version, either full or mini. Full has its own controls included
  this.action;
  this.officeControl;
  this.yearControl;

  this.basePath = ['candidates', 'totals', 'by_office'];
  this.baseQuery = {
    office: 'P',
    per_page: 20,
    active_candidates: false,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1,
    election_year: 2020,
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
  // Get the office value from the <script>
  this.baseQuery.office = queryResponse.results[0].office;
  // Get the office value from the <script>, but scrub it
  this.baseQuery.election_year = scrubElectionYear(
    queryResponse.results[0].election_year,
    this.baseQuery.office
  );

  // If this is the first build
  if (this.animVars.stepCount == 0) {
    this.animVars.stepCount = 1;
    this.animVars.valueTotal =
      this.action == 'raised'
        ? queryResponse.results[0].total_receipts
        : queryResponse.results[0].total_disbursements;

    // Save the first value for subsequent animations
    this.animVars.valueTemp = this.animVars.valueTotal;

    // If we don't want to animate the first build,
    if (!doInitialNumberBuild) {
      this.displayValue(this, this.animVars.valueTotal);
    }

    // Otherwise, build the initial animation steps
    else {
      this.animVars.stepCount = Math.ceil(Math.random() * 10) + 8; // How many animation steps should we have? (random(1-11) + 8)

      this.animVars.stepAmount = Math.random() * 5 + 5; // How much should each step increment? (random(1-6) + 5)
      this.animVars.startingValue =
        this.animVars.valueTotal -
        this.animVars.stepAmount * this.animVars.stepCount; // Considering this.animVars.stepAmount, where should we start the animation?

      // Save the first value for subsequent animations
      this.animVars.valueTemp = this.animVars.valueTotal;

      // Animating numbers can be messy, and it was here
      // We're going to set the animation as a series of setTimeout updates
      // We're going to jump by stepAmount every anim_delay ms for stepCurrent steps
      // This will handle from $0 where we're jumping from just ~$100 back as well as on control change where we may be jumping up or down by $1B
      for (
        this.animVars.stepCurrent = 0;
        this.animVars.stepCurrent <= this.animVars.stepCount;
        this.animVars.stepCurrent++
      ) {
        let anim_tempVal =
          this.animVars.startingValue +
          this.animVars.stepCurrent * this.animVars.stepAmount; // How much this step should display
        let anim_delay = this.animVars.stepCurrent * 125; // How long this step should wait from the start
        let instance = this; // The calling instance
        setTimeout(function() {
          instance.displayValue(instance, anim_tempVal);
        }, anim_delay);
      }
    }

    // Otherwise, only update the steps values
  } else {
    this.animVars.startingValue = this.animVars.valueTotal;
    this.animVars.valueTotal =
      this.action == 'raised'
        ? queryResponse.results[0].total_receipts
        : queryResponse.results[0].total_disbursements;

    this.startAnimation();
  }

  // TODO: let's lean on other sources here
  let officeDefs = {
    P: 'Presidential',
    S: 'Senate',
    H: 'House'
  };
  // Set the description text
  this.descriptionField.innerHTML =
    'Total ' +
    this.action +
    ' by all ' +
    officeDefs[this.baseQuery.office] +
    ' candidates running in ' +
    this.baseQuery.election_year;

  // Start the opening animation
  $(this.element).slideDown();
};

/**
 * Called from the constructor, sets up its vars and starts {@link loadData}
 */
AggregateTotalsBox.prototype.init = function() {
  this.scriptElement = document.currentScript; // The <script> on the page

  let allSet = true;

  // console.log('ASIDE DATASET:');
  // console.log(window.frameElement.dataset);

  // if (window.frameElement) {
  //   console.log('There is a window.frameElement:');
  //   console.log(window.frameElement);
  // } else {
  //   console.log('There is no window.frameElement');
  // }

  // if (!this.scriptElement.dataset) console.log('There is no dataset');
  // else {
  //   console.log('There IS a dataset:');
  //   console.log(this.scriptElement.dataset);
  // }

  // if (this.scriptElement.dataset['TESTING_force_iframe']) console.log('WILL force an iframe');
  // else console.log('will NOT force an iframe');

  // if (this.scriptElement.dataset['isolated']) console.log(this.scriptElement.dataset['isolated']);
  // else console.log('no data-isolated');

  // TODO - comment
  // If we're coming from an <iframe>, we need to inherit the dataset from window
  if (window.frameElement && window.frameElement.dataset) {
    for (var item in window.frameElement.dataset) {
      if (!this.scriptElement.dataset[item] && item.indexOf('testing') < 0) // TODO - remove the testing bit
        this.scriptElement.dataset[item] = window.frameElement.dataset[item];
    }
  }

  // Should we look at receipts or disbursements?
  this.action = this.scriptElement.dataset['action'];
  if (!this.action) allSet = false;

  // If we're missing something, stop here
  if (!allSet && this.action) return;

  // Build the actual element (the <aside>)
  let instance = this;
  this.element = buildElement(
    instance,
    this.scriptElement,
    this.scriptElement,
    'aside'
  );

  // Find the large value and save it
  this.valueField = this.element.querySelectorAll('.js-value-large');
  // And find its description
  this.descriptionField = this.element.querySelectorAll('.js-value-large-desc');

  // Find the officeControl and listen to it
  this.officeControl = this.element.querySelector('.js-select-office');
  if (this.officeControl) {
    this.officeControl.addEventListener(
      'change',
      this.handleOfficeChange.bind(this)
    );
  }

  // Find the yearControl and give it its listener
  this.yearControl = this.element.querySelector('.js-select-year');
  if (this.yearControl) {
    this.yearControl.addEventListener(
      'change',
      this.handleElectionYearChange.bind(this)
    );
  }

  // Start the initial data load
  this.loadData(this.baseQuery);
};

/**
 * Starts the data load, called by {@link init}
 * @param {Object} query - The data object for the query, {@link baseQuery}
 */
AggregateTotalsBox.prototype.loadData = function(query) {
  let instance = this;
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
  console.log('handleOfficeChange!');
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
  console.log('handleYearChange!');
  e.preventDefault();
  this.baseQuery.election_year = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
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
 * AggregateTotalsFrame constructor
 * @param {Element} callingScriptElement
 */
function AggregateTotalsFrame() {
  this.scriptElement; // The <script>
  this.element; // The HTML element of this boxbreakPointsAndHeights

  this.init();
}

/**
 * TODO
 */
AggregateTotalsFrame.prototype.init = function() {
  this.scriptElement = document.currentScript; // The <script> on the page

  // Add iframe to page
  // TODO - target an element?
  let instance = this;
  this.element = buildElement(instance, this.scriptElement, this.scriptElement, 'iframe');
  // Add resize listeners (to iframe)
  this.element.contentWindow.addEventListener(
    'resize',
    this.handleResize.bind(this)
  );
};

/**
 * TODO
 */
AggregateTotalsFrame.prototype.handleResize = function(e = null) {
  if (e) e.preventDefault();
  let newWidth = this.element.offsetWidth;
  let newHeight;
  for (let i = 0; i < breakPointsAndHeights.length; i++) {
    if (newWidth <= breakPointsAndHeights[i].widthLTE) {
      newHeight = breakPointsAndHeights[i].height;
      break;
    }
  }
  this.element.setAttribute('height', newHeight);
};

/**
 *
 * @param {HTMLObjectElement} callingInstance -
 * @param {Elem} domAnchor -
 * @param {String} elementType -
 */
function buildElement(
  callingInstance,
  scriptElement,
  domAnchor,
  elementType,
  theme = 'light'
) {
  let toReturn = document.createElement(elementType);
  toReturn.setAttribute(
    'id',
    'gov_fec_at_' + Math.floor(Math.random() * 10000)
  ); // Random so we can have multiple on a page, if needed

  if (elementType == 'iframe') {
    // We're only going to build the iframe and not the content in it
    toReturn.setAttribute('class', 'gov-fec-aggr-totals');
    toReturn.setAttribute('allowtransparency', 'true');
    toReturn.setAttribute('frameborder', '0');
    // toReturn.setAttribute('scrolling', 'no'); // TODO - re-enable
    // toReturn.setAttribute('style', '0');
    // toReturn.setAttribute('title', '0');
    // console.log('scriptElement.dataset:');
    // console.log(scriptElement.dataset);
    // Since we're going from a <script> to an <iframe>, we need to convey the dataset into the new <iframe>
    if (scriptElement.dataset) {
      for (let attr in scriptElement.dataset) {
        toReturn.dataset[attr] = scriptElement.dataset[attr];
      }
    }
    toReturn.setAttribute('src', '/widgets/aggregate-totals/'); // Only if it's an <iframe> // TODO - fix this later
  } else {
    console.log('ADDING AN ASIDE');
    // If it's the the actual element
    // set its class
    toReturn.setAttribute('class', 'aggr-totals theme-' + theme);

    // Let's build its html
    let theInnerHTML = ``;
    if (callingInstance.baseQuery.office || (ELECTION_YEARS && ELECTION_YEAR)) {
      theInnerHTML += `<div class="controls-wrapper">`;
      // If we have an office,
      console.log('baseQuery.office: ' + callingInstance.baseQuery.office);
      if (callingInstance.baseQuery.office) {
        theInnerHTML += `<fieldset>
          <label for="top-category" class="breakdown__title label t-inline-block">How much has been raised by:</label>
          <select id="top-category" name="top_category" class="js-select-office form-element--inline" aria-controls="top-table">
            <option value="P"${
              callingInstance.baseQuery.office == 'P' ? ' selected' : ''
            }>Presidential candidates</option>
            <option value="S"${
              callingInstance.baseQuery.office == 'S' ? ' selected' : ''
            }>Senate candidates</option>
            <option value="H"${
              callingInstance.baseQuery.office == 'H' ? ' selected' : ''
            }>House candidates</option>
          </select>
        </fieldset>`;
      }
      // If we have an election year and a list of possible years
      if (ELECTION_YEARS && ELECTION_YEAR) {
        theInnerHTML += `<fieldset>
          <label for="election-year" class="breakdown__title label t-inline-block">Running in: </label>
          <select id="election-year" name="cycle" class="js-select-year form-element--inline" aria-controls="top-table">
            ${ELECTION_YEARS.map(item => {
              return (
                '<option value="' +
                item +
                '"' +
                (item == ELECTION_YEAR ? ' selected' : '') +
                '>' +
                item +
                '</option>'
              );
            })}
          </select>
        </fieldset>`;
      }
      theInnerHTML += `</div>`;
      console.log(':ADDED AN ASIDE');
    }
    theInnerHTML += `
      <div class="total-wrapper">
        <h1 class="value js-value-large">$132,000,000</h1>
        <h2 class="description js-value-large-desc">Total raised by all presidential candidates running in&nbsp;2020</h2>
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
  }

  // Add the stylesheet to the document <head>
  let head = document.head;
  let linkElement = document.createElement('link');
  linkElement.type = 'text/css';
  linkElement.rel = 'stylesheet';
  linkElement.href = stylesheetPath;
  head.appendChild(linkElement);

  if (scriptElement == domAnchor) {
    // Put it in the page right before this <script>
    $(toReturn).insertBefore(domAnchor);
  } else {
    // Otherwise, replace the anchor element
    $(domAnchor).replaceWith(toReturn);
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

let thisScriptElement = document.currentScript;

if (thisScriptElement.dataset['testing_force_iframe'])
  new AggregateTotalsFrame();
// TODO remove the TESTING
else new AggregateTotalsBox();











//



// AggregateTotalsBox.prototype.handleElectionYearChange = function(e) {
//   console.log('YEAR CHANGE!');
//   e.preventDefault();
//   this.election_year = e.target.value;
//   this.currentQuery = Object.assign({}, this.currentQuery, {
//     election_year: this.election_year,
//     page: 1
//   });

//   // this.loadData(this.currentQuery);
//   // this.updateCoverageDateRange();
//   // this.pushStateToURL({ election_year: this.election_year });
// };

// AggregateTotalsBox.prototype.handleOfficeChange = function(e) {
//   console.log('OFFICE CHANGE!');
//   e.preventDefault();
//   this.office = e.target.value;

//   this.currentQuery = Object.assign({}, this.currentQuery, {
//     office: this.office,
//     page: 1
//   });
//   // this.updateElectionYearOptions(this.office);
//   // this.updateCoverageDateRange();
//   // this.loadData(this.currentQuery);
//   // this.pushStateToURL({ office: this.office });
// };
