'use strict';

var React = require('react');
var chai = require('chai');
var draftjs = require('draft-js');
var Enzyme = require('./setup');

var mount = Enzyme.mount;
var shallow = Enzyme.shallow;
var expect = chai.expect;
var EditorState = draftjs.EditorState;
var SansSerif = require('../../../static/js/draftail/SansSerif');

describe('draftail - SansSerif Block Component', function() {
  it('should build a SansSerif object for Draftail to Consume', function() {
    expect(SansSerif).to.be.an('object');
    expect(SansSerif).to.have.keys('type', 'source', 'decorator');
    expect(SansSerif.type).to.equal('SANSSERIF');
  });

  it('the SansSerif decorator should build a react element', function() {
    var Decorator = SansSerif.decorator;
    var element = shallow(<Decorator>test</Decorator>);
    expect(element.childAt(0).text()).to.equal('test');
    expect(element.type()).to.equal('span')
  });

  it('the SansSerif source should make selected font sans serif', function(done) {
    var Source = SansSerif.source;
    var editorState = EditorState.createEmpty();
    var entityType = editorState.getCurrentContent().createEntity();
    var onComplete = function(next) {
      expect(next).to.be.an('object');
      done();
    };
    var element = shallow(<Source editorState={editorState} entityType={entityType} onComplete={onComplete} />);
  });
});
