import unittest
from collections import OrderedDict
from unittest import mock

from data import api_caller


class TestLegal(unittest.TestCase):
    @mock.patch.object(api_caller, '_call_api')
    def test_load_legal_mur(self, call_api):
        call_api.return_value = {
            'docs': [{
                'no': '1234',
                'mur_type': 'current',
                'participants': [
                    {
                        'role': 'Complainant',
                        'name': 'Gollum',
                        'citations': []
                    },
                    {
                        'role': 'Respondent',
                        'name': 'Bilbo Baggins',
                        'citations': []
                    },
                ],
                'commission_votes': [],
                'dispositions': [
                    {
                        'disposition': 'Conciliation-PC',
                        'penalty': 100.0
                    },
                    {
                        'disposition': 'Conciliation-PC',
                        'penalty': 0.0
                    },
                ],
                'documents': []
            }]
        }

        mur = api_caller.load_legal_mur('1234')

        assert mur.get('no') == '1234'
        assert mur['participants_by_type'] == OrderedDict([
            ('Respondent', ['Bilbo Baggins']),
            ('Complainant', ['Gollum']),
        ])
        assert mur['collated_dispositions'] == OrderedDict([
            ('Conciliation-PC', OrderedDict([
                (100.0, [{'penalty': 100.0, 'disposition': 'Conciliation-PC'}]),
                (0.0, [{'penalty': 0.0, 'disposition': 'Conciliation-PC'}])
            ]))
        ])
