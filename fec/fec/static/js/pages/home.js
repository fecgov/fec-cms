'use strict';

var homepageEvents = require('../modules/home-events');

// accessible tabs for alt sidebar
require('../vendor/tablist').init();

// Home Page: Events and deadlines
new homepageEvents.HomepageEvents();

// We don't want the homepage to have any query parameters
// but election-search wants to add them
function scrubURI() {
  const uri = window.location.href.toString();
  if (uri.indexOf('?') > 0) {
    window.history.replaceState(
      {},
      document.title,
      window.location.href.split('?')[0]
    );
  }
}
// Let's remove any query params after the page and all resources are loaded
window.addEventListener('load', () => {
  scrubURI();
});

// For any elements who want to add query parameters to the URL, remove 'em
let inputs = document.querySelectorAll('#main input, #main select');
inputs.forEach(element => {
  element.addEventListener('change', scrubURI);
});

//
let offices = document.querySelectorAll('.js-office');
offices.forEach(element => {
  element.value = 'S';
});

let years = document.querySelectorAll('.js-election-year');
years.forEach(element => {
  element.value = '2022';
});

let toggles = document.querySelectorAll('.js-chart-toggle[value=receipts]');
toggles.forEach(element => {
  element.checked = true;
});
