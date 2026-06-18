from unittest import TestCase
from unittest import mock

from data import ecfr_caller


class TestEcfrCaller(TestCase):
    @mock.patch.object(ecfr_caller.requests, "get")
    def test_fetch_ecfr_data_uses_encoded_query_params(self, mock_get):
        response = mock.Mock()
        response.status_code = 200
        response.url = "https://www.ecfr.gov/api/search/v1/results?query=95%25+%236535"
        response.json.return_value = {"results": []}
        mock_get.return_value = response

        result = ecfr_caller.fetch_ecfr_data("95% #6535")

        self.assertEqual(result, {"results": []})
        mock_get.assert_called_once_with(
            "https://www.ecfr.gov/api/search/v1/results",
            params={
                "query": "95% #6535",
                "agency_slugs[]": "federal-election-commission",
                "date": "current",
                "per_page": 20,
                "page": 1,
                "order": "relevance",
                "paginate_by": "results",
            },
        )

    @mock.patch.object(ecfr_caller.requests, "get")
    def test_fetch_ecfr_data_returns_empty_payload_for_non_200(self, mock_get):
        response = mock.Mock()
        response.status_code = 500
        response.url = "https://www.ecfr.gov/api/search/v1/results?query=95%25"
        mock_get.return_value = response

        result = ecfr_caller.fetch_ecfr_data("95%", page="3")

        self.assertEqual(
            result,
            {
                "results": [],
                "meta": {
                    "current_page": 3,
                    "total_pages": 0,
                    "total_count": 0,
                },
            },
        )
