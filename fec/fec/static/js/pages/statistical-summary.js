function StatisticalSummary() {
  //Declare globals (scoped to this function)to get past linter error/tests.
  /* global history console */

  window.addEventListener('popstate', this.handlePopState.bind(this));

  this.tables = document.querySelectorAll('[data-category]');
  //this.tables = document.getElementsByTagName('table');
  this.selects = document.getElementsByTagName('select');
  this.latest_segment_alert = document.getElementById(
    'js-latest-segment-alert'
  );

  Array.from(this.selects).forEach(select => {
    Array.from(select.options).forEach(option => {
      //THIS IS FOR UPDATING SELECTED OPTIONS UPON PASTING IN A URL WITH QUERYSTRING
      //COULD THIS JUST use  history.replaceState() ?
      //OR CAN THIS BE REMOVED, WILL PUSHSTATE HANDLE IT NOW ?
      if (option.value == this.getUrlVars()[select.id]) {
        option.selected = 'selected';
      }
    });

    select.addEventListener('change', this.showTable.bind(this));
    select.addEventListener('change', this.handlePushState.bind(this));
    //select.addEventListener('change', this.handleLatestAvailableOption.bind(this));
  });

  this.showTable();
  this.handlePushState();
}

//////POPSTATE EVENT ////////
StatisticalSummary.prototype.handlePopState = function(e) {
  //window.addEventListener('popstate', (e) => {
  //alert('popped')
  //LAST BACK BUTTON ACTION NOT WORKIN WITH THE window.location.reload() , MAYBE NEED TO CHANGE showTable() TO showTable(arguments), then can ca, it here OR FORCE A selected CHANGE here.
  const params = e.state;
  console.log('params:' + params.year);
  console.log(
    'location: ' + document.location + ', state: ' + JSON.stringify(e.state)
  );
  this.chosenYear = params.year;
  this.chosenSegment = params.segment;

  //window.location.reload()   //console.log('options[2]:'+document.getElementById("year").options[2].value)

  //setTimeout( window.location.reload() , 0);
  //this.showTable()
  //updateContent(event.state)
  //history.pushState('' ,'', `?year=${ params.year}&segment=${ params.segment}`)

  //CAN THIS BE REMOVED, WILL PUSHSTATE HANDLE IT NOW?- BUT DONT FORGET, YOU CANT COMBINE OR RUN push and pop state FUNCTION IN THE SAME FUNCTION!
  //--OR--COULD THIS JUST use  history.replaceState() ?
  Array.from(this.selects).forEach(select => {
    Array.from(select.options).forEach(option => {
      if (option.value == this.getUrlVars()[select.id]) {
        option.selected = 'selected';
      }
    });
  });
  this.showTable();
  //setTimeout( this.showTable() , 1);
};

//////END POPSTATE EVENT ////////

//////PUSHSTATE//////////

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

StatisticalSummary.prototype.handlePushState = function() {
  ///PUSH STATE 2////
  const data = { year: this.chosenYear, segment: this.chosenSegment };
  //const title = '';
  var querystring = `?year=${this.chosenYear}&segment=${this.chosenSegment}`;

  history.pushState(data, '', querystring);
};
////////END PUSHSTATE  2 ////
////////END PUSHSTATE ////

StatisticalSummary.prototype.handleLatestAvailableOption = function() {
  //segmentOption.removeAttribute("disabled");

  let latestAvailable;
  let latestAvailableOption;
  const segmentOptions = this.chooseSegment.options;

  //if (this.chosenYear == thisYear || this.chosenYear - 1 == thisYear) {
  console.log('2020 chosenSegment:' + this.chosenSegment);
  Array.from(segmentOptions).forEach(segmentOption => {
    //FOR CURRENT YEAR latestAvailable segments--MAYBE MOVE THIS CONDITONAL TO forEach(select.options) ABOVE AS A CALL TO A handleWhatever() FUNCTION ??

    if (segmentOption.hasAttribute('selected')) {
      latestAvailable = segmentOption.value;
      latestAvailableOption = segmentOption;
      console.log('latestAvailable:' + latestAvailable);
      console.log('latestAvailableOption:' + latestAvailableOption.selected);
    }

    if (segmentOption.value > parseInt(latestAvailable)) {
      segmentOption.setAttribute('disabled', 'disabled');
    }
    //FOR  'this year' - later than available. BOTH OF THE BELOW CONDITIONALS WORK, FOR later than available, WHICH IS BETTER?
    //If segment after latesAvailable is chosen, then user chooses this year
    // SHOULD THIS BE segmentOptions[this.segmentOptions.selectedIndex] ? CHANGED
    if (
      segmentOptions[this.chooseSegment.selectedIndex].hasAttribute('disabled')
    ) {
      //latestAvailableOption.selected = 'selected'
      console.log('FIRST 2020 later than available');
    }
    //If segment after latesAvailable is chosen, then user chooses this year
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
    //END FOR 'this year' - later than availableX
  });

  //}
};

//SHOWTABLE SHOULD RUN WITH ARGUMENTS. BEKLOW VAR ASSIGNMENTS SHOULD BE MOVED OUT OF showTable() TO MAIN FUNCTION (??)
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

  this.presidential_segment_template = `
  <option value="24">24 Month - through 12/31/${this.chosenYear}</option>
  <option value="21">21 Month - through 9/30/${this.chosenYear}</option>
  <option value="18">18 Month - through 6/30/${this.chosenYear}</option>
  <option selected value="15">15 Month - through 3/31/${this.chosenYear}</option>
  <option value="12">12 Month - through 12/31/${this.actualYear}</option>
  <option value="6">6 Month - Through 6/30/${this.actualYear}</option>`;

  //const mm = today.getMonth(); //set to '6', 12' or '15' to test (January is 0!)
  const thisYear = today.getFullYear(); // set to '2019' to test
  if (this.chosenYear == thisYear || this.chosenYear - 1 == thisYear) {
    this.handleLatestAvailableOption();
  } else {
    for (var i = 0; i < this.chooseSegment.options.length; i++) {
      this.chooseSegment.options[i].removeAttribute('disabled');
    }
  }

  ///PUSH STATE 2////
  // const data = {'year': this.chosenYear, 'segment': this.chosenSegment }
  // const title = ''
  // var querystring = `?year=${this.chosenYear}&segment=${this.chosenSegment}`

  // history.pushState(data ,'', querystring)
  ////////END PUSHSTATE  2 ////

  Array.from(this.tables).forEach(table => {
    for (const row of Array.from(table.rows)) {
      //row.style.display = 'table-row'
      row.style.backgroundColor = '#fff';
    }
    //////SWITCH/////

    let liveTable;
    let tableTitle;
    //const tableId = table.id;
    table.style.display = 'none';

    const category = document
      .getElementById('type_1')
      .getAttribute('data-category');
    console.log(category);
    //MOVE THIS ABOVE rows loop
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
        //this.chooseSegment.innerHTML = this.presidential_segment_template
        switch (true) {
          case this.chosenYear >= 2018:
            liveTable = document.getElementById('type_1');
            //this.chooseSegment.innerHTML = presidential_new_segment_template
            break;
          case this.chosenYear <= 2016:
            liveTable = document.getElementById('type_2');
            //this.chooseSegment.innerHTML = presidential_segment_template
            break;
        }
        break;
      case 'party-committee':
        switch (true) {
          case this.chosenYear >= 2016:
            liveTable = document.getElementById('type_1');
            //table.rows[9].style.display  = 'none'

            break;
          case this.chosenYear == 2014:
            liveTable = document.getElementById('type_2');

            break;
          case this.chosenYear == 2012:
            liveTable = document.getElementById('type_2');
            liveTable.rows[4].style.backgroundColor = '#f90';
            liveTable.rows[6].style.backgroundColor = '#f90';
            liveTable.rows[12].style.backgroundColor = '#f90';

            break;

          case this.chosenYear <= 2010 && this.chosenYear >= 2004:
            liveTable = document.getElementById('type_3');
            liveTable.rows[5].style.backgroundColor = '#f90';

            break;
          case this.chosenYear <= 2002 && this.chosenYear >= 1992:
            liveTable = document.getElementById('type_3');

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
            break;
          case this.chosenYear <= 2003 && this.chosenYear >= 1990:
            liveTable = document.getElementById('type_4');
            liveTable.rows[4].style.backgroundColor = '#f90';
            liveTable.rows[5].style.backgroundColor = '#f90';
            break;
        }

        break; //LAST BREAK FOR CATEGORY SWITCH
    } //END SWITCH FOR CATEGORY
    //////END SWITCH/////
    liveTable.style.display = 'block';
    tableTitle = liveTable.getElementsByClassName('tableTitle')[0];
    tableTitle.textContent = `${this.displayYear} ${this.chosenSegment}-month data covering 01-01-${this.startYear} through ${this.endPeriod}${this.actualYear}`;

    const rows = liveTable.rows;
    console.log('rows:' + rows);
    for (const row of Array.from(rows)) {
      if (row.cells[2] && row.cells[3]) {
        const excel = row.cells[2];
        excel.classList.add('brdr');
        const pdf = row.cells[3];
        let linksArray = [excel, pdf];
        //console.log("linksArray[1]:"+ linksArray[1])
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
  }); //////END forEach((table)/////
}; //END showTable()

new StatisticalSummary();
