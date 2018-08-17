import React from 'react';
import PropTypes from 'prop-types';
import { EditorState, Modifier } from 'draft-js';
import Modal from './components/Modal';
import { slugify } from './utils';

const glossaryTerms = require('../data/terms.json');
const terms = [{ term: 'Select term' }].concat(glossaryTerms);

const GlossarySelect = ({ handleChange, terms }) => {
  const options = terms.map(function(t, idx) {
    const slug = `${slugify(t.term)}-${idx}`;

    return (
      <option key={slug} value={t.term}>
        {t.term}
      </option>
    );
  });

  return (
    <select name="term-select" onChange={e => handleChange(e.target.value)}>
      {options}
    </select>
  );
};

GlossarySelect.propTypes = {
  handleChange: PropTypes.func,
  terms: PropTypes.array
};

GlossarySelect.defaultProps = {
  handleChange: function() {},
  terms: terms
};

const GlossaryEntity = ({ handleChange, handleClose, title }) => (
  <Modal handleClose={handleClose} title={title}>
    <GlossarySelect handleChange={handleChange} />
  </Modal>
);

GlossaryEntity.propTypes = {
  handleChange: PropTypes.func,
  handleClose: PropTypes.func,
  title: PropTypes.string
};

GlossaryEntity.defaultProps = {
  handleChange: function() {},
  handleClose: function() {},
  title: 'Select a glossary term!'
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
    const contentWithEntity = content.createEntity(
      entityType.type,
      'IMMUTABLE',
      {
        term: value
      }
    );

    const entityKey = contentWithEntity.getLastCreatedEntityKey();

    // Add some text for the entity to be activated on.
    const text = `${selectedText}`;

    const newContent = Modifier.replaceText(
      content,
      selection,
      text,
      null,
      entityKey
    );
    const nextState = EditorState.push(
      editorState,
      newContent,
      'insert-characters'
    );

    onComplete(nextState);
  }

  handleClose() {
    this.props.onComplete();
  }

  render() {
    return (
      <GlossaryEntity
        handleChange={this.handleChange}
        handleClose={this.handleClose}
      />
    );
  }
}

GlossarySource.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.func
  ]),
  editorState: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  entityType: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  onComplete: PropTypes.oneOfType([PropTypes.object, PropTypes.func])
};

const Glossary = ({ children }) => <b className="term">{children}</b>;

Glossary.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.func
  ])
};

module.exports = {
  type: 'GLOSSARY',
  source: GlossarySource,
  decorator: Glossary
};
