/**
 * Until CSS Container Queries have wider support, FECContainerQuery listens for resize and assigns appropriate classes to the element that should scale.
 * Uses our defined grid breakpoints.
 * Container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries
 * caniuse: https://caniuse.com/css-container-queries
 */

// The points at which the next size is applied.
  // Ex: at 430 pixels, the small class is applied.
const breakpoints = [
  { widths: { minPx: 0, maxPx: 429 }, classname: 'cq-xs' },
  { widths: { mminPxn: 430, maxPx: 674 }, classname: 'cq-s' },
  { widths: { minPx: 675, maxPx: 899 }, classname: 'cq-m' },
  { widths: { minPx: 900, maxPx: 1199 }, classname: 'cq-l' },
  { widths: { minPx: 1200, maxPx: 9999 }, classname: 'cq-xl' }
];

/**
 * If containerSelector is one element, its size will determine the size of every resizeSelector. If resizeSelector and containerSelector are both arrays, they will be applied in a 1:1 fashion,
 * i.e. resizeSelector[0]:containerSelector[0], resizeSelector[1]:containerSelector[1], etc
 * @param {string} resizeSelector - Used in querySelectorAll to find the element(s) to resize
 * @param {string} containerSelector - Used in querySelectorAll to find element(s) whose widths will guide resizing
 *
 * @property {string[]} allClassNames - Derived from breakpoints, used when removing all cq class names
 * @property {object[]} elementPairs - Array of Objects like {child: HTMLElement, parent: HTMLElement}
 */
function FECContainerQuery(resizeSelector, containerSelector) {
  // Now that we have the breakpoints set, let's create a quick array of only the class names
  this.allClassNames = breakpoints.map(point => {
    return point.classname;
  });
  // Save the child-parent pairings for listeners and resizing
  this.elementPairs = [];

  const children = document.querySelectorAll(resizeSelector);
  const parents = document.querySelectorAll(containerSelector);

  children.forEach((el, i) => {
    this.elementPairs.push({
        child: el,
        parent: parents[i] || parents[0] // set it to the parent element in the same array position (ex [0]=[0], [1]=[1]), else set it to the first parents element (ex [1]=[0], [2]=[0]…)
    });
  });
  // Listen for window resize
  window.addEventListener('resize', this.handleResize.bind(this));
  // Dispatch a new resize to apply the class names immediately
  window.dispatchEvent(new Event('resize'));
}

/**
 * Handles when the window changes size, but only looks at the relevant element's size.
 * Toggles classes for the element based on {@see breakpointToSmall, @see breakpointToMedium, @see breakpointToLarge, @see breakpointToXL}
 */
FECContainerQuery.prototype.handleResize = function() {
  // For every child-parent element pair,
  this.elementPairs.forEach(pair => {
    const parentWidth = pair['parent'].offsetWidth;
    const child = pair['child'];
    // Remove any current class name
    child.classList.remove(...this.allClassNames);
    for (let i = 0; i < breakpoints.length; i++) {
      if (parentWidth >= breakpoints[i].widths.minPx && parentWidth <= breakpoints[i].widths.maxPx ) {
        child.classList.add(breakpoints[i].classname);
        break;
      }
    }
  });
};

module.exports = { FECContainerQuery };
