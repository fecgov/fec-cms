const React = require('react');
const InputElement = require('react-input-mask')

function DateFilter(props) {
  function interceptHandleChange(e) {
    if(new RegExp("[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]").test(e.target.value) || e.target.value === '') {
      props.instantQuery(e);
    } else {
      props.setQuery(e);
    }
  }

  return <fieldset className="filter">
    <legend className="label">{props.label}</legend>
    <div className="range range--date js-date-range">
      <div className="range__input range__input--min" data-filter="range">
        <label htmlFor={props.min_name}>Beginning</label>
        <InputElement mask="99/99/9999" id={props.min_name} name={props.min_name} value={props.min_value || ''}
          onChange={interceptHandleChange} placeholder="mm/dd/yyyy" />
      </div>
      <div className="range__hyphen">-</div>
      <div className="range__input range__input--max" data-filter="range">
        <label htmlFor={props.max_name}>Ending</label>
        <InputElement mask="99/99/9999" id={props.max_name} name={props.max_name} value={props.max_value || ''}
        onChange={interceptHandleChange} placeholder="mm/dd/yyyy" />
      </div>
    </div>
  </fieldset>
}

module.exports = DateFilter;
