'use strict';

function StatisticalSummary() {
  //Declare globals (scoped to this function)to get past linter error/tests.
  /* global history */

  window.addEventListener('popstate', this.handlePopState.bind(this));

  this.tables = document.querySelectorAll('[data-summary]');
  this.selects = document.getElementsByTagName('select');
  this.latest_segment_alert = document.getElementById(
    'js-latest-segment-alert'
  );

  //Bind showTable() to change event on any select
  Array.from(this.selects).forEach(select => {
    Array.from(select.options).forEach(option => {
      //For updating selected options based on  querystring parameters
      if (option.value == this.getUrlVars()[select.id]) {
        option.selected = 'selected';
      }
    });

    select.addEventListener('change', this.showTable.bind(this));
    select.addEventListener('change', this.handlePushState.bind(this));
  });

  this.showTable();
  this.handlePushState();
}

//Update state upon back or forward button click
StatisticalSummary.prototype.handlePopState = function(e) {
  const params = e.state;
  this.chosenYear = params.year;
  this.chosenSegment = params.segment;

  Array.from(this.selects).forEach(select => {
    Array.from(select.options).forEach(option => {
      if (option.value == this.getUrlVars()[select.id]) {
        option.selected = 'selected';
      }
    });
  });
  this.showTable();
};

//Parse paremeters out of querystring
StatisticalSummary.prototype.getUrlVars = function() {
  var vars = [],
    hash;
  var hashes = window.location.search
    .slice(window.location.search.indexOf('?') + 1)
    .split('&');
  for (var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars.push(hash[0]);
    vars[hash[0]] = hash[1];
  }
  return vars;
};

//Update history upon changes to parameters
StatisticalSummary.prototype.handlePushState = function() {
  ///PUSH STATE 2////
  const data = { year: this.chosenYear, segment: this.chosenSegment };
  //const title = '';
  var querystring = `?year=${this.chosenYear}&segment=${this.chosenSegment}`;

  history.pushState(data, '', querystring);
};

//Deternine which time-period select options are not yet available for current year and disable them.
StatisticalSummary.prototype.handleLatestAvailableOption = function() {
  let latestAvailable;
  let latestAvailableOption;
  const segmentOptions = this.chooseSegment.options;

  Array.from(segmentOptions)
    .reverse()
    .forEach(segmentOption => {
      //Disable segment options not available yet for this year
      if (segmentOption.hasAttribute('selected')) {
        latestAvailable = segmentOption.value;
        latestAvailableOption = segmentOption;
      }

      if (segmentOption.value > parseInt(latestAvailable)) {
        segmentOption.setAttribute('disabled', 'disabled');
      }

      //If user selects a this year while a segment option greater than latest-available is selected
      if (this.chosenSegment > parseInt(latestAvailable)) {
        this.latest_segment_alert.textContent =
          latestAvailableOption.text +
          ' is the latest available option for ' +
          this.chosenYear;
        this.latest_segment_alert.classList.add(
          'message--mini',
          'message',
          'message--inline',
          'message--alert',
          'message--alert'
        );
        latestAvailableOption.selected = 'selected';
        this.chosenSegment = latestAvailable;
        this.displaySegment = latestAvailableOption.text;
        history.pushState(
          '',
          '',
          `?year=${this.chosenYear}&segment=${this.chosenSegment}`
        );
      }
    });
};

//Main function that runs on page load and upon any interaction with selects
StatisticalSummary.prototype.showTable = function() {
  const end_periods = {
    '24': '12-31-',
    '21': '9-30-',
    '18': '6-30-',
    '15': '3-31-',
    '12': '12-31-',
    '6': '6-30-'
  };

  this.chooseYear = document.getElementById('year');
  this.chosenYear = this.chooseYear.value;
  this.displayYear = this.chooseYear.options[
    this.chooseYear.selectedIndex
  ].text;

  this.chooseSegment = document.getElementById('segment');
  this.chosenSegment = this.chooseSegment.value;
  this.displaySegment = this.chooseSegment.options[
    this.chooseSegment.selectedIndex
  ].text;

  this.endPeriod = end_periods[this.chosenSegment];

  //actual year is determined by wether the chosen times-period is in the first or second year of the two-year period
  this.actualYear =
    this.chosenSegment > 12 ? this.chosenYear : this.chosenYear - 1;
  this.startYear = this.chosenYear - 1;

  this.latest_segment_alert.textContent = '';
  this.latest_segment_alert.classList.remove(
    'message--mini',
    'message',
    'message--inline',
    'message--alert'
  );
  const today = new Date();
  const thisYear = today.getFullYear();

  //Fire handleLatestAvailableOption() if user selects this year's select option or a URL has this year in querysting year parameter

  //apply latestAvailableOption to both the first and second year of the latest two-year period
  if (this.chosenYear == thisYear || this.chosenYear - 1 == thisYear) {
    this.handleLatestAvailableOption();
  } else {
    for (var i = 0; i < this.chooseSegment.options.length; i++) {
      this.chooseSegment.options[i].removeAttribute('disabled');
    }
  }

  //Iterate all tables to start with display of none
  Array.from(this.tables).forEach(table => {
    table.style.display = 'none';
  });

  //Nested switch statements that first establishes the category of the current page(from the data-summary attribute of the first table),
  //...then establishes which table to show based on chosen year. Some also decide which rows to hide/show for tables re-used in more than
  //... one time-period segment.
  let liveTable;
  let tableTitle;

  //Establish the category of the current page from the data-summary attribute of the first table
  const category = document
    .getElementById('type_1')
    .getAttribute('data-summary');

  switch (category) {
    case 'congressional':
      switch (true) {
        case this.chosenYear >= 2012:
          liveTable = document.getElementById('type_1');
          break;
        case this.chosenYear <= 2010:
          liveTable = document.getElementById('type_2');
          break;
      }
      break;

    case 'presidential':
      switch (true) {
        case this.chosenYear >= 2016:
          liveTable = document.getElementById('type_1');
          break;
        case this.chosenYear <= 2012:
          liveTable = document.getElementById('type_2');
          break;
      }
      break;

    case 'party-committee':
      switch (true) {
        case this.chosenYear >= 2016:
          liveTable = document.getElementById('type_1');
          break;
        case this.chosenYear == 2014:
          if (this.chosenSegment != 6) {
            liveTable = document.getElementById('type_2');
          } else {
            liveTable = document.getElementById('type_3');
          }
          //Show all rows of type_2 for this time period
          [...liveTable.rows].map(x => (x.style.display = 'table-row'));

          break;
        case this.chosenYear == 2012:
          liveTable = document.getElementById('type_2');
          //Hide rows at these indexes for type_2 for this time period
          [4, 6, 12].map(x => (liveTable.rows[x].style.display = 'none'));
          break;
        case this.chosenYear <= 2010 && this.chosenYear >= 2004:
          liveTable = document.getElementById('type_3');
          //Hide rows at thise index for type_3 for this time period
          [5].map(x => (liveTable.rows[x].style.display = 'none'));
          break;
        case this.chosenYear <= 2002 && this.chosenYear >= 1992:
          liveTable = document.getElementById('type_3');
          //Show all rows of type_3 for this time period
          [...liveTable.rows].map(x => (x.style.display = 'table-row'));
          break;
        //default://PROBABLY JUST MOVE 1989 T0 ARCHIVE!
        case this.chosenYear == 1990:
          liveTable = document.getElementById('type_4');
          break;
      }
      break;

    case 'pac':
      switch (true) {
        case this.chosenYear >= 2012:
          liveTable = document.getElementById('type_1');
          break;
        case this.chosenYear <= 2010:
          liveTable = document.getElementById('type_2');
          break;
      }
      break;

    case 'communication-costs':
      switch (true) {
        case this.chosenYear >= 2016:
          liveTable = document.getElementById('type_1');
          break;
        case this.chosenYear == 2014:
          liveTable = document.getElementById('type_2');
          break;
        case this.chosenYear == 2012:
          liveTable = document.getElementById('type_3');
          break;
        case this.chosenYear <= 2010 && this.chosenYear >= 2004:
          liveTable = document.getElementById('type_4');
          //Show all rows of type_4 for this time period
          [...liveTable.rows].map(x => (x.style.display = 'table-row'));
          break;
        case this.chosenYear <= 2003 && this.chosenYear >= 1990:
          liveTable = document.getElementById('type_4');
          //Hide rows at these indexes for type_4 for this time period
          [4, 5].map(x => (liveTable.rows[x].style.display = 'none'));
          break;
      }
      break; //LAST BREAK FOR CATEGORY SWITCH
  } //END SWITCH STATEMENTS

  liveTable.style.display = 'block';
  tableTitle = liveTable.getElementsByClassName('tableTitle')[0];
  if (tableTitle) {
    tableTitle.textContent = `${this.displayYear} ${this.chosenSegment}-month data covering 01-01-${this.startYear} through ${this.endPeriod}${this.actualYear}`;
  }

  //Press release links
  const pressRelease = liveTable.getElementsByClassName('press-link')[0];
  let pressSegment = this.chosenSegment > 6 ? this.chosenSegment : 'six';
  const pressReleaseLink = `https://www.fec.gov/updates/?update_type=press-release&category=campaign-finance-data-summaries&search=${this.displayYear}+${pressSegment}-month`;
  const pressReleaseLinks = `https://www.fec.gov/updates/?update_type=press-release&category=campaign-finance-data-summaries&year=${this.actualYear}`;
  let pressReleaseLinkClean;

  //Ugly but necessary conditionals for the inconsistent/incomplete press-release history
  if (this.chosenYear >= 2018 || this.chosenYear == 2014) {
    pressReleaseLinkClean = decodeURI(pressReleaseLink);
  } else if (this.chosenYear == 2016) {
    pressReleaseLinkClean =
      this.chosenSegment != 18
        ? decodeURI(pressReleaseLink)
        : decodeURI(pressReleaseLinks);
  } else if (this.chosenYear == 2012) {
    pressReleaseLinkClean =
      this.chosenSegment != 12
        ? decodeURI(pressReleaseLink)
        : decodeURI(pressReleaseLinks);
  } else {
    pressReleaseLinkClean = decodeURI(pressReleaseLinks);
  }

  pressRelease.innerHTML = `<a href="${pressReleaseLinkClean}">Statistical summary press release(s)</a> &#187;`;

  //Iterate rows of liveTable and perform regex/replace on links to reflect chosen year/time-period
  const rows = liveTable.rows;
  for (const row of Array.from(rows)) {
    if (row.cells[2] && row.cells[3]) {
      const excel = row.cells[2];
      excel.classList.add('brdr');
      const pdf = row.cells[3];
      let linksArray = [excel, pdf];

      for (let docLink of linksArray) {
        const link = docLink.getElementsByTagName('a')[0];
        if (link) {
          const href = link.getAttribute('href');

          //CAN THIS REGEX BE REFINED/STRENGTHENED?
          //STRING EXAMPLE: https://transition.fec.gov/press/summaries/2020/tables/congressional/ConCand3_2020_15m.xlsx
          const newHref = href.replace(
            /(.*)(\d{4})(.*)(\d{4})(_\d{1,2}m)(.*)/,
            `$1${this.chosenYear}$3${this.actualYear}_${this.chosenSegment}m$6`
          );

          link.setAttribute('href', newHref);
        }
      }
    }
  }
  // }); //////END forEach((table)/////
}; //END showTable()

new StatisticalSummary();
