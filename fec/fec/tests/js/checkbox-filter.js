'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

var CheckboxFilter = require('../../static/js/modules/filters/checkbox-filter').CheckboxFilter;

describe('checkbox filters', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  beforeEach(function() {
    $(document.body).off('filter:added');
    $(document.body).off('filter:removed');
    $(document.body).off('filter:changed');

    this.$fixture.empty().append(
      '<button class="accordion__trigger">Filter category</button>' +
      '<div class="accordion__content">' +
        '<div class="js-filter">' +
          '<input id="president" name="office" type="checkbox" value="p">' +
          '<label for="president">President</label>' +
          '<input id="senate" name="office" type="checkbox" value="s">' +
          '<label for="senate">Senate</label>' +
          '<input id="house" name="office" type="checkbox" value="H">' +
          '<label for="house">House</label>' +
        '</div>' +
      '</div>'
    );
    this.filter = new CheckboxFilter(this.$fixture.find('.js-filter'));
  });

  it('locates dom elements', function() {
    expect(this.filter.$elm.is('#fixtures .js-filter')).to.be.true;
    expect(this.filter.$input.is('#fixtures input')).to.be.true;
    expect(this.filter.$filterLabel.is('#fixtures .accordion__trigger')).to.be.true;
  });

  it('sets its initial state', function() {
    expect(this.filter.name).to.equal('office');
    expect(this.filter.fields).to.deep.equal(['office']);
    expect(this.filter.removable).to.be.false;
  });

  it('pulls values from the query', function() {
    var query = {'office': ['p', 's']};
    this.filter.fromQuery(query);
    expect(this.filter.$elm.find('#president').is(':checked')).to.be.true;
    expect(this.filter.$elm.find('#senate').is(':checked')).to.be.true;
    expect(this.filter.$elm.find('#house').is(':checked')).to.be.false;
  });

  it('increments the filter count when checked', function() {
    this.filter.setValue(['p', 's']);
    expect(this.filter.$filterLabel.find('.filter-count').html()).to.equal('2');
  });

  it('decrements the filter count when unchecked', function() {
    this.filter.setValue(['p', 's']);
    this.filter.setValue('p');
    expect(this.filter.$filterLabel.find('.filter-count').html()).to.equal('1');
  });

  describe('handleChange()', function() {
    beforeEach(function() {
      this.trigger = sinon.spy($.prototype, 'trigger');
      this.$input = this.$fixture.find('#president');
      this.$label = this.filter.$elm.find('label[for="' + this.$input.attr('id') + '"]');
    });

    afterEach(function() {
      this.$input.prop('checked', false);
      $.prototype.trigger.restore();
    });

    it('sets loaded-once on the input after loading', function() {
      this.$input.prop('checked', true).change();
      expect(this.$input.data('loaded-once')).to.be.true;
      expect(this.$label.attr('class')).to.not.equal('is-loading');
    });

    it('adds the loading class if it has loaded once', function() {
      this.$input.prop('checked', true).change();
      this.$input.prop('checked', false).change();
      expect(this.$label.attr('class')).to.equal('is-loading');
    });

    it('triggers the add event on checking a checkbox', function() {
      this.$input.prop('checked', true).change();
      expect(this.trigger).to.have.been.calledWith('filter:added', [
        {
          key: 'president',
          value: 'President',
          loadedOnce: false,
          filterLabel: this.filter.$filterLabel,
          name: 'office',
        }
      ]);
    });

    it('triggers remove event on unchecking a checkbox', function() {
      this.$input.prop('checked', false).change();
      expect(this.trigger).to.have.been.calledWith('filter:removed', [
        {
          key: 'president',
          value: 'President',
          loadedOnce: false,
          filterLabel: this.filter.$filterLabel,
          name: 'office'
        }
      ]);
    });
  });

  describe('removable checkboxes', function() {
    beforeEach(function(){
      this.$fixture.empty().append(
        '<div class="js-filter" data-removable="true">' +
          '<li>' +
            '<input id="president" name="office" type="checkbox" value="p">' +
            '<label for="president">President</label>' +
            '<button class="js-remove"></button>' +
          '</li>' +
        '</div>'
      );
      this.filter = new CheckboxFilter(this.$fixture.find('.js-filter'));
    });

    it('sets the removable property', function() {
      expect(this.filter.removable).to.be.true;
    });

    it('removes checkbox on clicking the button', function() {
      this.filter.$elm.find('.js-remove').click();
      expect(this.filter.$elm.find('li').length).to.equal(0);
    });

    it('clears empty checkboxes', function() {
      this.filter.handleClearFilters();
      expect(this.filter.$elm.find('li').length).to.equal(0);
    });

    it('doesn not clear checked checkboxes', function() {
      this.filter.$elm.find('input').prop('checked', true);
      this.filter.handleClearFilters();
      expect(this.filter.$elm.find('li').length).to.equal(1);
    });
  });
});
