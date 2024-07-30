/* Accessible tab interface
/* Courtesy of http://heydonworks.com/practical_aria_examples/
-----------------------------------------------------------------------------------------
*/

import { default as _extend } from 'underscore/modules/extend.js';
import { default as _object } from 'underscore/modules/object.js';
import URI from 'urijs';
import initEvents from '../modules/events.js';
const events = initEvents();
import { pageView } from '../modules/analytics.js';

// The class for the container div

const $container = '.tab-interface';

/**
 * @param {jQuery.object} $target
 * @param {boolean} push
 */
function show($target, push) {
  // Toggle tabs
  $('[role="tab"]').attr({
    'aria-selected': null
  });
  $target.attr({
    'aria-selected': 'true'
  });
  // Toggle panels
  $($container + ' [role="tabpanel"]').attr('aria-hidden', 'true');
  const $panel = $('#' + $target.attr('href').substring(1));
  $panel.attr('aria-hidden', null);
  const name = $target.closest('[role="tablist"]').attr('data-name');
  const value = $target.attr('data-name');
  if (push) {
    const query = _extend(
      URI.parseQuery(window.location.search),
      _object([[name, value]])
    );
    const search = URI('')
      .query(query)
      .toString();
    window.history.pushState(query, search, search || window.location.pathname);
    pageView();
  }
  events.emit('tabs.show.' + value, { '$tab': $target, '$panel': $panel });
}

function refreshTabs() {
  var query = URI.parseQuery(window.location.search);
  $('ul[role="tablist"]').each(function(index, tabs) {
    const $tabs = $(tabs);
    const name = $tabs.attr('data-name');
    const $target = query[name]
      ? $tabs.find('[role="tab"][data-name="' + query[name] + '"]')
      : $tabs.find('[role="tab"]').eq(0);
    if ($target.length) {
      show($target);
    } else {
      $('[role="tabpanel"]').attr('aria-hidden', null);
    }
  });
}

export function onShow($elm, callback) {
  const $panel = $elm.closest('[role="tabpanel"]');
  if ($panel.is(':visible')) {
    callback();
  } else {
    const $trigger = $('[href="#' + $panel.attr('id') + '"]');
    const event = 'tabs.show.' + $trigger.attr('data-name');
    events.once(event, callback);
  }
}

export function init() {
  // Handle click on tab to show + focus tabpanel
  $('[role="tab"]').on('click', function(e) {
    e.preventDefault();
    show($(this), true);
  });

  $(window).on('popstate', refreshTabs);
  refreshTabs();
}
