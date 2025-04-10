import { default as Filter } from './filter-base.js';

/**
 * @TODO
 ✅ emptying both kw fields should delete the tag (disregard max gaps value)
 ✅ tabbing out of, say, an empty kw2 should bring back the error message
 ✅ tabbing out of two kw fields should hide error message
 ✅ tabbing out of maxgaps should start the timer, too, instead of submitting right away
 ✅ repeated timer calls are glitchy
 ✅ WHY ISN'T THE NO-RESULTS GOING AWAY WHEN THERE ARE RESULTS
 ✅ maybe related: pagination "showing __ results" isn't updating
 ✅ make the tag work
 ☑️
 */

/**
 * the various validation states, to keep things consistent and predictable
 * @enum {string}
 */
const validationStates = {
  empty: 'EMPTY',
  incomplete: 'INCOMPLETE',
  valid: 'VALID'
};

/**
 * Used inside typeahead-filter.js as this.typeaheadFilter
 * @param {JQuery} selector
 */
export default function KeywordProximityFilter(selector) {
  Filter.call(this, selector);

  this.$elm = $(selector);
  this.$input = this.$elm.find('input');

  this.$keyword0 = this.$elm.find('.js-keyword').first();
  this.$keyword1 = this.$elm.find('.js-keyword').last();
  this.$maxGaps = this.$elm.find('.js-max-gaps');
  this.$keyword0.data('loaded-once', false);
  this.$keyword1.data('loaded-once', false);
  this.$maxGaps.data('loaded-once', false);

  this.buttonDecr = document.querySelector('.button--decrement');
  this.buttonIncr = document.querySelector('.button--increment');
  this.timer_decInc;
  this.validationState = validationStates.empty;

  this.$keyword0.on('change', this.handleInputChange.bind(this));
  this.$keyword1.on('change', this.handleInputChange.bind(this));
  this.$maxGaps.on('change', this.handleNumberChange.bind(this));

  this.$keyword0.on('input', this.handleInputInput.bind(this));
  this.$keyword1.on('input', this.handleInputInput.bind(this));

  this.fields = ['q_proximity', 'max_gaps']; // This filter's API fields

  $(document.body).on('filter:modify', this.handleModifyEvent.bind(this));
  $(document.body).on('tag:removeAll', this.handleRemoveAll.bind(this));

  this.buttonDecr.addEventListener('click', this.handleIncDecClick.bind(this));
  this.buttonIncr.addEventListener('click', this.handleIncDecClick.bind(this));
}

KeywordProximityFilter.prototype = Object.create(Filter.prototype);
KeywordProximityFilter.constructor = KeywordProximityFilter;

/**
 * Called every time someone types in the <input>s,
 * used to hide the warning if there are now 0 or 2 keywords (i.e. when the user has corrected from 1).
 * Never turns on the warning, relying on blur/change to check that so it's not flickering as users change their minds.
 * @param {jQuery.Event} e
 */
KeywordProximityFilter.prototype.handleInputInput = function(e) {
  this.cancelMaxGapsDelay();

  if (this.$keyword0.val() == '' && this.$keyword1.val() == '')
    this.hideWarning();

  else if (this.$keyword0.val() && this.$keyword1.val() && this.$maxGaps.val() > 0)
    this.hideWarning();
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
  this.cancelMaxGapsDelay();
  this.timer_decInc = setTimeout(this.handleNumberChange.bind(this), 2000);
};

/**
 * The number (maxgaps) field is a little different in that it can be changed with an Enter or an ⬆︎⬇︎ keyboard button.
 *
 * We want to stop every change event so the timer can do its thing.
 * i.e. delay API calls to allow for more changes like repeated ⬆︎⬆︎⬆︎⬆︎.
 *
 * When the setTimeout calls this, e will be null, at which point, we broadcast a change event from the parent form
 * @param {jQuery.Event} [e]
 */
KeywordProximityFilter.prototype.handleNumberChange = function(e) {
  if (e && !$(e.target).data('loaded-once'))
    this.handleInputChange(e);

  else {
    if (!e) {
      this.handleInputChange({ target: this.$maxGaps.get(0) });
      if (this.validationState == validationStates.valid) {
        // Force the change event
        this.bubbleTheChangeEvent();
      }
    } else {
      e.stopPropagation();
      this.waitForMaxGapsChanges();
    }
  }
};

/**
 * This filter being a special case of three values across two API variable/field names,
 * the change events weren't always bubbling to <form>. So we're using a heavy hand to do it.
 * TODO: I'd like to alleviate the need for this special case
 */
KeywordProximityFilter.prototype.bubbleTheChangeEvent = function() {
  this.$maxGaps.get(0).closest('form').dispatchEvent(new CustomEvent('change', { bubbles: true }));
};

/**
 * The 'change' event bubbles to the <form>, which triggers the API/table refresh;
 * we want to prevent that if the fields in this filter aren't valid (we need both keywords + distance)
 *
 * The change event can come from user interaction or from a remote trigger('change'),
 * like when the filter's tag has been removed.
 * @param {(jQuery.Event|Object)} [e]
 */
KeywordProximityFilter.prototype.handleInputChange = function(e) {
  const wasValid = this.validationState == validationStates.valid;
  this.validateValues();
  const isValid = this.validationState == validationStates.valid;
  const tagCurrentlyExists = document.querySelector('.tags [data-tag-category="keyword-proximity"]');

  let eventName;

  if (!wasValid && !isValid) {
    // If it wasn't valid and still isn't valid, don't do anything,
    // i.e. keep the error message and block the <input> change event
    e.stopPropagation();
  }

  if (!isValid) eventName = 'filter:removed';
  else if (isValid && tagCurrentlyExists) eventName = 'filter:renamed';
  else if (isValid) eventName = 'filter:added';

  const allInputsLoadedOnce = (
    this.$keyword0.data('loaded-once') === true
    && this.$keyword1.data('loaded-once') === true
    && this.$maxGaps.data('loaded-once') === true
  );
  const nonremovable = false;

  if (eventName) {
    const eventTarget = e ? e.target : this.$keyword0;

    $(eventTarget).trigger(eventName, [
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
  }

  if (wasValid && !isValid && this.validationState == validationStates.incomplete) {
    this.bubbleTheChangeEvent();
  }

  if (e) $(e.target).data('loaded-once', true);
};

/**
 * Called by clicking the + and - buttons for maxGaps, then setTimeout to ask the API for new results.
 * The delay exists so we aren't calling the API every time someone clicks +/-
 * @param {PointerEvent} e
 */
KeywordProximityFilter.prototype.handleIncDecClick = function(e) {
  e.preventDefault();
  const datasetStepDirElm = e.target.dataset.stepDir ? e.target : e.target.closest('[data-step-dir]');
  const stepDir = datasetStepDirElm ? datasetStepDirElm.dataset.stepDir : null;

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

  if (this.validationState == validationStates.valid) this.waitForMaxGapsChanges();
};

/**
 *
 * @param {*} e
 * @param {*} opts
 * /
KeywordProximityFilter.prototype.handleRemoveAll = function(e, opts) {
  // If this is a forceRemove event that means it was triggered by table switch
  // So we need to clear these inputs and set had-value to false so that it fires filter:added
  const forceRemove = opts.forceRemove || false;

  function remove($filter) {
    $filter.val('');
    $filter.data('had-value', false);
    // $filter.trigger('filter:removed', { loadedOnce: true });
  }

  if (forceRemove) {
    this.$keyword0.val('');
    this.$keyword1.val('');
    this.$maxGaps.val(1);
    this.$keyword0.trigger('filter:removed', { loadedOnce: true });
  }
};
*/

/**
 * Reviews the content of the fields and sets this.validationState to ['empty'|'incomplete'|'valid']
 * @param {boolean} thenSubmit - Whether the filter should submit/post/update if valid
 * @returns {boolean} Returns `true` if both keywords have a content and there's a max_gaps
 */
KeywordProximityFilter.prototype.validateValues = function() {
  this.validationState = validationStates.empty;
  // incomplete: empty or not all fields have been set
  // valid: all fields have been validated
  // invalid: submission attempted but failed

  // Check if max_gaps are in-range
  const currentGaps = parseInt(Math.max(1, this.$maxGaps.val()));

  this.buttonDecr.classList.remove('is-active-filter');
  this.buttonIncr.classList.remove('is-active-filter');

  // activate/deactivate buttons if we're at the max values
  if (currentGaps <= 1) this.buttonDecr.classList.add('is-disabled');
  else this.buttonDecr.classList.remove('is-disabled');

  if (currentGaps >= 999) this.buttonIncr.classList.add('is-disabled');
  else this.buttonIncr.classList.remove('is-disabled');

  // Now test the keyword fields
  if (
    (!this.$keyword0.val() || this.$keyword0.val() == '') &&
    (!this.$keyword1.val() || this.$keyword1.val() == '')
  ) {
    this.validationState = validationStates.empty;

  } else if (this.$keyword0.val().length > 0 && this.$keyword1.val().length > 0 && this.$maxGaps.val() > 0) {
    this.validationState = validationStates.valid;

  } else {
    this.validationState = validationStates.incomplete;
  }

  this.toggleErrorMessage();

  return this.validationState == validationStates.valid;
};

/**
 * Shows the warning message if the fields are incomplete, hides it if the fields are valid or empty
 */
KeywordProximityFilter.prototype.toggleErrorMessage = function() {
  if (this.validationState == validationStates.incomplete) this.showWarning();
  else this.hideWarning();
};

/**
 * @param {Object} queryVars - Object of key-value pairs that came in through the query vars.
 *   ex: {ao_doc_category_id: 'F'}
 * @param {number} queryVars.max_gaps - An integer for the max distance between the keywords
 * @param {string|string[]} queryVars.q_proximity - String or array of strings of keywords to use in the prox. search
 */
KeywordProximityFilter.prototype.fromQuery = function(queryVars) {
  if (queryVars.q_proximity || queryVars.max_gaps) {
    this.setValue(queryVars);
  }
  return this;
};

/**
 * Called on initial load, then calls validateValues
 * @param {Object} queryVars
 */
KeywordProximityFilter.prototype.setValue = function(queryVars) {
  if (queryVars.q_proximity[0])
    this.$keyword0.val(queryVars.q_proximity[0]).trigger('change');

  if (queryVars.q_proximity[1])
    this.$keyword1.val(queryVars.q_proximity[1]).trigger('change');

  if (queryVars.max_gaps)
    this.$maxGaps.val(parseInt(queryVars.max_gaps)).trigger('change');

  this.validateValues();
};

/**
 * Appends the warning message to the DOM (after keyword1) if it doesn't currently exist
 */
KeywordProximityFilter.prototype.showWarning = function() {
  if (!this.showingWarning) {
    const warning = '<div class="filter__message filter__message--error">' +
      '<strong>(FPO)</strong> Keyword proximity search requires two terms and a distance</div>';
    $('[data-filter="q_proximity"]').last().after(warning);
    this.showingWarning = true;
  }
};

/**
 * Removes the warning message from the DOM
 */
KeywordProximityFilter.prototype.hideWarning = function() {
  this.$elm.find('.filter__message').remove();
  this.showingWarning = false;
};
