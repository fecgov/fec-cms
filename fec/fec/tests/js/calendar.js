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

    it('styles the buttons', function() {
      expect(this.calendar.$calendar.find('.button button--neutral')).to.exist;
    });

    it('uses the correct default view on desktop', function() {
      var defaultView = this.calendar.defaultView();
      expect(defaultView).to.equal('month');
    });
  });

  describe('handleRender()', function() {
    it('triggers a render event', function(){
      var eventCalled = false;
      this.calendar.$calendar.on('calendar:rendered', function(){
        eventCalled = true;
      })
      this.calendar.handleRender({name: 'month'});
      setTimeout(function() {
        expect(eventCalled).to.be.true;
      }, 1000);
    });

    it('highlights today', function() {
      this.calendar.handleRender({name: 'month'});
      expect(this.calendar.$calendar.find('.fc-today').length).to.be.above(1);
    });

    it('calls manageListToggles() on list views', function() {
      sinon.stub(this.calendar, 'manageListToggles');
      this.calendar.handleRender({name: 'monthTime'});
      expect(this.calendar.manageListToggles).to.have.been.called;
      this.calendar.manageListToggles.restore();
    });

    it('does not call manageListToggles() toggles on grid view', function() {
      sinon.stub(this.calendar, 'manageListToggles');
      this.calendar.handleRender({name: 'month'});
      expect(this.calendar.manageListToggles).to.not.have.been.called;
      this.calendar.manageListToggles.restore();
    });

    it('removes list toggles on grid view', function() {
      this.calendar.handleRender({name: 'monthTime'});
      this.calendar.handleRender({name: 'month'});
      expect($('.cal-list__toggles').length).to.equal(0);
      expect(this.calendar.$listToggles).to.not.exist;
    })
  });

  describe('manageListToggles()', function() {
    it('adds them to the dom if they do not exist', function() {
      this.calendar.manageListToggles({name: 'monthTime'});
      expect(this.calendar.$calendar.find('.cal-list__toggles')).to.exist;
    });

    it('highlights the active button', function() {
      var opts = {
        duration: 'month',
        sortBy: 'time'
      };
      this.calendar.manageListToggles({name: 'monthTime', options: opts});
      var $monthToggle = this.calendar.$calendar.find('button[data-trigger-view="monthTime"]');
      expect($monthToggle.hasClass('is-active')).to.exist;
    });

    it('highlights the quarter toggle', function() {
      this.calendar.manageListToggles({name: 'quarterTime'});
      var $quarterToggle = this.calendar.$calendar.find('.fc-quarterCategory-button');
      expect($quarterToggle.hasClass('fc-state-active')).to.be.true;
    });
  });

  describe('handleEventRender()', function() {
    it('Applies the correct attributes', function() {
      var event = {
        category: 'election',
        title: 'the big one',
        start: moment('2012-11-02')
      };
      var element = $('<a>Event</a>');
      var eventLabel = 'the big one Friday November 2, 2012. Category: election';
      this.calendar.handleEventRender(event, element);
      expect(element.attr('tabindex')).to.equal('0');
      expect(element.attr('aria-describedby')).to.equal(this.calendar.detailsId);
      expect(element.attr('aria-label')).to.equal(eventLabel);
    });
  });

  describe('handleDayRender()', function() {
    it('Adds the month name to the first of the month', function() {
      var cell = $('<td></td>');
      this.calendar.handleDayRender(moment('2016-01-01'), cell);
      expect(cell.html()).to.equal('January');
    });
  });

  describe('handleEventClick()', function() {
    it('makes a new tooltip if there is none', function(){
      // TODO
    })
  });

  describe('simulateClick()', function() {
    it('fakes a click on enter', function() {
      var target = '<span>link</span>';
      var clicked = false;
      $(target).on('click', function() {
        clicked = true;
      })
      this.calendar.simulateClick({keyCode: 13, target: target});
      setTimeout(function() {
        expect(clicked).to.be.true;
      }, 1000);
    });
  });

  describe('managePopoverControl()', function() {
    it('adds the correct attributes to the popover', function() {
      var $popover = $('<div class="fc-popover"><span class="fc-close"></span></div>');
      this.calendar.$calendar.append($popover);
      this.calendar.managePopoverControl({target: '<a></a>'});
      expect($popover.attr('role')).to.equal('tooltip');
      expect($popover.attr('id')).to.equal(this.calendar.popoverId);
      expect($popover.find('.fc-close').attr('tabindex')).to.equal('0');
      expect(document.activeElement.classList[0]).to.equal('fc-close');
    })
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
