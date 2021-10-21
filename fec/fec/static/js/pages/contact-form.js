'use strict';

var $ = require('jquery');
var Typeahead = require('../modules/typeahead').Typeahead;
var URI = require('urijs');

const loadRecaptcha = require('../modules/load-recaptcha').loadRecaptcha;

/* ServiceNow contact form */
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

ContactForm.prototype.initTypeahead = function() {
  // Overriding default typeahead behavior
  // This will set the value of a hidden input when selecting a value from typeahead
  var self = this;
  this.typeahead.$element.css({ height: 'auto' });
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on('typeahead:select', function(e, opts) {
    self.committeeId.val(opts.id);
    //focus away to prompt removal of error state, if present.
    $('#id_u_contact_title').focus();
  });
};

//Clear comm_id field when keyup is registered on comm name field.
ContactForm.prototype.clearHidden = function() {
  this.committeeId.val('');
};

ContactForm.prototype.initOtherReason = function() {
  this.otherReason.addClass('conditional-field');
  this.otherReason.hide();
};

ContactForm.prototype.toggleOtherReason = function(e) {
  if (e.target.value === 'other') {
    this.otherReason.show();
  } else {
    this.otherReason.hide();
  }
};

ContactForm.prototype.clearForm = function(e) {
  e.preventDefault();
  this.$elm.find('input, textarea, select').each(function() {
    $(this).val('');
  });
};

/* Analyst lookup tool */
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

AnalystLookup.prototype.initTypeahead = function() {
  // Overriding default typeahead behavior
  this.typeahead.$element.css({ height: 'auto' });
  this.typeahead.$input.off('typeahead:select');
  this.typeahead.$input.on('typeahead:select', this.fetchAnalyst.bind(this));
};

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

AnalystLookup.prototype.hideAnalyst = function() {
  this.$name.empty();
  this.$ext.empty();
  this.$analystContainer.attr('aria-hidden', 'true');
  this.$analystDetails.attr('aria-hidden', 'true');
  this.$analystNoResults.attr('aria-hidden', 'true');
  this.$prompt.attr('aria-hidden', 'false');
};

AnalystLookup.prototype.handleChange = function(e) {
  if (!$(e.target).val()) {
    this.hideAnalyst();
  }
};

function RadFormValidate(radform) {
  this.messages = {
    id_u_contact_first_name: 'Please provide your first name',
    id_u_contact_last_name: 'Please provide your last name',
    id_u_contact_email: 'Please include a valid email address',
    id_committee_name: 'Please choose a valid committee',
    id_u_category: 'Please choose a category',
    id_u_description: 'Please include a detailed question',
    id_u_committee_member_certification: 'Please agree before submitting'
  };

  this.radform = document.querySelector(radform);
  //if radform is renndered to the page
  if (this.radform && this.radform.length) {
    this.id_u_committee = this.radform.querySelector('#id_u_committee');

    //get all required fields
    this.req_fields = this.radform.querySelectorAll('[required]');

    this.id_committee_name = this.radform.querySelector('#id_committee_name');
    this.id_committee_name.setAttribute('autocomplete', 'off');

    var self = this;

    //Iterate the required fields to add error span and event listeners
    this.req_fields.forEach(function(req_field) {
      //if the required field is not the committee_member_certification checkbox
      if (req_field.id !== 'id_u_committee_member_certification') {
        req_field.insertAdjacentHTML(
          'afterend',
          '<span class="error ' + req_field.id + '" aria-live="polite"></span>'
        );
      } else {
        //This checkbox needs to put the error after or else it breaks its formatting onn the page
        document
          .querySelector('label[for=id_u_committee_member_certification]')
          .insertAdjacentHTML(
            'afterend',
            '<span class="error ' +
              req_field.id +
              '" id="checkbox_error" aria-live="polite"></span>'
          );
      }

      //bind showError() to input event on required fields
      req_field.addEventListener('blur', function() {
        self.showError(req_field);
        //self.validateCommitteeId();
      });

      req_field.addEventListener('input', function() {
        self.clearError(req_field);
      });
    });

    //bind to submit event for the form
    this.radform.addEventListener('submit', this.handleSubmit.bind(this));
    //bind to blur event for id_committee name field only
    this.id_committee_name.addEventListener('blur', this.handleBlur.bind(this));
  } //end if(radform)
}

RadFormValidate.prototype.handleBlur = function() {
  this.validateCommitteeId();
  this.showError(this.id_committee_name);
};

RadFormValidate.prototype.handleSubmit = function(event) {
  this.validateCommitteeId();

  //iterate invalid required fields to scroll to first invalid field
  var errored_list = [];
  //var self = this;
  for (let req_field of this.req_fields) {
    if (!req_field.validity.valid) {
      event.preventDefault();
      var req_field_id = req_field.getAttribute('id');
      var error_label = document.querySelector(
        "label[for='" + req_field_id + "']"
      );
      //This ridiculousness is becuase Chai test refuses recognize this perfectly valid querySelector expression above
      if (error_label) {
        var txt = error_label.textContent;
      }
      var errored_list_item = `<li>${txt}</li>`;

      errored_list.push(errored_list_item);
    }

    this.showError(req_field);
  }
  var recaptcha_msg = '';
  if (!this.validateRecaptcha()) {
    recaptcha_msg = `<br>reCaptcha thinks you’re a robot. Please try again.`;
  }

  var error_msg = `<div class="message message--error js-error-list">
                <h2 class="message__title">Error</h2>
                <p>Oops, you’re missing some information. We’ve highlighted the areas you need to fix:
                  ${recaptcha_msg}
                  <br>The following fields have an error:</p>
                   <ul>
                     ${errored_list.join('')}
                   </ul>
               </div>`;

  var error_message_box = document.querySelector('.js-error-list');
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

//validation specific to committee name and ID field
RadFormValidate.prototype.validateCommitteeId = function() {
  if (!this.id_u_committee.value) {
    var self = this;
    self.id_committee_name.value = '';
    //need a set timeout to wait for typeahead to finish whatever it is doing on the field
    setTimeout(function() {
      self.id_committee_name.value = '';
    }, 100);
  }
};

RadFormValidate.prototype.clearError = function(req) {
  req.classList.remove('invalid_border');
  const field_id = req.getAttribute('id');
  //const error_field = '#' + field_id + ' ~ span.error';
  const error_field = 'span.' + field_id;
  const req_fieldError = document.querySelector(error_field);
  req_fieldError.textContent = '';
};

//Validate recaptcha only when there are still invalid fields,
//otherwise its validated server-side
RadFormValidate.prototype.validateRecaptcha = function() {
  if (grecaptcha.getResponse() == '') {
    return false;
  } else {
    return true;
  }
};

//main showError funcrtion
RadFormValidate.prototype.showError = function(req) {
  const field_id = req.getAttribute('id');
  //const error_field = '#' + field_id + ' ~ span.error';
  const error_field = 'span.' + field_id;
  const req_fieldError = document.querySelector(error_field);
  const msg = this.messages[field_id];

  if (!req.validity.valid) {
    //This chexkbox needs to put red border on label due to its formatting
    if (req.id == 'id_u_committee_member_certification') {
      document
        .querySelector('label[for=id_u_committee_member_certification]')
        .classList.add('invalid_border');
    } else {
      req.classList.add('invalid_border');
    }

    // display the following error message.
    req_fieldError.textContent = msg;
  } else {
    //This checkbox needs to put remove red border from label due to its formatting
    if (req.id == 'id_u_committee_member_certification') {
      document
        .querySelector('label[for=id_u_committee_member_certification]')
        .classList.remove('invalid_border');
    } else {
      req.classList.remove('invalid_border');
    }
    req_fieldError.textContent = '';
  }
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
