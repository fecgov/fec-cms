/**
 * Filter tags (TagList) are the Chiclet-type tags above filtered tables
 */
/* global $ */
// let $ = require('jquery');

const template_body = value => `
<div>
  <div class="row">
    <h3 class="tags__title">Viewing 
      <span class="js-count" aria-hidden="true"></span>
      <span class="js-result-type">filtered ${value.resultType} for:</span>
    </h3>
    <button type="button" class="${value.clearResetFiltersClass} button--unstyled tags__clear" aria-hidden="true">${value.clearResetFiltersLabel}</button>
  </div>
  <ul class="tags">
  </ul>
</div>`;

const template_tag = value => `<div data-id="${value.key}" data-removable="true" class="tag__item">${value.value}
  <button class="button js-close tag__remove"><span class="u-visually-hidden">Remove</span></button>
</div>`;

const template_nonremoveableTag = value => `<div data-id="${value.key}" data-removable="false" data-remove-on-switch="${value.removeOnSwitch}" class="tag__item">
    ${value.value}
</div>`;

/**
 * TagLists are created by modules/tables.js and calendar-page.js
 * @class
 *
 * @param {object} opts
 * @param {string} opts.resultType
 * @param {boolean} opts.showResultCount
 * @param {string} opts.tableTitle
 *
 * @listens body.filter:added
 * @listens body.filter:removed
 * @listens body.filter:renamed
 * @listens body.filter:disabled
 * @listens body.filter:enabled
 * @listens body.tag:removeAll
 * @listens click
 */
function TagList(opts) {
  this.opts = opts;

  // Resetting filters will re-apply two-year limitations, like when users first land on the page.
  // Right now we're only applying the two-year filters for Receipts and Individual Contributions
  // Otherwise, we'll leave the functionality as 'Clear all filters'
  var shouldResetFilters =
    this.opts &&
    (this.opts.tableTitle == 'Receipts' ||
      this.opts.tableTitle == 'Individual contributions');

  this.$body = $(
    template_body({
      resultType: this.opts.resultType,
      clearResetFiltersLabel: shouldResetFilters
        ? 'Reset filters'
        : 'Clear all filters',
      clearResetFiltersClass: shouldResetFilters
        ? 'js-filter-reset'
        : 'js-filter-clear'
    })
  );

  this.$list = this.$body.find('.tags');
  this.$resultType = this.$body.find('.js-result-type');
  // We're going to use the same handler for either clear or reset functionality:
  this.$clear = this.$body.find('.js-filter-clear, .js-filter-reset');

  $(document.body)
    .on('filter:added', this.addTag.bind(this))
    .on('filter:removed', this.removeTagEvt.bind(this))
    .on('filter:renamed', this.renameTag.bind(this))
    .on('filter:disabled', this.disableTag.bind(this))
    .on('filter:enabled', this.enableTag.bind(this))
    .on('tag:removeAll', this.removeAllTags.bind(this));

  this.$list.on('click', '.js-close', this.removeTagDom.bind(this));
  this.$clear.on('click', this.removeAllTags.bind(this, {}, true));

  if (this.opts.showResultCount) {
    this.$body.find('.js-count').attr('aria-hidden', false);
  }
}

/**
 * Called when document.body hears filter:added
 * @param {jQuery.Event|CustomEvent} e
 * @param {object} passedOpts - Data for the tag. Can also come in a e.originalEvent.detail
 * @param {jQuery} passedOpts.filterLabel - 
 * @param {string} passedOpts.name - Is the name of the variable from the API
 * @param {string} passedOpts.key - Follows the format of {opts.name}-checkbox-{value}
 * @param {boolean} [passedOpts.nonremovable] - 
 * @param {string|null} [passedOpts.range] - 
 * @param {string} [passedOpts.rangeName] - 
 * @param {string} passedOpts.value - Used as the visible label for the filter tag, including html
 * @param {boolean} passedOpts.loadedOnce
 */
TagList.prototype.addTag = function(e, passedOpts) {
  var opts = passedOpts || e.detail;

  var tag = opts.nonremovable
    ? template_nonremoveableTag(opts)
    : template_tag(opts);
  var name = opts.range ? opts.rangeName : opts.name;
  var $tagCategory = this.$list.find(`[data-tag-category="${name}"]`);
  this.removeTag(opts.key, false);

  if ($tagCategory.length > 0) {
    this.addTagItem($tagCategory, tag, opts);
  } else {
    this.$list.append(`<li data-tag-category="${name}" class="tag__category">${tag}</li>`);
  }

  if (this.$list.find('.tag__item').length > 0) {
    this.$resultType.html(`filtered ${this.opts.resultType} for:`);
    this.$list.attr('aria-hidden', false);
  }

  if (!opts.nonremovable) {
    this.$clear.attr('aria-hidden', false);
  }
  if (name === 'two_year_transaction_period') {
    // anytime we add a tag, we check if we need to remove the all years tag based on the filter name
    $('li[data-tag-category="all-report-years"]').remove();
  }
};

/**
 * Called from within @see TagList.prototype.addTag
 * @param {jQuery} $tagCategory - element inside this.$list with a matching value for data-tag-category
 * @param {(boolean|string)} tag - boolean from TagList.addTag(opts.nonremoveable),
 * or string of HTML element defined by template_nonremoveableTag or template_tag
 * @param {object} opts
 * @param {('min' | 'max' | 'false')} opts.range
 * @param {string} opts.rangeName - appended to a class named of 'tag__category__range--'
 */
TagList.prototype.addTagItem = function($tagCategory, tag, opts) {
  var rangeClass = 'tag__category__range--' + opts.rangeName;
  if (opts.range == 'min') {
    $tagCategory.addClass(rangeClass).prepend(tag);
  } else if (opts.range == 'max') {
    $tagCategory.addClass(rangeClass).append(tag);
  } else {
    $tagCategory.append(tag);
  }
};

/**
 * Called from @see TagList.prototype.removeTag
 * @param {jQuery} $tag
 * @param {boolean} [emit] - Whether to broadcast tag:removed
 *
 * @emits tag:removed from $tag if emit is true
 */
TagList.prototype.removeTagElement = function($tag, emit) {
  // This handles the actual removal of the DOM elementrs
  var $tagCategory = $tag.parent();
  var key = $tag.data('id');

  if (emit) {
    $tag.trigger('tag:removed', [{ key: key }]);
  }
  $tag.remove();
  $tagCategory.removeClass(
    'tag__category__range--amount tag__category__range--date'
  );

  if ($tagCategory.is(':empty')) {
    $tagCategory.remove();
  }
};

/**
 * Called from TagList.prototype.removeAllTags
 * Called from TagList.prototype.removeTagEvt
 * Called from TagList.prototype.addTag
 * @param {string} key - Used to find [data-id="{key}"] in this.$list
 * @param {boolean} emit=false - Whether to broadcast that this tag was removed. Comes in as true from removeTagDom(), false from addTag(). Passed to removeTagElement.
 * @param {boolean} [forceRemove] - Whether to force the removal, like on table switch
 *
 * @property {jQuery} $tag - The item in the list with data-id matching the passed key
 */
TagList.prototype.removeTag = function(key, emit, forceRemove) {
  var $tag = this.$list.find('[data-id="' + key + '"]');

  if ($tag.length > 0) {
    // If the tag exists, remove the element if it's removable
    if ($tag.attr('data-removable') !== 'false') {
      this.removeTagElement($tag, emit);
    }
    // Or if it's a forceRemove event and the tag should be removed on table switch
    else if (forceRemove && $tag.attr('data-remove-on-switch') === 'true') {
      this.removeTagElement($tag, emit);
    }
  }

  // Show the clear button if all removable tags are gone
  if (this.$list.find('.tag__item[data-removable]').length === 0) {
    this.$clear.attr('aria-hidden', true);
  }

  // Update the text display
  if (this.$list.find('.tag__item').length === 0) {
    var text = this.opts.emptyText ? this.opts.emptyText : this.opts.resultType;
    this.$resultType.html(text);
    this.$list.attr('aria-hidden', true);
  }
};

/**
 * Handler for this.$clear click
 * Handler for document.body tag:removeAll
 * @param {} e
 * @param {} opts
 * @param {} opts.forceRemove
 * @param {} emit
 *
 * @emits tag:removeAll from document.body if emit && if (the clear button has the js-filter-reset class AND
 * (!opts || !opts.fromFilterSet))
 */
TagList.prototype.removeAllTags = function(e, opts, emit) {
  console.log('TagList.removeAllTags()');
  console.log('  typeof e: ', typeof e);
  console.log('  typeof opts: ', typeof opts);
  console.log('  typeof emit: ', typeof emit);
  console.log('  e: ', e);
  console.log('  opts: ', opts);
  console.log('  emit: ', emit);
  // If the element has the reset class, we revert to the original page state by re-navigating.
  // Do not trigger tag removal for filter reset on load
  if (
    $(this.$clear[0]).hasClass('js-filter-reset') &&
    (!opts || !opts.fromFilterSet)
  ) {
    // Set reset link based on page url
    var url = 'receipts/';
    if (window.location.href.indexOf('individual-contributions') !== -1) {
      url = url + 'individual-contributions/';
    }

    var resetLink =
      '/data/' +
      url +
      '?data_type=processed&two_year_transaction_period=' +
      window.DEFAULT_ELECTION_YEAR +
      '&min_date=01%2F01%2F' +
      (Number(window.DEFAULT_ELECTION_YEAR) - 1) +
      '&max_date=12%2F31%2F' +
      window.DEFAULT_ELECTION_YEAR;

    window.location.href = resetLink;
  } else {
    // Clear by removing tags for all other datatables
    var self = this;
    var forceRemove = opts.forceRemove || false;
    this.$list.find('[data-removable]').each(function() {
      self.removeTag($(this).data('id'), true, forceRemove);
    });
    // Don't emit another event unless told to do so
    // This way it can be triggered as an event listener without creating more
    if (emit) {
      $(document.body).trigger('tag:removeAll', { removeAll: false });
    }
  }
};

/**
 * The handler when document.body hears filter:removed,
 * which come from the filter's checkbox items being clicked, or when the chiclets above the table are clicked
 * @param {jQuery.Event} e - The filter:removed event
 * @param {object} passedOpts - Object of options
 * @param {jQuery} passedOpts.filterLabel - 
 * @param {string} passedOpts.name - Is the name of the variable from the API
 * @param {string} passedOpts.key - Follows the format of {opts.name}-checkbox-{value}
 * @param {string} passedOpts.value - Used as the visible label for the filter tag
 * @param {boolean} passedOpts.loadedOnce
 *
 * @calls {this.removeTag}
 */
TagList.prototype.removeTagEvt = function(e, passedOpts) {
  const opts = passedOpts || e.originalEvent.detail;

  this.removeTag(opts.key, false);
};

/**
 * Click handler for this.$list .js-close. (looks like an X on the right side of the chiclet)
 * Looks at the event's target's closest .tag__item and sends its id to removeTag()
 * @param {jQuery.Event} e - The 'click' event from this.$list .js-close
 *
 * @calls @see removeTag > @see removeTagElement > @see removeTagEvt > @see removeTag > @see removeTagElement
 * TODO: SHOULD THIS ^^ LOOP LIKE IT DOES? (The order of functions above is 1, 2, 3, 1, 2)
 */
TagList.prototype.removeTagDom = function(e) {
  var key = $(e.target)
    .closest('.tag__item')
    .data('id');
  this.removeTag(key, true);
};

/**
 * Handles document.body filter:renamed
 * @param {jQuery.Event} e
 * @param {CustomEvent} e.originalEvent - 
 * @param {object} passedOpts - Data for the tag. Can also come in a e.originalEvent.detail
 * @param {string} passedOpts.key - The tag identifier, e.g. committee_id-C00123456-checkbox
 * @param {string} passedOpts.value - The visible text from the tag
 * @param {boolean} passedOpts.nonremovable - 
 */
TagList.prototype.renameTag = function(e, passedOpts) {
  const opts = passedOpts || e.originalEvent.detail;
  var tag = opts.nonremovable
    ? template_nonremoveableTag(opts)
    : template_tag(opts);
  var $tag = this.$list.find('[data-id="' + opts.key + '"]');
  if ($tag.length) {
    $tag.replaceWith(tag);
  }
};

/**
 * Handler for document.body filter:disabled
 * @param {} e
 * @param {} opts
 * @param {} opts.key
 */
TagList.prototype.disableTag = function(e, opts) {
  console.log('TagList.disableTag(e, opts): ', e, opts);
  console.log('  typeof e: ', typeof e);
  console.log('  typeof opts: ', typeof opts);
  var $tag = this.$list.find('[data-id="' + opts.key + '"]');
  $tag.closest('.tag__category').hide();
};

/**
 * Handler for document.body filter:enabled
 * @param {} e
 * @param {} opts
 * @param {} opts.key
 */
TagList.prototype.enableTag = function(e, opts) {
  console.log('TagList.enableTag(e, opts): ', e, opts);
  console.log('  typeof e: ', e);
  console.log('  typeof opts: ', opts);

  var $tag = this.$list.find('[data-id="' + opts.key + '"]');
  $tag.closest('.tag__category').show();
};

module.exports = { TagList: TagList };
