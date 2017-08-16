const React = require('react');


function CheckboxList(props) {
  function handleCheckboxListChange(e) {
    const newEvent = { target: { name: props.name, value: props.value} };

    // value should be set to an array of values. If the array is empty,
    // it will be removed from query in the LegalSearch compenent.
    if (newEvent.target.value) {
      if(newEvent.target.value.indexOf(e.target.value) >= 0) {
        newEvent.target.value.splice(props.value.indexOf(e.target.value), 1);
      } else {
        newEvent.target.value.push(e.target.value);
      }
    } else {
        newEvent.target.value = [e.target.value];
    }

    props.handleChange(newEvent);
  }

  return <div className="filter">
    <legend className="label">{props.label}</legend>
    {props.options.map((option) => {
      return <div key={option.value}>
              <input type="checkbox" id={`${props.name}_${option.value}`} name={props.name}
                checked={props.value && props.value.indexOf(option.value) >= 0} value={option.value} onChange={handleCheckboxListChange} />
              <label htmlFor={`${props.name}_${option.value}`}>{option.text}</label>
            </div>
    })}
  </div>

}

module.exports = CheckboxList;
