// Common for all/most tests
// import './setup.js';
import * as sinonChai from 'sinon-chai';
import { expect, use } from 'chai';
import { spy, stub } from 'sinon/pkg/sinon-esm';
use(sinonChai);
// (end common)

import Feedback from '../../static/js/modules/feedback.js';

describe('feedback', function() {
  beforeEach(function() {
    this.feedback = new Feedback('/data/issue/');
  });

  describe('constructor', function() {
    it('memorizes its url', function() {
      expect(this.feedback.url).to.equal('/data/issue/');
    });

    it('appends the feedback widget', function() {
      expect($(document.body).has(this.feedback.$feedback).length).to.equal(1);
    });
  });

  describe('toggle', function() {
    it('starts closed', function() {
      expect(this.feedback.isOpen).to.be.false;
    });

    it('opens on toggle', function() {
      this.feedback.toggle();
      expect(this.feedback.$box.attr('aria-hidden')).to.equal('false');
      expect(this.feedback.$button.attr('aria-expanded')).to.equal('true');
      expect(this.feedback.isOpen).to.be.true;
    });

    it('closes on second toggle', function() {
      this.feedback.toggle();
      this.feedback.toggle();
      expect(this.feedback.$box.attr('aria-hidden')).to.equal('true');
      expect(this.feedback.$button.attr('aria-expanded')).to.equal('false');
      expect(this.feedback.isOpen).to.be.false;
    });
  });

  describe('callbacks', function() {
    beforeEach(function() {
      this.message = spy(this.feedback, 'message');
    });

    afterEach(function() {
      this.message.restore();
    });

    it('clears text on success', function() {
      this.feedback.handleSuccess({ html_url: 'https://github.com/fecgov/FEC/issue/1' });
      expect(this.feedback.$box.find('textarea').val()).to.equal('');
      expect(this.feedback.message).to.have.been.called;
    });

    it('shows message on error', function() {
      this.feedback.handleError(this.event);
      expect(this.feedback.message).to.have.been.called;
    });
  });

  describe('messages', function() {
    it('shows a message with expected class', function() {
      this.feedback.message('foo', 'bar', 'success');
      expect(this.feedback.$message.hasClass('message--success')).to.be.true;
    });

    it('hides previous classes', function() {
      this.feedback.message('foo', 'bar', 'success');
      this.feedback.message('foo', 'bar', 'error');
      expect(this.feedback.$message.hasClass('message--success')).to.be.false;
      expect(this.feedback.$message.hasClass('message--error')).to.be.true;
    });
  });

  describe('submission', function() {
    beforeEach(function() {
      this.ajaxStub = stub($, 'ajax');
      stub(this.feedback, 'handleSuccess');
      stub(this.feedback, 'handleError');
      this.event = { preventDefault: spy() };
      this.token = 'fake-token';
      this.feedback.$box.find('textarea').val('awesome site good job');
      var grecaptchaMock = stub({
            render: function (options) { }, // eslint-disable-line no-unused-vars, no-empty-function
            reset: function (id) { }, // eslint-disable-line no-unused-vars, no-empty-function
            getResponse: function (id) { }, // eslint-disable-line no-unused-vars, no-empty-function
            execute: function() { } // eslint-disable-line no-empty-function
        });
       window.grecaptcha = grecaptchaMock;
    });

    afterEach(function() {
      $.ajax.restore();
      this.feedback.handleSuccess.restore();
      this.feedback.handleError.restore();
    });

    it('skips submit on empty inputs', function() {
      var message = spy(this.feedback, 'message');
      this.feedback.$box.find('#feedback-1').val('');
      this.feedback.submit(this.token);
      expect(message).to.have.been.called;
      expect(this.ajaxStub).to.have.not.been.called;
    });

    it('calls handleSuccess on success', function() {
      var deferred = $.Deferred().resolve({});
      this.ajaxStub.returns(deferred);
      this.feedback.submit(this.token);
      expect(this.feedback.handleSuccess).to.have.been.called;
      expect(this.feedback.handleError).to.have.not.been.called;
    });

    it('calls handleError on error', function() {
      var deferred = $.Deferred().reject();
      this.ajaxStub.returns(deferred);
      this.feedback.submit(this.token);
      expect(this.feedback.handleSuccess).to.have.not.been.called;
      expect(this.feedback.handleError).to.have.been.called;
    });
  });
});
