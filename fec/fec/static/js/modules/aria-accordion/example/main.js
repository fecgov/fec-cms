(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var accordion = require('..');

var accordionElement = document.querySelector('.js-accordion');

new accordion.Accordion(accordionElement, {}, {openFirst: true});

},{"..":2}],2:[function(require,module,exports){
'use strict';

var extend = require('./util').extend;

var defaultOpts = {
  collapseOthers: false,
  customHiding: false,
  contentPrefix: 'accordion',
  openFirst: false,
  reflectStatic: false
};

var defaultSelectors = {
  trigger: 'button'
};

/**
 * Creates a new accordion component
 * @constructor
 * @param {Element} elm - The element that contains the entire accordion
 * @param {object} selectors - Selectors for locating DOM elements
 * @param {object} opts - Options for configuring behavior
 */

var Accordion = function(elm, selectors, opts) {
  this.elm = elm;
  this.selectors = extend({}, defaultSelectors, selectors);
  this.opts = extend({}, defaultOpts, opts);

  this.triggers = this.findTriggers();

  this.listeners = [];
  this.addEventListener(this.elm, 'click', this.handleClickElm.bind(this));

  if (this.opts.openFirst) {
    this.expand(this.triggers[0]);
  }
};

Accordion.prototype.handleClickElm = function(e) {
  // If the target is the button, toggle the button
  // Else see if the target is a child of a button
  if (this.triggers.indexOf(e.target) > -1) {
    this.toggle(e.target);
  } else {
    var self = this;
    this.triggers.forEach(function(trigger){
      if (e.target.parentElement === trigger) {
        self.toggle(trigger);
      }
    });
  }
};

Accordion.prototype.findTriggers = function() {
  var self = this;
  var triggers = [].slice.call(this.elm.querySelectorAll(this.selectors.trigger));
  triggers.forEach(function(trigger, index) {
    self.setAria(trigger, index);
  });
  return triggers;
};

Accordion.prototype.setAria = function(trigger, index) {
  var content = trigger.nextElementSibling;
  var contentID;
  var initExpanded = 'false';
  var initHidden = 'true';

  if (content.hasAttribute('id')) {
    contentID = content.getAttribute('id');
  } else {
    contentID = this.opts.contentPrefix + '-' + 'content-' + index;
    content.setAttribute('id', contentID);
  }

  if (this.opts.reflectStatic) {
    initExpanded = trigger.getAttribute('aria-expanded') || initExpanded;
    initHidden = content.getAttribute('aria-hidden') || initHidden;
  }

  trigger.setAttribute('aria-controls', contentID);
  trigger.setAttribute('aria-expanded', initExpanded);
  content.setAttribute('aria-hidden', initHidden);
  this.setStyles(content);
};

Accordion.prototype.toggle = function(elm) {
  var f = elm.getAttribute('aria-expanded') === 'true' ? this.collapse : this.expand;
  f.call(this, elm);
};

Accordion.prototype.expand = function(button) {
  if (this.opts.collapseOthers) {
    this.collapseAll();
  }
  var content = document.getElementById(button.getAttribute('aria-controls'));
  button.setAttribute('aria-expanded', 'true');
  content.setAttribute('aria-hidden', 'false');
  this.setStyles(content);
};

Accordion.prototype.collapse = function(button) {
  var content = document.getElementById(button.getAttribute('aria-controls'));
  button.setAttribute('aria-expanded', 'false');
  content.setAttribute('aria-hidden', 'true');
  this.setStyles(content);
};

Accordion.prototype.collapseAll = function() {
  var self = this;
  this.triggers.forEach(function(trigger) {
    self.collapse(trigger);
  });
};

Accordion.prototype.expandAll = function() {
  var self = this;
  this.triggers.forEach(function(trigger) {
    self.expand(trigger);
  });
};

Accordion.prototype.setStyles = function(content) {
  var prop = content.getAttribute('aria-hidden') === 'true' ? 'none' : 'block';

  if (!this.opts.customHiding) {
    content.style.display = prop;
  }
};

Accordion.prototype.addEventListener = function(elm, event, callback) {
  if (elm) {
    elm.addEventListener(event, callback);
    this.listeners.push({
      elm: elm,
      event: event,
      callback: callback
    });
  }
};

Accordion.prototype.destroy = function() {
  this.listeners.forEach(function(listener) {
    listener.elm.removeEventListener(listener.event, listener.callback);
  });
};

module.exports = { Accordion: Accordion };

},{"./util":3}],3:[function(require,module,exports){
var extend = function(out) {
  out = out || {};
  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i]) continue;
    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
        out[key] = arguments[i][key];
      }
    }
  }
  return out;
};

module.exports = {
  extend: extend
}

},{}]},{},[1]);
