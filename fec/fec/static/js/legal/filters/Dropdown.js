const React = require('react');
const PropTypes = require('prop-types');

function Dropdown(props) {
  function handleDropdownChange(e) {
    const value = e.target.value === '0' ? '' : e.target.value;
    props.handleChange({ target: { name: props.name, value: value } });
  }

  return (
    <div className="filter">
      <label htmlFor={props.name} className="label">
        {props.label}
      </label>
      <select id={props.name} name={props.name} onChange={handleDropdownChange}>
        {props.options.map(option => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
    </div>
  );
}

Dropdown.defaultProps = {
  handleChange: function() {},
  label: '',
  name: '',
  options: [],
  value: ''
};

Dropdown.propTypes = {
  handleChange: PropTypes.func,
  label: PropTypes.string,
  name: PropTypes.string,
  options: PropTypes.array,
  value: PropTypes.string
};

module.exports = Dropdown;
