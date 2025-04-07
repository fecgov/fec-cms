import { default as Filter } from './filter-base.js';

/**
 * @TODO
 ✅ emptying both kw fields should delete the tag (disregard max gaps value)
 ☑️ tabbing out of, say, an empty kw2 should bring back the error message
 ☑️ tabbing out of two kw fields should hide error message
 ☑️ tabbing out of maxgaps should start the timer, too, instead of submitting right away
 ☑️ repeated timer calls are glitchy
 ☑️ WHY ISN'T THE NO-RESULTS GOING AWAY WHEN THERE ARE RESULTS
 ☑️ maybe related: pagination "showing __ results" isn't updating
 ☑️ make the tag work
 ☑️
 *
 */

/** @enum
 *
 */
const validation = {
  empty: 'EMPTY',
  incomplete: 'INCOMPLETE',
  valid: 'VALID'
};

/**
 * Used inside typeahead-filter.js as this.typeaheadFilter
 * @param {JQuery} selector
 * @param {Object} dataset
 * @param {boolean} allowText
 */
export default function KeywordProximityFilter(selector) {
  // console.log('KeywordProximityFilter(selector): ', selector);
  Filter.call(this, selector);

  this.$elm = $(selector);
  this.$input = this.$elm.find('input');
  // console.log('  this.$input: ', this.$input);

  this.$keyword0 = this.$elm.find('.js-keyword').first();
  this.$keyword1 = this.$elm.find('.js-keyword').last();
  this.$maxGaps = this.$elm.find('.js-max-gaps');
  this.$keyword0.data('loaded-once', false);
  this.$keyword1.data('loaded-once', false);
  this.$maxGaps.data('loaded-once', false);

  this.buttonDecr = document.querySelector('.button--decrement');
  this.buttonIncr = document.querySelector('.button--increment');
  this.timer_decInc;
  this.validationState = validation.empty;

  this.$keyword0.on('change', this.handleInputChange.bind(this));
  this.$keyword1.on('change', this.handleInputChange.bind(this));
  this.$maxGaps.on('change', this.handleInputChange.bind(this));

  this.$keyword0.on('input', this.handleInputInput.bind(this));
  this.$keyword1.on('input', this.handleInputInput.bind(this));

  this.fields = ['q_proximity', 'max_gaps']; // This filter's API fields

  // this.$maxGaps.on('focus', this.handleFieldFocus.bind(this));
  // this.$keyword0.on('focus', this.handleFieldFocus.bind(this));
  // this.$keyword1.on('focus', this.handleFieldFocus.bind(this));

  $(document.body).on('filter:modify', this.handleModifyEvent.bind(this));
  $(document.body).on('tag:removeAll', this.handleRemoveAll.bind(this));

  this.buttonDecr.addEventListener('click', this.handleIncDecClick.bind(this));
  this.buttonIncr.addEventListener('click', this.handleIncDecClick.bind(this));
}

KeywordProximityFilter.prototype = Object.create(Filter.prototype);
KeywordProximityFilter.constructor = KeywordProximityFilter;

/**
 * Called every time someone types in the <input>s
 * @param {jQuery.Event} e
 */
KeywordProximityFilter.prototype.handleInputInput = function(e) {
  // console.log('KeywordProximityFilter.handleInputInput(e): ', e);

  // if (e.target == this.$maxGaps) {
    // console.log('  do nothing');
  // } else {
  this.cancelMaxGapsDelay();
  this.toggleErrorMessage();
  // }
  // if (this.$keyword0.val() && this.$keyword1.val()) {
  //   console.log('  yay - two keywords');
  // } else if (this.$keyword0.val() == '' && this.$keyword1.val() == '') {
  //   console.log('  no keywords');
  //   status = 'empty';

  // } else {
  //   console.log('  one keyword');
  //   status = 'incomplete';
  // }
};

/**
 *
 */
KeywordProximityFilter.prototype.cancelMaxGapsDelay = function() {
  if (this.timer_decInc) {
    clearTimeout(this.timer_decInc);
    delete this.timer_decInc;
  }
};

/**
 *
 */
KeywordProximityFilter.prototype.waitForMaxGapsChanges = function() {
  // console.log('KeywordProximityFilter.waitForMaxGapsChanges()');
  this.cancelMaxGapsDelay();
  this.timer_decInc = setTimeout(this.handleInputChange.bind(this), 2000, true);
};

/**
 *
 * @param {jQuery.Event} e
 * @param {boolean} isDelayed
 */
KeywordProximityFilter.prototype.handleInputChange = function(e, isDelayed = false) {
  // console.log('KeywordProximityFilter.handleInputChange(e): ', e);

  // If the changed element is a number field (max gaps) and we haven't already delayed it, do that now
  if ($(e.target).data('loaded-once') == true && e.target.type == 'number' && !isDelayed) {
    // console.log('  !isDelayed');
    // console.log('  e.target.type == number');
    e.stopImmediatePropagation();
    this.waitForMaxGapsChanges();
    return;
  }
  const prevValidationState = this.validationState == validation.valid;
  const newValidationState = this.validateValues();
  const tagCurrentlyExists = document.querySelector('.tags [data-tag-category="keyword-proximity"]');

  // console.log('  prevValidationState, newValidationState: ', prevValidationState, ' => ', newValidationState);

  let eventName;

  if (!prevValidationState && !newValidationState) {
    // console.log('  if');
    // If it wasn't valid and still isn't valid, don't do anything,
    // i.e. keep the error message and block the <input> change event
    // e.stopImmediatePropagation();
    eventName = 'filter:removed';

  } else {
    // console.log('  if');

    if (!newValidationState) eventName = 'filter:removed';
    else if (newValidationState && tagCurrentlyExists) eventName = 'filter:renamed';
    else if (newValidationState) eventName = 'filter:added';

    // console.log('    eventName: ', eventName);

    const $input = $(e.target); //
    // const value = $input.val();
    const allInputsLoadedOnce = (
      this.$keyword0.data('loaded-once') == true
      && this.$keyword1.data('loaded-once') == true
      && this.$maxGaps.data('loaded-once') == true
    );
    let nonremovable = false;

    // console.log('  MAXGAPS.VAL(): ', this.$maxGaps.val());
    // console.log('  allInputsLoadedOnce: ', allInputsLoadedOnce);
    if (eventName) {
      // console.log('  if (allInputsLoadedOnce)');
      this.$keyword0.trigger(eventName, [
        {
          key: 'keyword-proximity',
          tagElements: [
            { label: 'Proximity keywords' },
            { value: this.$keyword0.val() },
            { label: 'and' },
            { value: this.$keyword1.val() },
            { label: 'with max proximity' },
            { value: parseInt(this.$maxGaps.val()) }
          ],
          loadedOnce: allInputsLoadedOnce,
          name: 'keyword-proximity',
          nonremovable: nonremovable,
          removeOnSwitch: true
        }
      ]);
    } else {
      // console.log('  ELSE (allInputsLoadedOnce)');
    }

  }

  $(e.target).data('loaded-once', true);
};

/**
 *
 * @param {PointerEvent} e
 */
KeywordProximityFilter.prototype.handleIncDecClick = function(e) {
  // console.log('KeywordProximityFilter.handleIncDecClick(e): ', e);
  e.preventDefault();
  const datasetStepDirElm = e.target.dataset.stepDir ? e.target : e.target.closest('[data-step-dir]');
  // console.log('datasetStepDirElm: ', datasetStepDirElm);
  const stepDir = datasetStepDirElm ? datasetStepDirElm.dataset.stepDir : null;
  // console.log('this.$maxGaps.val(): ', this.$maxGaps.val());

  // If the gaps field doesn't have a value, set it to 1
  if (!this.$maxGaps.val()) this.$maxGaps.val(1);

  const currentGapValue = parseInt(this.$maxGaps.val());
  let nextGapVal;

  if (stepDir == 'increment')
    nextGapVal = Math.min(currentGapValue + 1, parseInt(this.$maxGaps.attr('max')));
  else if (stepDir == 'decrement')
    nextGapVal = Math.max(1, currentGapValue - 1);
  else
    return; // If it's not increment or decrement, stop here
  this.$maxGaps.val(nextGapVal);

  if (this.validateValues()) this.waitForMaxGapsChanges();
};

/**
 *
 * @param {*} e
 * @param {*} opts
 */
KeywordProximityFilter.prototype.handleModifyEvent = function(e, opts) {
  // console.log('handleModifyEvent(e, opts): ', e, opts);
  // var today = new Date();
  // // Sets min and max years based on the transactionPeriod filter
  // if (opts.filterName === this.name) {
  //   this.maxYear = parseInt(opts.filterValue);
  //   this.minYear = this.maxYear - 1;
  //   this.$minDate.val('01/01/' + this.minYear.toString()).change(); // TODO: jQuery deprecation
  //   if (this.maxYear === today.getFullYear()) {
  //     today = moment(today).format('MM/DD/YYYY');
  //     this.$maxDate.val(today).change(); // TODO: jQuery deprecation
  //   } else {
  //     this.$maxDate.val('12/31/' + this.maxYear.toString()).change(); // TODO: jQuery deprecation
  //   }
  //   this.validate();
  // }
};

/**
 *
 * @param {*} e
 * @param {*} opts
 */
KeywordProximityFilter.prototype.handleRemoveAll = function(e, opts) {
  // console.log('handleRemoveAll(e, opts): ', e, opts);
  // If this is a forceRemove event that means it was triggered by table switch
  // So we need to clear these inputs and set had-value to false so that it fires filter:added
  const forceRemove = opts.forceRemove || false;

  function remove($filter) {
    $filter.val('');
    $filter.data('had-value', false);
    // $filter.trigger('filter:removed', { loadedOnce: true });
  }

  if (forceRemove) {
    remove(this.$keyword0);
    remove(this.$keyword1);
    remove(this.$maxGaps);
    this.$keyword0.trigger('filter:removed', { loadedOnce: true });
  }
};

/**
 *
 * @param {boolean} thenSubmit - Whether the filter should submit/post/update if valid
 * @returns {boolean} Returns `true` if both keywords have a content and there's a max_gaps
 */
KeywordProximityFilter.prototype.validateValues = function() {
  // console.log('validateValues()');
  this.validationState = validation.empty;
  // incomplete: empty or not all fields have been set
  // valid: all fields have been validated
  // invalid: submission attempted but failed

  /*
    user has typed into first field and left it: incomplete
    user has entered a distance: incomplete
    user has entered a second keyword and left: incomplete
  */

  // Check if max_gaps are in-range
  const currentGaps = parseInt(Math.max(1, this.$maxGaps.val()));
  // console.log('  currentGaps: ', currentGaps);

  this.buttonDecr.classList.remove('is-active-filter');
  this.buttonIncr.classList.remove('is-active-filter');

  if (currentGaps <= 1) this.buttonDecr.classList.add('is-disabled');
  else this.buttonDecr.classList.remove('is-disabled');

  if (currentGaps >= 999) this.buttonIncr.classList.add('is-disabled');
  else this.buttonIncr.classList.remove('is-disabled');

  // Now test the keyword fields
  if (
    (!this.$keyword0.val() || this.$keyword0.val() == '') &&
    (!this.$keyword1.val() || this.$keyword1.val() == '')
  ) {
    // console.log('  no keywords');
    this.validationState = validation.empty;

  } else if (this.$keyword0.val().length > 0 && this.$keyword1.val().length > 0 && this.$maxGaps.val()) {
    // console.log('  yay - two keywords');
    this.validationState = validation.valid;

  } else {
    // console.log('  one keyword');
    this.validationState = validation.incomplete;
  }
  return this.validationState == validation.valid;
};

/**
 *
 */
KeywordProximityFilter.prototype.toggleErrorMessage = function() {
  const errorMessageHidden = this.validationState == validation.incomplete ? 'false' : 'true';
  this.$elm.find('.filter__message--error').attr('aria-hidden', errorMessageHidden);
}

/**
 * @param {Object} queryVars - Object of key-value pairs that came in through the query vars.
 *   ex: {ao_doc_category_id: 'F'}
 * @param {number} queryVars.max_gaps - An integer for the max distance between the keywords
 * @param {string|string[]} queryVars.q_proximity - String or array of strings of keywords to use in the prox. search
 */
KeywordProximityFilter.prototype.fromQuery = function(queryVars) {
  // console.log('KeywordProximityFilter.fromQuery(queryVars): ', queryVars);

  if (queryVars.q_proximity || queryVars.max_gaps) {
    this.setValue(queryVars);
  }
  return this;
};

KeywordProximityFilter.prototype.setValue = function(queryVars) {
  // console.log('KeywordProximityFilter.setValue(queryVars): ', queryVars);

  if (queryVars.q_proximity[0])
    this.$keyword0.val(queryVars.q_proximity[0]).trigger('change');

  if (queryVars.q_proximity[1])
    this.$keyword1.val(queryVars.q_proximity[1]).trigger('change');

  if (queryVars.max_gaps)
    this.$maxGaps.val(parseInt(queryVars.max_gaps)).trigger('change');
};
