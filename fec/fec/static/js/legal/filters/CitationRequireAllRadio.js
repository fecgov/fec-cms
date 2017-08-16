const React = require('react')

function CitationRequireAllRadio(props) {
  const require_all = props.value === "true";
  return <div>
    <label>If more than one citation is entered:</label>
    <input type="radio" id="citation_require_all_false" name={props.name}
      onChange={props.handleChange} value={false} checked={!require_all} />
    <label htmlFor="citation_require_all_false">Show cases citing any of them</label>
    <input type="radio" id="citation_require_all_true" name={props.name}
      onChange={props.handleChange} value={true} checked={require_all} />
    <label htmlFor="citation_require_all_true">Show cases citing all of them</label>
  </div>
}

module.exports = CitationRequireAllRadio;
