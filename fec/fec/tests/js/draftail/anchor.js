'use strict';

var React = require('react');
var chai = require('chai');
var draftjs = require('draft-js');
var Enzyme = require('./setup');

var mount = Enzyme.mount;
var shallow = Enzyme.shallow;
var expect = chai.expect;
var EditorState = draftjs.EditorState;
var Entity = draftjs.Entity;
var Anchor = require('../../../static/js/draftail/Anchor');

describe('draftail - Anchor Block Component', function() {
  it('should build a Anchor object for Draftail to consume', function() {
    expect(Anchor).to.be.an('object');
    expect(Anchor).to.have.keys('type', 'source', 'decorator');
    expect(Anchor.type).to.equal('ANCHOR')
  });

  it('the Anchor decorator should build a react element', function() {
    var Decorator = Anchor.decorator;
    var element = shallow(<Decorator>test</Decorator>);
    expect(element.childAt(0).text()).to.equal('test');
    expect(element.type()).to.equal('span')
  });

  it('the Anchor source should build an anchor component from selected text', function(done) {
    var Source = Anchor.source;
    var editorState = EditorState.createEmpty();
    var entityType = Entity.create();
    var onComplete = function(next) {
      expect(next).to.be.an('object');
      done();
    };
    var element = shallow(<Source editorState={editorState} entityType={entityType} onComplete={onComplete} />);
  });
});
