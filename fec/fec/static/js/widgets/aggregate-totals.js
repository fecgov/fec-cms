'use strict';

// TODO: - UPDATE ALL COMMENTS AND JSDOC CONTENT

/**
 * This file runs the show for embedded Aggregate Totals
 * It's the path for Aggregate Totals on non-fec pages or for otherwise building and controlling the <iframe> where the box will live.
 * @copyright
 * @license
 * @author
 * TODO TODO TODO TODO
 */

// Editable vars
const stylesheetPath = '/static/css/widgets/aggregate-totals.css';
// For when we have both internal controls
const breakPointsAndHeights_full = [
  { widthLTE: 600, height: 326 },
  { widthLTE: 700, height: 300 },
  { widthLTE: 800, height: 250 }
];
// For when we have an internal office control
const breakPointsAndHeights_office = []; // TODO
// For when we have no internal controls
const breakPointsAndHeights_mini = []; // TODO

// Includes
// (none)

/**
 * AggregateTotalsFrame constructor
 * @param {Element} callingScriptElement
 */
function AggregateTotalsFrame() {
  this.scriptElement; // The <script>
  this.element; // The HTML element affected by boxbreakPointsAndHeights

  this.init();
}

/**
 * TODO -
 */
AggregateTotalsFrame.prototype.init = function() {
  this.scriptElement = document.currentScript; // The <script> on the page

  // Build the element
  this.element = buildElement(this.scriptElement, this.scriptElement);
  // Add resize listeners to that new element
  this.element.contentWindow.addEventListener(
    'resize',
    this.handleResize.bind(this)
  );

  this.handleResize();
};

/**
 * TODO -
 */
AggregateTotalsFrame.prototype.handleResize = function(e = null) {
  if (e) e.preventDefault();
  let newWidth = this.element.offsetWidth;
  let newHeight;
  for (let i = 0; i < breakPointsAndHeights_full.length; i++) {
    if (newWidth <= breakPointsAndHeights_full[i].widthLTE) {
      newHeight = breakPointsAndHeights_full[i].height;
      break;
    }
  }
  this.element.setAttribute('height', newHeight);
};

/**
 * TODO -
 * @param {HTMLObjectElement} callingInstance -
 * @param {Elem} domAnchor -
 * @param {String} elementType -
 */
function buildElement(scriptElement, domAnchor) {
  let toReturn = document.createElement('iframe');
  toReturn.setAttribute(
    'id',
    'gov_fec_at_' + Math.floor(Math.random() * 10000)
  ); // Random so we can have multiple on a page, if needed

  // We're only going to build the iframe and not the content in it
  toReturn.setAttribute('class', 'gov-fec-aggr-totals'); // TODO - need this?
  toReturn.setAttribute('allowtransparency', 'true');
  toReturn.setAttribute('frameborder', '0');
  // toReturn.setAttribute('scrolling', 'no'); // TODO - re-enable
  // toReturn.setAttribute('style', '0');
  // toReturn.setAttribute('title', '0');
  // console.log('scriptElement.dataset:');
  // console.log(scriptElement.dataset);

  // Since we're going from a <script> to an <iframe>, we need to convey the dataset into the new <iframe>
  if (scriptElement.dataset) {
    for (let attr in scriptElement.dataset) {
      toReturn.dataset[attr] = scriptElement.dataset[attr];
    }
  }
  toReturn.setAttribute('src', '/widgets/aggregate-totals/'); // Only if it's an <iframe> // TODO - fix this later

  // Add the stylesheet to the document <head>
  // TODO - <DO WE STILL NEED THIS>  ?
  let head = document.head;
  let linkElement = document.createElement('link');
  linkElement.type = 'text/css';
  linkElement.rel = 'stylesheet';
  linkElement.href = stylesheetPath;
  head.appendChild(linkElement);
  // TODO - </DO WE STILL NEED THIS>

  if (scriptElement == domAnchor) {
    // Put it in the page right before this <script>
    domAnchor.parentElement.insertBefore(toReturn, domAnchor);
  } else {
    // Otherwise, replace the anchor element
    domAnchor.replaceWith(toReturn);
  }
  return toReturn; // TODO
}

new AggregateTotalsFrame();
