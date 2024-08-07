website_search_url = "/search/?type=candidates&type=committees&type=site&query="
data_search_url = "/data/search/?search="
dev_api_url = "https://fec-dev-api.app.cloud.gov/v1/"
stage_api_url = "https://api-stage.open.fec.gov/v1/"
prod_api_url = "https://api.open.fec.gov/v1/"

candidate_committee_and_election_pages = {
    "/data/candidate/": ["candidate_id",],
    "/data/committee/": ["committee_id",],
    "/data/elections/senate/": ["state", "election_year"],
    "/data/elections/president/": ["election_year",],
}

legal_search_pages = {
    "/data/legal/search/admin_fines/": ["search",],
    "/data/legal/search/advisory-opinions/": ["search",],
    "/data/legal/search/adrs/": ["search",],
    "/data/legal/search/enforcement/": ["search",],
    "/data/legal/search/regulations/": ["search",],
    "/data/legal/search/statutes/": ["search",],
    "/data/legal/search/": ["search",],
    "/legal-resources/policy-and-other-guidance/guidance-documents/": ["query"],
    "/legal-resources/enforcement/audit-search/": ["committee_id"],

}
data_table_pages = {
    "/data/receipts/individual-contributions/": ["two_year_transaction_period", "min_date",],
    "/data/national-party-account-receipts/": ["min_contribution_receipt_date",],
    "/data/national-party-account-disbursements/": ["min_disbursement_date",],
    "/data/receipts/": ["two_year_transaction_period", "min_date",],
    "/data/disbursements/": ["two_year_transaction_period", "min_date",],
    "/data/filings/": ["min_receipt_date",],
    "/data/committees/": ["committee_id",],
    "/data/candidates/": ["candidate_id",],
    "/data/independent-expenditures/": ["cycle",],
    "/data/candidates/house/": ["election_year",],
    "/data/reports/house-senate/": ["committee_id",],
    "/data/candidates/president/": ["candidate_id",],
    "/data/committees/pac-party/": ["committee_id",],
    "/data/reports/pac-party/": ["committee_id",],
    "/data/individual-contributions/": ["two_year_transaction_period", "min_date",],
    "/data/reports/presidential/": ["committee_id",],
    "/data/debts/": ["min_coverage_end_date",],
    "/data/allocated-federal-nonfederal-disbursements/": ["cycle", "min_date",],
    "/data/party-coordinated-expenditures/": ["cycle",],
    "/data/loans/": ["min_incurred_date",],
    "/data/electioneering-communications/": ["min_date",],
    "/data/communication-costs/": ["min_date",],
    "/data/candidates/senate/": ["election_year",],
    "/data/elections/": ["cycle", "zip"],
}

calendar_and_press_pages = [
    "/calendar/",
    "/press/resources-journalists/political-action-committees-pacs/",
    "/press/",
    "/press/resources-journalists/presidential-senate-and-house-candidates/",
    "/press/resources-journalists/political-parties/",
    "/press/resources-journalists/advisory-opinions/",
    "/press/resources-journalists/convention-committees-and-host-committees/",
    "/press/resources-journalists/public-communications/",
    "/updates/",
]

about_pages = [
    "/about/",
    "/about/leadership-and-structure/",
    "/about/mission-and-history/",
    "/about/careers/",
    "/about/leadership-and-structure/james-e-trainor-iii/",
    "/about/leadership-and-structure/commissioners/",
    "/about/no-fear-act/",
    "/about/leadership-and-structure/sean-j-cooksey/",
    "/about/leadership-and-structure/allen-dickerson/",
    "/about/privacy-and-security-policy/",
    "/about/leadership-and-structure/dara-lindenbaum/",
    "/about/reports-about-fec/strategy-budget-and-performance/",
    "/about/leadership-and-structure/ellen-l-weintraub/",
    "/about/leadership-and-structure/shana-m-broussard/",
    "/about/leadership-and-structure/bradley-smith/",
    "/about/leadership-and-structure/fec-offices/",
    "/about/plain-language/",
    "/about/reports-about-fec/",
    "/about/reports-about-fec/oig-reports/",
    "/about/open/",
    "/about/reports-about-fec/agency-operations/impact-national-voter-registration-act-1993-administration-federal-elections-html/",
    "/contact/",
    "/meetings/",
]

legal_resource_pages = [
    "/legal-resources/court-cases/citizens-united-v-fec/",
    "/legal-resources/enforcement/",
    "/legal-resources/enforcement/complaints-process/how-to-file-complaint-with-fec/",
    "/legal-resources/regulations/",
    "/legal-resources/enforcement/audit-search/",
    "/legal-resources/court-cases/buckley-v-valeo/",
    "/legal-resources/court-cases/",
    "/legal-resources/legislation/",
    "/legal-resources/court-cases/court-case-alphabetical-index/",
    "/legal-resources/policy-other-guidance/",
    "/legal-resources/court-cases/mccutcheon-et-al-v-fec/",
    "/legal-resources/enforcement/complaints-process/",
    "/legal-resources/enforcement/administrative-fines/",
    "/legal-resources/court-cases/pursuing-americas-greatness-v-fec/",
    "/legal-resources/court-cases/fec-v-rivera/",
    "/legal-resources/court-cases/national-republican-senatorial-committee-et-al-v-federal-election-commission-et-al-22-639/",
    "/legal-resources/court-cases/campaign-legal-center-et-al-v-fec-23-3163/",
    "/legal-resources/advisory-opinions-process/",
    "/legal-resources/court-cases/mcconnell-v-fec/",
    "/legal-resources/court-cases/speechnoworg-v-fec/",
    "/legal-resources/enforcement/audit-reports/",
    "/legal-resources/regulations/explanations-and-justifications/",
    "/legal-resources/enforcement/administrative-fines/calculating-administrative-fines/",
    "/legal-resources/court-cases/kennedy-for-president-v-fec-83-1521/",
    "/legal-resources/regulations/explanations-and-justifications/explanations-and-justifications-citation-index/",
    "/legal-resources/enforcement/audit-reports/unauthorized-committee-audit-reports/",
    "/legal-resources/enforcement/alternative-dispute-resolution/",
    "/legal-resources/enforcement/procedural-materials/",
    "/legal-resources/court-cases/ab-pac-v-fec-22-2139/",
    "/legal-resources/court-cases/rnc-v-dnc-and-fec/",
    "/legal-resources/court-cases/austin-v-michigan-state-chamber-of-commerce/",
    "/legal-resources/court-cases/perot-96-and-natural-law-party-v-fec-and-the-commission-on-presidential-debates/",
]

campaign_finance_pages = [
    "/introduction-campaign-finance/how-to-research-public-records/individual-contributions/",
    "/introduction-campaign-finance/understanding-ways-support-federal-candidates/presidential-elections/public-funding-presidential-elections/",
    "/introduction-campaign-finance/election-results-and-voting-information/",
    "/introduction-campaign-finance/how-to-research-public-records/candidates/",
    "/introduction-campaign-finance/understanding-ways-support-federal-candidates/",
    "/introduction-campaign-finance/how-to-research-public-records/election-dates/",
    "/campaign-finance-data/campaign-finance-statistics/",
    "/campaign-finance-data/presidential-candidate-data-summary-tables/",
    "/introduction-campaign-finance/how-to-research-public-records/",
    "/introduction-campaign-finance/how-to-research-public-records/pacs-parties-and-other-committees/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-2020/",
    "/campaign-finance-data/party-code-descriptions/",
    "/introduction-campaign-finance/how-to-research-public-records/combined-federalstate-disclosure-and-election-directory/",
    "/campaign-finance-data/congressional-candidate-data-summary-tables/",
    "/campaign-finance-data/political-action-committee-data-summary-tables/",
    "/campaign-finance-data/presidential-map-data/",
    "/introduction-campaign-finance/",
    "/campaign-finance-data/contributions-individuals-file-description/",
    "/campaign-finance-data/presidential-campaign-finance-summaries/",
    "/campaign-finance-data/all-candidates-file-description/",
    "/campaign-finance-data/political-party-data-summary-tables/",
    "/introduction-campaign-finance/understanding-ways-support-federal-candidates/presidential-elections/",
    "/introduction-campaign-finance/how-to-research-public-records/state-election-offices/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-2016/",
    "/campaign-finance-data/committee-master-file-description/",
    "/campaign-finance-data/communication-filings-data-summary-tables/",
    "/campaign-finance-data/transaction-type-code-descriptions/",
    "/campaign-finance-data/committee-type-code-descriptions/",
    "/introduction-campaign-finance/data-tutorials/",
    "/campaign-finance-data/candidate-master-file-description/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-2012/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-2000/",
    "/campaign-finance-data/new-statements-candidacy-file-description/",
    "/campaign-finance-data/contributions-committees-candidates-file-description/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-2018/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-1996/",
    "/campaign-finance-data/presidential-matching-fund-submissions/",
    "/campaign-finance-data/candidate-committee-linkage-file-description/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-2010/",
    "/campaign-finance-data/current-campaigns-house-and-senate-file-description/",
    "/office-inspector-general/how-submit-a-complaint-with-the-fec-oig/",
    "/campaign-finance-data/pac-and-party-summary-file-description/",
    "/campaign-finance-data/leadership-pacs-and-sponsors-description/",
    "/introduction-campaign-finance/election-results-and-voting-information/federal-elections-2008/",
    "/campaign-finance-data/about-campaign-finance-data/",
    "/campaign-finance-data/committee-summary-file-description/",
    "/data/elections/house/",
    "/data/elections/senate/",
    "/data/browse-data/",
    "/data/raising-bythenumbers/",
    "/data/candidates/president/presidential-map/",
    "/data/spending-bythenumbers/",
    "/data/",
]

help_pages = [
    "/help-candidates-and-committees/candidate-taking-receipts/contribution-limits/",
    "/help-candidates-and-committees/dates-and-deadlines/",
    "/help-candidates-and-committees/guides/",
    "/help-candidates-and-committees/registering-candidate/",
    "/help-candidates-and-committees/candidate-taking-receipts/who-can-and-cant-contribute/",
    "/help-candidates-and-committees/",
    "/help-candidates-and-committees/advertising-and-disclaimers/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/2024-quarterly-filers/",
    "/help-candidates-and-committees/forms/",
    "/help-candidates-and-committees/registering-political-party/",
    "/help-candidates-and-committees/registering-candidate/house-senate-president-candidate-registration/",
    "/help-candidates-and-committees/foreign-nationals/",
    "/help-candidates-and-committees/making-disbursements/transfers/",
    "/help-candidates-and-committees/federal-government-contractors/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/congressional-pre-election-reporting-dates-2024/",
    "/help-candidates-and-committees/candidate-taking-receipts/types-contributions/",
    "/help-candidates-and-committees/filing-reports/electronic-filing/",
    "/help-candidates-and-committees/registering-pac/",
    "/help-candidates-and-committees/candidate-taking-receipts/using-personal-funds-candidate/",
    "/help-candidates-and-committees/filing-reports/in-kind-contributions/",
    "/help-candidates-and-committees/get-tax-id-and-bank-account/",
    "/help-candidates-and-committees/filing-reports/registering-candidate/",
    "/help-candidates-and-committees/making-disbursements/personal-use/",
    "/help-candidates-and-committees/dates-and-deadlines/2023-reporting-dates/looking-ahead-2024-presidential/",
    "/help-candidates-and-committees/registering-candidate/gaining-ballot-access/",
    "/help-candidates-and-committees/understanding-public-funding-presidential-elections/",
    "/help-candidates-and-committees/making-independent-expenditures/",
    "/help-candidates-and-committees/filing-reports/quarterly-reports/",
    "/help-candidates-and-committees/filing-reports/",
    "/help-candidates-and-committees/filing-reports/fecfile-software/",
    "/help-candidates-and-committees/registering-political-party/qualifying-as-a-political-party-committee/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/2024-monthly-filers/",
    "/help-candidates-and-committees/purposes-disbursements/",
    "/help-candidates-and-committees/filing-reports/individual-contributions/",
    "/help-candidates-and-committees/filing-pac-reports/registering-super-pac/",
    "/help-candidates-and-committees/partnership-llc-contributions/",
    "/help-candidates-and-committees/candidate-taking-receipts/coordinated-communications/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/public-debates/",
    "/help-candidates-and-committees/candidate-taking-receipts/volunteer-activity/",
    "/help-candidates-and-committees/taking-receipts-pac/who-can-and-cant-contribute-nonconnected-pac/",
    "/help-candidates-and-committees/question-rad/",
    "/help-candidates-and-committees/keeping-records/recording-receipts/",
    "/help-candidates-and-committees/making-disbursements/",
    "/help-candidates-and-committees/making-disbursements-pac/contribution-limits-nonconnected-pacs/",
    "/help-candidates-and-committees/get-treasurer/",
    "/help-candidates-and-committees/dates-and-deadlines/filing-frequency-type-filer/",
    "/help-candidates-and-committees/registering-pac/types-nonconnected-pacs/",
    "/help-candidates-and-committees/reporting-examples/bitcoins-investment/",
    "/help-candidates-and-committees/filing-pac-reports/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/july-quarterly-report-notice-for-congressional-committees-pacs-and-parties-2024/",
    "/help-candidates-and-committees/taking-receipts-pac/contributions-to-super-pacs-and-hybrid-pacs/",
    "/help-candidates-and-committees/trainings/",
    "/help-candidates-and-committees/candidate-taking-receipts/delegate-activity/",
    "/help-candidates-and-committees/making-disbursements/making-contributions-other-federal-and-nonfederal-candidates/",
    "/help-candidates-and-committees/candidate-taking-receipts/understanding-independent-expenditures/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/endorsing-candidates-corporation-labor-organization/",
    "/help-candidates-and-committees/making-disbursements-pac/",
    "/help-candidates-and-committees/candidate-taking-receipts/",
    "/help-candidates-and-committees/taking-receipts-political-party/who-can-and-cant-contribute-party-committee/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/endorsement-examples/",
    "/help-candidates-and-committees/registering-candidate/testing-the-waters-possible-candidacy/",
    "/help-candidates-and-committees/filing-reports/monthly-reports-presidential/",
    "/help-candidates-and-committees/taking-receipts-political-party/affiliation-between-party-committees/",
    "/help-candidates-and-committees/making-disbursements-political-party/exempt-party-activities/",
    "/help-candidates-and-committees/filing-reports/election-cycle-aggregation/",
    "/help-candidates-and-committees/joint-fundraising-candidates-political-committees/",
    "/help-candidates-and-committees/registering-pac/registering-nonconnected-committee/",
    "/help-candidates-and-committees/candidate-taking-receipts/remedying-excessive-contribution/",
    "/help-candidates-and-committees/making-disbursements/advertising/candidate-committee-yard-sign-example/",
    "/help-candidates-and-committees/handling-loans-debts-and-advances/personal-loans-candidate/",
    "/help-candidates-and-committees/taking-receipts-political-party/contribution-limits-party-committees/",
    "/help-candidates-and-committees/making-disbursements/fundraising-campaign/",
    "/help-candidates-and-committees/registering-ssf/understanding-ssf-and-its-connected-organization/",
    "/help-candidates-and-committees/registering-pac/understanding-nonconnected-pacs/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/24-and-48-hour-reports-independent-expenditures-periods-main-page-2024/",
    "/help-candidates-and-committees/other-filers/making-electioneering-communications/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/events-and-programs-candidates-or-party-committees-by-ssf/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/conducting-voter-registration-and-get-out-the-vote-drives-corporation-labor-organization/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/pre-and-post-general-reports-2024/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/24-and-48-hour-reports-independent-expenditures-periods-congressional-primaries-2024/",
    "/help-candidates-and-committees/taking-receipts-political-party/transfers-or-party-committees/",
    "/help-candidates-and-committees/filing-reports/registering-committee/",
    "/help-candidates-and-committees/terminating-a-committee/",
    "/help-candidates-and-committees/registering-candidate/house-senate-presidential-candidate-committee-registration/",
    "/help-candidates-and-committees/making-disbursements-political-party/contributions-made-party-committees/",
    "/help-candidates-and-committees/understanding-public-funding-presidential-elections/receiving-public-funding-grant-for-general-election/",
    "/help-candidates-and-committees/taking-receipts-political-party/national-nominating-convention/",
    "/help-candidates-and-committees/making-disbursements-pac/fundraising-nonconnected-pac/",
    "/help-candidates-and-committees/making-disbursements/travel-behalf-campaigns/",
    "/help-candidates-and-committees/making-independent-expenditures/reporting-independent-expenditures-form-5/",
    "/help-candidates-and-committees/winding-down-candidate-campaign/winding-down-costs/",
    "/help-candidates-and-committees/candidate-taking-receipts/support-political-parties/",
    "/help-candidates-and-committees/registering-political-party/bank-accounts-political-party-committees/",
    "/help-candidates-and-committees/registering-political-party/registering-political-party-committee/",
    "/help-candidates-and-committees/filing-reports/paper-filing/",
    "/help-candidates-and-committees/registering-pac/bank-accounts-nonconnected-pacs/",
    "/help-candidates-and-committees/understanding-public-funding-presidential-elections/presidential-spending-limits/",
    "/help-candidates-and-committees/taking-receipts-political-party/refunds-contributions/",
    "/help-candidates-and-committees/making-disbursements-pac/making-kind-contributions-candidates/",
    "/help-candidates-and-committees/handling-loans-debts-and-advances/",
    "/help-candidates-and-committees/filing-reports/pre-election-reports/",
    "/help-candidates-and-committees/lobbyist-bundling-disclosure/",
    "/help-candidates-and-committees/taking-receipts-pac/",
    "/help-candidates-and-committees/filing-pac-reports/registering-hybrid-pac/",
    "/help-candidates-and-committees/registering-candidate/other-agency-requirements/",
    "/help-candidates-and-committees/filing-amendments/",
    "/help-candidates-and-committees/understanding-public-funding-presidential-elections/establishing-eligibility-presidential-primary-matching-funds/",
    "/help-candidates-and-committees/fundraising-for-ssf/payroll-deduction-ssf/",
    "/help-candidates-and-committees/filing-reports/pacs-other-political-committee-contributions/",
    "/help-candidates-and-committees/making-disbursements-political-party/coordinated-party-expenditures/coordinated-party-expenditure-limits/",
    "/help-candidates-and-committees/filing-reports/contributions-received-through-conduits/",
    "/help-candidates-and-committees/filing-reports/48-hour-notices/",
    "/help-candidates-and-committees/winding-down-candidate-campaign/",
    "/help-candidates-and-committees/fundraising-for-ssf/events-and-promotions-one-third-rule-ssf/",
    "/help-candidates-and-committees/making-independent-expenditures/reporting-independent-expenditures-form-3x/",
    "/help-candidates-and-committees/filing-reports/bitcoin-contributions/",
    "/help-candidates-and-committees/candidate-taking-receipts/archived-contribution-limits/",
    "/help-candidates-and-committees/making-disbursements-political-party/coordinated-party-expenditures/",
    "/help-candidates-and-committees/keeping-records/misappropriated-funds/",
    "/help-candidates-and-committees/filing-reports/importing-data-fecfile/",
    "/help-candidates-and-committees/taking-receipts-pac/contribution-limits-nonconnected-pacs/",
    "/help-candidates-and-committees/filing-pac-reports/nonconnected-committee-quarterly-filers/",
    "/help-candidates-and-committees/filing-reports/validation-errors-explained/",
    "/help-candidates-and-committees/making-disbursements/fundraising-other-candidates-committees/",
    "/help-candidates-and-committees/registering-pac/incorporating-nonconnected-pac/",
    "/help-candidates-and-committees/keeping-records/",
    "/help-candidates-and-committees/filing-reports/candidate-contributions/",
    "/help-candidates-and-committees/fundraising-for-ssf/solicitable-class-corporation-ssf/",
    "/help-candidates-and-committees/making-disbursements-political-party/",
    "/help-candidates-and-committees/other-filers/",
    "/help-candidates-and-committees/filing-political-party-reports/",
    "/help-candidates-and-committees/registering-ssf/ssf-registration/",
    "/help-candidates-and-committees/registering-pac/naming-nonconnected-pac/",
    "/help-candidates-and-committees/filing-reports/joint-fundraising-transfers/",
    "/help-candidates-and-committees/taking-receipts-political-party/volunteer-activity-party/",
    "/help-candidates-and-committees/taking-receipts-political-party/contributions-party-committees/",
    "/help-candidates-and-committees/making-disbursements/advertising/candidate-committee-fundraiser-invitation-example/",
    "/help-candidates-and-committees/candidate-taking-receipts/recounts-and-contested-elections/",
    "/help-candidates-and-committees/taking-receipts-political-party/",
    "/help-candidates-and-committees/making-disbursements-pac/qualifying-multicandidate-committee-nonconnected-pac/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/prior-notices-2024/election-report-notice-new-york/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/candidate-or-party-appearances-corporation-or-labor-organization/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/federal-election-activity-periods-main-page-2024/",
    "/help-candidates-and-committees/making-disbursements-political-party/definition-federal-election-activity-fea/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/april-quarterly-monthly-report-notice-presidential-committees-2024/",
    "/help-candidates-and-committees/filing-reports/other-filing-software/",
    "/help-candidates-and-committees/candidate-taking-receipts/support-other-campaigns/",
    "/help-candidates-and-committees/reporting-examples/",
    "/help-candidates-and-committees/making-disbursements/operating-expenditures-candidate/",
    "/help-candidates-and-committees/request-additional-information/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/supplemental-filing-information-congressional-committees-2024/",
    "/help-candidates-and-committees/fundraising-for-ssf/",
    "/help-candidates-and-committees/making-disbursements-pac/fundraising-super-pacs-federal-candidates-nonconnected-pac/",
    "/help-candidates-and-committees/keeping-pac-records-nonconnected/",
    "/help-candidates-and-committees/registering-political-party/information-local-party-committees-not-registered-fec/",
    "/help-candidates-and-committees/reporting-examples/termination-report/",
    "/help-candidates-and-committees/understanding-public-funding-presidential-elections/public-funding-vice-presidential-candidates/",
    "/help-candidates-and-committees/taking-receipts-ssf/who-can-and-cant-contribute-to-ssf/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/prior-notices-2024/election-report-notice-utah-republican/",
    "/help-candidates-and-committees/fundraising-for-ssf/matching-charitable-contributions-ssf/",
    "/help-candidates-and-committees/making-disbursements/advertising/candidate-committee-website-example/",
    "/help-candidates-and-committees/making-disbursements/non-campaign-related-expenses/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/july-quarterly-monthly-report-notice-presidential-committees-2024/",
    "/help-candidates-and-committees/winding-down-candidate-campaign/sale-campaign-assets/",
    "/help-candidates-and-committees/filing-reports/redesignating-and-reattributing-contributions/",
    "/help-candidates-and-committees/making-disbursements/advertising/candidate-television-ad-example/",
    "/help-candidates-and-committees/registering-political-party/national-party-accounts-certain-expenses/",
    "/help-candidates-and-committees/filing-reports/charitable-donations/",
    "/help-candidates-and-committees/making-disbursements-political-party/party-website-example/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/prior-notices-2024/election-report-notice-louisiana/",
    "/help-candidates-and-committees/handling-loans-debts-and-advances/retiring-debts-candidate/",
    "/help-candidates-and-committees/filing-reports/operating-expenditures/",
    "/help-candidates-and-committees/making-disbursements-pac/support-sponsoring-organization-nonconnected-pac/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/",
    "/help-candidates-and-committees/registering-political-party/getting-ballot-access-and-incorporating-party-committee/",
    "/help-candidates-and-committees/reporting-examples/reimbursement-personal-funds-for-travel-expenses/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/coordinated-communications-periods-main-page-2024/",
    "/help-candidates-and-committees/filing-pac-reports/multicandidate-status/",
    "/help-candidates-and-committees/keeping-records/records-disbursements/",
    "/help-candidates-and-committees/making-disbursements-pac/notices-required-nonconnected-solicitations/",
    "/help-candidates-and-committees/registering-ssf/",
    "/help-candidates-and-committees/dates-and-deadlines/2024-reporting-dates/june-monthly-report-notice-monthly-filing-pacs-and-parties-2024/",
    "/help-candidates-and-committees/fundraising-for-ssf/definition-member-ssf/",
    "/help-candidates-and-committees/making-disbursements-pac/nonconnected-webstore-fundraiser-disclaimer-example/",
    "/help-candidates-and-committees/making-disbursements/fundraising-notices-campaigns/",
    "/help-candidates-and-committees/making-disbursements-ssf-or-connected-organization/corporation-labor-organization-communications-restricted-class/",
    "/help-candidates-and-committees/filing-reports/candidate-personal-funds-loans/",
    "/help-candidates-and-committees/filing-pac-reports/48-hour-reports/",
    "/help-candidates-and-committees/making-disbursements/advertising/candidate-committee-billboard-example/",
]
