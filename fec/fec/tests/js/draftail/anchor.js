import React from 'react';
import { expect } from 'chai';
import { EditorState } from 'draft-js';

import './setup.js';
import { shallow } from 'enzyme';

import { default as Anchor } from '../../../static/js/draftail/Anchor.js';

describe('draftail - Anchor Block Component', function() {
  it('should build an Anchor object for Draftail to consume', function() {
    expect(Anchor).to.be.an('object');
    expect(Anchor).to.have.keys('type', 'source', 'decorator');
    expect(Anchor.type).to.equal('ANCHOR');
  });

  it('the Anchor decorator should build a React element', function() {
    var Decorator = Anchor.decorator;
    var element = shallow(<Decorator>test</Decorator>);
    expect(element.childAt(0).text()).to.equal('test');
    expect(element.type()).to.equal('span');
  });

  it('the Anchor source should build an anchor component from selected text', function(done) {
    const Source = Anchor.source;
    const editorState = EditorState.createEmpty();
    const entityType = editorState.getCurrentContent().createEntity();
    const onComplete = function(next) {
      expect(next).to.be.an('object');
      done();
    };
    const element = shallow(<Source editorState={editorState} entityType={entityType} onComplete={onComplete} />);
  });
});
