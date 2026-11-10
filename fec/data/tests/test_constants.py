from datetime import datetime
from unittest import TestCase, mock
from urllib.parse import parse_qs, urlsplit

from django.template import engines
from django.test import RequestFactory

from data import api_caller, constants, views_datatables


class TestDefaultYears(TestCase):
    def setUp(self):
        patcher = mock.patch('data.constants.datetime')
        self.clock = patcher.start()
        self.addCleanup(patcher.stop)

    def freeze_time(self, instant):
        self.clock.now.side_effect = datetime.fromisoformat(instant).astimezone

    def test_default_years(self):
        cases = [
            # April rollovers occur at 04:00 UTC (midnight Eastern Daylight Time).
            ('2025-04-16T03:59:59+00:00', 2024, 2026, 2024),
            ('2025-04-16T04:00:00+00:00', 2026, 2026, 2028),
            ('2027-04-16T03:59:59+00:00', 2026, 2028, 2028),
            ('2027-04-16T04:00:00+00:00', 2028, 2028, 2028),
            ('2029-04-16T03:59:59+00:00', 2028, 2030, 2028),
            ('2029-04-16T04:00:00+00:00', 2030, 2030, 2032),
            ('2033-04-16T03:59:59+00:00', 2032, 2034, 2032),
            ('2033-04-16T04:00:00+00:00', 2034, 2034, 2036),
            ('2037-04-16T03:59:59+00:00', 2036, 2038, 2036),
            ('2037-04-16T04:00:00+00:00', 2038, 2038, 2040),
            # November rollovers occur at 05:00 UTC (midnight Eastern Standard Time).
            ('2026-11-09T04:59:59+00:00', 2026, 2026, 2028),
            ('2026-11-09T05:00:00+00:00', 2026, 2028, 2028),
            ('2028-11-09T04:59:59+00:00', 2028, 2028, 2028),
            ('2028-11-09T05:00:00+00:00', 2028, 2030, 2028),
            # No premature rollovers at New Year, leap day, or in the wrong year.
            ('2027-01-01T05:00:00+00:00', 2026, 2028, 2028),
            ('2028-02-29T17:00:00+00:00', 2028, 2028, 2028),
            ('2028-04-16T04:00:00+00:00', 2028, 2028, 2028),
            ('2027-11-09T05:00:00+00:00', 2028, 2028, 2028),
        ]
        for instant, time_period, election_year, presidential_year in cases:
            with self.subTest(instant=instant):
                self.freeze_time(instant)
                assert constants.get_default_years() == {
                    'END_YEAR': time_period,
                    'DEFAULT_TIME_PERIOD': time_period,
                    'DEFAULT_ELECTION_YEAR': election_year,
                    'DEFAULT_PRESIDENTIAL_YEAR': presidential_year,
                }

    def test_cached_filters_update_after_rollover(self):
        cases = [
            ('partials/individual-contributions-filter.jinja', {},
             'id="two_year_transaction_period-checkbox-2024"', 'id="two_year_transaction_period-checkbox-2026"'),
            ('partials/receipts-filter.jinja', {},
             'id="two_year_transaction_period-checkbox-2024"', 'id="two_year_transaction_period-checkbox-2026"'),
            ('partials/party-coordinated-expenditures-filter.jinja', {},
             'id="cycle-checkbox-2024"', 'id="cycle-checkbox-2026"'),
            ('partials/reports-filter.jinja', {'table_context': {'form_type': 'pac-party'}},
             'data-required-default="2024"', 'data-required-default="2026"'),
            ('partials/candidates-office-filter.jinja', {'table_context': {'office': 'president'}},
             'data-default-cycle="2024"', 'data-default-cycle="2028"'),
        ]
        request = RequestFactory().get('/')
        for template_name, context, old_value, new_value in cases:
            with self.subTest(template=template_name):
                template = engines['backend'].get_template(template_name)
                self.freeze_time('2025-04-16T03:59:59+00:00')
                before = template.render(context, request=request)
                assert old_value in before
                assert new_value not in before

                self.freeze_time('2025-04-16T04:00:00+00:00')
                assert new_value in template.render(context, request=request)

    def test_redirects_use_reporting_period(self):
        views = [
            (views_datatables.disbursements, 'two_year_transaction_period'),
            (views_datatables.allocated_federal_nonfederal_disbursements, 'cycle'),
            (views_datatables.individual_contributions, 'two_year_transaction_period'),
            (views_datatables.receipts, 'two_year_transaction_period'),
        ]
        dates = [
            # Election years advance in November; reporting periods wait until April.
            ('2026-11-09T05:00:00+00:00', 2026),
            ('2027-04-16T04:00:00+00:00', 2028),
        ]
        request = RequestFactory().get('/')
        for view, period_key in views:
            for instant, expected_period in dates:
                with self.subTest(view=view.__name__, instant=instant):
                    self.freeze_time(instant)
                    response = view(request)
                    assert parse_qs(urlsplit(response.url).query) == {
                        period_key: [str(expected_period)],
                        'min_date': [f'01/01/{expected_period - 1}'],
                        'max_date': [f'12/31/{expected_period}'],
                    }

    @mock.patch('data.api_caller._call_api', return_value={'results': []})
    def test_api_default_updates_after_rollover(self, call_api):
        self.freeze_time('2026-11-09T04:59:59+00:00')
        api_caller.load_top_candidates('-receipts')
        assert call_api.call_args.kwargs['election_year'] == 2026

        self.freeze_time('2026-11-09T05:00:00+00:00')
        api_caller.load_top_candidates('-receipts')
        assert call_api.call_args.kwargs['election_year'] == 2028

    @mock.patch('data.api_caller._call_api', return_value={'results': []})
    def test_api_preserves_explicit_year(self, call_api):
        self.freeze_time('2026-11-09T05:00:00+00:00')
        api_caller.load_top_candidates('-receipts', election_year=2020)
        assert call_api.call_args.kwargs['election_year'] == 2020
