'use strict';

/* global require, module, window */

var eventemitter = require('eventemitter2');
var EventEmitter2 = eventemitter.EventEmitter2 || eventemitter;
module.exports = window.events = window.events || new EventEmitter2();
