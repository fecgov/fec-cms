import { extend as _extend, template as _template } from 'underscore';
import List from 'list.js';
import Accordion from 'aria-accordion';

const KEYCODE_ENTER = 13;
const KEYCODE_ESC = 27;

// https://davidwalsh.name/element-matches-selector
function selectorMatches(el, selector) {
  var p = Element.prototype;
  var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s) {
    return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
  };
  return f.call(el, selector);
}

function forEach(values, callback) {
  return [].forEach.call(values, callback);
}

const itemTemplate = _template(
  '<li class="{{ glossaryItemClass }}">' +
    '<button class="data-glossary-term {{ termClass }}">{{ term }}' +
    '</button>' +
    '<div class="{{ definitionClass }}">{{ definition }}</div>' +
  '</li>',
  {interpolate: /\{\{(.+?)\}\}/g}
);

const defaultSelectors = {
  glossaryID: '#glossary',
  toggle: '.js-glossary-toggle',
  close: '.js-glossary-close',
  listClass: '.js-glossary-list',
  searchClass: '.js-glossary-search'
};

const defaultClasses = {
  definitionClass: 'glossary__definition',
  glossaryItemClass: 'glossary__item',
  highlightedTerm: 'term--highlight',
  termClass: 'glossary__term'
};

function removeTabindex(elm) {
  var elms = getTabIndex(elm);
  forEach(elms, function(elm) {
    elm.setAttribute('tabIndex', '-1');
  });
}

function restoreTabindex(elm) {
  var elms = getTabIndex(elm);
  forEach(elms, function(elm) {
    elm.setAttribute('tabIndex', '0');
  });
}

function getTabIndex(elm) {
  return elm.querySelectorAll('a, button, input, [tabindex]');
}

/**
 * Glossary widget
 * @constructor
 * @param {Array} terms - Term objects with "glossary-term" and "glossary-definition" keys
 * @param {Object} selectors - CSS selectors for glossary components
 * @param {Object} classes - CSS classes to be applied for styling
 */
export default function Glossary(terms, selectors, classes) {
  this.terms = terms;
  this.selectors = _extend({}, defaultSelectors, selectors);
  this.classes = _extend({}, defaultClasses, classes);

  this.body = document.querySelector(this.selectors.glossaryID);
  this.toggleBtn = document.querySelector(this.selectors.toggle);
  this.closeBtn = document.querySelector(this.selectors.close);
  this.search = this.body.querySelector(this.selectors.searchClass);
  this.listElm = this.body.querySelector(this.selectors.listClass);
  this.selectedTerm = this.toggleBtn;

  // Initialize state
  this.isOpen = false;

  // Update DOM
  this.populate();
  this.initList();
  this.linkTerms();

  // Remove tabindices
  removeTabindex(this.body);

  // Initialize accordions
  this.accordion = new Accordion(this.listElm, null, {contentPrefix: 'glossary'});

  // Bind listeners
  this.listeners = [];
  this.addEventListener(this.toggleBtn, 'click', this.toggle.bind(this));
  this.addEventListener(this.closeBtn, 'click', this.hide.bind(this));
  this.addEventListener(this.search, 'input', this.handleInput.bind(this));
  this.addEventListener(document.body, 'keyup', this.handleKeyup.bind(this));
}

Glossary.prototype.populate = function() {
  this.terms.forEach(function(term) {
    var opts = {
      term: term.term,
      definition: term.definition,
      definitionClass: this.classes.definitionClass,
      glossaryItemClass: this.classes.glossaryItemClass,
      termClass: this.classes.termClass
    };
    this.listElm.insertAdjacentHTML('beforeend', itemTemplate(opts));
  }, this);
};

/** Initialize list.js list of terms */
Glossary.prototype.initList = function() {
  var glossaryId = this.selectors.glossaryID.slice(1);
  var listClass = this.selectors.listClass.slice(1);
  var searchClass = this.selectors.searchClass.slice(1);
  var options = {
    valueNames: ['data-glossary-term'],
    listClass: listClass,
    searchClass: searchClass,
  };
  this.list = new List(glossaryId, options);
  this.list.sort('data-glossary-term', {order: 'asc'});
};

/** Add links to terms in body */
Glossary.prototype.linkTerms = function() {
  var terms = document.querySelectorAll('[data-term]');
  forEach(terms, function(term) {
    term.setAttribute('title', 'Click to define');
    term.setAttribute('tabIndex', 0);
    term.setAttribute('data-term', (term.getAttribute('data-term') || '').toLowerCase());
  });
  document.body.addEventListener('click', this.handleTermTouch.bind(this));
  document.body.addEventListener('keyup', this.handleTermTouch.bind(this));
};

Glossary.prototype.handleTermTouch = function(e) {
  if (e.which === KEYCODE_ENTER || e.type === 'click') {
    if (selectorMatches(e.target, '[data-term]')) {
      this.show(e);
      this.selectedTerm = e.target;
      this.findTerm(e.target.getAttribute('data-term'));
    }
    else {
      this.selectedTerm = this.toggleBtn;
    }
  }
};

/** Highlight a term */
Glossary.prototype.findTerm = function(term) {
  this.search.value = term;
  var highlightClass = this.classes.highlightedTerm;

  // Highlight the term and remove other highlights
  forEach(this.body.querySelectorAll('.' + highlightClass), function(term) {
    term.classList.remove(highlightClass);
  });
  forEach(this.body.querySelectorAll('span[data-term="' + term + '"]'), function(term) {
    term.classList.add(highlightClass);
  });
  this.list.filter(function(item) {
    return item._values['data-glossary-term'].toLowerCase() === term;
  });

  this.list.search();
  var button = this.list.visibleItems[0].elm.querySelector('button');
  this.accordion.expand(button);
};

Glossary.prototype.toggle = function() {
  var method = this.isOpen ? this.hide : this.show;
  method.apply(this);
};

Glossary.prototype.show = function() {
  this.body.setAttribute('aria-hidden', 'false');
  this.toggleBtn.setAttribute('aria-expanded', 'true');
  this.search.focus();
  this.isOpen = true;
  restoreTabindex(this.body);
};

Glossary.prototype.hide = function() {
  this.body.setAttribute('aria-hidden', 'true');
  this.toggleBtn.setAttribute('aria-expanded', 'false');
  this.selectedTerm.focus();
  this.isOpen = false;
  removeTabindex(this.body);
};

/** Remove existing filters on input */
Glossary.prototype.handleInput = function() {
  if (this.list.filtered) {
    this.list.filter();
  }
};

/** Close glossary on escape keypress */
Glossary.prototype.handleKeyup = function(e) {
  if (e.keyCode == KEYCODE_ESC) {
    if (this.isOpen) {
      this.hide();
    }
  }
};

Glossary.prototype.addEventListener = function(elm, event, callback) {
  if (elm) {
    elm.addEventListener(event, callback);
    this.listeners.push({
      elm: elm,
      event: event,
      callback: callback
    });
  }
};

Glossary.prototype.destroy = function() {
  this.accordion.destroy();
  this.listeners.forEach(function(listener) {
    listener.elm.removeEventListener(listener.event, listener.callback);
  });
};
