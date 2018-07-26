'use strict';

var Enzyme = require('enzyme');
var Adapter = require('enzyme-adapter-react-15.4');

Enzyme.configure({ adapter: new Adapter() });

module.exports = Enzyme;
