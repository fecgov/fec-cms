'use strict';

/* global require, module, window */

var EventEmitter2 = require('eventemitter2').EventEmitter2;
module.exports = window.events = window.events || new EventEmitter2();
