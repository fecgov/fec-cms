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
        "results": [
            {
                "starts_on": "2016-12-23",
                "ends_on": "",
                "type": "Section",
                "hierarchy": {
                    "title": "11",
                    "subtitle": "",
                    "chapter": "I",
                    "subchapter": "E",
                    "part": "9008",
                    "subpart": "B",
                    "subject_group": "",
                    "section": "9008.55",
                    "appendix": ""
                },
                "hierarchy_headings": {
                    "title": "Title 11",
                    "subtitle": "",
                    "chapter": " Chapter I",
                    "subchapter": "Subchapter E",
                    "part": "Part 9008",
                    "subpart": "Subpart B",
                    "subject_group": "",
                    "section": "§ 9008.55",
                    "appendix": ""
                },
                "headings": {
                    "title": "Federal Elections",
                    "subtitle": "",
                    "chapter": "Federal Election Commission",
                    "subchapter": "Presidential Election Campaign Fund:" +
                                  " General Election Financing",
                    "part": "Federal Financing of Presidential Nominating" +
                            " Conventions",
                    "subpart": "Host Committees and Municipal Funds" +
                               " Representing a Convention City",
                    "subject_group": "",
                    "section": "Funding for convention committees, host" +
                               "committees and municipal funds.",
                    "appendix": ""
                },
                "full_text_excerpt": "that convention committees may accept" +
                                     " <strong>in-kind</strong>" +
                                     " <strong>donations</strong> from host" +
                                     " committees and municipal" +
                                     " <span class=\"elipsis\">…</span>" +
                                     " municipal funds provided that the" +
                                     " <strong>in-kind</strong>" +
                                     " <strong>donations</strong> are in" +
                                     " accordance with the requirements of",
                "score": 23.934675,
                "structure_index": 10462,
                "reserved": "",
                "removed": "",
                "change_types": [
                    "effective",
                    "initial"
                ]
            }
        ],
        "meta": {
            "current_page": 1,
            "total_pages": 1,
            "total_count": 1,
            "max_score": 23.934675,
            "description": "Changes to sections matching 'in-kind donation' from Federal Election Commission"
        }
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
    total_count = advisory_opinions['total_advisory_opinions']
    results = {"total_all": total_count}
    results.update(advisory_opinions)
    results.update(regulations)
    return results
