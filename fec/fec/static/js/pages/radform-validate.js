const messages = {
  id_u_contact_first_name: 'Please provide your first name',
  id_u_contact_last_name: 'Please provide your last name',
  id_u_contact_email: 'Please include a valid email address',
  id_committee_name: 'Please choose a valid committee',
  id_u_category: 'Please choose a category',
  id_u_description: 'Please include a detailed question',
  id_u_committee_member_certification: 'You must aree before submitting'
};

const radform = document.querySelector('.js-contact-form.contact-form');

if (radform && radform.length) {
  const id_u_committee = document.getElementById('id_u_committee');
  id_u_committee.removeAttribute('type');
  id_u_committee.insertAdjacentHTML('afterend', '<br>');

  const req_fields = radform.querySelectorAll('[required]');

  //const invalid_border = document.querySelectorAll('.invalid_border')
  const id_committee_name = document.getElementById('id_committee_name');
  id_committee_name.setAttribute('autocomplete', 'off');


  req_fields.forEach(function(req_field) {
    if (req_field.id !== 'id_u_committee_member_certification') {
      req_field.insertAdjacentHTML(
        'afterend',
        '<span class="error t-sans t-bold" aria-live="polite"></span>'
      );
    } else {
      document
        .querySelector('label[for=id_u_committee_member_certification]')
        .insertAdjacentHTML(
          'afterend',
          '<span class="error" id="checkbox_error" aria-live="polite"></span>'
        );
    }

    req_field.addEventListener('input', function() {
      //rem_border)
      showError(req_field);
    });

  });



  radform.addEventListener('submit', function(event) {

    validate_committee_id();

  var invalid_array = [];
  for (let req_field of req_fields) {


      if (!req_field.validity.valid) {
        // If it isn't, we display an appropriate error message
        

        showError(req_field);
        
        invalid_array.push(req_field)
        invalid_array[0].scrollIntoView();
        
        // Then we prevent the form from being sent by canceling the event
        event.preventDefault();
        //break;
        
      } else {
        req_field.nextElementSibling.textContent = '';
       
      }
    }
  });

  var validate_committee_id = function() {
    // if (!id_u_committee.validity.valid){
    //   id_committee_name.setCustomValidity("Invalid field.")
    //   alert('COMM ID INVALID')
    // }
    // else {
    //   id_u_committee.setCustomValidity(" ")
    //   id_committee_name.setCustomValidity(" ")
    // }

    if (!id_u_committee.value) {
      id_committee_name.value = '';
    } else {
      //id_u_committee.setCustomValidity(" ")
    }
  };
}



function showError(req) {

  const field_id = req.getAttribute('id');
  const error_field = '#' + field_id + ' ~ span.error';
  const req_fieldError = document.querySelector(error_field);
  const msg = messages[field_id];

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
}

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
