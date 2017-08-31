const React = require('react');

const OPERATORS = ['OR', '&', '-'];

class BooleanTextFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checkboxValues: this.props.value ? [this.parseCheckboxValues(this.props.value)] : []
    }
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.submitQuery = this.submitQuery.bind(this);
    this.combineValues = this.combineValues.bind(this);
    this.parseCheckboxValues = this.parseCheckboxValues.bind(this);
  }

  /**
   * Handle "enter" events in the text input
   * Get the value of the input and then clear the input
   */
  handleKeydown(e) {
    if (e.keyCode === 13) {
      this.handleTextChange(e.target.value);
      e.target.value = '';
    }
  }

  /**
   * Handle clicking the submit button
   * Get the value of the input and then clear the input
   */
  handleSubmit(e) {
    e.preventDefault();
    this.handleTextChange(e.target.previousSibling.value);
    e.target.previousSibling.value = '';
  }

  /**
   * Takes a value for the text field and adds it to the checkboxValues state
   */
  handleTextChange(value) {
    this.setState({
      checkboxValues: this.state.checkboxValues.concat([this.parseCheckboxValues(value)])
    }, function () { this.submitQuery() });
  }

  /**
   * Trigger an instant query using the combined values of all checkboxes
   */
  submitQuery() {
    const combinedValues = this.combineValues();
    const syntheticEvent = {
      target: {
        name: this.props.name,
        value: combinedValues
      }
    }
    this.props.instantQuery(syntheticEvent);
    // this.setState({lastAction: "removed"});
  }

  /**
  * - Set the checked value to false
  * - Update state
  * - Call submitQuery()
  */
  handleCheckboxChange(e) {
    let checkboxValues = this.state.checkboxValues;
    let index = Number(e.target.dataset.index) - 1;
    checkboxValues[index].checked = e.target.checked;
    this.setState({checkboxValues: checkboxValues}, function () { this.submitQuery() });
  }

  /**
   * Return an object with all the structured data for each checkbox
   */
  parseCheckboxValues(value, checked) {
    const count = this.state ? this.state.checkboxValues.length + 1 : 0;
    let operator = 'OR';
    let operatorLabel = 'or';
    let label = value;

    if (value.split('&').length > 1) {
      operator = '&';
      operatorLabel = 'and';
      label = value.split('&')[1];
    } else if (value.split('-').length > 1) {
      operator = '-';
      operatorLabel = 'excluding';
      label = value.split('-')[1];
    }

    return {
      index: count,
      name: this.props.name,
      key: 'checkbox-' + count,
      label: label,
      value: value,
      operator: operator,
      operatorLabel: operatorLabel,
      checked: true,
      handleChange: this.handleCheckboxChange.bind(this)
    }
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

  render() {
    return <div className="filter">
        <label className="label" htmlFor={this.props.name + "-filter"}>{this.props.label}</label>
        {this.state.checkboxValues && this.state.checkboxValues.map(checkbox => {
          return <div key={checkbox.key}>
            <input type="checkbox" id={`checkbox-${checkbox.name}-${checkbox.index}`} name={checkbox.name}
            onChange={checkbox.handleChange} checked={checkbox.checked} data-index={checkbox.index} />
            <label htmlFor={`checkbox-${checkbox.name}-${checkbox.index}`}>
              <strong>{checkbox.operatorLabel}</strong> {checkbox.label}
            </label>
          </div>
        })}
        <div className="combo combo--search--mini">
          <input id={this.props.name + "-filter"} type="text" name={this.props.name} className="combo__input"
              onChange={this.props.handleChange} onKeyDown={this.handleKeydown}/>
          <button className="combo__button button--search button--standard"
           onClick={this.handleSubmit}>
            <span className="u-visually-hidden">Search</span>
          </button>
        </div>
        {this.props.helpText && <span className="t-note t-sans search__example">
          {this.props.helpText}</span>}
      </div>
  }
}

module.exports = BooleanTextFilter;
