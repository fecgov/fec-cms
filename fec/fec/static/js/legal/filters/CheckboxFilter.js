const React = require('react');
const Checkbox = require('./Checkbox');

function CheckboxFilter(props) {
    return <div className="filter">
      <Checkbox name={props.name} handleChange={props.handleChange}
        checked={props.checked || false} label={props.label} />
    </div>
}

module.exports = CheckboxFilter;
