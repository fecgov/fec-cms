const React = require('react');

function TextFilter(props) {

  function handleKeydown(e) {
     if (e.keyCode === 13) {
       props.getResults();
     }
   }

  return <div className="filter">
      <label className="label" htmlFor={props.name + "-filter"}>{props.label}</label>
      <div className="combo combo--search--mini">
        <input id={props.name + "-filter"} type="text" name={props.name} className="combo__input"
            value={props.value || ''} onChange={props.handleChange} onKeyDown={handleKeydown}/>
        <button className="combo__button button--search button--standard"
         onClick={props.getResults}>
          <span className="u-visually-hidden">Search</span>
        </button>
      </div>
      {props.keywordModal &&
        <button
          aria-controls="spending-modal"
          data-a11y-dialog-show="keyword-modal">More keyword options</button>
      }
      {props.helpText && <span className="t-note t-sans search__example">
        {props.helpText}</span>}
    </div>
}

module.exports = TextFilter;
