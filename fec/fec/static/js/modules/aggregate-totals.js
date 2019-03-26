'use strict';

const $ = require('jquery');
const helpers = require('./helpers');

/**
 * Handles the functionality for the aggregate totals box(es)
 */
function AggregateTotals() {
  this.scriptElement; // the <script>
  this.element; // the HTML element of this box
  this.descriptionField; // the HTML element that holds the explanation
  this.valueField; // the HTML element that holds the value

  this.basePath = ['candidates', 'totals', 'by_office'];
  this.election_year; // this instance's current election year
  this.office; // this instance's current office var
  this.queryObj; // 
  this.value; // this instance's current value

  this.init();
}
/**
 * Called by {@link loadData} to parse and display the data
 * @param Response queryResponse - the successful API reply
 */
AggregateTotals.prototype.buildElement = function(queryResponse) {
  this.value = queryResponse.results[0].total_disbursements;
  this.office = queryResponse.results[0].office; // (Again, in case it's changed)
  this.year = queryResponse.results[0].election_year;

  let stepCount = Math.ceil(Math.random() * 5) + 1; // How many animation steps should we have?
  let stepAmount = Math.random() * 10; // How much should each step increment?
  let startingValue = this.value - stepAmount * stepCount; // Considering stepAmount, where should we start the animation?

  for (let stepCurrent = 0; stepCurrent <= stepCount; stepCurrent++) {
    let tempVal = startingValue + stepCurrent * stepAmount; // How much this step should display
    let delay = stepCurrent * 750; // How long this step should wait from the start
    let instance = this; // The calling instance
    setTimeout(function() {
      let valString =
        '$' + tempVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'); // Format for US dollars and cents
      instance.valueField.innerHTML = valString; // Display this value
    }, delay);
  }

  this.descriptionField.innerHTML =
    'Total raised by all ' +
    this.office +
    ' candidates running in ' +
    this.year;

  $(this.element).slideDown();
};

/**
 * Called from the constructor, sets up its vars and starts {@link loadData}
 */
AggregateTotals.prototype.init = function() {
  this.scriptElement = document.currentScript; // The <script> on the page
  var dataObjStr = String(this.scriptElement.dataset.obj); // Grab the data-obj param
  dataObjStr = dataObjStr.replace(/'/g, '"'); // Convert the single quotes to double to be JSON-friendlier
  this.dataObj = JSON.parse('[' + dataObjStr + ']')[0]; // And make it into a usable object, but only the first element
  // this.dataObj = this.dataObj[0]; // 

  this.office = this.dataObj.office;
  this.election_year = this.dataObj.election_year;

  this.element = document.querySelector(String(this.dataObj.target));

  $(this.element).slideUp(0);

  this.valueField = document.querySelector(
    String(this.dataObj.target) + ' .value'
  );
  this.descriptionField = document.querySelector(
    String(this.dataObj.target) + ' .description'
  );

  this.queryObj = {
    office: this.office,
    per_page: 20,
    active_candidates: false,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1,
    election_year: this.election_year
  };

  this.loadData(this.queryObj);
};

/**
 * Starts the data load, called by {@link init}
 * @param Object query - The data object for the query, {@link queryObj}
 */
AggregateTotals.prototype.loadData = function(query) {
  let self = this;
  $.getJSON(helpers.buildUrl(this.basePath, query))
    .done(response => {
      self.buildElement(response);
    })
    .fail((jqxhr, textStatus, error) => {
      // FAIL SILENTY
    });
};

new AggregateTotals();
