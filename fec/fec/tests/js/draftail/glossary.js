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
var Glossary = require('../../../static/js/draftail/Glossary');
var terms = require('../../../static/js/data/terms.json');

describe('draftail - Glossary Block Component', function() {
  it('should build a Glossary object for Draftail to Consume', function() {
    expect(Glossary).to.be.an('object');
    expect(Glossary).to.have.keys('type', 'source', 'decorator');
    expect(Glossary.type).to.equal('GLOSSARY')
  });

  it('the Glossary decorator should build a react element', function() {
    var Decorator = Glossary.decorator;
    var element = shallow(<Decorator>test</Decorator>);
    expect(element.childAt(0).text()).to.equal('test');
    expect(element.type()).to.equal('b')
  });

  it('the Glossary source should build a select with all the term options', function() {
    var Source = Glossary.source;
    var element = mount(<Source />);
    expect(element.find('select').children().length).to.equal(terms.length+1);
  });

  it('the Glossary source should close', function(done) {
    var Source = Glossary.source;
    var onComplete = function() {
      expect(true).to.be.true;
      done();
    };
    var element = mount(<Source onComplete={onComplete} />);
    element.find('.modal-close').simulate('click');
  });

  it('the Glossary should update the content when component changes', function(done) {
    var Source = Glossary.source;
    var editorState = EditorState.createEmpty();
    var entityType = Entity.create();
    var onComplete = function(next) {
      expect(next).to.be.an('object');
      done();
    };
    var element = mount(<Source editorState={editorState} entityType={entityType} onComplete={onComplete} />);
    element.find('select').simulate('change', 'test');
  });
});
