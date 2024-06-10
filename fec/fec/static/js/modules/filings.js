import { extend as _extend } from 'underscore';

import { MODAL_TRIGGER_CLASS, modalRenderFactory } from './tables.js';
import { amendmentVersion, amendmentVersionDescription, buildUrl } from '../modules/helpers.js';
import { default as candidateTemplate } from '../templates/reports/candidate.hbs';
import { default as ieTemplate } from '../templates/reports/ie-only.hbs';
import { default as pacTemplate } from '../templates/reports/pac.hbs';

const templates = {
  F3: candidateTemplate,
  F3P: candidateTemplate,
  F3X: pacTemplate,
  F5: ieTemplate
};

function resolveTemplate(row) {
  return templates[row.form_type](row);
}

export function fetchReportDetails(row) {
  const url = buildUrl(['committee', row.committee_id, 'reports'], {
    beginning_image_number: row.beginning_image_number
  });
  return $.getJSON(url).then(function(response) {
    const result = response.results.length ? response.results[0] : {};

    result.amendment_version = amendmentVersion(result.most_recent);
    result.amendment_version_description = amendmentVersionDescription(
      row
    );

    return _extend({}, row, result);
  });
}

export const renderModal = modalRenderFactory(
  resolveTemplate,
  fetchReportDetails
);

export function renderRow(row, data) {
  if (data.form_type && data.form_type.match(/^F[35][XP]?$/)) {
    row.classList.add(MODAL_TRIGGER_CLASS, 'row--has-panel');
  }
}
