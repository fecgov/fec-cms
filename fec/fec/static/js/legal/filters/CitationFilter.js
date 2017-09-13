const React = require('react');
const URI = require('urijs');
const $ = require('jquery');
const Checkbox = require('./Checkbox');

class CitationFilter extends React.Component {
    constructor(props) {
      super(props);
      this.state = { citations: [], dropdownVisible: false, currentValue: '', highlightCitation: 0 }
      this.interceptChange = this.interceptChange.bind(this);
      this.setSelection = this.setSelection.bind(this);
      this.dropdownDisplay = this.dropdownDisplay.bind(this);
      this.hideDropdown = this.hideDropdown.bind(this);
      this.getFilterAddedText = this.getFilterAddedText.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
      this.handleMouseOver = this.handleMouseOver.bind(this);
    }

    interceptChange(e) {
        if(e.target.value) {
          const path = URI(window.API_LOCATION)
                      .path([window.API_VERSION, 'legal', 'citation', this.props.citationType, e.target.value].join('/'))
                      .addQuery('api_key', window.API_KEY);
          $.getJSON(path.toString(), (result) => {
            this.setState({citations: result.citations, dropdownVisible: true});
          });
        } else {
          this.setState({citations: [], dropdownVisible: false});
        }

        this.setState({currentValue: e.target.value, highlightCitation: 0});
    }

    setSelection(citation) {
      const citationTags = this.props.value || [];
      citationTags.push(citation)
      const syntheticEvent = { target: {name: this.props.name, value: citationTags } };
      this.props.instantQuery(syntheticEvent);
      this.setState({dropdownVisible: false, currentValue: '', lastAction: "added"});
    }

    dropdownDisplay() {
      return this.state.dropdownVisible ? 'block' : 'none';
    }

    hideDropdown(e) {
      this.setState({dropdownVisible: false});
    }

    removeCitation(citationText) {
      const value = this.props.value;
      value.splice(this.props.value.indexOf(citationText), 1);
      const syntheticEvent = {target: { name: this.props.name,
        value } }
      this.props.instantQuery(syntheticEvent);
      this.setState({lastAction: "removed"});
    }

    getFilterAddedText() {
      if(this.props.resultCountChange < 0) {
        return (-this.props.resultCountChange).toString() + " fewer results."
      } else if(this.props.resultCountChange > 0) {
        return this.props.resultCountChange.toString() + " more results."
      } else {
        return "Same number of results."
      }
    }

    handleMouseOver(index) {
      return (e) => {
        this.setState({ highlightCitation: index });
      }
    }

    handleKeydown(e) {
      let highlightCitation = this.state.highlightCitation;

      if(this.state.dropdownVisible) {
        // down arrow or tab
        if(e.keyCode === 40 || e.keyCode === 9) {
          e.preventDefault();
          if(highlightCitation < this.state.citations.length - 1) {
            this.setState({ highlightCitation: highlightCitation + 1 });
          } else {
            this.setState({ highlightCitation: 0 });
          }
        }

        // up arrow
        if(e.keyCode === 38) {
          if(highlightCitation > 0) {
            this.setState({ highlightCitation: highlightCitation - 1 });
          } else {
            this.setState({ highlightCitation: this.state.citations.length - 1 });
          }
        }

        // enter
        if(e.keyCode === 13) {
          this.setSelection(this.state.citations[this.state.highlightCitation].citation_text);
        }
      }
    }

    render() {
      return <div className="filter" onBlur={this.hideDropdown} onKeyDown={this.handleKeydown}>
          <label className="label" htmlFor={this.props.name + "-filter"}>{this.props.label}</label>
          {this.props.value && this.props.value.map(citationText => {
            return <Checkbox key={citationText} name={citationText} label={citationText}
            checked={true} handleChange={() => this.removeCitation(citationText)} />
          })}
          {this.props.lastFilter === this.props.name &&
            <div className="filter__message filter__message--success"><div>Filter {this.state.lastAction} &#x2713;</div><div>{this.getFilterAddedText()}</div></div>}
          <div className="combo combo--search--mini"  style={{position: 'relative', display: 'block'}}>
            <input id={this.props.name + "-filter"} type="text" name={this.props.name} className="combo__input"
                value={this.state.currentValue} onChange={this.interceptChange} />
          <div className="tt-menu" aria-live="polite"
           style={{position: 'absolute', top: '100%', left: '0px', zIndex: 100, display: this.dropdownDisplay()}}>
          <div className="tt-dataset tt-dataset-candidate">
          <span className="tt-suggestion__header">Select a citation:</span>
          {this.state.citations.map((citation, index) => {
              return <div key={citation.citation_text} onMouseDown={() => this.setSelection(citation.citation_text)}
                onMouseOver={this.handleMouseOver(index)} className="selectCitation">
                <span className={"tt-suggestion tt-selectable" + (this.state.highlightCitation === index && ' tt-cursor')}>
              <span className="tt-suggestion__name">{citation.citation_text}</span>
              {citation.formerly && <span className="tt-suggestion__office">(formerly {citation.formerly})</span>}
              </span></div>
            })}
          </div></div></div></div>
}}

module.exports = CitationFilter;
