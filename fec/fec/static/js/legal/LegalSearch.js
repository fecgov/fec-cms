const $ = require('jquery');
const _ = require('underscore');
const React = require('react');
const ReactDOM = require('react-dom');
const URI = require('urijs');
const Filters = require('./Filters');
const SearchResults = require('./SearchResults');
const Pagination = require('./Pagination');
const Tags = require('./Tags');

class LegalSearch extends React.Component {
  constructor(props) {
    super(props);
    const initState = URI.parseQuery(window.location.search);
    initState.q = initState.search;
    initState.type = initState.search_type;
    initState.advisory_opinions = [];
    if(initState.ao_statutory_citation && !Array.isArray(initState.ao_statutory_citation)){
      initState.ao_statutory_citation = [initState.ao_statutory_citation];
    }
    if(initState.ao_regulatory_citation && !Array.isArray(initState.ao_regulatory_citation)){
      initState.ao_regulatory_citation = [initState.ao_regulatory_citation];
    }

    if(!initState.ao_category && !(initState.ao_is_pending && initState.ao_is_pending === 'true')) {
        initState.ao_category = ['F'];
    } else if(!Array.isArray(initState.ao_category)) {
      initState.ao_category = [initState.ao_category];
    }
    initState.from_hit = initState.from_hit ? parseInt(initState.from_hit, 10) : 0;
    initState.loading = true;

    this.getResults = this.getResults.bind(this);
    this.setQuery = this.setQuery.bind(this);
    this.instantQuery = this.instantQuery.bind(this);
    this.getUserSearchCriteria = this.getUserSearchCriteria.bind(this);

    initState.lastQuery = this.getUserSearchCriteria(initState);
    this.state = initState;
  }

  componentDidMount() {
    this.getResults();
  }

  setQuery(e, callback) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const newState = {[e.target.name]: value, lastFilter: e.target.name};

    if(e.target.name !== 'from_hit') {
      newState.from_hit = 0;
    }

    // special logic: pending AOs don't have final opinions, so if they are filtering
    // by pending, we remove all document type restrictions. Document type restrictions
    // can be added afterwards to filter by other document types.
    if(e.target.name === 'ao_is_pending' && e.target.checked) {
      newState.ao_category = false;
    }

    this.setState(newState, () => {
      if(callback) {
        callback();
      }
    });
  }

  instantQuery(e) {
    this.setQuery(e, this.getResults);
  }

  getUserSearchCriteria(state) {
    const queryState = _.extend({}, state);
    queryState.search = queryState.q;
    Object.keys(queryState).forEach(function(queryParam) {
      if(['advisory_opinions',
      'resultCount',
      'lastResultCount',
      'lastFilter',
      'loading',
      'lastQuery'].indexOf(queryParam) >=0 ||
        !queryState[queryParam] ||
        queryState[queryParam].length === 0) {
        delete queryState[queryParam];
      }
    });
    return queryState;
  }

  getResults(e) {
    this.setState({'loading': true});
    if(e) {
      e.preventDefault();
    }
    let queryPath = URI(window.API_LOCATION)
                .path([window.API_VERSION, 'legal', 'search'].join('/'))
                .addQuery('api_key', window.API_KEY)
                .addQuery('type', 'advisory_opinions');

    let queryState = this.getUserSearchCriteria(this.state);
    Object.keys(queryState).forEach((queryParam) => {
      queryPath = queryPath.addQuery(queryParam, queryState[queryParam]);
    });

    const lastResultCount = this.state.resultCount;
    $.getJSON(queryPath.toString(), (results) => {
                  this.setState({ advisory_opinions: results.advisory_opinions,
                  resultCount: results.total_advisory_opinions,
                  lastResultCount,
                  loading: false,
                  lastQuery: this.getUserSearchCriteria(this.state)}, () => {
                    queryPath = queryPath.removeSearch('api_key');
                    window.history.pushState(URI.parseQuery(queryPath.query()),
                      null, queryPath.search().toString());
                  });
      });
  }

  render() {
    return <section className="main__content--full data-container__wrapper">
      <div id="filters" className="filters is-open">
        <button className="filters__header filters__toggle js-filter-toggle" type="button">
          <span className="filters__title">Edit filters</span>
        </button>
        <div className="filters__content">
          <Filters query={this.state} setQuery={this.setQuery}
                getResults={this.getResults} instantQuery={this.instantQuery} />
        </div>
      </div>
      <div id="results-aos" className="content__section data-container">
        <div className="data-container__widgets">
          <div className="data-container__head">
            <h1 className="data-container__title">Advisory opinions</h1>
          </div>
          <Tags query={this.state.lastQuery} resultCount={this.state.resultCount} handleRemove={this.instantQuery} />
          <div className="u-padding--left u-padding--right">
            <div className="message message--info">
              <h3>This feature is still in progress</h3>
              <p>We&#39;re actively building the <strong>advisory opinion search</strong>, and it doesn&#39;t yet include some
              advanced search functions. If you can&#39;t find what you&#39;re looking for, you can still <a href="http://saos.fec.gov/saos/searchao">search
              opinions on the old fec.gov</a>.</p>
            </div>
          </div>
        </div>
        <SearchResults advisory_opinions={this.state.advisory_opinions} q={this.state.q} loading={this.state.loading} />
        <Pagination from_hit={this.state.from_hit} advisory_opinions={this.state.advisory_opinions}
          resultCount={this.state.resultCount} handleChange={this.instantQuery} />
      </div>
    </section>
}
}

module.exports = LegalSearch;
