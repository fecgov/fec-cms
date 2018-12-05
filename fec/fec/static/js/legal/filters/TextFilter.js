const React = require('react');
const PropTypes = require('prop-types');
const TooltipHelp = require('./TooltipHelp');

function TextFilter(props) {
  function handleKeydown(e) {
    if (e.keyCode === 13) {
      props.getResults();
    }
  }

  return (
    <div>
    <TooltipHelp message={'Hello, I am a super cool tooltip'} position={'top'}></TooltipHelp>
    <div className="filter">
      <label className="label" htmlFor={props.name + '-filter'}>
        {props.label}
      </label>
      <div className="combo combo--search--mini">
        <input
          id={props.name + '-filter'}
          type="text"
          name={props.name}
          className="combo__input"
          value={props.value || ''}
          onChange={props.handleChange}
          onKeyDown={handleKeydown}
        />
        <button
          className="combo__button button--search button--standard"
          onClick={props.getResults}
        >
          <span className="u-visually-hidden">Search</span>
        </button>
      </div>
      {props.keywordModal && (
        <button
          className="button--keywords"
          aria-controls="keyword-modal"
          data-a11y-dialog-show="keyword-modal"
        >
          More keyword options
        </button>
      )}
      {props.helpText && (
        <span className="t-note t-sans search__example">{props.helpText}</span>
      )}
    </div>
    </div>
  );
}

TextFilter.defaultProps = {
  getResults: function() {},
  handleChange: function() {},
  helpText: 'help',
  keywordModal: true,
  TooltipHelp : false,
  name: 'name',
  value: ''
};

TextFilter.propTypes = {
  getResults: PropTypes.func,
  handleChange: PropTypes.func,
  helpText: PropTypes.string,
  keywordModal: PropTypes.bool,
  TooltipHelp : PropTypes.bool,
  name: PropTypes.string,
  value: PropTypes.string
};

module.exports = TextFilter;
