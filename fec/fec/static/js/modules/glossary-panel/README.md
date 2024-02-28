# Glossary panel

[![Build Status](https://img.shields.io/travis/18F/glossary/master.svg)](https://travis-ci.org/18F/glossary)
[![Test Coverage](https://img.shields.io/codecov/c/github/18F/glossary/master.svg)](https://codecov.io/github/18F/glossary)

# About
Add a simple glossary panel to your site to help your users understand jargon-y terms. As seen on [betaFEC](https://beta.fec.gov) and [EITI](https://useiti.doi.gov/).

For example:
* https://beta.fec.gov/data/ - click on the book icon in the header
* https://useiti.doi.gov/how-it-works/production/ - click on "fossil fuel"

# Getting started

Note: if you are a contributor, please see [CONTRIBUTING for additional help](CONTRIBUTING.md).

## Download
### Via npm
```
npm install glossary-panel
```

## Set up your HTML
The following is the bare minimum HTML needed in your document:

```html
	<button class="js-glossary-toggle">Glossary</button>
	<div id="glossary" aria-describedby="glossary-title" aria-hidden="true">
	  <button title="Close glossary" class="js-glossary-close">Hide glossary</button>
	  <h2 id="glossary-title">Glossary</h2>
	  <label for="glossary-search">Filter glossary terms</label>
	  <input id="glossary-search" class="js-glossary-search" type="search" placeholder="e.g. Committee">
	  <ul class="js-glossary-list"></ul>
	</div>
```

It includes a toggle button, a div for the glossary, a close button inside the glossary, a title, a search input and label, and a `<ul>` for the terms.

Then, to add glossary terms to the body of the page, add a `data-term` attribute to the terms. For example:

```html
A <span data-term="committee">committee</span> is a thing.
```

The data attribute must match the text of the term in your JSON file exactly, but it is not case-sensitive.


## Initialize
In whichever file you initialize your JavaScript components, initialize the glossary like so:

```js
	var Glossary = require('@18f/glossary');

	// JSON file of terms and definitions
	var terms = require('terms');

	// Optional configurion objects
	var selectors = { ... };
	var classes = { ... };

	new Glossary(terms, selectors, classes);

```

# Configuration
The constructor expects an array of objects (`terms`) that follows this pattern:

```json
[
  {
    "term": "Glossary",
    "definition": "A useful tool for finding the definitions of terms"
  }
]
```

The constructor also accepts an optional hash of `selectors` as its second parameter:

- `glossaryID`: ID of the glossary panel that will be shown and hidden. _Default_: `#glossary`
- `close`: ID or class of the close button inside the glossary panel. _Default_: `.js-glossary-close`
- `listClass`: Class of the `<ul>` that will be populated with terms. _Default_: `.js-glossary-list`
- `searchClass`: Class of the `<input>` that will be used to filter the list. _Default_: `.js-glossary-search`
- `toggle`: ID or class of the element that will be used to open and close the glossary in the main body of the document. _Default_: `.js-glossary-toggle`

And you can pass an optional hash of `classes` to be applied to to the DOM:

- `definitionClass`: Single class applied to the `<div>` that contains the term's definition. _Default_: `glossary__definition`
- `glossaryItemClass`: Single class applied to the `<li>` that contains the term and deffinition. _Default_: `glossary__item`
- `highlightedTerm`: Single class applied to terms in the body when they are highlighted. _Default_: `term--higlight`
- `termClass`: Single class applied to the `<button>` element that opens the definition. _Default_: `glossary__term`

# Methods
- `Glossary.show()`: Show the glossary
- `Glossary.hide()`: Hide the glossary
- `Glossary.toggle()`: Toggle the glossary open or closed
- `Glossary.destroy()`: Completely remove the glossary from the DOM
- `Glossary.findTerm(term)`: If the glossary is opens, filters the list down to the term called, expands the term, and highlights the associated term in the DOM

# Styling
To style the glossary terms and defintions in the accordion list, either use the default classes or whichever ones you passed in. To change the style of the buttons when the accordion elements are expanded, you can select for `[aria-expanded="true"]`.

You will need to add styles for `[aria-hidden="true"]` in order to hide the glossary panel and the glossary definitions.

# License
## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
