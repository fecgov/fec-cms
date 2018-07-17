import React from 'react';
import { EditorState, Modifier } from 'draft-js';
import { slugify } from './utils';

const glossaryTerms = require('../data/terms.json');
const terms = [{"term": "Select term"}].concat(glossaryTerms);

class Modal extends React.Component {
  render() {
    const handleClose = this.props.handleClose;
    const Bold = React.createElement('strong', {
      style: {
        color: '#fff',
        position: 'relative',
        top: '-2px'
      }
    }, 'x');

    const Cancel = React.createElement('div', {
      onClick: function(e) {
       handleClose();
      },
      style: {
        backgroundColor: 'rgb(51,51,51)',
        border: 'solid 3px #fff',
        boxShadow: '1px 1px 5px rgb(51,51,51)',
        borderRadius: '100%',
        cursor: 'pointer',
        float: 'right',
        height: '15px',
        margin: '10px',
        padding: '3px',
        textAlign: 'center',
        verticalAlign: 'middle',
        width: '15px'
      }
    }, Bold);

    const Title = React.createElement('h2', {
      style: {
        padding: '5px 0',
        margin: '10px'
      }
    }, ['Select a Glossary term!']);

    return React.createElement('div', {
      style: {
        backgroundColor: '#fff',
        border: 'solid 1px rgb(50,50,50)',
        boxShadow: '5px 5px 20px rgb(50,50,50)',
        width: '200px',
        height: 'auto',
        display: 'block',
        left: 'calc(50% - 100px)',
        padding: '10px 20px',
        pointerEvents: 'auto',
        position: 'fixed',
        top: 'calc(50% - 100px)',
        zIndex: '100'
      }
    }, [Cancel, Title, this.props.children]);
  }
}

Modal.defaultProps = {
  handleClose: function() {}
};

class GlossarySelect extends React.Component {
  render() {
    const handleChange = this.props.handleChange;

    const options = this.props.terms.map(function(t, idx) {
      const disabled = idx === 0 ? true : false;
      const slug = `${slugify(t.term)}-${idx}`;

      return (
        <option key={slug} value={t.term}>
          {t.term}
        </option>
      );
    });

    return (
      <select name='term-select' onChange={e => handleChange(e.target.value)}>
        {options}
      </select>
    );
  }
}

GlossarySelect.defaultProps = {
  handleChange: function() {},
  terms: terms
};

class GlossaryEntity extends React.Component {
  render() {
    const Element = React.createElement(GlossarySelect, {
      handleChange: this.props.handleChange
    });

    return React.createElement(Modal, {
      handleClose: this.props.handleClose
    }, Element);
  }
}

GlossaryEntity.defaultProps = {
  handleChange: function() {},
  handleClose: function() {}
};

// Creates the entities as soon as it is rendered.
class GlossarySource extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  handleChange(value) {
    const { editorState, entityType, onComplete } = this.props;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();

    // Gets the selected text from the editor
    var selectionState = editorState.getSelection();
    var anchorKey = selectionState.getAnchorKey();
    var currentContentBlock = content.getBlockForKey(anchorKey);
    var start = selectionState.getStartOffset();
    var end = selectionState.getEndOffset();
    var selectedText = currentContentBlock.getText().slice(start, end);

    // Uses the Draft.js API to create a new entity with the right data.
    const contentWithEntity = content.createEntity(entityType.type, 'IMMUTABLE', {
        term: value,
    });

    const entityKey = contentWithEntity.getLastCreatedEntityKey();

    // Add some text for the entity to be activated on.
    const text = `${selectedText}`;

    const newContent = Modifier.replaceText(content, selection, text, null, entityKey);
    const nextState = EditorState.push(editorState, newContent, 'insert-characters');

    onComplete(nextState);
  }

  handleClose() {
    this.props.onComplete();
  }

  render() {
    return React.createElement(GlossaryEntity, {
      handleChange: this.handleChange,
      handleClose: this.handleClose
    });
  }
}

// This adds additional 'term' class to the editor
// to add custom editor styles inside customize-editor.css
const Glossary = (props) => {
  const { entityKey, contentState } = props;

  return React.createElement('b', {
    class: 'term'
  }, props.children);
};

module.exports = {
  type: 'GLOSSARY',
  source: GlossarySource,
  decorator: Glossary
};
