const React = require('react');

function Dropdown(props) {
  function handleDropdownChange(e) {
    const value = e.target.value === '0' ? '' : e.target.value;
    props.handleChange({ target: { name: props.name, value: value } });
  }

  return <div className="filter">
          <label htmlFor={props.name} className="label">{props.label}</label>
          <select id={props.name} name={props.name} onChange={handleDropdownChange}>
            {props.options.map(option => <option key={option.value} value={option.value}>{option.text}</option>)}
          </select>
          </div>
}

module.exports = Dropdown;
