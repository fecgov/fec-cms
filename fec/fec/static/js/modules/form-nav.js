'use strict';

/* FormNav
 * Submits the form on select change and clears out unnecessary params
 */

function FormNav(form) {
  this.form = form;
  this.form.addEventListener('change', this.handleChange.bind(this));
}

FormNav.prototype.handleChange = function() {
  var allSelects = this.form.querySelectorAll('select,input');
  // Remove names from all selects with no values
  for(var i = 0; i < allSelects.length; i++) {
    var select = allSelects[i];
    if(select.getAttribute('name') && !select.value) {
      select.setAttribute('name', '');
    }
  }

  this.form.submit();
};

module.exports = {FormNav: FormNav};
