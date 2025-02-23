// Common for all/most tests
import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
use(sinonChai);
// (end common)

import {
  calendarDownload,
  checkStartTime,
  className,
  mapCategoryDescription
} from '../../static/js/modules/calendar-helpers.js';
import moment from 'moment';
import ElectionSearch from '../../static/js/modules/election-search.js';

describe('calendarDownload', function () {
  describe('should', function () {
    let expectedUrl = `${window.API_LOCATION}/${window.API_VERSION}/test/path/`;
    expectedUrl += `?api_key=${window.CALENDAR_DOWNLOAD_PUBLIC_API_KEY}&per_page=500`;
    expectedUrl += `&param1=val+1&param+2=(val2)`;

    it('return expected results', function () {
      expect(
        calendarDownload('test/path', { param1: 'val 1', 'param 2': '(val2)' })
      ).to.equal(expectedUrl);
    });
    it('handle errors as expected', function () {
      // TODO
      // TODO
      // TODO
    });
  });
});

describe('checkStartTime', function () {
  describe('should', function () {
    it('return expected results', function () {
      expect(checkStartTime({ start_date: '2000-01-01 12:34' })).to.be.true;
      expect(checkStartTime({ start_date: '2000-01-01 01' })).to.be.true;
      expect(checkStartTime({ start_date: '2000-01-01T23:59:59Z' })).to.be.true;
      expect(checkStartTime({ start_date: '2000-01-01' })).to.be.false;
      expect(checkStartTime({ start_date: new Date() })).to.be.true;
    });
    it('handle errors as expected', function () {
      expect(checkStartTime({ start_date: '2000-01-01 99:99' })).to.be.false;
      expect(checkStartTime({ start_date: '2000-01-01 13:99' })).to.be.false;
      expect(checkStartTime({ start_date: '2000-01-01 24' })).to.be.false;
      expect(checkStartTime({ start_date: '2000-01-01 13:99' })).to.be.false;
    });
  });
});

describe('className', function () {
  describe('should', function () {
    it('return expected results', function () {
      expect(className({ start_date: '2000-01-01', end_date: '2000-01-02' })).to.equal('fc-multi-day');
      expect(className({ start_date: '2000-01-01 00:00', end_date: '2000-01-01 01:00' })).to.equal('');
    });
    it('handle errors as expected', function () {
      expect(className({})).to.be.equal('');
      expect(className({ start_date: '2000' })).to.equal('');
      expect(className({ end_date: '2000' })).to.equal('fc-multi-day');
      expect(className({ start_date: '2000', end_date: '2001' })).to.equal('');
      expect(className({ start_date: '2000-10', end_date: '2001-11' })).to.equal('fc-multi-day');
      expect(className({ start_date: '2000-01-05', end_date: '2000-01-03' })).to.equal('fc-multi-day');
    });
  });
});

// getGoogleUrl is being tested in tests/js/calendar.js
// getUrl is being tested in tests/js/calendar.js

describe('mapCategoryDescription', function () {
  describe('should', function () {
    it('return expected results', function () {
      expect(mapCategoryDescription('Election Dates')).to.be.equal('Federal elections. These include primary, general and special elections as well as caucuses and conventions.');
    });
    it('handle errors as expected', function () {
      expect(mapCategoryDescription()).to.be.undefined;
      expect(mapCategoryDescription('gibberish')).to.be.undefined;
      expect(mapCategoryDescription(false)).to.be.undefined;
    });
  });
});

// These functions are for things that used to include Moment
describe('ElectionSearch', function () {
  // From modules/election-search.js
  // let prev = moment(upcomingElections[0].election_date, 'YYYY-MM-DD');
  // let repl = new Date(upcomingElections[0].election_date)
  // moment(upcomingElections[0].election_date, 'YYYY-MM-DD');
  describe('formatGenericElectionDate', function() {
    it('replacement should go smoothly', function() {
      const result = { cycle: 2020 };
      let date = moment()
        .year(result.cycle)
        .month('November')
        .date(1);
      while (date.format('E') !== '1') {
        date = date.add(1, 'day');
      }
      let prev = date.add(1, 'day').format('MMMM Do, YYYY');
      // ^^ THAT'S OUR GOAL ^^

      let repl;

      const newElectionDate = new Date(result.cycle, 10, 1);
      // Looking at the days of the week, we want the first Tuesday of the month.
      // Problem: getDay() is local and Sunday isn't always the first day of the week, so we'll look at UTCDay
      let i = 0;
      while (newElectionDate.getUTCDay() != 2 && i < 10) {
        newElectionDate.setDate(newElectionDate.getDate() + 1);
        i++;
      }
      // repl.setFullYear(result.cycle);
      repl = newElectionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const newDate = newElectionDate.getDate();
      if (newDate == 1)
        repl = repl.replace(',', 'st,');
      else if (newDate == 2)
        repl = repl.replace(',', 'nd,');
      else if (newDate == 3)
        repl = repl.replace(',', 'rd,');
      else
        repl = repl.replace(',', 'th,');

      expect(repl).to.equal(prev);

    });
  });

  // expect(mapCategoryDescription()).to.be.undefined;
});
