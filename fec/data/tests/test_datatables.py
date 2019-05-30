from django.test import Client
from django.test import TestCase


client = Client()


class TestDatatablesRender(TestCase):

    # Raising

    def test_receipts(self):
        response = client.get('/data/receipts/')
        assert response.status_code == 200

    def test_individual_contributions(self):
        response = client.get('/data/individual-contributions/')
        assert response.status_code == 200

    # Spending

    def test_disbursements(self):
        response = client.get('/data/disbursements/')
        assert response.status_code in (200, 302)

    def test_independent_expenditures(self):
        response = client.get('/data/independent-expenditures/')
        assert response.status_code == 200

    def test_party_coordinated_expenditures(self):
        response = client.get('/data/party-coordinated-expenditures/')
        assert response.status_code == 200

    def test_electioneering_communications(self):
        response = client.get('/data/electioneering-communications/')
        assert response.status_code == 200

    def test_communication_costs(self):
        response = client.get('/data/communication-costs/')
        assert response.status_code == 200

    # Loans and Debts
    def test_loans(self):
        response = client.get('/data/loans/')
        assert response.status_code == 200

    # Candidates

    def test_all_candidates(self):
        response = client.get('/data/candidates/')
        assert response.status_code == 200

    def test_presidential_candidates(self):
        response = client.get('/data/candidates/president/')
        assert response.status_code == 200

    def test_senate_candidates(self):
        response = client.get('/data/candidates/senate/')
        assert response.status_code == 200

    def test_house_candidates(self):
        response = client.get('/data/candidates/house/')
        assert response.status_code == 200

    # Committees

    def test_all_committees(self):
        response = client.get('/data/committees/')
        assert response.status_code == 200

    # Filings and reports

    def test_all_filings(self):
        response = client.get('/data/filings/')
        assert response.status_code == 200

    def test_presidential_reports(self):
        response = client.get('/data/reports/presidential/')
        assert response.status_code == 200

    def test_house_senate_reports(self):
        response = client.get('/data/reports/house-senate/')
        assert response.status_code == 200

    def test_pac_party_reports(self):
        response = client.get('/data/reports/pac-party/')
        assert response.status_code == 200

