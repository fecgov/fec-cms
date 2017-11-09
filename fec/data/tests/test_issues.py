
import pytest
import github3
from django.test import Client

from django.test import TestCase as CMSApp
from unittest import mock


@pytest.yield_fixture
def client():
    with client.test_request_context():
        yield CMSApp(client)

class TestGithub:

    @pytest.fixture
    def mock_repo(self):
        return mock.Mock()

    @pytest.fixture
    def mock_client(self, mock_repo):
        client = mock.Mock()
        client.repository.return_value = mock_repo
        return client

    @pytest.fixture
    def mock_login(self, monkeypatch, mock_client):
        login = mock.Mock()
        login.return_value = mock_client
        monkeypatch.setattr(github3, 'login', login)
        return login

    def test_missing_referer(self, client):
        res = client.post_json(
            ('/issue'),
            {'feedback': 'i like it'},
            expect_errors=True,
        )
        assert res.status_code == 422

    def test_invalid_referer(self, client):
        res = client.post_json(
            ('/issue'),
            {'feedback': 'i do not like it'},
            headers={'referer': 'http://fec.gov'},
            expect_errors=True,
        )
        assert res.status_code == 422

    def test_missing_input(self, client):
        res = client.post_json(
            ('/issue'),
            {},
            headers={'referer': 'http://localhost:5000'},
            expect_errors=True,
        )
        assert res.status_code == 422

    def test_submit(self, client, mock_login, mock_client, mock_repo):
        referer = 'http://localhost:5000'
        mock_issue = mock.Mock()
        mock_issue.to_json.return_value = {'body': 'it broke'}
        mock_repo.create_issue.return_value = mock_issue
        res = client.post_json(
            ('/issue'),
            {
                'action': 'i tried to use it',
                'feedback': 'but nothing happened',
                'about': 'i like data',
            },
            headers={'referer': referer},
        )
        assert res.status_code == 201
        mock_login.assert_called_with(token=config.github_token)
        mock_client.repository.assert_called_with('18F', 'fec')
        assert len(mock_repo.create_issue.call_args_list) == 1
        args, kwargs = mock_repo.create_issue.call_args
        assert referer in args[0]
        assert 'i tried to use it' in kwargs['body']
        assert 'but nothing happened' in kwargs['body']
        assert 'i like data' in kwargs['body']
        assert res.json == {'body': 'it broke'}