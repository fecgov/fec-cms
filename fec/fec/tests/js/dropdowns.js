'use strict';

/* global require, document, describe, before, beforeEach, after, afterEach, it */

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

var Dropdown = require('../../static/js/modules/dropdowns').Dropdown;

function isOpen(dropdown) {
  return dropdown.isOpen &&
    dropdown.$panel.attr('aria-hidden') == 'false';
}

function isClosed(dropdown) {
  return !dropdown.isOpen &&
    dropdown.$panel.attr('aria-hidden') == 'true';
}

describe('dropdown', function() {
  before(function() {
    this.$fixture = $('<div id="fixtures"></div>');
    $('body').append(this.$fixture);
  });

  describe('standard dropdown', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<fieldset class="js-dropdown">' +
          '<legend class="label">Election Years</legend>' +
          '<ul class="dropdown__selected"></ul>' +
          '<div class="dropdown">' +
            '<button class="dropdown__button button--alt">More</button>' +
            '<div id="cycle-dropdown" class="dropdown__panel" aria-hidden="true">' +
              '<ul class="dropdown__list">' +
                '<li class="dropdown__item">' +
                  '<input id="A" name="cycle" type="checkbox" value="A">' +
                  '<label id="label-A" class="dropdown__value" for="A">A</label>' +
                '</li>' +
                '<li class="dropdown__item">' +
                  '<input id="B" name="cycle" type="checkbox" value="B">' +
                  '<label id="label-B" class="dropdown__value" for="B">B</label>' +
                '</li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
        '</fieldset>'
      );
      this.dropdown = new Dropdown('.js-dropdown');
    });

    it('initializes', function() {
      expect(this.dropdown.isOpen).to.be.false;
    });

    it('shows', function() {
      this.dropdown.show();
      expect(isOpen(this.dropdown)).to.be.true;
    });

    it('hides', function() {
      this.dropdown.hide();
      expect(isClosed(this.dropdown)).to.be.true;
    });

    it('toggles', function() {
      this.dropdown.$button.click();
      expect(isOpen(this.dropdown)).to.be.true;
      this.dropdown.$button.click();
      expect(isClosed(this.dropdown)).to.be.true;
    });

    it('handles a check', function() {
      var checkbox = this.dropdown.$panel.find('#A');
      checkbox.click();
      expect(checkbox.is(':checked')).to.be.true;
    });

    it('selects input when checked', function() {
      this.dropdown.selectItem($('#A'));
      var selectedItems = this.dropdown.$selected.find('.dropdown__item');
      var panelItems = this.dropdown.$panel.find('.dropdown__item');
      expect(selectedItems.length).to.equal(1);
      expect(panelItems.length).to.equal(2);
    });

    it('select two inputs', function() {
      this.dropdown.selectItem($('#A'));
      this.dropdown.selectItem($('#B'));
      var selectedItems = this.dropdown.$selected.find('.dropdown__item');
      var panelItems = this.dropdown.$panel.find('.dropdown__item');
      expect(selectedItems.length).to.equal(2);
      expect(panelItems.length).to.equal(2);
    });

    it('selects dropdown item and make sure it is checked', function() {
      this.dropdown.selectItem($('#A'));
      var panelItems = this.dropdown.$panel.find('.dropdown__item');
      expect(panelItems.find('.dropdown__item--selected').length).to.equal(1);
      expect(panelItems.find('.dropdown__item--selected').hasClass('is-checked')).to.be.true;
    });

    it('unchecks an input', function() {
      var checkbox = this.dropdown.$panel.find('#B');
      checkbox.click();
      checkbox.click();
      var dropdownItem = this.dropdown.$panel.find('.dropdown__item--selected');
      expect(dropdownItem.hasClass('is-checked')).to.be.false;
    });

    it('clear all tags removes all selected inputs', function() {
      this.dropdown.selectItem($('#A'));
      this.dropdown.selectItem($('#B'));
      $(document.body).trigger('tag:removeAll', {});
      var selectedItems = this.dropdown.$selected.find('.dropdown__item');
      var panelItems = this.dropdown.$panel.find('.dropdown__item');
      expect(selectedItems.length).to.equal(0);
      expect(panelItems.length).to.equal(2);
    });

    it('removes an unchecked input', function() {
      var checkbox = this.dropdown.$panel.find('#B');
      checkbox.click();
      checkbox.click();
      expect(checkbox.is(':checked')).to.be.false;
      this.dropdown.handleCheckboxRemoval(checkbox);
      var selectedItems = this.dropdown.$selected.find('.dropdown__item');
      expect(selectedItems.length).to.equal(0);
    });

    it('focuses next input', function() {
      this.dropdown.selectItem($('#A'));
      expect(document.activeElement).to.equal($('#B').get(0));
    });

    it('focuses previous input when selecting the bottom item', function() {
      this.dropdown.selectItem($('#B'));
      expect(document.activeElement).to.equal($('#A').get(0));
    });

    it('removes the panel', function() {
      this.dropdown.removePanel();
      expect(this.dropdown.$body.find('.dropdown__panel').length).to.equal(0);
      expect(this.dropdown.$body.find('.dropdown__button').length).to.equal(0);
    });

    it('removes the panel on init if empty', function() {
      this.$fixture.empty().append(
        '<fieldset class="js-dropdown">' +
          '<legend class="label">Election Years</legend>' +
          '<ul class="dropdown__selected"></ul>' +
          '<div class="dropdown">' +
            '<button class="dropdown__button button--alt">More</button>' +
            '<div id="cycle-dropdown" class="dropdown__panel" aria-hidden="true"></div>' +
          '</div>' +
        '</fieldset>'
      );
      sinon.spy(Dropdown.prototype, 'removePanel');
      var dropdown = new Dropdown('.js-dropdown');
      expect(Dropdown.prototype.removePanel).to.have.been.called;
    });

    it('hides when clicking somewhere else', function() {
      this.dropdown.show();
      this.dropdown.handleClickAway({target: 'other'});
      expect(isClosed(this.dropdown)).to.be.true;
    });

    it('hides when focusing somewhere else', function() {
      this.dropdown.show();
      this.dropdown.handleFocusAway({target: 'other'});
      expect(isClosed(this.dropdown)).to.be.true;
    });

    it('hides on ESC', function(){
      this.dropdown.show();
      this.dropdown.handleKeyup({keyCode: 27});
      expect(isClosed(this.dropdown)).to.be.true;
    });
  });

  describe('non-removable checkboxes and dropdown', function() {
    beforeEach(function() {
      this.$fixture.empty().append(
        '<fieldset class="js-dropdown">' +
          '<legend class="label">Political Party</legend>' +
          '<ul class="dropdown__selected">' +
            '<li class="dropdown__item">' +
              '<input id="party-DEM" name="party" type="checkbox" value="DEM" tabindex="0">' +
              '<label class="dropdown__value" for="party-DEM">Democratic Party</label>' +
            '</li>' +
            '<li class="dropdown__item">' +
              '<input id="party-REP" name="party" type="checkbox" value="REP" tabindex="0">' +
              '<label class="dropdown__value" for="party-REP">Republican Party</label>' +
            '</li>' +
          '</ul>' +
          '<div class="dropdown">' +
            '<button class="dropdown__button button--alt">More</button>' +
            '<div id="cycle-dropdown" class="dropdown__panel" aria-hidden="true">' +
              '<ul class="dropdown__list">' +
                '<li class="dropdown__item">' +
                  '<input id="A" name="cycle" type="checkbox" value="A">' +
                  '<label id="label-A" class="dropdown__value" for="A">A</label>' +
                '</li>' +
                '<li class="dropdown__item">' +
                  '<input id="B" name="cycle" type="checkbox" value="B">' +
                  '<label id="label-B" class="dropdown__value" for="B">B</label>' +
                '</li>' +
              '</ul>' +
            '</div>' +
          '</div>' +
        '</fieldset>'
      );
      this.dropdown = new Dropdown('.js-dropdown');
    });

    it('select dropdown item and adds input to selected', function() {
      this.dropdown.selectItem($('#A'));
      var selectedItems = this.dropdown.$selected.find('.dropdown__item');
      var panelItems = this.dropdown.$panel.find('.dropdown__item');
      expect(selectedItems.length).to.equal(3);
      expect(panelItems.length).to.equal(2);
    });

    it('removal of tag does not delete non-removable checkbox', function() {
      $(document.body).trigger('tag:removed', [{key: 'party-DEM'}]);
      var selectedItems = this.dropdown.$selected.find('.dropdown__item');
      expect(selectedItems.length).to.equal(2);
    });

    it('clear all tags only removes removable selected inputs', function() {
      this.dropdown.selectItem($('#A'));
      var selectedItems = this.dropdown.$selected.find('.dropdown__item');
      expect(selectedItems.length).to.equal(3);
      $(document.body).trigger('tag:removeAll', {});
      selectedItems = this.dropdown.$selected.find('.dropdown__item');
      expect(selectedItems.length).to.equal(2);
    });
  });
});
