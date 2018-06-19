const React = window.React;
const Modifier = window.DraftJS.Modifier;
const EditorState = window.DraftJS.EditorState;

const terms = [
    {"term": "Select term"},
    {"term": "Act"},{"term": "Administrative expense"},{"term": "Advance"},{"term": "Advisory opinion (AO)"},
    {"term": "Affiliated committees"},{"term": "Agent (of a candidate)"},{"term": "Agent (of a party)"},
    {"term": "Allocation account"},{"term": "Authorized committee"},{"term": "Bundled contribution"},
    {"term": "Campaign traveler"},{"term": "Candidate"},{"term": "Candidate ID"},{"term": "Cash-on-hand"},
    {"term": "CFR"},{"term": "Clearly identified candidate"},{"term": "Commercial vendor"},
    {"term": "Committee type"},{"term": "Communications filers"},{"term": "Conduit or intermediary"},
    {"term": "Connected organization"},{"term": "Contribution"},{"term": "Coordinated"},
    {"term": "Contribution in the name of another"},{"term": "Coordinated communication"},
    {"term": "Coordinated party expenditure"},{"term": "Corporation"},{"term": "Custodian of Records"},
    {"term": "Date made"},{"term": "Date received"},{"term": "Debt"},{"term": "Delegate"},
    {"term": "Delegate committee"},{"term": "Designated/designation"},{"term": "Direct mail"},
    {"term": "Disbursement"},{"term": "District"},{"term": "Disclaimer notice"},{"term": "Donation"},
    {"term": "Earmarked contribution"},{"term": "Election"},{"term": "Election cycle"},
    {"term": "Electioneering communication"},{"term": "Employer"},{"term": "Ending cash-on-hand"},
    {"term": "Executive and administrative personnel"},{"term": "Exempt party activities"},
    {"term": "Expenditure"},{"term": "Express advocacy"},
    {"term": "Facilitation"},{"term": "Family"},{"term": "Federal Election Activity (FEA)"},
    {"term": "Federal funds"},{"term": "Federal government contractor"},{"term": "Federal officeholder"},
    {"term": "Federally chartered corporation"},{"term": "Filing"},{"term": "Foreign national"},
    {"term": "Generic campaign activity"},{"term": "Get-Out-The-Vote (GOTV)"},{"term": "Hybrid PAC"},
    {"term": "Identification"},{"term": "In-kind contribution"},{"term": "Independent expenditure"},
    {"term": "Independent expenditure only committee"},{"term": "Joint contribution"},
    {"term": "Joint fundraising"},{"term": "Joint fundraising committee"},{"term": "Labor organization"},
    {"term": "Leadership PAC"},{"term": "Levin funds"},{"term": "Limited liability company (LLC)"},
    {"term": "Lobbyist/registrant"},{"term": "Lobbyist/Registrant PAC"},
    {"term": "Local or district party committee"},{"term": "Local party organization"},{"term": "Major party"},
    {"term": "Matter Under Review (MUR)"},
    {"term": "Member"},{"term": "Membership organization"},{"term": "Memo entry/memo item"},
    {"term": "Memo text"},{"term": "Multicandidate committee"},{"term": "National bank"},
    {"term": "National committee"},{"term": "National party committee"},{"term": "Net debts outstanding"},
    {"term": "Nonconnected committee"},{"term": "Non-contribution account"},{"term": "None"},
    {"term": "Nonfederal funds"},{"term": "Occupation"},{"term": "One-third rule"},
    {"term": "Ongoing committee"},{"term": "Operating expenditures"},{"term": "Ordinary course of business"},
    {"term": "Organization type"},{"term": "Overnight delivery service"},{"term": "Party committee"},
    {"term": "PASO"},{"term": "Person"},{"term": "Personal funds of a candidate"},
    {"term": "Political Action Committee (PAC)"},
    {"term": "Political committee"},{"term": "Political party"},{"term": "Postmarked"},
    {"term": "Presidential public funds"},{"term": "Principal campaign committee"},{"term": "Prior approval"},
    {"term": "Public communication"},{"term": "Qualified/non-qualified"},{"term": "Reattributed contribution"},
    {"term": "Receipt"},{"term": "Redesignated contribution"},{"term": "Refunded contribution"},
    {"term": "Reports, designations and statements"},{"term": "Restricted class/solicitable class"},
    {"term": "Separate segregated fund (SSF)"},{"term": "Solicitation (SSF)"},{"term": "Special election"},
    {"term": "State party committee"},{"term": "Status"},{"term": "Stockholder"},{"term": "Super PAC"},
    {"term": "Terminating committee"},{"term": "to Direct"},{"term": "to Solicit"},
    {"term": "Total disbursements"},{"term": "Total receipts"},{"term": "Trade association"},
    {"term": "Treasurer"},{"term": "Treasury funds"},{"term": "Undesignated contribution"},
    {"term": "Unique identifier"},{"term": "U.S.C."},{"term": "Usual and normal charge"},
    {"term": "Voter drive activity"},{"term": "Voter identification"},{"term": "Voter registration activity"}
];

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

class GlossaryOptions extends React.Component {
    render() {
        return React.createElement('option', {
            value: this.props.value
        }, this.props.children);
    }
}

GlossaryOptions.defaultProps = {
    value: ''
};

class GlossarySelect extends React.Component {
    render() {
        const handleChange = this.props.handleChange;

        const options = this.props.terms.map(function(t, idx) {
            const disabled = idx === 0 ? true : false;
            const slug = t.term.split(' ').join('_');

            return React.createElement(GlossaryOptions, {
                key: slug+'-'+idx,
                value: t.term
            }, t.term);
        });

        return React.createElement('select', {
            name: 'term-select',
            onChange: function(e) {
                handleChange(e.target.value);
            },
        }, options);
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

window.draftail.registerPlugin({
    type: 'GLOSSARY',
    source: GlossarySource,
    decorator: Glossary,
});
