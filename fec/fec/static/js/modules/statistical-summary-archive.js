/**
 *
 */
export default function StatisticalSummaryArchive() {
  this.chooseYear = document.getElementById('year');

  this.chooseFiler = document.getElementById('filer');

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
  Array.from(this.selects).forEach(select => {
    Array.from(select.options).forEach(option => {
      if (option.value == this.getUrlVars()[select.id]) {
        option.selected = 'selected';
      }
    });
  });
  this.showTable();
};

//Parse parameters out of querystring
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
  const presidentialArchiveYears = this.presidentialArchiveYears; //['1976', '1980', '1984', '1988'];
  Array.from(yearOptions).forEach(yearOption => {
    //disable non-presidential years
    if (presidentialArchiveYears.indexOf(yearOption.value) == -1) {
      yearOption.setAttribute('disabled', 'disabled');
    } else {
      //display single years for presidential
      yearOption.textContent = yearOption.value;
    }
    if (yearOption.value == this.chosenYear) {
      yearOption.selected = 'selected';
    }
  });
};

StatisticalSummaryArchive.prototype.showTable = function() {
  const tables = document.getElementsByTagName('table');
  //Iterate all tables to start with display of none
  Array.from(tables).forEach(table => {
    table.style.display = 'none';
    //set 'data-summary' attr on all tables so existing CSS can be used
    table.setAttribute('data-summary', 'archive');
  });

  this.chosenYear = this.chooseYear.value;

  this.chosenFiler = this.chooseFiler.value;

  //handle if presidential is chosen
  if (this.chosenFiler == 'presidential') {
    this.chosenYear =
      this.presidentialArchiveYears.indexOf(this.chosenYear) == -1
        ? parseInt(this.chosenYear) + 2
        : this.chosenYear;

    this.disableNonPresYears();
  } else {
    for (let i = 0; i < this.chooseYear.options.length; i++) {
      this.chooseYear.options[i].removeAttribute('disabled');
      this.chooseYear.options[i].textContent = this.twoYearPeriods[i];
    }
  }

  //show table title
  this.tableTitle.textContent =
    this.chooseYear.options[this.chooseYear.selectedIndex].text +
    ' ' +
    this.chooseFiler.options[this.chooseFiler.selectedIndex].text +
    ' ' +
    'data summaries';

  //set class for liveTable based on selected params
  let chosenYearFilerClass = '._' + this.chosenYear + '.' + this.chosenFiler;
  //find all tables with 'chosenYearFilerClass' (expenditures has two for some years)
  for (let liveTable of document.querySelectorAll(chosenYearFilerClass)) {
    liveTable.style.display = 'block';
    //zebra stripe  liveTable  rows after everything else is done
    this.zebraStripeVisible(liveTable);
  }
}; //end showTable()
