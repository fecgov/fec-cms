// TODO
// TODO
// TODO: go through the site and update all references to this file so it works with GTM?
// TODO
// TODO
// TODO REMOVE THESE
// TODO
// TODO

import { chain as _chain, map as _map } from 'underscore';

let dataLayer = window.dataLayer;

/**
 * Create the window.dataLayer object (Array) for GTM if it doesn't already exist
 */
export function init() {
  if (!window.dataLayer) window.dataLayer = [];
  dataLayer = window.dataLayer || [];
}

/**
 * Common place to trigger analytics custom events
 * @param {Object} eventObj The data object, optionally including event, eventCategory, eventAction, eventLabel, eventValue
 * @param {string} eventObj.event The name of the event. This serves as the trigger inside Google Tag Manager
 * @param {string} eventObj.eventCategory Passed to GTM (and forwarded to Google Analytics)
 * @param {string} eventObj.eventAction Passed to GTM (and forwarded to Google Analytics)
 * @param {string} eventObj.eventLabel Passed to GTM (and forwarded to Google Analytics)
 * @param {number} eventObj.eventValue Passed to GTM (and forwarded to Google Analytics)
 */
export function customEvent(eventObj) {
  init();
  dataLayer.push({
    event: eventObj.event || 'Custom Event',
    eventCategory: eventObj.eventCategory || '',
    eventAction: eventObj.eventAction || '',
    eventLabel: eventObj.eventLabel || '',
    eventValue: eventObj.eventValue || null
  });
}

/**
 * Common place for interactive elements to trigger a pageview event (that isn't an actual page load)
 */
export const pageView = () => {
  init();
  dataLayer.push({ event: 'pageview' });
};

/**
 * As of November 2020, this is only being used inside a test
 * @param {*} query
 */
export function sortQuery(query) {
  return _chain(query)
    .pairs()
    .map(function(pair) {
      return [pair[0], Array.isArray(pair[1]) ? pair[1] : [pair[1]]];
    })
    .reduce(function(memo, pair) {
      return memo.concat(
        _map(pair[1], function(value) {
          return [pair[0], value];
        })
      );
    }, [])
    .sort()
    .map(function(pair) {
      return pair.join('=');
    })
    .join('&')
    .value();
}
