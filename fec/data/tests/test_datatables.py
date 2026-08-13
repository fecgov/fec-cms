from unittest import mock

from django.test import Client
from django.test import RequestFactory
from django.test import TestCase

from data import views_datatables
from fec import settings  # TODO: remove the import with the flags

client = Client()


class TestDatatablesRender(TestCase):

    # Raising

    def test_receipts(self):
        response = client.get('/data/receipts/', follow=True)
        assert response.status_code == 200

    def test_individual_contributions(self):
        response = client.get('/data/individual-contributions/', follow=True)
        assert response.status_code == 200

    # Spending

    def test_disbursements(self):
        response = client.get('/data/disbursements/', follow=True)
        assert response.status_code == 200

    def test_independent_expenditures(self):
        response = client.get('/data/independent-expenditures/', follow=True)
        assert response.status_code == 200

    def test_party_coordinated_expenditures(self):
        response = client.get('/data/party-coordinated-expenditures/', follow=True)
        assert response.status_code == 200

    def test_electioneering_communications(self):
        response = client.get('/data/electioneering-communications/', follow=True)
        assert response.status_code == 200

    def test_communication_costs(self):
        response = client.get('/data/communication-costs/', follow=True)
        assert response.status_code == 200

    # H4 allocated federal/nonfederal disbursements
    # TODO: remove the conditional with the flag
    if settings.FEATURES.get('h4_allocated_disbursements'):
        def test_allocated_federal_nonfederal_disbursements(self):
            response = client.get('/data/allocated-federal-nonfederal-disbursements/', follow=True)
            assert response.status_code == 200

    # Loans
    def test_loans(self):
        response = client.get('/data/loans/', follow=True)
        assert response.status_code == 200

    # Debts
    # TODO: debts dates (remove the conditional with the flag)
    def test_debts(self):
        response = client.get('/data/debts/', follow=True)
        assert response.status_code == 200

    # Candidates
    def test_all_candidates(self):
        response = client.get('/data/candidates/', follow=True)
        assert response.status_code == 200

    def test_presidential_candidates(self):
        response = client.get('/data/candidates/president/', follow=True)
        assert response.status_code == 200

    def test_senate_candidates(self):
        response = client.get('/data/candidates/senate/', follow=True)
        assert response.status_code == 200

    def test_house_candidates(self):
        response = client.get('/data/candidates/house/', follow=True)
        assert response.status_code == 200

    # Committees
    def test_all_committees(self):
        response = client.get('/data/committees/', follow=True)
        assert response.status_code == 200

    # Filings and reports
    def test_all_filings(self):
        response = client.get('/data/filings/', follow=True)
        assert response.status_code == 200

    def test_presidential_reports(self):
        response = client.get('/data/reports/presidential/', follow=True)
        assert response.status_code == 200

    def test_house_senate_reports(self):
        response = client.get('/data/reports/house-senate/', follow=True)
        assert response.status_code == 200

    def test_pac_party_reports(self):
        response = client.get('/data/reports/pac-party/', follow=True)
        assert response.status_code == 200

    # National party accounts
    def test_national_party_account_receipts(self):
        response = client.get('/data/national-party-account-receipts/', follow=True)
        assert response.status_code == 200

    def test_national_party_account_disbursements(self):
        response = client.get('/data/national-party-account-disbursements/', follow=True)
        assert response.status_code == 200

    # Rulemakings
    def test_rulemakings(self):
        response = client.get('/legal/search/rulemakings/', follow=True)
        assert response.status_code == 200


class TestRulemakingSearchQueryLimit:
    expected_error = (
        b"Search terms must be 10 characters or fewer. "
        b"Please shorten your search and try again."
    )

    def setup_method(self):
        self.factory = RequestFactory()

    @mock.patch.object(views_datatables.settings, 'LEGAL_SEARCH_MAX_QUERY_LENGTH', 10)
    def test_rulemaking_search_rejects_q_over_character_limit(self):
        request = self.factory.get(
            '/legal/search/rulemakings/',
            {'q': 'x' * 11}
        )

        response = views_datatables.rulemaking(request)

        assert response.status_code == 400
        assert self.expected_error in response.content
        assert response.content.count(self.expected_error) == 1
        assert b'value="xxxxxxxxxxx"' not in response.content
        assert b'maxlength="' in response.content
