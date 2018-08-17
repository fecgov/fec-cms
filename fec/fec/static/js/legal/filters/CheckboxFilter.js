const React = require('react');
const PropTypes = require('prop-types');
const Checkbox = require('./Checkbox');

function CheckboxFilter(props) {
  return (
    <div className="filter">
      <Checkbox
        name={props.name}
        handleChange={props.handleChange}
        checked={props.checked || false}
        label={props.label}
      />
    </div>
  );
}

CheckboxFilter.propTypes = {
  checked: false,
  handleChange: function() {},
  label: 'label',
  name: 'name'
};

CheckboxFilter.propTypes = {
  checked: PropTypes.bool,
  handleChange: PropTypes.func,
  label: PropTypes.string,
  name: PropTypes.string
};

module.exports = CheckboxFilter;
