const React = window.React;
const Modifier = window.DraftJS.Modifier;
const EditorState = window.DraftJS.EditorState;

const DEMO_GLOSSARY = ['AMD', 'AAPL', 'TWTR', 'TSLA', 'BTC'];

// Not a real React component – just creates the entities as soon as it is rendered.
class GlossarySource extends React.Component {
    componentDidMount() {
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
            term: selectedText,
        });
        const entityKey = contentWithEntity.getLastCreatedEntityKey();

        // We also add some text for the entity to be activated on.
        const text = `${selectedText}`;

        const newContent = Modifier.replaceText(content, selection, text, null, entityKey);
        const nextState = EditorState.push(editorState, newContent, 'insert-characters');

        onComplete(nextState);
    }

    render() {
        return null;
    }
}

const Glossary = (props) => {
    const { entityKey, contentState } = props;
    //const data = contentState.getEntity(entityKey).getData();

    return React.createElement('b', {
        class: 'term'
    }, props.children);
};

window.draftail.registerPlugin({
    type: 'GLOSSARY',
    source: GlossarySource,
    decorator: Glossary,
});