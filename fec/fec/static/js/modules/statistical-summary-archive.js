'use strict';

function StatisticalSummaryArchive() {
  //Declare globals (scoped to this function)to get past linter error/tests.

  this.chooseYear = document.getElementById('year');
  this.chosenYear = this.chooseYear.value;
  this.chooseFiler = document.getElementById('filer');
  this.chosenFiler = this.chooseFiler.value;

  this.tableTitle = document.getElementsByClassName('js-table-title')[0];

  this.twoYearPeriods = [
    '1987-1988',
    '1985-1986',
    '1983-1984',
    '1981-1982',
    '1979-1980',
    '1977-1978',
    '1975-1976'
  ];
  this.presidentialArchiveYears = ['1976', '1980', '1984', '1988'];

  // window.addEventListener('popstate', () => {
  //   this.handlePopState();
  // });

  window.addEventListener('popstate', this.handleArchivePopState.bind(this));

  this.selects = document.getElementsByClassName('js-archive-select');
  Array.from(this.selects).forEach(select => {
    Array.from(select.options).forEach(option => {
      //For updating selected options based on  querystring parameters
      if (option.value == this.getUrlVars()[select.id]) {
        option.selected = 'selected';
      }
    });

    select.addEventListener('change', this.showTable.bind(this));
    select.addEventListener('change', this.handleArchivePushState.bind(this));
  });
  this.showTable();
  this.handleArchivePushState();
}

//Update state upon back or forward button click
StatisticalSummaryArchive.prototype.handleArchivePopState = function() {
  //const params = e.state;
  //this.chosenYear = params.year;
  //this.chosenFiler = params.filer;
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
StatisticalSummaryArchive.prototype.getUrlVars = function() {
  let vars = [],
    hash;
  let hashes = window.location.search
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
StatisticalSummaryArchive.prototype.handleArchivePushState = function() {
  const data = {
    year: this.chosenYear,
    filer: this.chosenFiler
  };
  var querystring = `?year=${this.chosenYear}&filer=${this.chosenFiler}`;
  window.history.pushState(data, '', querystring);
};

StatisticalSummaryArchive.prototype.zebraStripeVisible = function(table) {
  let k = 0;
  for (let j = 0, row; (row = table.tBodies[0].rows[j]); j++) {
    if (!(row.style.display === 'none')) {
      if (k % 2) {
        row.style.backgroundColor = 'rgb(255, 255, 255)';
      } else {
        row.style.backgroundColor = 'rgba(241,241,241,.5)';
      }
      k++;
    }
  }
};

StatisticalSummaryArchive.prototype.disableNonPresYears = function() {
  const yearOptions = document.getElementById('year').options;
  //var self = this;
  //const yearOptions = this.chooseYear.options;
  const presidentialArchiveYears = this.presidentialArchiveYears; //['1976', '1980', '1984', '1988'];
  Array.from(yearOptions)
    //.reverse()
    .forEach(yearOption => {
      //disable non-presidential years
      if (presidentialArchiveYears.indexOf(yearOption.value) == -1) {
        yearOption.setAttribute('disabled', 'disabled');
        //yearOption.style.display ='none';
      } else {
        //display single years for presidential
        yearOption.textContent = yearOption.value;
      }
      if (yearOption.value == this.chosenYear) {
        yearOption.selected = 'selected';
      }
      // console.log(
      //   'yearOption.selected:' + yearOption.text + yearOption.selected
      // );
    });
};

StatisticalSummaryArchive.prototype.showTable = function() {
  var self = this;
  const tables = document.getElementsByTagName('table');
  //Iterate all tables to start with display of none
  Array.from(tables).forEach(table => {
    table.style.display = 'none';
    //set 'data-summary' attr on all tables so existinng CSS can be used
    table.setAttribute('data-summary', 'archive');
  });

  // this.chooseYear = $('#year');
  // console.log('this.chooseYear in script:', this.chooseYear);
  // this.chosenYear = this.chooseYear.value;
  // this.chooseFiler = $('#filer');
  // this.chosenFiler = this.chooseFiler.value;

  //self.chooseYear = document.getElementById('year');
  self.chosenYear = self.chooseYear.value;
  //self.chooseFiler = document.getElementById('filer');
  self.chosenFiler = self.chooseFiler.value;

  //handle if presidential is chosen
  if (self.chosenFiler == 'presidential') {
    self.chosenYear =
      self.presidentialArchiveYears.indexOf(self.chosenYear) == -1
        ? parseInt(self.chosenYear) + 2
        : self.chosenYear;

    this.disableNonPresYears();
  } else {
    for (let i = 0; i < self.chooseYear.options.length; i++) {
      self.chooseYear.options[i].removeAttribute('disabled');
      //self.chooseYear.options[i].style.display = "block"
      self.chooseYear.options[i].textContent = self.twoYearPeriods[i]; //chooseYear.options[i].value-1+'-'+chooseYear.options[i].value
    }
  }

  //show table title
  //const tableTitle = document.getElementsByClassName('js-table-title')[0];
  self.tableTitle.textContent =
    //self.chooseYear.options[self.chooseYear.selectedIndex].text +
    self.chooseYear.options[self.chooseYear.selectedIndex].text +
    ' ' +
    //self.chooseFiler.options[self.chooseFiler.selectedIndex].text +
    self.chooseFiler.options[self.chooseFiler.selectedIndex].text +
    ' ' +
    'data summaries';

  //set class for liveTable based on selected params
  let chosenYearFilerClass = '._' + self.chosenYear + '.' + self.chosenFiler;
  //find all tables with 'chosenYearFilerClass' (expenditures has two for some years)
  for (let liveTable of document.querySelectorAll(chosenYearFilerClass)) {
    liveTable.style.display = 'block';
    //zebra stripe  liveTable  rows after everyting else is done
    self.zebraStripeVisible(liveTable);
  }
}; //end showTable()

module.exports = { StatisticalSummaryArchive: StatisticalSummaryArchive };

//temporarily leave these two comments here to handle Istanbul error

//temporarily leave these two comments here to handle Istanbul error
