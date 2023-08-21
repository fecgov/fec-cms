from django.test import Client
from django.test import TestCase

from fec import settings  # TODO: debts dates (remove the import with the flag)

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
        def test_debts(self):
            response = client.get('/data/allocated-federal-nonfederal-disbursements/', follow=True)
            assert response.status_code == 200

    # Loans

    def test_loans(self):
        response = client.get('/data/loans/', follow=True)
        assert response.status_code == 200

    # Debts
    # TODO: debts dates (remove the conditional with the flag)
    if settings.FEATURES.get('debts'):
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
