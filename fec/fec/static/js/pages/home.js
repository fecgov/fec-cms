'use strict';

var homepageEvents = require('../modules/home-events');

// accessible tabs for alt sidebar
require('../vendor/tablist').init();

// Home Page: Events and deadlines
new homepageEvents.HomepageEvents();

//remove competing/confusing querystrings on homepage
function cleanURI() {
  const uri = window.location.toString();
  if (uri.indexOf('?') > 0) {
    window.history.replaceState(
      {},
      document.title,
      window.location.href.split('?')[0]
    );
  }
}

cleanURI();

let inputs = document.querySelectorAll('#main input, #main select');
inputs.forEach(element => {
  element.addEventListener('change', cleanURI);
});

//handle Chrome inconsistency with History API
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
