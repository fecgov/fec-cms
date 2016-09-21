import re

from bs4 import BeautifulSoup as bs
from urllib.parse import urljoin


bucket_url = 'https://amazon-ugly-bucketname'

# adding this so that the variable is defined when path replacements are initialized
def new_press_link(l):
    if len(re.findall(r'\d+', l)) > 0:
        new_url = bucket_url + '/fecgov-assets/news_releases/{0}/'.format(re.findall(r'\d+', l)[0])
        return(new_url)
    else:
        return(l)


def remake_links(href, body):
    # find relative links
    soup = bs(body, "html5lib")
    links = soup.find_all('a')
    for link in links:
        # looking for all realitive links
        if link['href'][:7] != 'http://':
            # re-save links as absolute links
            link['href'] = urljoin(href, link['href'])
            # check if those links are to be replaced
        path_replacements = [
            ('http://fec.gov/press/press[0-9]+/', new_press_link(link['href'])),
        ]
        for old, new in path_replacements:
            re_string = '^' + old + '*'
            if re.match(re_string, link['href']):
                link['href'] = re.sub(old, new, link['href'])

    return soup


test = 'lsdkjfkj <a href="/test.com">x</a> sijdflkj<a href="http://www.example/test.com">y</a> asd <a href="http://fec.gov/press/press1999/testy.pdf">z</a>'


print(remake_links('http://fec.gov/', test))
