import { default as A11yDialog } from 'a11y-dialog';
import { default as URI } from 'urijs';

import { customEvent } from './analytics.js';

/**
 * KeywordModal
 * @class
 * Creates a pop-up modal for advanced keyword searches
 * and processes the values of the various inputs to form a single search string
 * with all the proper boolean operators.
 * In the web app, it loads results by simply adding the new search query
 * to the window.location.search which forces a page refresh.
 */
export default function KeywordModal() {
  this.elm = document.querySelector('.js-keyword-modal');
  this.$elm = $(this.elm);
  this.$form = this.$elm.find('form');
  console.log('this.$form: ',this.$form )
  this.$fields = this.$elm.find(
    '#keywords-any, #keywords-all, #keywords-exact' 
  )
  // this.$proximity_fields = this.$elm.find('input[name="q_proximity"], input[name="proximity_filter_term"], select[name="proximity_filter"], input[name="max_gaps"]'
  //   // '#q_proximity, #max_gaps, #proximity_filter_term, #proximity_filter' 
  //  );

   console.log('window.location.search', window.location.search)



  

  
   const proximity_form  = document.querySelector('#proximity_form');
   const req_fields = proximity_form.querySelectorAll('[required]');
   const self = this;
   //let req_fields = proximity_form.find('[required]');
   console.log('req_fields: ' ,req_fields)
   //Array.from(req_fields).Foreach(function(req_field) {
   for (const req_field of req_fields) {
    req_field.insertAdjacentHTML(
      'afterend',
      '<span class="error ' + req_field.id + '" aria-live="polite"></span>'
    );
        // Bind showError() to blur event on required fields
        req_field.addEventListener('blur', function() {
          self.showError(req_field);
        });
        // Clear error once user starts typing
        req_field.addEventListener('input', function() {  
            self.clearError(req_field);
        });
   }










  this.$excludeField = this.$elm.find('#keywords-none');
  this.$submit = this.$elm.find('button[type="submit"]');
  this.$submit.on('click', this.handleSubmit.bind(this));

  this.$addInput = this.$elm.find('#js-add-input');
  this.$addInput.on('click', this.addQproximityField.bind(this));
  this.$removeInput = this.$elm.find('#js-rm-input');
  this.$removeInput.on('click', this.removeQproximityField.bind(this));
  // Using on JQuery on event here because element does not exist on page-load
  $(document).on('click','#js-rm-input', function(event){
    $(event.target).parent().remove()
  })



  this.dialog = new A11yDialog(this.elm);

  this.$elm.on(
    'dialog:show',
    function() {
      $('body').css('overflow', 'hidden');
      this.fireEvent('Keyword modal: opened');
    }.bind(this)
  );

  this.$elm.on('dialog:hide', function() {
    $('body').css('overflow', 'scroll');
  });


}

KeywordModal.prototype.showError = function(req) {
  this.messages = {
    'q_proximity': 'Please provide a keyword or phrase',
    'q_proximity-1': 'Please provide a keyword or phrase',
    'max_gaps': 'Please provide a proximity gap value',
  };

  const field_id = req.getAttribute('id');
  const error_field = 'span.' + field_id;
  const req_fieldError = document.querySelector(error_field);
  const msg = this.messages[field_id];

  req.classList.add('invalid_border');
  

  if (!req.validity.valid) {
      req.classList.add('invalid_border');
      req_fieldError.textContent = msg;
  } else {
    req.classList.remove('invalid_border');
    req_fieldError.textContent = '';
  }
};

/**
 * Handle a click event on the submit button
 * prevents the form from being submitted at first in order to create the search string
 * and then replaces the existing search param in the window.
 * Hides the modal after execution.
 */
KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  const searchQuery = this.generateQueryString();
  const proximityQuery = this.generateProximityQueryString();
  let query = URI(window.location.search)
    .removeSearch('q_proximity').removeSearch('max_gaps').removeSearch('proximity_filter_term').removeSearch('proximity_filter')
    .removeSearch('search')
    .addSearch('search', searchQuery)

  this.dialog.hide();
  // Event record for GTM
  this.fireEvent('Keyword modal query: ' + searchQuery);
   
  //const formData = new FormData(this.$elm.find('form')[0]);
  //localStorage.setItem('formData', formData);


  
  //document.forms["category-filters"].submit();
  window.location = this.$form.attr('action') + query.toString() + proximityQuery.toString();
};

/**
 * Converts the keyword modal value into a formatted search query string
 * @returns {string} formatted search query string
 */
KeywordModal.prototype.generateQueryString = function() {
  let includeQuery = '';
  let excludeQuery = '';
  const self = this;

  this.$fields.each(function() {
    const $input = $(this);
    if ($input.val() && includeQuery) {
      includeQuery = includeQuery + ' | ' + '(' + self.parseValue($input) + ')';
    } else if ($input.val()) {
      includeQuery = '(' + self.parseValue($input) + ')';
    }
  });

  if (this.$excludeField.val()) {
    excludeQuery = self.parseValue(this.$excludeField);
  }
  var queryString = includeQuery + excludeQuery;
  return queryString;
};


///////// NEW ////////
KeywordModal.prototype.generateProximityQueryString = function() {
  let $q_proximity_fields = this.$elm.find('input[name="q_proximity"], input[name="max_gaps"]')
  let $optional_proximity_fields = this.$elm.find('input[name="proximity_filter_term"], select[name="proximity_filter"]')

    // '#q_proximity, #max_gaps, #proximity_filter_term, #proximity_filter' 
  
   //console.log('this.$proximity_fields: ',  this.$proximity_fields)
  //let q_proximity_fields = $('#q_proximity, #q_proximity_1', '#max_gaps')

  let proximityQueryString = '';
  const self = this;

  if ($('#q_proximity').val() && $('#q_proximity-1').val()) {
    $q_proximity_fields.each(function() {
    const $input = $(this);
    //if ($input.val()) {
      proximityQueryString += `&${$input.attr('name')}=${$input.val()}`
      console.log('&${$input.attr("name")}: ',  `${$input.attr('name')}`)
      //sessionStorage.setItem(`${$input.attr('id')}`, `${$input.val()}`);
     //}
    });
  }
  if ($('#proximity_filter_term').val()) {
     $optional_proximity_fields.each(function() {
        const $input = $(this);
        //if ($input.val()) {
          proximityQueryString += `&${$input.attr('name')}=${$input.val()}`
          console.log('&${$input.attr("name")}: ',  `${$input.attr('name')}`)
          //sessionStorage.setItem(`${$input.attr('id')}`, `${$input.val()}`);
         //}
        });
    }
  return proximityQueryString;
};

KeywordModal.prototype.addQproximityField = function() {
      const fields = document.getElementsByClassName('q-proximity-fields')[0];
      let childInputs = fields.querySelectorAll('input').length - 1;
      fields.insertAdjacentHTML('beforeend',
        `<div class="input--removable ">
        <input type="text" id="q_proximity-${childInputs+1}" name="q_proximity"><button id="js-rm-input" class="u-margin--top button button--close--base modal__remove-field" type="button"></button>
        </div>`)

}

KeywordModal.prototype.removeQproximityField = function(event) {
  let field = event.target.previousElementSibling
  console.log('field: ', field)
  field.remove()


}



////// END NEW //////


/**
 * Parses the values of the individual input, combining the words with
 * whichever operator the input requires, as determined by its data-operator attribute.
 * @returns {string} The various words joined together with the correct operator
 */
KeywordModal.prototype.parseValue = function($input) {
  const words = $input
    .val()
    .replace(/"/g, '')
    .split(' ');
  const operator = $input.data('operator');
  if (operator === 'and') {
    return words.join(' + ');
  } else if (operator === 'or') {
    return words.join(' | ');
  } else if (operator === 'exact') {
    return '"' + $input.val().replace(/"/g, '') + '"';
  } else if (operator === 'exclude') {
    return $input
      .val()
      .split(' ')
      .map(function(word) {
        return ' -' + word;
      })
      .join('');
  }
};






/**
 * Fire an event to GTM
 * @param {string} actionLabel - Name of the action to register with GA
 */
KeywordModal.prototype.fireEvent = function(actionLabel) {
  // Updating this to use DataLayer for GTM
  customEvent({
    eventName: 'fecCustomEvent',
    eventCategory: 'Legal interactions',
    eventAction: actionLabel,
    eventValue: 1
  });
};
