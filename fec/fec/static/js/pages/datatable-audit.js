/**
 * audit datatable page
 * ---------------------
 * inital show all audit case.
 *
 */
import { audit as cols_audit } from '../modules/columns.js';
import { auditCategorySubcategory, showSubCategory } from '../modules/audit-category-sub-category.js';
import auditTags from '../modules/audit_tags.js';
import { DataTable_FEC, modalRenderRow } from '../modules/tables.js';
//for sub category filter-tag and results

$(document).bind( // TODO: jQuery deprecation
  'ready ajaxComplete',
  '#sub_category_id',
  showSubCategory
);

$(function() {
  auditCategorySubcategory();
  auditTags();
  new tables.DataTable($table, {
  const $table = $('#results');
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
