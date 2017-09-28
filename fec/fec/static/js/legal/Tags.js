const React = require('react');
const _ = require('underscore');
const requestorOptions = require('./requestorOptions');
const documentTypes = require('./documentTypes');


function Tags(props) {
  const namedFields = [];
  Array.prototype.push.apply(namedFields, requestorOptions);
  Array.prototype.push.apply(namedFields, documentTypes);
  namedFields.push({value: 'ao_is_pending', text: "Pending"});
  var citationRequireAll = props.query.ao_citation_require_all && props.query.ao_citation_require_all !== 'false';

  function removeQuery(name, value) {
    function handleRemove(e) {
      var newEvent;
      if(Array.isArray(props.query[name])) {
        let currentValues = _.extend(props.query[name]);
        currentValues.splice(currentValues.indexOf(value), 1);
        if(currentValues.length === 0) {
          newEvent = {target: { name, value: false } };
        } else {
          newEvent = { target: { name, value: currentValues } }
        }
      } else {
        newEvent = { target: { name, value: false } };
      }
      props.handleRemove(newEvent);
    }

    return handleRemove;
  }

  function getTag(name, value) {
    var tagText;
    if(["true", "false", true, false].indexOf(value) >= 0) {
      value = name;
    }

    if (namedFields.filter(val => val.value === value).length > 0) {
      tagText = namedFields.filter(val => val.value === value)[0].text;
    } else {
      tagText = value;
    }

    return <div key={name + '-' + tagText} className="tag__item">{tagText}
        <button className="button tag__remove" onClick={removeQuery(name, value)}><span className="u-visually-hidden">Remove</span></button>
      </div>
  }

  function getTagCategory(query, tagName) {
    if(Array.isArray(query[tagName])) {
      function getArrayTagClasses() {
        var classes = "tag__category";
        if(tagName.indexOf('citation') >= 0 && citationRequireAll) {
          classes += " tag__category--and";
        }
        return classes;
      }
      return <li key={tagName} className={getArrayTagClasses()}>{query[tagName].map(val => getTag(tagName, val))}</li>
    } else if(tagName.indexOf("date") >= 0) {
      if(query[tagName].min && query[tagName].max) {
        return <li key={tagName} className="tag__category tag__category__range--date">
        {[getTag(query[tagName].minName, query[tagName].min), getTag(query[tagName].maxName, query[tagName].max)]}</li>
      } else if(query[tagName].min) {
        return <li key={tagName} className="tag__category">{getTag(query[tagName].minName, 'Beginning ' + query[tagName].min)}</li>
      } else {
        return <li key={tagName} className="tag__category">{getTag(query[tagName].maxName, 'Ending ' + query[tagName].max)}</li>
      }
    } else {
      return <li key={tagName} className="tag__category">{getTag(tagName, query[tagName])}</li>;
    }
  }

  function getTagCategories() {
    let query = _.extend({}, props.query);
    const excludedFields = ['from_hit', 'search', 'type', 'search_type', 'ao_citation_require_all']
    excludedFields.forEach(fieldName => delete query[fieldName]);

    if(query.ao_min_issue_date || query.ao_max_issue_date) {
      query.issue_date = {min: query.ao_min_issue_date,
                          minName: 'ao_min_issue_date',
                          max: query.ao_max_issue_date,
                          maxName: 'ao_max_issue_date'};
      delete query.ao_min_issue_date;
      delete query.ao_max_issue_date
    }
    if(query.ao_min_request_date || query.ao_max_request_date) {
      query.request_date = {min: query.ao_min_request_date,
                            minName: 'ao_min_request_date',
                            max: query.ao_max_request_date,
                            maxName: 'ao_max_request_date'};
      delete query.ao_min_request_date
      delete query.ao_max_request_date
    }
    return Object.keys(query).map((tagName) => {
        return getTagCategory(query, tagName)

    });
  }

  if(getTagCategories()) {
    return <div className="data-container__tags"><div className="row"><h3 className="tags__title">
    Viewing <span className="tags__count">{props.resultCount}</span> {(getTagCategories().length > 0) ? " filtered results for:" : " results"}
    </h3></div>
    <ul className="tags">
        {getTagCategories()}
        </ul></div>
    } else {
      return;
    }
}

module.exports = Tags
