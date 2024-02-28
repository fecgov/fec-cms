'use strict';

var chai = require('chai');
var expect = chai.expect;

var Glossary = require('../src/glossary');

var terms = [
  {
    'term': 'foo',
    'definition': 'definition of foo',
  },
  {
    'term': 'bar',
    'definition': 'definition of bar',
  }
];

function isOpen(glossary) {
  return glossary.isOpen &&
    glossary.body.getAttribute('aria-hidden') === 'false' &&
    glossary.toggleBtn.getAttribute('aria-expanded') === 'true';
}

function isClosed(glossary) {
  return !glossary.isOpen &&
    glossary.body.getAttribute('aria-hidden') === 'true' &&
    glossary.toggleBtn.getAttribute('aria-expanded') === 'false';
}

// See http://stackoverflow.com/a/15948355/1222326
function click(elm) {
  var e = document.createEvent('MouseEvent');
  e.initMouseEvent(
    'click',
    true /* bubble */, true /* cancelable */,
    window, null,
    0, 0, 0, 0, /* coordinates */
    false, false, false, false, /* modifier keys */
    0 /*left*/, null
  );
  elm.dispatchEvent(e);
}

describe('glossary', function() {
  before(function() {
    this.fixture = document.createElement('div');
    this.fixture.id = 'fixtures';
    document.body.appendChild(this.fixture);
  });

  beforeEach(function() {
    this.fixture.innerHTML =
      '<button class="js-glossary-toggle"></button>' +
      '<span data-term="foo"></span>' +
      '<div id="glossary">' +
        '<button class="js-glossary-close">' +
          '<span>Hide glossary</span>' +
        '</button>' +
        '<input class="js-glossary-search" />' +
        '<ul class="js-glossary-list"></ul>' +
      '</div>';
    this.glossary = new Glossary(terms, {body: '#glossary'});
  });

  it('initializes', function() {
    expect(this.glossary.isOpen).to.be.false;
  });

  it('shows', function() {
    this.glossary.show();
    expect(isOpen(this.glossary)).to.be.true;
  });

  it('hides', function() {
    this.glossary.hide();
    expect(isClosed(this.glossary)).to.be.true;
  });

  it('toggles', function() {
    this.glossary.toggle();
    expect(isOpen(this.glossary)).to.be.true;
    this.glossary.toggle();
    expect(isClosed(this.glossary)).to.be.true;
  });

  it('linkifies terms in the document', function() {
    var $term = this.fixture.querySelector('[data-term]');
    expect($term.title).to.equal('Click to define');
    click($term);
    var items = this.glossary.list.visibleItems;
    expect(items.length).to.equal(1);
    expect(items[0].elm.innerText.indexOf('foo')).to.be.greaterThan(-1);
  });

  it('finds a term', function() {
    this.glossary.findTerm('foo');
    var items = this.glossary.list.visibleItems;
    expect(items.length).to.equal(1);
    expect(items[0].elm.innerText.indexOf('foo')).to.be.greaterThan(-1);
  });

  it('removes event listeners on destroy', function() {
    this.glossary.destroy();
    this.glossary.toggleBtn.click();
    expect(isOpen(this.glossary)).to.be.false;
  });
});
