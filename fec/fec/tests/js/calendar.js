'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');
var moment = require('moment');

require('./setup')();

var Calendar = require('../../static/js/calendar').Calendar;

describe('calendar', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  before(function() {
    this.server = sinon.fakeServer.create();
  });

  after(function() {
    this.server.restore();
  });

  beforeEach(function() {
    this.$fixture.empty().append(
      '<div id="calendar"></div>' +
      '<div id="download"></div>' +
      '<div id="subscribe"></div>'
    );
    this.calendar = new Calendar({
      selector: '#calendar',
      download: '#download',
      subscribe: '#subscribe',
      url: 'http://test.calendar',
      exportUrl: 'http://test.calendar/export',
      filterPanel: {
        setHeight: function() {},
        $form: {on: function() {}},
        filterSet: {serialize: function() {}}
      }
    });
    this.server.respond();
  });

  describe('constructor()', function() {
    it('memorizes options', function() {
      expect(this.calendar.opts.url).to.equal('http://test.calendar');
      expect(this.calendar.opts.exportUrl).to.equal('http://test.calendar/export');
    });

    it('finds dom nodes', function() {
      expect(this.calendar.$download.is($('#download'))).to.be.true;
      expect(this.calendar.$subscribe.is($('#subscribe'))).to.be.true;
    });

    it('initializes a fullCalendar', function() {
      expect(moment.isMoment(this.calendar.$calendar.fullCalendar('getDate'))).to.be.true;
    });
  });

  describe('filter()', function() {
    before(function() {
      this.response = {
        results: [
          {
            category: 'election',
            title: 'the big one',
            start_date: moment().format()
          }
        ]
      };
      this.server.respondWith(
        [200, {'Content-Type': 'application/json'}, JSON.stringify(this.response)]
      );
    });

    beforeEach(function() {
      sinon.stub(this.calendar.filterSet, 'serialize');
      this.calendar.filterSet.serialize.returns({category: ['election-P']});
    });

    afterEach(function() {
      this.calendar.filterSet.serialize.restore();
    });

    it('fetches events', function() {
      this.calendar.params = null;
      this.calendar.filter();
      this.server.respond();
      expect(this.calendar.filterSet.serialize).to.have.been.called;
      expect(this.calendar.params).to.deep.equal(this.calendar.filterSet.serialize());
      var events = this.calendar.$calendar.fullCalendar('getEvents');
      expect(events.length).to.equal(1);
    });
  });
});
