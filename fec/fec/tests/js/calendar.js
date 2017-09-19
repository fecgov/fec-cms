'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');
var moment = require('moment');

require('./setup')();

var helpers = require('../../static/js/modules/helpers');
var Calendar = require('../../static/js/modules/calendar').Calendar;
var calendarTooltip = require('../../static/js/modules/calendar-tooltip');
var calendarHelpers = require('../../static/js/modules/calendar-helpers');

var tooltipContent = require('../../static/js/templates/calendar/details.hbs');

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
        $form: {on: function() {}},
        filterSet: {
          serialize: function() {},
          fields: {}
        }
      }
    });
    this.server.respond();
  });

  beforeEach(function() {
    $(document.body).width(helpers.BREAKPOINTS.MEDIUM);
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
      expect(this.calendar.$calendar.find('.button button--alt')).to.exist;
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

  describe('handleRender()', function() {
    it('triggers a render event', function() {
      var callback = sinon.stub();
      $(document.body).on('calendar:rendered', callback);
      this.calendar.handleRender({name: 'month'});
      expect(callback).to.have.been.called;
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
    });
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

    it('highlights the list toggle', function() {
      this.calendar.manageListToggles({name: 'monthCategory'});
      var $listToggle = this.calendar.$calendar.find('.fc-monthTime-button');
      expect($listToggle.hasClass('fc-state-active')).to.be.true;
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
    beforeEach(function() {
      sinon.stub(calendarTooltip, 'CalendarTooltip');
    });

    afterEach(function() {
      calendarTooltip.CalendarTooltip.restore();
    });

    it('makes a new tooltip if there is none', function() {
      var target = '<a><span class="fc-content"></span></a>';
      this.calendar.handleEventClick({}, {target: target});
      expect(calendarTooltip.CalendarTooltip).to.have.been.called;
    });

    it('does not make a tooltip if there is one', function() {
      var target = '<a><span class="fc-content"></span></a><div class="tooltip"></div>';
      this.calendar.handleEventClick({}, {target: target});
      expect(calendarTooltip.CalendarTooltip).to.not.have.been.called;
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
    });
  });
});

describe('calendar tooltip', function() {
  beforeEach(function() {
    var dom =
    '<div class="fc-event-container">' +
      '<a class="cal-event" tabindex="0"></a>' +
    '</div>';
    $(document.body).append($(dom));
    var $container = $('.cal-event');
    var content = tooltipContent({});
    this.calendarTooltip = new calendarTooltip.CalendarTooltip(content, $container);
    $container.append(this.calendarTooltip.$content);
  });

  afterEach(function() {
    this.calendarTooltip.close();
    $('.cal-event').remove();
  });

  it('closes on click away', function() {
    $(document.body).click();
    expect($('.cal-details').length).to.equal(0);
  });

  it('stays open if you click inside it', function() {
    this.calendarTooltip.$content.find('a').click();
    expect($('.cal-details').length).to.equal(1);
  });

  it('closes on clicking the close button', function() {
    this.calendarTooltip.$content.find('.js-close').click();
    expect($('.cal-details').length).to.equal(0);
  });

  it('focuses on the trigger on close', function() {
    this.calendarTooltip.close();
    expect($(document.activeElement).hasClass('cal-event')).to.be.true;
  });
});

describe('helpers', function() {
  describe('calendarHelpers.getGoogleurl()', function() {
    it('builds the correct Google url', function() {
      var googleUrl = calendarHelpers.getGoogleUrl({
        title: 'the big one',
        summary: 'vote today',
        end: moment('2016-11-01'),
        start: moment('2016-11-02')
      });
      expect(googleUrl).to.equal('https://calendar.google.com/calendar/render?action=TEMPLATE&text=the+big+one&details=vote+today&dates=20161102T000000%2F20161101T000000');
    });
  });

  describe('calendarHelpers.getUrl()', function() {
    it('builds the correct url', function() {
      var url = calendarHelpers.getUrl('calendar', {category: 'election'});
      expect(url).to.equal('/v1/calendar/?api_key=12345&per_page=500&category=election');
    });
  });

  describe('calendarHelpers.className()', function() {
    it('adds a multi-day class for multi-day events', function() {
      var multiEvent = {
        start_date: moment('2012-11-02'),
        end_date: moment('2012-11-03')
      };
      var singleEvent = {
        start_date: moment('2012-11-02'),
        end_date: moment('2012-11-02')
      };
      var multiDayClass = calendarHelpers.className(multiEvent);
      var singleDayClass = calendarHelpers.className(singleEvent);
      expect(multiDayClass).to.equal('fc-multi-day');
      expect(singleDayClass).to.not.equal('fc-multi-day');
    });
  });
});
