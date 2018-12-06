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
      <div className="filter">
        <label
          className="label t-inline-block"
          htmlFor={props.name + '-filter'}
        >
          {props.label}
        </label>
        {props.TooltipHelp.addTooltip && (
          <TooltipHelp
            message={props.TooltipHelp.message}
            verticalPosition={props.TooltipHelp.verticalPosition}
            horizontalPosition={props.TooltipHelp.horizontalPosition}
          />
        )}
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
          <span className="t-note t-sans search__example">
            {props.helpText}
          </span>
        )}
      </div>
    </div>
  );
}

TextFilter.defaultProps = {
  getResults: function() {},
  handleChange: function() {},
  helpText: '',
  keywordModal: true,
  TooltipHelp: {},
  name: 'name',
  value: ''
};

TextFilter.propTypes = {
  getResults: PropTypes.func,
  handleChange: PropTypes.func,
  helpText: PropTypes.string,
  keywordModal: PropTypes.bool,
  TooltipHelp: PropTypes.object,
  name: PropTypes.string,
  value: PropTypes.string
};

module.exports = TextFilter;
