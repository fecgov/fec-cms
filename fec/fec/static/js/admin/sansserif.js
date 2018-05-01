const React = window.React;
const Modifier = window.DraftJS.Modifier;
const EditorState = window.DraftJS.EditorState;


// Not a real React component – just creates the entities as soon as it is rendered.
class StockSource extends React.Component {
    componentDidMount() {
        const { editorState, entityType, onComplete } = this.props;
        const content = editorState.getCurrentContent();
        const selection = editorState.getSelection();


        // Uses the Draft.js API to create a new entity with the right data.
        const contentWithEntity = content.createEntity(entityType.type, 'IMMUTABLE', {
        });
        const entityKey = contentWithEntity.getLastCreatedEntityKey();

 
        const nextState = EditorState.push(editorState, content, 'insert-characters');

        onComplete(nextState);
    }

    render() {
        return null;
    }
}

const Stock = (props) => {
    const { entityKey, contentState } = props;
    const data = contentState.getEntity(entityKey).getData();
    console.log('props', props);
        console.log('data'. data);


    return React.createElement('span', {
        className: 't-sans',
    }, props.children);
};

window.draftail.registerPlugin({
    type: 'STOCK',
    source: StockSource,
    decorator: Stock,
});