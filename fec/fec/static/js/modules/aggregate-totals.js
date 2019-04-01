'use strict';

const $ = require('jquery');
const helpers = require('./helpers');

/**
 * Handles the functionality for the aggregate totals box(es)
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
    value: 0, // This instance's current value, only used for animation
    stepCount: 0
  };

  this.init();
}
/**
 * Called by {@link loadData} to parse and display the data
 * @param Response queryResponse - The successful API reply
 */
AggregateTotals.prototype.displayUpdatedData = function(queryResponse) {
  console.log('TESTING - query response:');
  console.log(queryResponse);
  this.baseQuery.office = queryResponse.results[0].office;
  this.baseQuery.election_year = queryResponse.results[0].election_year;

  // If this is the first build
  if (this.animVars.stepCount == 0) {
    this.animVars.stepCount = Math.ceil(Math.random() * 10) + 5; // How many animation steps should we have? (random(1-11) + 5)
    this.animVars.value =
      this.action == 'raised'
        ? queryResponse.results[0].total_receipts
        : queryResponse.results[0].total_disbursements;
    this.animVars.stepAmount = Math.random() * 100 + 123.456; // How much should each step increment? (random(1-11) + 20)
    this.animVars.startingValue =
      this.animVars.value - this.animVars.stepAmount * this.animVars.stepCount; // Considering this.animVars.stepAmount, where should we start the animation?

    // Otherwise, only update the steps values
  } else {
    this.animVars.startingValue = this.animVars.value;
    this.animVars.value =
      this.action == 'raised'
        ? queryResponse.results[0].total_receipts
        : queryResponse.results[0].total_disbursements;
    this.animVars.stepAmount =
      (this.animVars.value - this.animVars.startingValue) /
      this.animVars.stepCount;
  }

  // Animating numbers can be messy and it was here
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
    let anim_delay = this.animVars.stepCurrent * 250; // How long this step should wait from the start
    let instance = this; // The calling instance
    setTimeout(function() {
      let valString =
        '$' + anim_tempVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'); // Format for US dollars and cents
      instance.valueField.innerHTML = valString; // Display this value
    }, anim_delay);
  }

  // TODO: let's lean on other sources here
  let officeDefs = {
    P: 'Presidential',
    S: 'Senate',
    H: 'House'
  };
  // Set the description
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
    this.baseQuery.election_year = $(this.yearControl).val();

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

  // Make the <aside> for the html doc and give it its attributes
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
 * @param Object query - The data object for the query, {@link baseQuery}
 */
AggregateTotals.prototype.loadData = function(query) {
  console.log('TESTING - loading data query:');
  console.log(query);
  let self = this;
  $.getJSON(helpers.buildUrl(this.basePath, query)).done(response => {
    self.displayUpdatedData(response);
  });
};

AggregateTotals.prototype.handleOfficeChange = function(e) {
  e.preventDefault();
  this.baseQuery.office = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
};

AggregateTotals.prototype.handleElectionYearChange = function(e) {
  e.preventDefault();
  this.baseQuery.election_year = e.target.value; // Save the updated value
  this.loadData(this.baseQuery); // Reload the data
};

new AggregateTotals();
