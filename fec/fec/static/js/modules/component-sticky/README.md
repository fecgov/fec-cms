# Sticky

<!-- [![Code Climate](https://codeclimate.com/github/kudago/sticky/badges/gpa.svg)](https://codeclimate.com/github/kudago/sticky) -->

Position:sticky that works.


`$ npm install --save component-sticky`

```js
var Sticky = require('component-sticky');

var sticky = new Sticky(document.querySelector(".sticky-element"), {
	...
});
```

## Options

### offset: 0
How many pixels to skip from the top

### within: parent
Any element, element selector or bounding box like {top: 0, bottom: 100 } or { top: element, bottom: element }

### stickyClass: 'is-stuck'
Class to add when element is sticked

### stubClass: 'sticky-stub'
Class to add to a spacer (placeholder when element is stuck)

### bottomClass: 'is-bottom'
When element is parked bottom

### topClass: 'is-top'
When element is parked on top

### stack: null
Name of a group to stack elements within. _undefined_ stack won’t relate element to any group


## API

### `aticky.recalc()`

Update position, sizes, sticking. Automatically called on window resize.

### `sticky.disable()`

Unhook sticky controller from element. Called automatically when element is removed.

### `sticky.enable(`

Enable previously disabled sticky element.



[![NPM](https://nodei.co/npm/component-sticky.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/component-sticky/)
