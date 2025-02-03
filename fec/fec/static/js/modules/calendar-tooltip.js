/**
 *
 */
import Dropdown from './dropdowns.js';
// import Listeners from './listeners.js';

/**
 * Activates a new .tooltip element. Doesn't create it, but
 * - activates listeners
 * - activates the Dropdown
 * - destroys the element on click-outside
 * - handles adding listeners to and then destroying calendar events' tooltips/details pop-up
 *   (doesn't create the element but will remove it)
 */
export class CalendarTooltip {
  /**
   * @constructor
   * @param {HTMLElement} el - The HTMLElement that is the tooltip, i.e. the .tooltip element
   */
  constructor(el) {
    CalendarTooltip.instances.push(this);

    el.previousElementSibling.classList.add('visible-tooltip');

    this.dropdown = new Dropdown(el.querySelector('.dropdown'), { checkboxes: false });

    // Catch the click on its way in, which happens before the tooltip is created,
    // otherwise we get into
    // # 1) click capture phase
    // # 2) create tooltip and add listeners
    // # 3) click bubbling is caught by tooltip listeners
    // # 4) tooltip is removed
    window.addEventListener('click', CalendarTooltip.handleExternalClicks, { capture: true });

    el.querySelector('.js-close').addEventListener('click', CalendarTooltip.handleCloseClick);
  }

  // PUBLIC METHODS

  // GETTERS

  // SETTERS

  // METHODS

  // PUBLIC PROPERTIES

  // STATIC
  static instances = [];

  /**
   * @param {PointerEvent} e
   */
  static handleCloseClick = function(e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    CalendarTooltip.destroyAll();
  };

  /**
   * @param {PointerEvent} e
   */
  static handleExternalClicks = function(e) {
    // If the target isn't inside a .tooltip, close this tooltip and destroy everything
    if (!e.target.closest('.tooltip')) {
      CalendarTooltip.destroyAll();
    }
  };

  static destroyAll = function() {
    CalendarTooltip.instances.forEach(instance => {
      instance.#selfDestruct();
    });
    CalendarTooltip.instances = [];
    let calendarEntriesWithTooltips = document.querySelectorAll('.visible-tooltip');
    calendarEntriesWithTooltips.forEach(el => {
      el.classList.remove('visible-tooltip');
    });
    calendarEntriesWithTooltips = [];
  };

  #selfDestruct = function() {
    window.removeEventListener('click', CalendarTooltip.handleExternalClicks, true);
    document.querySelector('.tooltip .js-close').removeEventListener('click', CalendarTooltip.handleCloseClick);

    let el = document.querySelector('#calendar-details');
    el.removeEventListener('mouseleave', CalendarTooltip.handleMouseLeave);

    this.dropdown.destroy();
    this.dropdown = null;
    el.remove();
    el = null;
    delete this;
  };
}
