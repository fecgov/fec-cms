const React = require('react');

function Pagination(props) {
  function interceptHandleChange(increment) {
    const syntheticEvent = { target: { name: 'from_hit', value: props.from_hit + increment } };
    props.handleChange(syntheticEvent);
  }

  return props.resultCount > 0 ? <div className="results-info">
          <div className="dataTables_info">
          {props.from_hit + 1}&ndash;{props.from_hit + props.advisory_opinions.length} of {props.resultCount}</div>
          <div className="dataTables_paginate">
            {props.from_hit > 0 ? <a className="paginate_button previous"
             onClick={() => interceptHandleChange(-props.advisory_opinions.length)}>Previous</a>
              : <span className="paginate_button previous is-disabled">Previous</span> }
            {props.from_hit + props.advisory_opinions.length < props.resultCount ? <a className="paginate_button next"
             onClick={() => interceptHandleChange(props.advisory_opinions.length)}>Next</a>
              : <span className="paginate_button next is-disabled">Next</span> }
          </div>
        </div> : null
}

module.exports = Pagination;
