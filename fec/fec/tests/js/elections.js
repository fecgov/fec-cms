'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var $ = require('jquery');

require('./setup')();

// var elections = require('../../static/js/pages/elections').getElections;

describe('elections page', function() {
  describe('getElections', function() {
    before(function(done) {
      window.context = {
        elections: {
          state: 'AZ'
        }
      };
      this.$fixture = $('<div id="fixtures"></div>');
      $('body').append(this.$fixture);
      this.xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];

      this.xhr.onCreate = function (xhr) {
          requests.push(xhr);
      };
      done();
    });

    beforeEach(function(done) {
      this.$fixture.empty().append(
        '<div class="election-dates"></div>'
      );
      done();
    });

    afterEach(function(done) {
      this.$fixture.empty();
      done();
      this.xhr.restore();
    });

    it('should query and attach to election-dates div', function(done) {
      console.log(window.context);
      done()
      // var callback = sinon.spy();
      // $.getJSON('/').done(callback);
      // this.requests[0].respond(200, { "Content-Type": "application/json" },
      //                          '[{ "id": 12, "comment": "Hey there" }]');
      // console.log(callback.calledWith([{ id: 12, comment: "Hey there" }]))
    });
  });
});
