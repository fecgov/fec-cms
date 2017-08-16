const React = require('react');
const $ = require('jquery');
const moment = require('moment');


function SearchResults(props) {
  function highlights(advisory_opinion) {
    return {__html: '&hellip;' + advisory_opinion.highlights }
  }

  function advisoryOpinionLink(no) {
    return $('#advisory_opinion_page').val().replace('ao_no', no)
  }

  function getIssueDate(advisory_opinion) {
    if(advisory_opinion.issue_date === "1900-01-01") {
      if(advisory_opinion.is_pending) {
        return "Pending";
      } else {
        return "Withdrawn";
      }
    } else {
        return moment(advisory_opinion.issue_date).format('MM/DD/YYYY');
      }
  }

  if(props.loading) {
    return <div className="overlay__container">
              <div className="overlay is-loading"></div>
          </div>
  } else {
    if(props.advisory_opinions && props.advisory_opinions.length > 0) {
      return <div className="data-container__datatable">
        <table className="simple-table simple-table--display">
          <thead className="simple-table__header">
            <tr>
              <th scope="col" className="simple-table__header-cell">Case</th>
              <th scope="col" className="simple-table__header-cell">Date issued</th>
              <th scope="col" className="simple-table__header-cell">Summary</th>
              <th scope="col" className="simple-table__header-cell">This opinion is cited by these later opinions</th>
            </tr>
          </thead>
          <tbody>
            { props.advisory_opinions.map((advisory_opinion) => {
              return <tr key={"CASE " + advisory_opinion.no} className="simple-table__row">
                <td scope="row" className="simple-table__cell"><div><i className="icon i-folder icon--inline--left"></i><strong>
                <a href={advisoryOpinionLink(advisory_opinion.no)}>AO {advisory_opinion.no}</a></strong></div>
                    <div><a href={advisoryOpinionLink(advisory_opinion.no)}>{advisory_opinion.name}</a></div>
                    { advisory_opinion.is_pending && <div><i className="icon pending-ao__icon icon--inline--left"></i>Pending request</div> }
                </td>
                <td className="simple-table__cell">{getIssueDate(advisory_opinion)}</td>
                <td className="simple-table__cell">{advisory_opinion.summary}</td>
                <td className="simple-table__cell">
                  {advisory_opinion.aos_cited_by.length > 0 ? advisory_opinion.aos_cited_by.map((citation) => {
                    return <div key={"CITATION" + citation.no}><a href={advisoryOpinionLink(citation.no)}>{citation.no}</a></div>
                  }) : "This advisory opinion is not cited by other advisory opinions"}
                </td>
              </tr>
              {advisory_opinion.highlights.length > 0 && <tr><td scope="row" className="simple-table__cell">Keyword matches in documents</td>
                <td colSpan="3" className="t-serif legal-search-result__hit u-padding--top simple-table__cell"
                dangerouslySetInnerHTML={ highlights(advisory_opinion) }></td></tr>}
            }) }
          </tbody>
        </table>
        </div>
    } else {
      return <div className="message message--no-icon">
        <h2 className="message__title">No results</h2>
        <p>Sorry, we didn&rsquo;t find any documents matching { props.query }.</p>
        <div className="message--alert__bottom">
          <p>Think this was a mistake?</p>
          <ul className="list--buttons">
            {props.query && <li><a className="button button--standard" href="http://search04.fec.gov/vivisimo/cgi-bin/query-meta?v%3Asources=Administrative_Fine%2CAdvisory_Opinion%2CAlternative_Dispute_Resolution%2CAudit_Reports%2CMatters_Under_Review%2CMatters_Under_Review_Archived%2CRulemaster%2CCandidate_Summary%2CCommittee_Summary%2Cfec.gov&query={{ query }}&x=0&y=0&v%3aproject=fec_search_02_prj&v%3aframe=form&form=advanced-fec&">Try FEC.gov</a></li>}
            <li><a className="button button--standard" href={ "mailto:" + $('#contact-email').val() }>Email our team</a></li>
            <li><a className="button button--standard" href="https://github.com/18f/fec/issues">File an issue</a></li>
          </ul>
        </div>
      </div>
    }
  }
}

module.exports = SearchResults;
