/**
 * Submits the form on select change and clears out unnecessary params
 */

/**
 *
 * @param {jQuery Element} form
 */
export default function FormNav(form) {
  this.form = form;
  this.form.addEventListener('change', this.clearNamesIfNull.bind(this));
  this.form.addEventListener('submit', this.clearNamesIfNull.bind(this));
}

/**
 * We don't want empty elements to send empty vars into the form submit.
 * So, if it has no value, remove its name, too.
 * @param {Event} e MouseEvent, TouchEvent
 */
FormNav.prototype.clearNamesIfNull = function(e) {
  var allSelects = this.form.querySelectorAll('select,input');
  // Remove names from all selects with no values
  for (var i = 0; i < allSelects.length; i++) {
    var select = allSelects[i];
    if (select.getAttribute('name') && !select.value) {
      select.setAttribute('name', '');
    }
  }

  if (e.type == 'change') this.form.submit(); // TODO: jQuery deprecation
};
