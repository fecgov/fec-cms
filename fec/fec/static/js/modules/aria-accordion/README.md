# FEC Notes
# This is a dupe of 18F's accordion that has been archived since late 2017

# 18F Aria-Accordion

[![Build Status](https://img.shields.io/travis/18F/accordion/master.svg)](https://travis-ci.org/18F/accordion)
[![Test Coverage](https://img.shields.io/codecov/c/github/18F/accordion/master.svg)](https://codecov.io/github/18F/accordion)

# About
A simple, accessible JavaScript accordion.

# Getting started
## Download
### Via npm
```
npm install aria-accordion
```

## Set up your HTML

```html
	<ul class="js-accordion">
	    <li>
	      <button>
	        First Amendment
	      </button>
	      <div>
	        <p>
	        Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.
	        </p>
	      </div>
	    </li>
	    <li>
	      <button>
	        Second Amendment
	      </button>
	      <div>
	        <p>
	        A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.
	        </p>
	      </div>
	    </li>
   </ul>
```

Simply create a series of `<button>` elements followed by `<div>`s and this will take care of the rest, adding the proper ARIA attributes. You can add custom IDs to the `<div>`s and the library will default to those. If you don't add IDs the library will generate them for you.


## Initialize
In whichever file you initialize your JavaScript components, initialize the accordion like so:

```js
	var accordion = require('@18f/accordion');

	// Required element to turn into an accordion
	var elm = document.querySelector('.js-accordion');

	// Optional configurion objects
	var selectors = { ... };
	var opts = { ... };

	new accordion.Accordion(elm, selectors, opts);
```


# Configuration
The constructor requires an HTML element to turn into the accordion.

The constructor accepts an optional hash of selectors as its second parameter:

- `trigger`: CSS selector for the elements to turn into the accordion triggers. The component will look for these items' next sibling to turn into the accordion content that is hidden and revealed. _Default_: `button`

You can also pass a hash of options. Currently, the only option is:

- `collapseOthers`: Boolean for whether or not to collapse all other panels when one panel is open. _Default_: `false`
- `customHiding`: Boolean for whether or not to use your own CSS to hide collapsed content areas. _Default_: `false`
- `contentPrefix`: String prefix for the content div IDs in order to have multiple accordions on the same page. _Default_: `accordion`
- `openFirst`: Boolean for whether or not to open the first item by default. _Default_: `false`
- `reflectStatic`: Boolean for whether or not the accordion should reflect any attributes (`aria-hidden` and `aria-expanded`) that were rendered statically. _Default_: `false`

# Styling
You're free to add classes and style your markup however you please. By default, the component sets any content element with `[aria-hidden="true"]` to `display: none` inline, but you can override this to use your own custom hiding styles with the `customHiding` property. To style the buttons when they panel is open vs closed, target `[aria-expanded="true"]`.


# License
## Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
