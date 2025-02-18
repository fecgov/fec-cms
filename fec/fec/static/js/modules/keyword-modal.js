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

  ///// NEW //////

  // this.$proximity_fields = this.$elm.find('input[name*="proximity"], #max_gaps'
  //  // '#q_proximity, #max_gaps, #proximity_filter_term, #proximity_filter' 
  // );
  //console.log('this.$proximity_fields: ',  this.$proximity_fields)

  //console.log(localStorage.getItem("q_proximity"));
  //const q_prox_value = (localStorage.getItem("q_proximity"));

  //const formData = new FormData(this.$elm.find('form')[0]);
  //formData.append("q_proximity", q_prox_value);

  // for (const [key, value] of formData.entries()) {
  //   const input = document.querySelector(`[name="${key}"]`);
  //   console.log('INPUT', input)
  //   if (input) {
  //     console.log('VALUE', value)
  //     input.value = value;
  //   }
  // }

  //console.log('formData: ',formData)
  //const fieldEntries = localStorage.getItem("formData");

  //console.log('formData: ',fieldEntries.get('q_proximity'));


  // console.log('this.proximity_fields',this.$proximity_fields)
  // console.log('this.proximity_fieldsARR',Array.from(this.$proximity_fields))
  // console.log('this.proximity_fieldsVAL',Array.from(this.$proximity_fields)[0])
  //*****  NOTE:  Use 'formData()' to populatr form from url querysyring ****


/////// SESSION STORAGE //////

  console.log('sessionStorage: ', sessionStorage)

  this.$proximity_fields_pop = this.$elm.find('input[name*="proximity"],select[name*="proximity"], #max_gaps'
    // '#q_proximity, #max_gaps, #proximity_filter_term, #proximity_filter' 
   );
   this.$proximity_fields_pop.each(function() {
    const $input = $(this);
  $input.val(sessionStorage.getItem($input.attr('id')))

   })
   
   /////// END SESSION STORAGE //////

   /////// validation //////

   //const q_proximity_fields  = document.querySelectorAll('input[name="q_proximity"]')
   const q_proximity_field  = document.getElementById("q_proximity")
   const maxgaps_field  = document.getElementById("max_gaps")
   q_proximity_field.addEventListener("mouseenter", function() { 
    
    //validateQProximityFirst() 
    if (!(maxgaps_field.value)) {
      console.log('NO VALUE')
      maxgaps_field.style="border-color:red"
      maxgaps_field.setCustomValidity('A proximity value is required');
    }
    else {
      maxgaps_field.style="border-color:#aeb0b5"
    }
  });
   
  //  q_proximity_fields.forEach(function (field) {
  //    field.addEventListener('click', validateQProximity(field));

  //  })

  function test() {
    alert('test')
  }

   function validateQProximity(field) {
    console.log('X:',field.value)
    if (field.value) {
      field.setCustomValidity('');
    } else {
      field.setCustomValidity('You must provide a value in max gaps field below to search primary keyword or phrase');
    }
    field.reportValidity();
   }

   function validateQProximityFirst() {
    //alert('clicked')
    console.log('X:',q_proximity_field.value)
    if (!(maxgaps_field.value)) {
      console.log('NO VALUE')
      maxgaps_field.setCustomValidity('A proximity value is required');
    } else {
      maxgaps_field.setCustomValidity('');
    }
    //q_proximity_field.reportValidity();
    maxgaps_field.reportValidity();
    
   }
  

   ///// end validation //////

///////  END NEW //////




  this.$excludeField = this.$elm.find('#keywords-none');
  this.$submit = this.$elm.find('button[type="submit"]');
  this.$submit.on('click', this.handleSubmit.bind(this));

  this.$addInput = this.$elm.find('#js-add-input');
  this.$addInput.on('click', this.addQproximityField.bind(this));




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

/**
 * Handle a click event on the submit button
 * prevents the form from being submitted at first in order to create the search string
 * and then replaces the existing search param in the window.
 * Hides the modal after execution.
 */
KeywordModal.prototype.handleSubmit = function(e) {
  e.preventDefault();
  const searchQuery = this.generateQueryString();
  const proxiimityQuery = this.generateProximityQueryString();
  let query = URI(window.location.search)
    .removeSearch('search')
    .addSearch('search', searchQuery);

  this.dialog.hide();
  // Event record for GTM
  this.fireEvent('Keyword modal query: ' + searchQuery);
   
  //const formData = new FormData(this.$elm.find('form')[0]);
  //localStorage.setItem('formData', formData);


  window.location = this.$form.attr('action') + query.toString() + proxiimityQuery.toString();
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
  this.$proximity_fields = this.$elm.find('input[name*="proximity"],select[name*="proximity"], #max_gaps'
    // '#q_proximity, #max_gaps, #proximity_filter_term, #proximity_filter' 
   );
   console.log('this.$proximity_fields: ',  this.$proximity_fields)

  let proxiimityQuery = '';
  const self = this;

  this.$proximity_fields.each(function() {
    const $input = $(this);
    if ($input.val()) {
      proxiimityQuery += `&${$input.attr('name')}=${$input.val()}`
      sessionStorage.setItem(`${$input.attr('id')}`, `${$input.val()}`);
    }
  });
  var queryString = proxiimityQuery;
  return queryString;
};

KeywordModal.prototype.addQproximityField = function() {
      const fields = document.getElementsByClassName('q-proximity-fields')[0]
      let childInputs = fields.querySelectorAll('input').length
      fields.insertAdjacentHTML('beforeend',`<input type="text" id="q_proximity-${childInputs+1}" name="q_proximity" required data-operator="and">`)
      // <button class="u-margin--top button button--close--base" type="button" id="js-remove-input"></button>

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
