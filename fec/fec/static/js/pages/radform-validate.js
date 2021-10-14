'use strict';

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
  //this.radform = document.querySelector(radform);
  this.radform = document.getElementById(radform);
  if (this.radform && this.radform.length) {
    //this.id_u_committee = document.getElementById('id_u_committee');
    this.id_u_committee = this.radform.querySelector('#id_u_committee');
    this.id_u_committee.removeAttribute('type');
    //id_u_committee.insertAdjacentHTML('afterend', '<br>');

    this.req_fields = this.radform.querySelectorAll('[required]');

    //this.id_committee_name = radform.getElementById('id_committee_name');
    this.id_committee_name = this.radform.querySelector('#id_committee_name');
    this.id_committee_name.setAttribute('autocomplete', 'off');

    var self = this;

    this.req_fields.forEach(function(req_field) {
      if (req_field.id !== 'id_u_committee_member_certification') {
        req_field.insertAdjacentHTML(
          'afterend',
          '<span class="error t-sans t-bold ' +
            req_field.id +
            '" aria-live="polite"></span>'
        );
      } else {
        document
          .querySelector('label[for=id_u_committee_member_certification]')
          .insertAdjacentHTML(
            'afterend',
            '<span class="error ' +
              req_field.id +
              '" id="checkbox_error" aria-live="polite"></span>'
          );
      }

      //req_field.addEventListener('input', self.showError.bind(this));

      req_field.addEventListener('input', function() {
        self.showError(req_field);
      });
    });

    this.radform.addEventListener('submit', this.handleSubmit.bind(this));
    this.id_committee_name.addEventListener('blur', this.handleBlur.bind(this));

    //for adding ID under field (doe snot completely work--does not get cleared)
    this.committeeNameError = document.querySelector('span.id_committee_name');
    this.id_u_committeeValue = `<span style="color:green" id="chosenId"></span>`;
    this.committeeNameError.insertAdjacentHTML(
      'afterend',
      this.id_u_committeeValue
    );
    this.chosenId = document.querySelector('#chosenId');
  } //end if radfomr
}

RadFormValidate.prototype.handleBlur = function() {
  //rem_border)
  this.validateCommitteeId();
  this.showError(this.id_committee_name);
};

// id_committee_name.addEventListener('typahhead:select', function() {
//   //rem_border)
//   alert('SELECTED')
//   showError(id_committee_name);
// });

RadFormValidate.prototype.handleSubmit = function(event) {
  this.validateCommitteeId();

  var invalid_array = [];
  for (let req_field of this.req_fields) {
    if (!req_field.validity.valid) {
      event.preventDefault();

      // If it isn't, we display an appropriate error message

      invalid_array.push(req_field);
      invalid_array[0].scrollIntoView();

      // Then we prevent the form from being sent by canceling the event

      //break;
    }
    this.showError(req_field);
    //  else {
    //   req_field.nextElementSibling.textContent = '';
    // }
  }
};

RadFormValidate.prototype.validateCommitteeId = function() {
  //var validateCommitteeId = function() {
  // if (!id_u_committee.validity.valid){
  //   id_committee_name.setCustomValidity("Invalid field.")
  //   alert('COMM ID INVALID')
  // }
  // else {
  //   id_u_committee.setCustomValidity(" ")
  //   id_committee_name.setCustomValidity(" ")
  // }

  if (!this.id_u_committee.value) {
    this.id_committee_name.value = '';
    this.chosenId.innerHTML = '';
  } else {
    //   document

    this.chosenId.innerHTML = 'ID: ' + this.id_u_committee.value + ' &#10004;';
    //   //id_u_committee.setCustomValidity(" ")
  }
};

RadFormValidate.prototype.showError = function(req) {
  //var showError = function(req) {
  const field_id = req.getAttribute('id');
  //const error_field = '#' + field_id + ' ~ span.error';
  const error_field = 'span.' + field_id;
  const req_fieldError = document.querySelector(error_field);
  const msg = this.messages[field_id];

  if (!req.validity.valid) {
    if (req.id == 'id_u_committee_member_certification') {
      document
        .querySelector('label[for=id_u_committee_member_certification]')
        .classList.add('invalid_border');
    } else {
      req.classList.add('invalid_border');
    }

    // If the field is empty,
    // display the following error message.
    req_fieldError.textContent = msg;
    //req.scrollIntoView()
  } else {
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

new RadFormValidate('radform_id');

module.exports = {
  RadFormValidate: RadFormValidate
};

// var go_to_first_error = function(req) {
//   req.scrollIntoView();
// };

// var validate_committee = function () {
//    fetch('https://api.open.fec.gov/v1/committees/?api_key=XXX&q=C00212191&sort_hide_null=false&sort_nulls_last=true&sort=-designation_full&per_page=10&pag=1')
//   .then(response => { return response.json() })
//   .then(function(obj) {
//                 const data = obj.results
//                 if (data[0].name) {
//                 console.log('success:'+ data[0].name)
//                 } else {
//                   console.log('No data')
//                 }
//               }).catch(error => { console.log('error:'+ error)
//             })
//    }
