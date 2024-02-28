/* Accessible tab interface
/* Courtesy of http://heydonworks.com/practical_aria_examples/
-----------------------------------------------------------------------------------------
*/

import { extend as _extend, object as _object } from 'underscore';
import URI from 'urijs';
import initEvents from '../modules/events.js';
const events = initEvents();
import { pageView } from '../modules/analytics.js';

// The class for the container div

const $container = '.tab-interface';

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
  var $panel = $('#' + $target.attr('href').substring(1));
  $panel.attr('aria-hidden', null);

  var name = $target.closest('[role="tablist"]').attr('data-name');
  var value = $target.attr('data-name');

  if (push) {
    var query = _extend(
      URI.parseQuery(window.location.search),
      _object([[name, value]])
    );
    var search = URI('')
      .query(query)
      .toString();
    window.history.pushState(query, search, search || window.location.pathname);
    pageView();
  }

  events.emit('tabs.show.' + value, { $tab: $target, $panel: $panel });
}

function refreshTabs() {
  var query = URI.parseQuery(window.location.search);
  $('ul[role="tablist"]').each(function(index, tabs) {
    var $tabs = $(tabs);
    var name = $tabs.attr('data-name');
    var $target = query[name]
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
  var $panel = $elm.closest('[role="tabpanel"]');
  if ($panel.is(':visible')) {
    callback();
  } else {
    var $trigger = $('[href="#' + $panel.attr('id') + '"]');
    var event = 'tabs.show.' + $trigger.attr('data-name');
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
