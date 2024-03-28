import React from 'react';
import { expect } from 'chai';
import { EditorState } from 'draft-js';

import './setup.js';
import { shallow } from 'enzyme';

import { default as SansSerif } from '../../../static/js/draftail/SansSerif.js';

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
    expect(element.type()).to.equal('span') // TODO: jQuery deprecation (.type())
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
