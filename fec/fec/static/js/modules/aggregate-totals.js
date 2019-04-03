'use strict';

const $ = require('jquery');
const helpers = require('./helpers');

const doInitialNumberBuild = false;
/**
 * Handles the functionality for the aggregate totals box(es).
 * Loads, creates an <aside> with {@link init}, then makes itself visible (with {@link displayUpdatedData}) after it has some data to show.
 * @param {String} office - Required. Can be set through data-office for the <script> or collected from the target specified with data-office-control.
 * @param {String} election_year - Required. Can be set through data-election-year for the <script> or collected from the target specied with data-year-control.
 * @param {String} officeControl - Required. Set with data-office-control on <script> but not required if data-office is set.
 * @param {String} yearControl - Required. Set with data-year-control on <script> but not required if data-election-year is set.
 * @param {String} action - Required. Can be 'raised' or 'spending'? 'spent'?
 * @param {Boolean} doInitialNumberBuild - Should we animate the first value or just display it and be done? Default: false.
 */
function AggregateTotals() {
  this.scriptElement; // The <script>
  this.element; // The HTML element of this box
  this.descriptionField; // The HTML element that holds the explanation
  this.valueField; // The HTML element that holds the value
  this.action;
  this.officeControl;
  this.yearControl;

  this.basePath = ['candidates', 'totals', 'by_office'];
  this.baseQuery; // Vars for data load
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
AggregateTotals.prototype.displayUpdatedData = function(queryResponse) {
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
AggregateTotals.prototype.init = function() {
  this.scriptElement = document.currentScript; // The <script> on the page

  this.baseQuery = {
    office: '',
    per_page: 20,
    active_candidates: false,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1,
    election_year: 2020
  };

  let allSet = true;
  // If we have a control for the office value, let's work with that
  if (this.scriptElement.dataset['officeControl']) {
    this.officeControl = document.querySelector(
      String(this.scriptElement.dataset['officeControl'])
    );
    $(this.officeControl).on('change', this.handleOfficeChange.bind(this));
    this.baseQuery.office = $(this.officeControl).val();

    // alternatively, we can use a hard-coded single value, too
  } else if (this.scriptElement.dataset.office) {
    this.baseQuery.office = this.scriptElement.dataset.office;

    // without one of those, we can't do anything
  } else allSet = false;

  // If we have a control for the year value, let's work with that
  if (this.scriptElement.dataset['yearControl']) {
    this.yearControl = document.querySelector(
      String(this.scriptElement.dataset['yearControl'])
    );
    $(this.yearControl).on('change', this.handleElectionYearChange.bind(this));
    this.baseQuery.election_year = scrubElectionYear(
      $(this.yearControl).val(),
      this.baseQuery.office
    );

    // alternatively, we can use a hard-coded single value, too
  } else if (this.scriptElement.dataset['electionYear']) {
    this.baseQuery.election_year = this.scriptElement.dataset['electionYear'];

    // without one of those, we can't do anything
  } else allSet = false;

  // Should we look at receipts or disbursements?
  this.action = this.scriptElement.dataset['action'];
  if (!this.action) allSet = false;

  // If we're missing something, stop here
  if (!allSet && this.action) return;

  // Make the <aside> for the dom and give it its attributes
  this.element = document.createElement('aside');
  this.element.setAttribute(
    'id',
    'fec_at_' + Math.floor(Math.random() * 10000)
  ); // Random so we can have multiple on a page, if needed
  this.element.setAttribute('class', 'aggregate-totals-block');
  // Create the value element
  this.valueField = document.createElement('h1');
  this.valueField.setAttribute('class', 'value');
  // Create the description element
  this.descriptionField = document.createElement('h2');
  this.descriptionField.setAttribute('class', 'description');
  // Put the value and description in the <aside>
  this.element.appendChild(this.valueField);
  this.element.appendChild(this.descriptionField);
  // It's not visible yet, but let's make sure it doesn't show up until we have something to show
  $(this.element).slideUp(0);
  // Put it in the page right before this <script>
  $(this.element).insertBefore(this.scriptElement);

  // Start the initial data load
  this.loadData(this.baseQuery);
};

/**
 * Starts the data load, called by {@link init}
 * @param {Object} query - The data object for the query, {@link baseQuery}
 */
AggregateTotals.prototype.loadData = function(query) {
  let instance = this;
  $.getJSON(helpers.buildUrl(this.basePath, query)).done(response => {
    instance.displayUpdatedData(response);
  });
};

/**
 * Event handler for when the office control is changed.
 * The target is specified in <script data-office-control />
 * @param Event e - the change event
 */
AggregateTotals.prototype.handleOfficeChange = function(e) {
  e.preventDefault();
  this.baseQuery.office = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
};

/**
 * Event handler for when the election year control changes.
 * The target is specified in <script data-year-control />
 * @param {Event} e - The change event
 */
AggregateTotals.prototype.handleElectionYearChange = function(e) {
  e.preventDefault();
  this.baseQuery.election_year = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
};

/**
 * Formats the given value and puts it into the dom element.
 * @param {Element} instance - The dom element whose valueField will hold the text
 * @param {Number} passedValue - The number to format and plug into the element
 */
AggregateTotals.prototype.displayValue = function(instance, passedValue) {
  let valString =
    '$' + passedValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'); // Format for US dollars and cents
  instance.valueField.innerHTML = valString;
};

/**
 * Starts the timers to update the displayed value from one to the next (not part of the initial display)
 * Called by {@link displayUpdatedData} when the displayed value should changed.
 */
AggregateTotals.prototype.startAnimation = function() {
  let instance = this;
  // If there's an existing interval, clear it
  if (instance.animVars.interval) {
    window.clearInterval(instance.animVars.interval);
  }
  instance.animVars.interval = window.setInterval(function() {
    console.log('tick');
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

new AggregateTotals();
