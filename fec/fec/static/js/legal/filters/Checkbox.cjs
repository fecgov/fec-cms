const React = require('react');
const PropTypes = require('prop-types');

function Checkbox(props) {
  return (
    <div>
      <input
        type="checkbox"
        id={props.name}
        name={props.name}
        onChange={props.handleChange}
        checked={props.checked}
      />
      <label htmlFor={props.name}>{props.label}</label>
    </div>
  );
}

Checkbox.defaultProps = {
  checked: false,
  handleChange: function() {},
  label: 'label',
  name: 'name'
};

Checkbox.propTypes = {
  checked: PropTypes.bool,
  handleChange: PropTypes.func,
  label: PropTypes.string,
  name: PropTypes.string
};

module.exports = Checkbox;
