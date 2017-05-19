# DigitalGov search index instructions

The site-wide search of fec.gov uses the General Service Administration's [DigitalGov Search tool](search.digitalgov.gov) for the search engine. We use the [i14y API](https://search.digitalgov.gov/developer/i14y.html) for maintaining the search index, which feeds into ElasticSearch.

For more information about i14Y, you can read the [technical documentation here](http://gsa.github.io/slate/). These instructions are for explaining how to manually update the index.

## Getting set up
The DigitalGov Search "site" we use is called `betafec_api` (though that can change). If you're trying to access the admin panel, you will need someone to add you as a contributor to that site. This is where all the admin panel controls and analytics live.

The i14y search works by setting up one or more "drawers", which are basically collections of pages for the index. All drawers serve the same search. We have two drawers set up: `main`, which includes all CMS and web app pages, and `transition` which includes all transition.fec.gov pages.

Each drawer has its own key, so to push updates to them you will need to add the drawers' keys to your local env:

```
export DIGITALGOV_DRAWER_KEY_MAIN=<main key>
export DIGTIALGOV_DRAWER_KEY_TRANSITION:<transition key>
```

i14y accepts HTTP requests (POST / PUT / DELETE) with data structured like:

```json
{
  "document_id":"1",
  "title":"this is a fairly short title",
  "path": "http://www.gov.gov/cms/doc1.html", 
  "created": "2015-05-12T22:35:09Z",
  "changed": "2015-06-12T22:35:09Z",
  "description": "some more information here on the document", 
  "content": "the long form body of the document", 
  "promote": false, 
  "language" : "en",
  "tags" : "tag1, another tag"
}
```

You must pass either a `description` or `content` when adding a new document. The search engine searches the `title`, `description`, `content` and `tags`, but only matches in the `content` or `title` are actually displayed in the search results.

You can push updates manually with cURL, but for convenience we've set up a few Django management commands that make things a little simpler, which are detailed below.

## Adding CMS pages to the index
The search indexes are not automatically updated when content changes on the site, so we need to run a manual script to update the indexes.

1. **Update your CMS database:** Make sure that your local database is up-to-date with the production database. The management script references the local database in order to determine which pages to scrape. [Follow these instructions](https://github.com/18F/fec-cms#restoring-your-local-database-from-a-backup) to restore your local database from a backup.

2. **Scrape the pages:** Run `fec/manage.py scrape_cms_pages`. By default, this script will:
- Find all pages that are *direct children* of: Home, About, and About > Leadership and Structure
- Find all pages that are *descendants* (children, grand-children, etc.) of: Legal resources, Help for candidates and committees, Press
- It will then go through each of these pages and scrape the main body content from the page on the production website. 
- It will then write all the pages to `output.json`, located in `/fec/search/management/data/`. 
- The JSON consists of items in this format:

```json
    {
        "path": "https://beta.fec.gov/legal-resources/advisory-opinions-process/",
        "title": "The advisory opinion process",
        "created": "2017-01-19-214642",
        "document_id": 6059,
        "language": "en",
        "content": "scraped site content",
        "promote": "false"
    }
```

3. **Push the indexes to i14y** Run `fec/manage.py index_pages`. This will take each item in `output.json` and attempt a POST request to i14Y. If there is not already a page in the index with the same `document_id`, it will add it. If a page with the same `document_id` is already there, it will update it with whatever data is in this version.

Once `index_pages` has run, you can log in to search.digitalgov.gov and see the new pages under "Content" > "i14Y Drawers" > "Main".

Once the data is there, it will work when running a search on the site.

## Adding web app pages to the index
Adding non-CMS pages to the index is a little more complicated. Because there's no database to query for a set of pages (which `scrape_pages` does above), you need to manually create a set of  pages to index. The file`fec/search/management/data/web_app_pages.json` is a list of web app pages to index. If you're going from a spreadsheet, [CSV2JSON](http://www.csvjson.com/csv2json) is a useful tool.

The good news is that because the API provides the candidate and committee results, the only pages that we need to index are the ~25 static routes. 

So to add these pages:

1. **Create the basic data:** Edit `web_app_pages.json` to include the pages you want to add or edit. If a page isn't in here, nothing will happen. If you want to scrape the content for the page, add a field for `scrape_content: "true"`; the default is to not scrape content. 

Because most of these pages don't have much content worth scraping, we populate data in the `description` and `tags` fields in order to give the search engine something to search against.

It's important that these pages have stable `document_id` fields because that's how you update or delete a document in the search index. The convention we use is `app-*` 

2. **Run the scraper (optional):** Run `fec/manage.py scrape_web_app_pages`. This will scrape content for any pages that have `scrape_content: "true"` set. It will write all pages to `data/output.json`. If you don't have any pages you need to scrape, you can skip this step and go to #3.
3. **Index the pages:** Once you're satisfied with the data, run `fec/manage.py index_pages`. This will add or update every page in `output.json`. Optionally you can pass in a path to a different JSON file to use.

## Adding transition pages to the index
Similar to adding web app pages, transition pages need to be manually identified. These currently live in `fec/search/management/data/transition_pages.json`. When you want to scrape the page content, here's what to do:

1. **Create the basic data:** Update `/data/transition_pages.json` with all of the pages you want to scrape. Each item should contain these fields (example):

```JSON
  {
    "document_id": "transition-1",
    "path": "http://transition.fec.gov/pubrec/publicrecordsoffice.shtml",
    "created": "04/01/2017",
    "language": "en",
    "title": "Public Records Office"
  }
```

Optionally, you can add `description`, `tags`, or `promoted` fields. 

2. **Scrape the content:** Run `fec/manage.py scrape_transition_pages`. This script will read `data/transition_pages.json` and call each URL and scrape the content in the `#fec_mainContent` or `#fec_mainContentWide` `<div>`s. Optionally, you could pass in a different path to a JSON file with the optional `--path_to_json` argument. This script will output the results to `output.json`. It's generally a good idea to read over this file and make sure things look right.
3. **Index the pages:** Run `fec/manage.py index_pages -transition`. This command works the same as it does for adding CMS pages, but with the `-transition` flag it will put them in the transition drawer.  

## Additional DigitalGov configuration
**Best bets:** of the really great features of DigitalGov Search is what's called "Best bets". These are basically search suggestions that you can manually add (or add in bulk by uploading a spreadsheet) which map a URL to a specific set of keywords. Any Best Bet will be returned at the top of the search results. 

**Deleting pages:** To remove pages from the index, you'll need to make a DELETE request with the `document_id` you want to delete. [More info in the docs](http://gsa.github.io/slate/#delete-a-document).
