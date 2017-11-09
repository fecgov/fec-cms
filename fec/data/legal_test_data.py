from faker import Faker

faker = Faker()


def factory(f):
    """Decorator to wrap your data function as a test factory."""
    def decorator(**data):
        d = f()
        assert type(d) is dict
        d.update(data)
        return d

    return decorator

def ao_no():
    return '2014-%00d' % faker.random_int(max=100)


@factory
def statute():
    return {
        "no": "%s" % faker.random_int(max=100),
        "section": "%s" % faker.random_int(max=100000),
        "name": faker.sentence(),
        "highlights": [
            faker.sentence(),
            faker.sentence(),
            faker.sentence(),
        ],
    }

@factory
def statutes_search_results():
    return {
        "total_statutes": 10,
        "statutes": [
            statute(),
            statute(),
            statute(),
        ]
    }

@factory
def regulations_search_results():
    return {
        "total_regulations": 17,
        "regulations": [
            {
                "doc_id": "2_6",
                "highlights": [
                    faker.sentence(),
                    faker.sentence(),
                    faker.sentence(),
                ],
                "name": "Transcripts and recordings.",
                "no": "2.6",
                "url": "/regulations/2-6/2016-annual-2#2-6"
            },
            {
                "doc_id": "104_18",
                "highlights": [
                    faker.sentence(),
                    faker.sentence(),
                ],
                "name": "Electronic filing of reports (52 U.S.C. 30102(d) and 30104(a)(11)).",
                "no": "104.18",
                "url": "/regulations/104-18/2016-annual-104#104-18"
            },
            {
                "doc_id": "2_3",
                "highlights": [
                ],
                "name": "General rules.",
                "no": "2.3",
                "url": "/regulations/2-3/2016-annual-2#2-3"
            }
        ],
    }


@factory
def advisory_opinions_search_results():
    return {
        "total_advisory_opinions": 542,
        "advisory_opinions": {
            "1999-03": [
                {
                    "category": "AO Request, Supplemental Material, and Extensions of Time",
                    "date": "1999-02-09T00:00:00",
                    "description": "Request by Microsoft Corporate Political Action Committee",
                    "doc_id": 65492,
                    "highlights": [
                        faker.sentence(),
                        faker.sentence(),
                    ],
                    "id": 744,
                    "name": "Microsoft PAC",
                    "no": "1999-03",
                    "summary": "Use of digital signatures by restricted class to authorize payroll deductions.",
                    "tags": "0000",
                    "url": "https://cg-b5ec3026-92d5-49e7-8bfb-e3098741dc34.s3.amazonaws.com/legal/aos/65492.pdf"
                }
            ]
        }
    }

@factory
def legal_universal_search_results():
    """Test data from the universal search API."""
    advisory_opinions = advisory_opinions_search_results()
    regulations = regulations_search_results()
    total_count = advisory_opinions['total_advisory_opinions'] + regulations['total_regulations']
    results = {"total_all": total_count}
    results.update(advisory_opinions)
    results.update(regulations)
    return results