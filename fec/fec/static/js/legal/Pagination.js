const React = require('react');

function Pagination(props) {
  function interceptHandleChange(offset) {
    
    // from_hit is a zero-based index
    let updatedFromHit = props.from_hit + offset;

    // when from_hit is less than 0, reset to 0 (ensures no negative value)
    if (updatedFromHit < 0) {
      updatedFromHit = 0;
    } 
    // ensures that from_hit is less than result count
    else if (updatedFromHit >= props.resultCount) {
      updatedFromHit = props.resultCount - 1;
    }

    // create an event to update from_hit
    const syntheticEvent = { 
      target: { 
        name: 'from_hit', 
        value: updatedFromHit 
      }
    };
    props.handleChange(syntheticEvent);
  }

  return props.resultCount > 0 ? <div className="results-info">
          <div className="dataTables_info">
          {props.from_hit + 1}&ndash;{props.from_hit + props.advisory_opinions.length} of {props.resultCount}</div>
          <div className="dataTables_paginate">
            {props.from_hit > 0 ? <a className="paginate_button previous"
             onClick={() => interceptHandleChange(-20)}>Previous</a>
              : <span className="paginate_button previous is-disabled">Previous</span> }
            {props.from_hit + props.advisory_opinions.length < props.resultCount ? <a className="paginate_button next"
             onClick={() => interceptHandleChange(20)}>Next</a>
              : <span className="paginate_button next is-disabled">Next</span> }
          </div>
        </div> : null
}

module.exports = Pagination;
