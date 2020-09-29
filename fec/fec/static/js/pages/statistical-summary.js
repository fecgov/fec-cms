'use strict';

function StatisticalSummary() {
  //Declare globals (scoped to this function)to get past linter error/tests.
  /* global history console */

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
  console.log('params:' + params.year);
  console.log(
    'location: ' + document.location + ', state: ' + JSON.stringify(e.state)
  );
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

  console.log('2020 chosenSegment:' + this.chosenSegment);
  Array.from(segmentOptions)
    .reverse()
    .forEach(segmentOption => {
    //Disable segment options not available yet for this year
      if (segmentOption.hasAttribute('selected')) {
        latestAvailable = segmentOption.value;
        latestAvailableOption = segmentOption;
        console.log('latestAvailable:' + latestAvailable);
        console.log('latestAvailableOption:' + latestAvailableOption.selected);
      }

      if (segmentOption.value > parseInt(latestAvailable)) {
        segmentOption.setAttribute('disabled', 'disabled');
      }

      //If user selects a this year while a segment option greater than latest-available is selected
      if (this.chosenSegment > parseInt(latestAvailable)) {
        console.log('2020 later than available');
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

  //actual year is deternined by wether the chosen times-period is in the first or second year of the two-year period
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
  //const mm = today.getMonth(); //set to '6', 12' or '15' to test (January is 0!)
  const thisYear = today.getFullYear(); // set to '2019' to test

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
    //for (const row of Array.from(table.rows)) {
    //. row.style.display = 'table-row'
    //  row.style.backgroundColor = '#fff';
    //}
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
  console.log(category);

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
          liveTable = document.getElementById('type_2');
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
          {
            //wrap in extra curly braces for this because of extra logic
            liveTable = document.getElementById('type_4');

            //REMEBER THIS P.O.C IS ONLY GETTING SECOND ROW, WOULD NEED TO ITERATE ROWS OR CELLS, ASK TO MOVE 1990 TO ARCHIVE !!!!
            const linx = liveTable.rows[2].getElementsByTagName('a')[0];
            console.log('linx:' + linx);
            if (linx) {
              const hrex = linx.getAttribute('href');
              const newHrex = hrex.replace(
                /(.*)(\d{4})(\/)(\d{4})(\d{4})(\w*)(-)(\d{1,2})(.*)/,
                `$12020$32020$5$6$7${this.chosenSegment}$9`
              );

              linx.setAttribute('href', newHrex);
              console.log('newHrex:' + newHrex);
            }
          } //end - wrap in extra curly braces for this because of extra logic

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
  tableTitle.textContent = `${this.displayYear} ${this.chosenSegment}-month data covering 01-01-${this.startYear} through ${this.endPeriod}${this.actualYear}`;

  //Iterate rows of liveTable and perform regex/replace on links to reflect chosen year/time-period
  const rows = liveTable.rows;
  console.log('rows:' + rows);
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
