/**
 * Handles the creation and animation for the animated three-row money comparison bars
 */

import { currency } from './helpers';

/**
 * Quick lookup for converting api results to sometimes-abbreviated and punctuated versions
 */
const partyAbbrevs = {
  DEM: 'Dem.',
  REP: 'Rep.',
  Other: 'Other'
};

/**
 * The defaults for a new PartyMoneyBars, overridden by opts constructor argument
 */
const defaultSettings = {
  animateChanges: true, // TODO: this isn't being read yet
  currencyLabel: 'US Dollars', // TODO: is this needed? Maybe if we'd like to override it sometimes?
  eventId: null,
  figureClasses: '', // TODO: make this work?
  figureGroupClasses: '', // TODO: make this work?
  initValues: [
    { min: 0, max: 100, value: 50, party: 'DEM' },
    { min: 0, max: 100, value: 50, party: 'REP' },
    { min: 0, max: 100, value: 50, party: 'Other' }
  ]
};

/**
 * @class
 * @param {string} putMetersHereSelector - How to find the HTMLElement that will be used for this.
 * @param {string} [putTotalHereSelector] - Where to put the total.
 * @param {object} [opts] - Options to override defaults.
 * @property {HTMLElement} metersHolder - The HTMLElement parent where the meters should go.
 * @property {HTMLElement} totalElm - The HTMLElement whose innerText should be used to display the total $.
 * @property {object} settings - Combination of settings from opts overriding defaultSettings.
 * @returns {PartyMoneyBars} New instance of PartyMoneyBars.
 */
function PartyMoneyBars(putMetersHereSelector, putTotalHereSelector, opts = {}) {
  this.metersHolder = document.querySelector(putMetersHereSelector);
  this.totalElm = putTotalHereSelector.length > 1 ? document.querySelector(putTotalHereSelector) : null;
  this.settings = Object.assign({}, defaultSettings, opts);

  this.init();
  return this;
}

/**
 * Does all of the setup work that doesn't involve constructor arguments
 */
PartyMoneyBars.prototype.init = function() {

  // Build elements
  // Add the parties holder to this.metersHolder
  this.metersHolder.innerHTML = partiesHolderTemplate;
  // Then add three meters to the parties holder
  const partiesHolder = this.metersHolder.querySelector('.js-parties-holder');
  for (let i = 0; i < 3; i++) {
    partiesHolder.innerHTML += meterRowTemplate;
  }

  const meters = this.metersHolder.querySelectorAll('meter');

  // Let's use an ID so we can more easily update meters' labels.
  // What ID can we give these meters? Base it on the first parent with an id.
  // Use that ID and make its name a bit more custom for this class
  const metersIdBase = this.metersHolder.closest('[id]').id;
  meters.forEach((meter, i) => {
    const thisMetersId = `${metersIdBase}-party-money-meter-${i}`;
    meter.setAttribute('id', thisMetersId);
    if (this.settings.currencyLabel) meter.setAttribute('title', this.settings.currencyLabel);
    const thisMetersParent = meter.closest('.js-meter-row');
    thisMetersParent.querySelector('.js-party-title').setAttribute('for', thisMetersId);
    thisMetersParent.querySelector('.js-party-value').setAttribute('for', thisMetersId);
  });

  // Add listeners
  document.body.addEventListener('fec_data_refresh', e => {
    if (e.detail.id == this.settings.eventId) {
      this.applyNewData(e.detail.value);
    }
  });
};

/**
 * Triggered by the body#fec_data_refresh event (if the event id matches this instance's id).
 * Takes the new values, sorts them, and puts them in the right (ranked) <meter> elements
 * @param {object} newValObj - New value to represent. Expected structure is {total: 9.87, DEM: 7.65, REP: 5.43, Other: 3.21}
 * @param {number} [newValObj.total] - Grand total, if we're showing that // TODO: make sure it appears and disappears as needed
 * @param {number} newValObj.DEM - Value for Democrats
 * @param {number} newValObj.REP - Value for Republicans
 * @param {number} [newValObj.Other] - Value for Other parties // TODO: will this disappear if not included? Will it ever not be included?
 */
PartyMoneyBars.prototype.applyNewData = function(newValObj) {
  // If we're doing the total, it's at newValObj.total;
  if (this.totalElm) {
    if (newValObj.total) {
      this.totalElm.textContent = currency(newValObj.total, true);
    } else {
      // TODO Handle if we have a total element but didn't get a new value for it
    }
  }

  // Sort the party values so the highest is on top
  let rankedPartiesAndValues = [
    { party: 'DEM', value: newValObj.DEM },
    { party: 'REP', value: newValObj.REP },
    { party: 'Other', value: newValObj.Other }
  ];
  // sort them based so the largest value is [0] (descending)
  rankedPartiesAndValues.sort((a, b) => {
    if (a.value < b.value) return 1;
    else if (a.value > b.value) return -1;
    else return 0;
  });

  const meters = this.metersHolder.querySelectorAll('meter');
  meters.forEach((meter, i) => {
    meter.max = rankedPartiesAndValues[0].value;
    meter.value = rankedPartiesAndValues[i].value;
    meter.dataset.party = rankedPartiesAndValues[i].party.toUpperCase();
    // Update the meter's labels
    meter.labels.forEach(label => {
      if (label.classList.contains('js-party-title')) {
        label.textContent = partyAbbrevs[rankedPartiesAndValues[i].party];
      } else if (label.classList.contains('js-party-value')) {
        label.textContent = currency(meter.value, true);
      }
    });
  });
};

/**
 * The template for the wrapper where the individual js-meter-row elements will live
 */
const partiesHolderTemplate = `<div class="js-parties-holder" role="grid"></div>`;

/**
 * Template for the rows/meters. There will generally be three of these inside one js-parties-holder
 */
const meterRowTemplate = `
        <div class="js-meter-row" role="row">
          <label for="" role="cell" class=" js-party-title"></label>
          <label for="" role="cell" class=" js-party-value t-mono-stacked-currency">$0</label>
          <div>
            <meter id="" min="0" max="0" value="0" title="" data-party=""></meter>
          </div>
        </div>`;

module.exports = { PartyMoneyBars };
