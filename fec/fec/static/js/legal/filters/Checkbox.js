const React = require('react');

function Checkbox(props) {
  return <div><input type="checkbox" id={props.name} name={props.name}
    onChange={props.handleChange} checked={props.checked} />
  <label htmlFor={props.name}>{props.label}</label></div>
}

module.exports = Checkbox;
