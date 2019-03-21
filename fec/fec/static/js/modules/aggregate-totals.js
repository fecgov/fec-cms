'use strict';

const $ = require('jquery');
const helpers = require('./helpers');

function AggregateTotals() {
  this.scriptElement;
  this.election_year;
  this.office;
  this.value;
  this.valueField;
  this.descriptionField;
  this.value;

  this.init();
}
AggregateTotals.prototype.buildElement = function(
  passedTotal,
  passedOffice,
  passedYear
) {
  this.value = passedTotal;
  this.office = passedOffice; // (just in case it's changed)
  this.year = passedYear;

  this.stepCount = Math.ceil(Math.random() * 5) + 1;
  this.stepAmount = Math.random() * 10;
  this.startingValue = this.value - this.stepAmount * this.stepCount;

  for (
    this.stepCurrent = 0;
    this.stepCurrent <= this.stepCount;
    this.stepCurrent++
  ) {
    this.tempVal = this.startingValue + this.stepCurrent * this.stepAmount;
    this.delay = this.stepCurrent * 500;
    this.instance = this;
    setTimeout(function() {
      this.valString =
        '$' + this.tempVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
      this.instance.valueField.innerHTML = this.valString;
    }, this.delay);
  }

  this.descriptionField.innerHTML =
    'Total raised by all ' +
    this.office +
    ' candidates running in ' +
    this.year;
};

AggregateTotals.prototype.init = function() {
  this.scriptElement = document.currentScript; // the <script> on the page
  var dataObjStr = String(this.scriptElement.dataset.obj); // grab the data-obj param
  dataObjStr = dataObjStr.replace(/'/g, '"'); // convert the single quotes to double to be JSON-friendlier
  this.dataObj = JSON.parse('[' + dataObjStr + ']'); // and make it into a usable object

  this.valueField = document.querySelector(
    String(this.dataObj.target) + ' .value'
  );
  this.descriptionField = document.querySelector(
    String(this.dataObj.target) + ' .description'
  );

  this.basePath = ['candidates', 'totals', 'by_office'];

  this.baseQuery = {
    office: this.office,
    per_page: 20,
    active_candidates: false,
    sort_null_only: false,
    sort_hide_null: false,
    sort_nulls_last: false,
    page: 1,
    election_year: this.election_year
  };
  this.currentQuery = this.baseQuery;
};

AggregateTotals.prototype.loadData = function(query) {
  this.self = this;
  $.getJSON(helpers.buildUrl(this.basePath, query)).done(function(response) {
    this.theTotal = response.results[0].total_disbursement;
    this.theOffice = response.results[0].office;
    this.theYear = response.results[0].election_year;

    this.self.buildElement(this.theTotal, this.theOffice, this.theYear);
  });
};

new AggregateTotals();
