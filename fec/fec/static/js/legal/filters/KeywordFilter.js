const React = require('react');

class KeywordFilter extends React.Component {
  constructor(props) {
    super(props);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.submitQuery = this.submitQuery.bind(this);
    this.combineValues = this.combineValues.bind(this);
  }

  /**
   * Handle "enter" events in the text input
   * Get the value of the input and then clear the input
   */
  handleKeydown(e) {
    if (e.keyCode === 13) {
      this.submitQuery(e.target.value);
    }
  }

  /**
   * Handle clicking the submit button
   * Get the value of the input and then clear the input
   */
  handleSubmit(e) {
    e.preventDefault();
    this.submitQuery(e.target.previousSibling.value);
  }

  /**
   * Trigger an instant query using the combined values of all checkboxes
   */
  submitQuery(value) {
    const combinedValues = this.combineValues();
    const syntheticEvent = {
      target: {
        name: this.props.name,
        value
      }
    }
    this.props.instantQuery(syntheticEvent);
    // this.setState({lastAction: "removed"});
  }

  /**
   * Combine all of the values of the selected checkboxes into a single query string
   */
  combineValues() {
    let combinedValue = '';
    for (let i = 0; i < this.state.checkboxValues.length; i++) {
      if (this.state.checkboxValues[i].checked) {
        let checkValue = this.state.checkboxValues[i].value;
        if (!combinedValue) {
          combinedValue = checkValue;
        } else {
          combinedValue = combinedValue + '+' + checkValue;
        }
      }
    }

    return combinedValue;
  }

  /**
   * Open the advanced keyword modal
   */
  openModal() {

  }

  render() {
    return <div className="filter">
        <label className="label" htmlFor={this.props.name + "-filter"}>{this.props.label}</label>
        <div className="combo combo--search--mini">
          <input id={this.props.name + "-filter"} type="text" name={this.props.name} className="combo__input"
              onChange={this.props.handleChange} onKeyDown={this.handleKeydown}/>
          <button className="combo__button button--search button--standard"
           onClick={this.handleSubmit}>
            <span className="u-visually-hidden">Search</span>
          </button>
        </div>
        <button aria-controls="spending-modal" data-a11y-dialog-show="keyword-modal">More keyword options</button>
        {this.props.helpText && <span className="t-note t-sans search__example">
          {this.props.helpText}</span>}
      </div>
  }
}

module.exports = KeywordFilter;
