var Typeahead = require('../modules/typeahead').Typeahead;
import { default as URI } from 'urijs';

const loadRecaptcha = require('../modules/load-recaptcha').loadRecaptcha;

const analytics = require('../modules/analytics');

/**
 * ServiceNow contact form
 * @param {*} $elm
 */
function ContactForm($elm) {
  this.$elm = $elm;
  this.committeeId = $elm.find('#id_u_committee');
  this.committeeName = $elm.find('#id_committee_name');
  this.committeeNameError = $elm.find('.id_committee_name');
  this.category = $elm.find('#id_u_category');
  this.otherReason = $elm.find('#id_u_other_reason').closest('div');
  this.typeahead = new Typeahead(
    $elm.find('.js-contact-typeahead'),
    'committees',
    ''
  );
  this.$cancel = $elm.find('.js-cancel');
  this.initTypeahead();
  this.initOtherReason();
  this.category.on('change', this.toggleOtherReason.bind(this));
  this.$cancel.on('click', this.clearForm.bind(this));
  this.typeahead.$input.on('keyup', this.clearHidden.bind(this));

  loadRecaptcha();
}

/**
 * Overriding default typeahead behavior
 * This will set the value of a hidden input when selecting a value from typeahead
 */
ContactForm.prototype.initTypeahead = function() {
  var self = this;
  this.typeahead.$element.css({ height: 'auto' });
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on('typeahead:select', function(e, opts) {
    self.committeeId.val(opts.id);
    //focus away to prompt removal of error state, if present. Could only focus into...
    //...another field, Attempts to focusout, or focus onto body, did not work.
    $('#id_u_contact_title')
      .focus()
      .blur();
  });
};

/**
 * Clear comm_id field when keyup is registered on comm name field.
 */
ContactForm.prototype.clearHidden = function() {
  this.committeeId.val('');
};

/**
 *
 */
ContactForm.prototype.initOtherReason = function() {
  this.otherReason.addClass('conditional-field');
  this.otherReason.hide();
};

/**
 *
 * @param {JQuery.Event} e
 */
ContactForm.prototype.toggleOtherReason = function(e) {
  if (e.target.value === 'other') {
    this.otherReason.show();
  } else {
    this.otherReason.hide();
  }
};

/**
 *
 * @param {JQuery.Event} e
 */
ContactForm.prototype.clearForm = function(e) {
  e.preventDefault();
  this.$elm.find('input, textarea, select').each(function() {
    $(this).val('');
  });
};

/**
 * Analyst lookup tool
 * @param {JQuery.$element} $elm
 */
function AnalystLookup($elm) {
  this.$elm = $elm;
  this.$input = this.$elm.find('input');
  this.$name = this.$elm.find('.js-analyst-name');
  this.$analystContainer = this.$elm.find('.js-analyst-container');
  this.$prompt = this.$elm.find('.js-analyst-prompt');
  this.$ext = this.$elm.find('.js-analyst-ext');
  this.$analystDetails = this.$elm.find('.js-yes-analyst');
  this.$analystNoResults = this.$elm.find('.js-no-analyst');

  this.typeahead = new Typeahead(this.$input, 'committees', '');
  this.initTypeahead();

  this.$input.on('change, blur', this.handleChange.bind(this));

  loadRecaptcha();
}

/**
 *
 */
AnalystLookup.prototype.initTypeahead = function() {
  // Overriding default typeahead behavior
  this.typeahead.$element.css({ height: 'auto' });
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on('typeahead:select', this.fetchAnalyst.bind(this));
};

/**
 * @param {Event} e - The event from typeahead:select
 * @param {Object} opts
 */
AnalystLookup.prototype.fetchAnalyst = function(e, opts) {
  var url = URI(window.API_LOCATION)
    .path(Array.prototype.concat(window.API_VERSION, 'rad-analyst').join('/'))
    .addQuery({
      api_key: window.API_KEY_PUBLIC,
      per_page: 1,
      committee_id: opts.id
    })
    .toString();

  $.getJSON(url).done(this.showAnalyst.bind(this));
};

/**
 * @param {JQueryCallback} response
 */
AnalystLookup.prototype.showAnalyst = function(response) {
  var hasResults = response.results.length > 0;
  if (hasResults) {
    var name =
      response.results[0].first_name + ' ' + response.results[0].last_name;
    var ext = response.results[0].telephone_ext;
    this.$name.html(name);
    this.$ext.html(ext);
  }
  this.$analystContainer.attr('aria-hidden', 'false');
  this.$prompt.attr('aria-hidden', 'true');
  this.$analystDetails.attr('aria-hidden', !hasResults);
  this.$analystNoResults.attr('aria-hidden', hasResults);
};

/**
 *
 */
AnalystLookup.prototype.hideAnalyst = function() {
  this.$name.empty();
  this.$ext.empty();
  this.$analystContainer.attr('aria-hidden', 'true');
  this.$analystDetails.attr('aria-hidden', 'true');
  this.$analystNoResults.attr('aria-hidden', 'true');
  this.$prompt.attr('aria-hidden', 'false');
};

/**
 *
 * @param {JQuery.Event} e
 */
AnalystLookup.prototype.handleChange = function(e) {
  if (!$(e.target).val()) {
    this.hideAnalyst();
  }
};

/**
 *
 * @param {string} radformSelector - The value used to find the element with document.querySelector()
 */
function RadFormValidate(radformSelector) {
  this.messages = {
    id_u_contact_first_name: 'Please provide your first name',
    id_u_contact_last_name: 'Please provide your last name',
    id_u_contact_email: 'Please include a valid email address',
    id_committee_name: 'Please choose a valid committee',
    id_u_category: 'Please choose a category',
    id_u_description: 'Please include a detailed question',
    id_u_committee_member_certification: 'Please agree before submitting'
  };

  this.box_messages = {
    id_u_contact_first_name: 'First name',
    id_u_contact_last_name: 'Last name',
    id_u_contact_email: 'Valid email',
    id_committee_name: 'Valid committee name or ID',
    id_u_category: 'Subject',
    id_u_description: 'Question',
    id_u_committee_member_certification: 'I agree/agreement confirmation'
  };

  const radform = document.querySelector(radformSelector);
  // If radform is rendered to the page
  if (radform && radform.length) {
    this.id_u_contact_email = radform.querySelector('#id_u_contact_email');
    this.id_u_committee = radform.querySelector('#id_u_committee');
    this.req_fields = radform.querySelectorAll('[required]');
    this.id_committee_name = radform.querySelector('#id_committee_name');
    this.id_committee_name.setAttribute('autocomplete', 'off');

    const self = this;

    // Iterate the required fields to add error span and event listeners
    this.req_fields.forEach(function(req_field) {
      // If the required field is not the committee_member_certification checkbox
      if (req_field.id !== 'id_u_committee_member_certification') {
        req_field.insertAdjacentHTML(
          'afterend',
          '<span class="error ' + req_field.id + '" aria-live="polite"></span>'
        );
      } else {
        // This checkbox needs to put the error after its label or else it breaks its formatting on the page
        document
          .querySelector('label[for=id_u_committee_member_certification]')
          .insertAdjacentHTML(
            'afterend',
            '<span class="error ' +
              req_field.id +
              '" id="checkbox_error" aria-live="polite"></span>'
          );
      }

      // Bind showError() to blur event on required fields
      req_field.addEventListener('blur', function() {
        self.showError(req_field);
      });
      // Clear error once user starts typing
      req_field.addEventListener('input', function() {
        self.clearError(req_field);
      });
    });

    // Bind to submit event for the form
    radform.addEventListener('submit', this.handleSubmit.bind(this));
    // Bind to blur event for committee name or id field only
    this.id_committee_name.addEventListener(
      'blur',
      this.validateCommitteeId.bind(this)
    );
    // Bind to blur event for email field only
    this.id_u_contact_email.addEventListener(
      'blur',
      this.validateEmail.bind(this)
    );
  }
}

/**
 *
 * @param {SubmitEvent} event
 */
RadFormValidate.prototype.handleSubmit = function(event) {
  this.validateCommitteeId();
  const self = this;
  // Iterate invalid required fields to scroll to first invalid field
  let errored_list = [];
  for (const req_field of this.req_fields) {
    if (!req_field.validity.valid) {
      event.preventDefault();
      const req_field_id = req_field.getAttribute('id');
      const box_msg = self.box_messages[req_field_id];

      const errored_list_item = `<li>${box_msg}</li>`;

      errored_list.push(errored_list_item);
    }
    this.showError(req_field);
  }

  // Only shows recaptcha error if submit is prevented due to invalid fields, otherwise
  // recaptcha gets validated server-side
  let recaptcha_msg = '';
  if (!this.validateRecaptcha()) {
    recaptcha_msg = `<p>Also, reCAPTCHA thinks you’re a robot: Please try again.</p>`;
  }

  const error_msg = `
              <div class="message message--error error_box js-error-box">
                <h2 class="message__title">Error</h2>
                <p>Oops, you’re missing some information. We’ve highlighted the areas you need to fix:</p>
                  <ul>
                    ${errored_list.join('')}
                  </ul>
                  ${recaptcha_msg}
              </div>`;

  const error_message_box = document.querySelector('.js-error-box');
  if (error_message_box) {
    error_message_box.parentNode.removeChild(error_message_box);
  }

  if (errored_list.length) {
    document
      .querySelectorAll('.contact-form__element')[0]
      .insertAdjacentHTML('afterend', error_msg);

    document
      .querySelectorAll('.contact-form__element')[0]
      .scrollIntoView({ behavior: 'smooth' });
  }
};

/**
 *
 */
RadFormValidate.prototype.validateEmail = function() {
  const email_value = this.id_u_contact_email.value;
  // Email validation regex, email is also validated server-side by Django
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const self = this;
  if (re.test(email_value)) {
    // setCustomValidity allows us to overrride this req_field's WC3 default email validation which
    // contradicts Dango's server side validation and seems to confuse everyone
    self.id_u_contact_email.setCustomValidity('');
  } else {
    // This message does not actually get rendered from here, it just needs to be
    // anything other than an empty string to set the read-only validity state as invalid
    self.id_u_contact_email.setCustomValidity(
      'Please include a valid email address'
    );
  }
  this.showError(this.id_u_contact_email);
};

/**
 * Validation specific to committee name and ID field
 */
RadFormValidate.prototype.validateCommitteeId = function() {
  const self = this;
  if (!this.id_u_committee.value) {
    self.id_committee_name.value = '';
    // Need a set timeout to wait for Typeahead to finish whatever it is doing on the field
    setTimeout(function() {
      self.id_committee_name.value = '';
    }, 100);
  }
  // id_committee_name will not validate on blur, unless above validation code has run first
  this.showError(this.id_committee_name);
};

/**
 *
 * @param {HTMLFormElement} req - The field whose value is required
 */
RadFormValidate.prototype.clearError = function(req) {
  req.classList.remove('invalid_border');
  const field_id = req.getAttribute('id');
  const error_field = 'span.' + field_id;
  const req_fieldError = document.querySelector(error_field);
  req_fieldError.textContent = '';
};

/**
 * Runs if submit is prevented due to invalid fields, otherwise recaptcha gets validated server-side
 * @returns {boolean}
 */
RadFormValidate.prototype.validateRecaptcha = function() {
  if (grecaptcha.getResponse() == '') {
    analytics.customEvent({
      event: 'fecCustomEvent',
      eventCategory: 'Error',
      eventAction: 'RAD form validation',
      eventLabel: 'recaptcha'
    });
    return false;
  } else {
    return true;
  }
};

/**
 * Main showError function
 * @param {HTMLFormElement} req - The field whose value is required
 */
RadFormValidate.prototype.showError = function(req) {
  const field_id = req.getAttribute('id');
  const error_field = 'span.' + field_id;
  const req_fieldError = document.querySelector(error_field);
  const msg = this.messages[field_id];

  if (!req.validity.valid) {
    // This checkbox needs to put red border on label due to its formatting
    if (req.id == 'id_u_committee_member_certification') {
      document
        .querySelector('label[for=id_u_committee_member_certification]')
        .classList.add('invalid_border');
    } else {
      req.classList.add('invalid_border');
    }

    // Display the error message
    req_fieldError.textContent = msg;
  } else {
    // This checkbox needs to remove red border from label due to its formatting
    if (req.id == 'id_u_committee_member_certification') {
      document
        .querySelector('label[for=id_u_committee_member_certification]')
        .classList.remove('invalid_border');
    } else {
      req.classList.remove('invalid_border');
    }
    req_fieldError.textContent = '';
  }
  analytics.customEvent({
    event: 'fecCustomEvent',
    eventCategory: 'Error',
    eventAction: 'RAD form validation',
    eventLabel: req.id
  });
};

new ContactForm($('.js-contact-form'));
new AnalystLookup($('.js-analyst-lookup'));
new RadFormValidate('#id_contact_form');

// Even though we initialize above, export so it can be tested
module.exports = {
  AnalystLookup: AnalystLookup,
  ContactForm: ContactForm,
  RadFormValidate: RadFormValidate
};
