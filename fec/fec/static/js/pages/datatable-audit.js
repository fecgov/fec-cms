/**
 * Data and initialization for audit datatable page {@link /legal-resources/enforcement/audit-search/}
 */
import { auditCategorySubcategory, showSubCategory } from '../modules/audit-category-sub-category.js';
import auditTags from '../modules/audit_tags.js';
import { audit as cols_audit } from '../modules/columns.js';
import { DataTable_FEC, modalRenderRow } from '../modules/tables.js';

// for sub category filter-tag and results
$(document).on(
  'ready ajaxComplete',
  '#sub_category_id',
  showSubCategory
);

$(function() {
  auditCategorySubcategory();
  auditTags();
  const $table = $('#results');
  new DataTable_FEC($table, {
    autoWidth: false,
    title: 'Audit Reports',
    path: ['audit-case'],
    columns: cols_audit,
    order: [1, 'desc'],
    useFilters: true,
    useExport: true,
    rowCallback: modalRenderRow,
    callbacks: {
      //     afterRender: tablePanels.renderauditPanel(false)
    }
  });
});
