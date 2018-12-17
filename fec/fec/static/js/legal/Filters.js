const React = require('react');
const PropTypes = require('prop-types');
const Dropdown = require('./filters/Dropdown');
const TextFilter = require('./filters/TextFilter');
const CheckboxFilter = require('./filters/CheckboxFilter');
const CheckboxList = require('./filters/CheckboxList');
const DateFilter = require('./filters/DateFilter');
const CitationFilter = require('./filters/CitationFilter');
const CitationRequireAllRadio = require('./filters/CitationRequireAllRadio');
const FilterPanel = require('./FilterPanel');
const requestorOptions = require('./requestorOptions');
const documentTypes = require('./documentTypes');

function Filters(props) {
  const resultCountChange =
    props.query.resultCount - props.query.lastResultCount;

  return (
    <div>
      <div className="accordion__content">
        <TextFilter
          key="ao_no"
          name="ao_no"
          label="AO number"
          value={props.query.ao_no}
          handleChange={props.setQuery}
          getResults={props.getResults}
        />
        <TextFilter
          key="ao_requestor"
          name="ao_requestor"
          label="Requestor Name (or AO Name)"
          value={props.query.ao_requestor}
          handleChange={props.setQuery}
          getResults={props.getResults}
        />
        <Dropdown
          key="ao_requestor_type"
          name="ao_requestor_type"
          label="Requestor Type"
          value={props.query.ao_requestor_type}
          options={requestorOptions}
          handleChange={props.instantQuery}
        />
      </div>
      <ul className="accordion--neutral" data-content-prefix="first">
        <FilterPanel id="first-content-0" header="Documents" startOpen={true}>
          <TextFilter
            key="q"
            name="q"
            label="Keywords"
            value={props.query.q}
            handleChange={props.setQuery}
            getResults={props.getResults}
            keywordModal={true}
            TooltipHelp={{
              addTooltip: true,
              message:
                'Refine a keyword search by using AND, OR, “ ”, -, to expand or limit results.',
              verticalPosition: 'above',
              horizontalPosition: 'left'
            }}
          />
          <CheckboxFilter
            key="ao_is_pending"
            name="ao_is_pending"
            label="Show only pending requests"
            checked={props.query.ao_is_pending}
            handleChange={props.instantQuery}
          />
          <CheckboxList
            key="ao_category"
            name="ao_category"
            label="Document Type"
            value={props.query.ao_category}
            handleChange={props.instantQuery}
            options={documentTypes}
          />
        </FilterPanel>
        <FilterPanel id="first-content-1" header="Citations">
          <CitationRequireAllRadio
            key="ao_citation_require_all"
            name="ao_citation_require_all"
            handleChange={props.instantQuery}
            value={props.query.ao_citation_require_all}
          />
          <CitationFilter
            handleChange={props.setQuery}
            getResults={props.getResults}
            key="ao_regulatory_citation"
            name="ao_regulatory_citation"
            label="Regulatory citation"
            instantQuery={props.instantQuery}
            citationType="regulation"
            value={props.query.ao_regulatory_citation}
            resultCountChange={resultCountChange}
            lastFilter={props.query.lastFilter}
          />
          <CitationFilter
            handleChange={props.setQuery}
            getResults={props.getResults}
            key="ao_statutory_citation"
            name="ao_statutory_citation"
            label="Statutory citation"
            instantQuery={props.instantQuery}
            citationType="statute"
            value={props.query.ao_statutory_citation}
            resultCountChange={resultCountChange}
            lastFilter={props.query.lastFilter}
          />
        </FilterPanel>
        <FilterPanel id="first-content-2" header="Time period">
          <DateFilter
            key="issue_date"
            label="Issued date"
            min_name="ao_min_issue_date"
            max_name="ao_max_issue_date"
            min_value={props.query.ao_min_issue_date}
            max_value={props.query.ao_max_issue_date}
            instantQuery={props.instantQuery}
            setQuery={props.setQuery}
          />
          <DateFilter
            key="request_date"
            label="Request date"
            min_name="ao_min_request_date"
            max_name="ao_max_request_date"
            min_value={props.query.ao_min_request_date}
            max_value={props.query.ao_max_request_date}
            instantQuery={props.instantQuery}
            setQuery={props.setQuery}
          />
        </FilterPanel>
        <FilterPanel id="first-content-3" header="Other entities">
          <TextFilter
            key="ao_entity_name"
            name="ao_entity_name"
            label="Entity name"
            value={props.query.ao_entity_name}
            handleChange={props.setQuery}
            getResults={props.getResults}
            helpText="Search any individuals or groups involved in the opinion."
          />
        </FilterPanel>
      </ul>
    </div>
  );
}

Filters.propTypes = {
  getResults: function() {},
  instantQuery: function() {},
  query: {
    resultCount: 0,
    lastResultCount: 0,
    ao_no: '',
    ao_requestor: '',
    ao_requestor_type: '',
    q: '',
    ao_is_pending: false,
    ao_category: '',
    ao_citation_require_all: '',
    ao_regulatory_citation: [],
    lastFilter: '',
    ao_statutory_citation: [],
    ao_min_issue_date: new Date(),
    ao_max_issue_date: new Date(),
    ao_min_request_date: new Date(),
    ao_max_request_date: new Date(),
    ao_entity_name: ''
  },
  setQuery: function() {}
};

Filters.propTypes = {
  getResults: PropTypes.func,
  instantQuery: PropTypes.func,
  query: PropTypes.shape({
    resultCount: PropTypes.number,
    lastResultCount: PropTypes.number,
    ao_no: PropTypes.string,
    ao_requestor: PropTypes.string,
    ao_requestor_type: PropTypes.string,
    q: PropTypes.string,
    ao_is_pending: PropTypes.bool,
    ao_category: PropTypes.string,
    ao_citation_require_all: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.string
    ]),
    ao_regulatory_citation: PropTypes.array,
    lastFilter: PropTypes.string,
    ao_statutory_citation: PropTypes.array,
    ao_min_issue_date: PropTypes.instanceOf(Date),
    ao_max_issue_date: PropTypes.instanceOf(Date),
    ao_min_request_date: PropTypes.instanceOf(Date),
    ao_max_request_date: PropTypes.instanceOf(Date),
    ao_entity_name: PropTypes.string
  }),
  setQuery: PropTypes.func
};

module.exports = Filters;
