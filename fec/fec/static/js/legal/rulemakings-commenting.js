/**
 * 
 * TODO (NOTE): key values are on dev
 * TODO (NOTE): how to handle duplicate file names if the files come from different directories
 * TODO (NOTE): cf services
 * TODO (NOTE): cf service-key service-name
 * 
 * TODO: on landing on the summary/review page, scroll to the top
 */
export default function RulemakingsCommenting() {
  this.appElId = 'rulemakings-comments'; // How to find the button to launch this
  this.app = document.querySelector(`#${this.appElId}`);
  this.formEl = this.app.querySelector('form');
  this.framesHolder = document.querySelector('#frames-holder');
  this.frames = document.querySelectorAll('.frame');
  this.frame0 = document.querySelector('#frame-representedEntityType');
  this.frame1 = document.querySelector('#frame-submitterInfo');
  this.frame2 = document.querySelector('#frame-commenterInfo');
  this.frame3 = document.querySelector('#frame-comments');
  this.frame4 = document.querySelector('#frame-summary');
  this.frame5 = document.querySelector('#frame-confirmation');
  this.help = document.querySelector('.js-help');
  this.bottomNav = document.querySelector('.frames-footer-nav');
  this.topNav = this.app.querySelector('.topnav');
  this.commenterTemplate;
  this.currentFrameNum;
  this.representedEntityType;
  this.submissionStatus;
  this.submissionResponse;
  this.init();
}

// TODO
// TODO: remove this and references to it
// TODO
RulemakingsCommenting.prototype.fakeTheData = function(initFormData) {
  let toReturn = initFormData;

  toReturn.set('representedEntityType', 'counsel');

  toReturn.set('commenters_0_.firstName', 'Johnna');
  toReturn.set('commenters_0_.lastName', 'Smith');
  toReturn.set('commenters_0_.addressType', 'Home');
  toReturn.set('commenters_0_.mailingCity', 'Smithsville');
  toReturn.set('commenters_0_.mailingState', 'AK');
  toReturn.set('commenters_0_.mailingCountry', 'USA');
  toReturn.set('commenters_0_.emailAddress', 'jsmith@email.email');

  toReturn.set('commenters_0_.firstName', 'Johnna');
  toReturn.set('commenters_0_.lastName', 'Smith');
  toReturn.set('commenters_0_.addressType', 'Home');
  toReturn.set('commenters_0_.mailingCity', 'Smithsville');
  toReturn.set('commenters_0_.mailingState', 'AK');
  toReturn.set('commenters_0_.mailingCountry', 'USA');
  toReturn.set('commenters_0_.emailAddress', 'jsmith@email.email');

  toReturn.set('lawfirm', true);

  // Include information for the lawfirm, if checked
  toReturn.set('commenters_0_.representedEntity.orgName', 'Bob Loblaw Law Firm');
  toReturn.set('commenters_0_.representedEntity.addressType', 'Branch');
  toReturn.set('commenters_0_.representedEntity.mailingAddressStreet', 'My Firm Branch Address');
  toReturn.set('commenters_0_.representedEntity.mailingCity', 'Bobtown');
  toReturn.set('commenters_0_.representedEntity.mailingState', 'AL');
  toReturn.set('commenters_0_.representedEntity.mailingZip', '20785-1237');
  toReturn.set('commenters_0_.representedEntity.mailingCountry', 'CA');
  toReturn.set('commenters_0_.representedEntity.emailAddress', 'bob@bobloblawlawblog.blog');

  toReturn.set('commenters_1_.commenterType', 'individual');
  toReturn.set('commenters_1_.firstName', 'John');
  toReturn.set('commenters_1_.lastName', 'Smith');
  toReturn.set('commenters_1_.orgName', 'ERROR');
  toReturn.set('commenters_1_.addressType', 'Office');
  toReturn.set('commenters_1_.mailingCity', 'Smithstown');
  toReturn.set('commenters_1_.mailingState', 'AR');
  toReturn.set('commenters_1_.mailingCountry', 'USA');
  toReturn.set('commenters_1_.emailAddress', 'jjsmith@email.com');

  toReturn.set('commenters_2_.commenterType', 'individual');
  toReturn.set('commenters_2_.firstName', 'Johnny');
  toReturn.set('commenters_2_.lastName', 'Smith');
  toReturn.set('commenters_2_.orgName', 'ERROR');
  toReturn.set('commenters_2_.addressType', 'Home');
  toReturn.set('commenters_2_.mailingCity', 'Smithstown');
  toReturn.set('commenters_2_.mailingState', 'AR');
  toReturn.set('commenters_2_.mailingCountry', 'USA');
  toReturn.set('commenters_2_.emailAddress', 'j3smith@email.com');

  toReturn.set('commenters_3_.commenterType', 'organization');
  toReturn.set('commenters_3_.firstName', 'ERROR');
  toReturn.set('commenters_3_.lastName', 'ERROR');
  toReturn.set('commenters_3_.orgName', 'Smithstown PTA');
  toReturn.set('commenters_3_.addressType', 'Headquarters');
  toReturn.set('commenters_3_.mailingCity', 'Smithsburgh');
  toReturn.set('commenters_3_.mailingState', 'AZ');
  toReturn.set('commenters_3_.mailingCountry', 'USA');
  toReturn.set('commenters_3_.emailAddress', 'smithpta@email.org');

  return toReturn;
};

/**
 * TEMP FUNCTION?
 * @param {string} name
 * @returns {string}
 */
function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1]
    ? decodeURIComponent(document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      .split('=')[1])
    : null;
}

/**
 * Kick it off
 */
RulemakingsCommenting.prototype.init = function() {
  this.frames = document.querySelectorAll('fieldset.frame');

  // Which block should we use as a template for every commenter?
  let commenter0block = this.formEl.querySelector('#contact-info-template');
  this.commenterTemplate = commenter0block.innerHTML;
  // Remove those elements that shouldn't be in _0_
  let unwantedNodes = commenter0block.querySelectorAll('[data-index-0="false"]');
  unwantedNodes.forEach(node => { node.remove(); });

  // Populate the lawfirm country <select> with the same values from #commenters_0_.mailingCountry
  // console.log('  country: ', this.formEl.querySelector('commenters_0_.representedEntity.mailingCountry'));
  this.formEl.querySelector('select[name="commenters_0_.representedEntity.mailingCountry"]').innerHTML =
    this.formEl.querySelector('select[name="commenters_0_.mailingCountry"]').innerHTML;

  // Listen to form events
  this.formEl.addEventListener('change', this.handleFormChange.bind(this));
  // this.formEl.addEventListener('click', this.handleFormClick.bind(this));

  let fileInputCancelButtons = this.formEl.querySelectorAll('#files-holder fieldset .button--cancel');
  fileInputCancelButtons.forEach(button => {
    button.addEventListener('click', this.handleFileCancelClick.bind(this));
  });

  let phoneInput = this.formEl.querySelector('[name="commenters_0_.phone"]');
  if (phoneInput) phoneInput.addEventListener('input', this.handlePhoneInput.bind(this));

  let tooltipTriggers = this.formEl.querySelectorAll('.tooltip__trigger');
  tooltipTriggers.forEach(button => {
    button.addEventListener('click', this.handleTooltipClick.bind(this));
  });

  let bottomNavButtons = this.bottomNav.querySelectorAll('button');
  bottomNavButtons.forEach(button => {
    button.addEventListener('click', this.handleBottomNavClick.bind(this));
  });

  let commentsTextarea = this.formEl.querySelector('textarea');
  commentsTextarea.addEventListener('resize', (e) => {
    console.log('resize(e): ', e);
  });
  commentsTextarea.addEventListener('input', () => {
    let charsAvail = 4000 - commentsTextarea.value.length;
    let output = this.formEl.querySelector('#comments-length-remaining');
    output.textContent = charsAvail.toLocaleString('en-US');
    output.classList.toggle('near-limit', charsAvail < 100);
  });

  window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

  this.goToFrame(0);
};

/**
 * @param {number|string} frameNum
 */
RulemakingsCommenting.prototype.goToFrame = function(frameNum) {
  // If we're already on the right frame, we're done
  if (this.currentFrameNum === frameNum) return;

  if (this.currentFrameNum == undefined) this.currentFrameNum = 0;

  if (frameNum == 'next') {
    // TODO: validate frameset just in case

    // For the 'self' type, we want to skip commenterInfo, _2_
    if (this.currentFrameNum === 1 && this.representedEntityType === 'self') {
      this.currentFrameNum = 3;
    } else this.currentFrameNum++;

  } else if (frameNum == 'back') {
    // For the 'self' type, we want to skip commenterInfo, _2_
    if (this.currentFrameNum === 3 && this.representedEntityType === 'self') {
      this.currentFrameNum = 1;

      // Otherwise, if we're past frame _0_, backup
    } if (this.currentFrameNum > 0) {
      this.currentFrameNum--;

    // But for frame _0_, _if there's no data to lose_, go to the previous browser page
    } else if (this.currentFrameNum === 0) {
      // TODO: if there's no data to lose,
      history.back();
    }
  } else if (frameNum === 'confirmation') {
    this.currentFrameNum = this.frames.length - 1;
    this.updateBottomNav('confirmation');
  }

  this.updateLaterFrames();

  // Update the frames' classes
  this.frames.forEach((frame, i) => {
    frame.classList.toggle('previous', i < this.currentFrameNum);
    frame.classList.toggle('next', i > this.currentFrameNum);
    frame.classList.toggle('current', i === this.currentFrameNum);
  });

  this.updateHeightForCurrentFrame();

  this.updateTopNav();

  // The confirmation page has nothing to validate
  if (this.currentFrameNum != 5) this.validateCurrentFrame();
};

/**
 *
 */
RulemakingsCommenting.prototype.updateHeightForCurrentFrame = function() {
  let currFrame = this.formEl.querySelector('.frame.current');
  if (currFrame)
    this.framesHolder.style.height = `${currFrame.clientHeight}px`;
};

/**
 * Will build or update "next" frames as needed
 */
RulemakingsCommenting.prototype.updateLaterFrames = function() {
  console.log('updateLaterFrames()');

  if (this.currentFrameNum === 1) {
    console.log('  frame 1');
    if (this.representedEntityType == 'self') {
      //
    }
  } else if (this.currentFrameNum === 2) {
    // 2 is the commenter info
    let commentersHolder = this.formEl.querySelector('#commenters-holder');
    if (!commentersHolder.childElementCount) {
      this.addCommenter();
    }

  } else if (this.currentFrameNum === 4) {
    console.log('  summary!');

    if (!this.validateEntireForm()) {
      console.log('SHOULD GO BACK TO PREVIOUS PAGE!');
    }

    let formData = new FormData(this.formEl);
    let summaryTable = this.frame4.querySelector('table tbody');
    let newInnerHtml = '';

    // TODO: REMOVE THIS
    formData = this.fakeTheData(formData);
    // TODO: REMOVE THIS

    newInnerHtml += `<tr><th colspan="2">Confirm information</th></tr>`;
    newInnerHtml += `<tr><td colspan="2">Verify the following information before clicking submit.</td></tr>`;
    newInnerHtml += `<tr><td colspan="2">&nbsp;</td></tr>`;

    // Section heads and name (no title for 'self')
    if (this.representedEntityType === 'counsel')
      newInnerHtml += `<tr><th colspan="2">Counsel</th></tr>`;

    else if (this.representedEntityType === 'rep')
      newInnerHtml += `<tr><th colspan="2">Officer/Representative/Member</th></tr>`;

    else if (this.representedEntityType === 'other')
      newInnerHtml += `<tr><th colspan="2">${formData.get('representedEntityConnection')}</th></tr>`;

    // Everyone: first commenter's info
    newInnerHtml += `<tr><td>Name:</td><td>${formData.get('commenters_0_.firstName')} ${formData.get('commenters_0_.lastName')}</td></tr>`;
    newInnerHtml += `<tr><td>Address type:</td><td>${formData.get('commenters_0_.addressType')}</td></tr>`;
    newInnerHtml += `<tr><td>City:</td><td>${formData.get('commenters_0_.mailingCity')}</td></tr>`;
    newInnerHtml += `<tr><td>State:</td><td>${formData.get('commenters_0_.mailingState')}</td></tr>`;
    newInnerHtml += `<tr><td>Country:</td><td>${formData.get('commenters_0_.mailingCountry')}</td></tr>`;
    newInnerHtml += `<tr><td>Email:</td><td>${formData.get('commenters_0_.emailAddress')}</td></tr>`;

    if (this.representedEntityType != 'self') { // None of these are for 'self'

      if (this.representedEntityType === 'counsel' && formData.get('lawfirm')) {
        // Include information for the lawfirm, if checked
        newInnerHtml += `<tr><th colspan="2">Law firm</th></tr>`;
        newInnerHtml += `<tr><td>Organization:</td><td>${formData.get('commenters_0_.representedEntity.orgName')}</td></tr>`;
        newInnerHtml += `<tr><td>Address type:</td><td>${formData.get('commenters_0_.representedEntity.addressType')}</td></tr>`;
        newInnerHtml += `<tr><td>Street address:</td><td>${formData.get('commenters_0_.representedEntity.mailingAddressStreet')}</td></tr>`;
        newInnerHtml += `<tr><td>City:</td><td>${formData.get('commenters_0_.representedEntity.mailingCity')}</td></tr>`;
        newInnerHtml += `<tr><td>State:</td><td>${formData.get('commenters_0_.representedEntity.mailingState')}</td></tr>`;
        newInnerHtml += `<tr><td>ZIP code:</td><td>${formData.get('commenters_0_.representedEntity.mailingZip')}</td></tr>`;
        newInnerHtml += `<tr><td>Country:</td><td>${formData.get('commenters_0_.representedEntity.mailingCountry')}</td></tr>`;
        newInnerHtml += `<tr><td>Email:</td><td>${formData.get('commenters_0_.representedEntity.emailAddress')}</td></tr>`;
      }

      // COMMENTER LOOP
      // /counsel for another person group or org
      for (let i = 1;
        formData.has('commenters_' + i + '_.firstName') ||
        formData.has('commenters_' + i + '_.orgName');
        i++) {

        newInnerHtml += `<tr><th colspan="2">Commenter #${i}</th></tr>`;

        newInnerHtml += '<tr><td>';
        if (formData.get('commenters_' + i + '_.commenterType') === 'individual')
          newInnerHtml += 'Name:</td><td>'
            + formData.get('commenters_' + i + '_.firstName') + ' '
            + formData.get('commenters_' + i + '_.lastName');
        else
          newInnerHtml += `Organization:</td><td>${formData.get('commenters_' + i + '_.orgName')}`;

        newInnerHtml += '</td></tr>';

        const addrType = formData.get('commenters_' + i + '_.addressType');
        const addrCity = formData.get('commenters_' + i + '_.mailingCity');
        const addrState = formData.get('commenters_' + i + '_.mailingState');
        const addrCountry = formData.get('commenters_' + i + '_.mailingCountry');
        const addrEmail = formData.get('commenters_' + i + '_.emailAddress');

        newInnerHtml += `<tr><td>Address type:</td><td>${addrType}</td></tr>`;
        newInnerHtml += `<tr><td>City:</td><td>${addrCity}</td></tr>`;
        newInnerHtml += `<tr><td>State:</td><td>${addrState}</td></tr>`;
        newInnerHtml += `<tr><td>Country:</td><td>${addrCountry}</td></tr>`;
        newInnerHtml += `<tr><td>Email:</td><td>${addrEmail}</td></tr>`;
      }
    }

    newInnerHtml += `<tr><td colspan="2"><hr></td></tr>`;

    // For everyone
    if (formData.get('files_0_').name)
      newInnerHtml += `<tr><td>Attachment:</td><td>${formData.get('files_0_').name}</td></tr>`;
    if (formData.get('files_1_').name)
      newInnerHtml += `<tr><td>Attachment:</td><td>${formData.get('files_1_').name}</td></tr>`;
    if (formData.get('files_2_').name)
      newInnerHtml += `<tr><td>Attachment:</td><td>${formData.get('files_2_').name}</td></tr>`;

    newInnerHtml += `<tr><td colspan="2"><hr></td></tr>`;

    newInnerHtml += `<tr><td>Text comment:</td><td>${formData.get('comments')}</td></tr>`;

    summaryTable.innerHTML = newInnerHtml;

  } else if (this.currentFrameNum === 5) {
    console.log('CONFIRMATION PAGE');
    // Confirmation page!

    // If we have a success response, let's put those details into the page
    if (this.submissionResponse && this.submissionStatus == 'success') {
      // If we have a response, we need to fill in some fields
      console.log('  RESPONSE: ', this.submissionResponse);
      let formData = new FormData(this.formEl);
      formData = this.fakeTheData(formData);

      let now = new Date();
      let datetimeStamp = new Date(this.submissionResponse.submitted_at);// 'yyyy-mm-dd hh:mmT-4';
      let datetimeString = now.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
      });
      let confirmationMessage = formData.get('commenters_0_.lastName') + ', ';
      confirmationMessage += formData.get('commenters_0_.firstName');
      confirmationMessage += ' has submitted comments ';

      if (this.representedEntityType === 'self') {
        // nothing
      } else if (this.representedEntityType === 'counsel') {
        // counsel org name

        let commentersNames = [];
        for (let i = 1; formData.has('commenters_' + i + '_.commenterType'); i++) {
          console.log('  for ', i);
          commentersNames.push(
            formData.get('commenters_' + i + '_.commenterType') === 'individual'
            ? formData.get('commenters_' + i + '_.firstName') + ' ' + formData.get('commenters_' + i + '_.lastName')
            : formData.get('commenters_' + i + '_.orgName')
          );
        }
        console.log('  commentersNames: ', commentersNames);

        // If there are commenters_1_+, we need the "on behalf of" part
        if (commentersNames.length > 0)
          confirmationMessage += 'on behalf of ';

        // If there's one commenter, add their name
        if (commentersNames.length === 1)
          confirmationMessage += commentersNames[0];
        // For two commenters, join them with an 'and'
        else if (commentersNames.length === 2)
          confirmationMessage += commentersNames.join(' and ');
        // For more than two, join with commas and a serial comma because we don't know what names could be
        else
          confirmationMessage += commentersNames.slice(0, -1).join(', ') + ', and ' + commentersNames.slice(-1);
      }

      confirmationMessage += ' for ';
      confirmationMessage += formData.get('reg_no') + ' ';
      confirmationMessage += formData.get('reg_name');
      confirmationMessage += ' on ';
      confirmationMessage += `<time datetime="${datetimeStamp}">${datetimeString}</time>.`;
      this.frame5.querySelector('.message--success p').innerHTML = confirmationMessage;

    } else if (this.submissionStatus == 'error') {
      // TODO: If we have an error response
    }

    // If we're still submitting, let's show that block
    let messageElements = [...this.frame5.children];
    // Toggle HTMLElements based on submissionStats vs data-status=""
    messageElements.forEach(messageEl => {
      console.log('    messageEl: ', messageEl);
      // console.log('      submissionStatus: ', submissionStatus);
      console.log('      comparison: ', messageEl.dataset.status != this.submissionStatus);
      messageEl.classList.toggle('hidden', messageEl.dataset.status != this.submissionStatus);
    });
  }
};

/**
 * @returns {boolean}
 */
RulemakingsCommenting.prototype.validateEntireForm = function() {
  console.log('validateEntireForm()');
  let toReturn = true;
  let formData = new FormData(this.formEl);

  // Fields that are always required
  const requiredFieldNames = [
    'representedEntityType',
    'commenters_0_.firstName',
    `commenters_0_.lastName`,
    `commenters_0_.addressType`,
    `commenters_0_.mailingCity`,
    `commenters_0_.mailingState`,
    `commenters_0_.mailingCountry`,
    `commenters_0_.emailAddress`
  ];

  // For 'other' relationships, record how they label the relationship
  if (this.representedEntityType === 'other')
    requiredFieldNames.push('representedEntityConnection');

  // For those who'd like to testify
  if (formData.get('commenters_0_.testify') === true)
    requiredFieldNames.push('commenters_0_.phone');

  // Fields required only for counsel AND if they've chosen to include law firm information
  if (this.representedEntityType === 'counsel' && formData.get('lawfirm') === true) {
    requiredFieldNames.push(
      'commenters_0_.representedEntity.orgName',
      'commenters_0_.representedEntity.addressType',
      'commenters_0_.representedEntity.mailingAddressStreet',
      'commenters_0_.representedEntity.mailingCity',
      'commenters_0_.representedEntity.mailingState',
      'commenters_0_.representedEntity.mailingZip',
      'commenters_0_.representedEntity.mailingCountry',
      'commenters_0_.representedEntity.emailAddress'
    );
  }

  // For non-self commenters, add every commenters[i] element that exists
  if (this.representedEntityType != 'self') {
    let i;
    while (formData.has(`commenters[${i}].commenterType`)) {
      requiredFieldNames.push(`commenters[${i}].commenterType`);

      if (formData.get(`commenters[${i}].commenterType`) === 'organization')
        requiredFieldNames.push(`commenters[${i}].representedEntity.orgName`);
      else
        requiredFieldNames.push(
          `commenters[${i}].representedEntity.firstName`,
          `commenters[${i}].representedEntity.firstName`
        );

      requiredFieldNames.push(
        `commenters[${i}].representedEntity.addressType`,
        `commenters[${i}].representedEntity.mailingAddressStreet`,
        `commenters[${i}].representedEntity.mailingCity`,
        `commenters[${i}].representedEntity.mailingState`,
        `commenters[${i}].representedEntity.mailingCountry`,
        `commenters[${i}].representedEntity.emailAddress`
      );
      i++;
    }
  }

  // Now, on to validating the fields
  requiredFieldNames.forEach(fieldName => {
    this.validateField(`[name="${fieldName}"]`);
  });

  // Required: a comment or at least one attached file
  if (!formData.get('files_0_').file && !formData.get('files_1_').file
    && !formData.get('files_2_').file && !formData.get('comments').length < 1) {
      toReturn = false;
  }

  console.log('  toReturn: ', toReturn);
  return toReturn;
};

/**
 * 
 * @param {(string|HTMLElement)} elOrSelector - HTML element or a string to select it
 * @param {boolean} [requireValue=false]
 * @returns {boolean} whether the field is validated
 */
RulemakingsCommenting.prototype.validateField = function(elOrSelector, requireValue = false) {
  console.log('validateField(elOrSelector, requireValue): ', elOrSelector, requireValue);
  const theField = typeof elOrSelector === 'string'
    ? this.formEl.querySelector(elOrSelector)
    : elOrSelector;
  const fieldName = theField.name;
  const formData = new FormData(this.formEl);
  let toReturn = true;
  console.log('  theField: ', theField);
  console.log('  fieldName: ', fieldName);

  // Testing a state field, it needs to be exactly two letters if for the USA. Otherwise optional.
  if (fieldName.indexOf('State') > 0) {
    let theCountry = formData.get(fieldName.replace('State', 'Country'));
    if (theCountry === 'USA' && !formData.get(fieldName).length !== 2) {
      if (requireValue) theField.classList.add('invalid');
      toReturn = false;
    }

  // ZIP Codes in the USA should be five numbers then optionally a dash and four numbers. Optional outside the US
  } else if (fieldName.indexOf('Zip') > 0) {
    let theCountry = formData.get(fieldName.replace('Zip', 'Country'));
    const zipRegex = /\d{5}(-\d{4}){0,1}$/;
    if (theCountry === 'USA' && !zipRegex.test(formData.get(fieldName))) {
      if (requireValue) theField.classList.add('invalid');
      toReturn = false;
    }
  } else if (requireValue === true && formData.get(fieldName).length <= 2) {
    if (requireValue) theField.classList.add('invalid');
    toReturn = false;
  }

  return toReturn;
};

/**
 * @returns {HTMLElement} Returns the new commenter/div created
 */
RulemakingsCommenting.prototype.addCommenter = function() {
  let commentersHolder = this.formEl.querySelector('#commenters-holder');
  let newCommenter = document.createElement('div');
  newCommenter.setAttribute('class', 'commenter');
  // Set its innerHTML
  let newChildIndex = commentersHolder.childElementCount + 1;
  let newInnerHtml = this.commenterTemplate;
  newInnerHtml = newInnerHtml.replace('data-index-0="false"', '');
  newInnerHtml = newInnerHtml.replaceAll('0', newChildIndex);
  newCommenter.innerHTML = newInnerHtml;

  // Remove any of the possible "I'd like to testify" fields that should only be included for the submitter
  let testifyEls = newCommenter.querySelectorAll(
    'fieldset[data-show-if-var$=".testify"], fieldset:has(input[name$=".testify"])'
  );
  testifyEls.forEach(el => {
    newCommenter.removeChild(el);
  });

  // Add button listeners
  newCommenter.querySelectorAll('.commenter-controls button').forEach(button => {
    button.addEventListener('click', this.handleCommenterClick.bind(this));
  });

  commentersHolder.appendChild(newCommenter);

  console.log('  this.formEl: ', this.formEl);
  this.formEl.dispatchEvent(new Event('change')); // For the height resize

  return newCommenter;
};

/**
 * 
 * @param {HTMLElement} el
 */
RulemakingsCommenting.prototype.removeCommenter = function(el) {
  let commentersHolder = this.formEl.querySelector('#commenters-holder');
  // If we won't be removing the only commenter, do it
  el.remove();

  // If we've removed the only commenter, add a new one
  if (commentersHolder.childElementCount < 1) this.addCommenter();

  // Re-number the remaining commenters
  let commenters = [...commentersHolder.children];
  commenters.forEach((commenter, i) => {
    let i1 = i + 1;
    let elementsToUpdate = commenter.querySelectorAll('input, select, label');
    elementsToUpdate.forEach(elToUpdate => {
      console.log('  elToUpdate: ', elToUpdate);
      if (elToUpdate.name) elToUpdate.setAttribute('name', elToUpdate.name.replace(/(\[\d+\])/, `[${i1}]`));
      if (elToUpdate.id) elToUpdate.setAttribute('id', elToUpdate.id.replace(/(\[\d+\])/, `[${i1}]`));
      if (elToUpdate.for) elToUpdate.setAttribute('for', elToUpdate.for.replace(/(\[\d+\])/, `[${i1}]`));
      console.log('    elToUpdate: ', elToUpdate);
    });
    let commenterNumberLabel = commenter.querySelector('label:first-of-type');
    console.log('  commenterNumberLabel: ', commenterNumberLabel);
    commenterNumberLabel.innerHTML = `Commenter #${(i1)}`;
  });

  this.formEl.dispatchEvent(new Event('change')); // For the height resize

};

/**
 * Called when anything is typed into the phone field, saves non-digits and displays them in a US phone format
 * @param {InputEvent} e
 */
RulemakingsCommenting.prototype.handlePhoneInput = function(e) {
  let field = e.target;
  let digitsStr = field.value.replaceAll(/\D/g, '').substring(0,10);
  let area = digitsStr.substring(0,3);
  let prefix = digitsStr.substring(3,6);
  let line = digitsStr.substring(6,10);
  // I like these being >5 and >2 but then it's impossible to backspace from line to prefix or from prefix to area
  if (digitsStr.length > 6) field.value = `(${area}) ${prefix}-${line}`;
  else if (digitsStr.length > 3) field.value = `(${area}) ${prefix}`;
  else if (digitsStr.length > 0) field.value = `(${area}`;
};
/**
 *
 */
RulemakingsCommenting.prototype.handleCommenterClick = function(e) {
  console.log('handleCommenterClick(e): ', e);
  e.preventDefault();
  if (e.target.dataset.command == 'add-commenter') {
    this.addCommenter();
  } else if (e.target.dataset.command == 'remove-commenter') {
    this.removeCommenter(e.target.closest('.commenter'));
  }

  // If the type was clicked, toggle the fields in this commenter
  if (e.target.name.indexOf('.commenterType') ) this.toggleCommenterFields(e.target);
};

/**
 *
 * @param {PointerEvent} e
 */
RulemakingsCommenting.prototype.handleFileCancelClick = function(e) {
  console.log('handleFileCancelClick(e): ', e);
  e.preventDefault();

  // Find the linked <input> element, clear its value and remove the has-file class
  let linkedInput = this.formEl.querySelector(`#${e.target.dataset.commandfor}`);
  console.log('. linkedInput: ', linkedInput);
  // linkedInput.type = ''; // Change it to not-a-file because we can't set the .value or .files
  // linkedInput.type = 'file'; // Change it back to a file selector
  linkedInput.value = '';
  linkedInput.classList.remove('has-file');
};

/**
 * @param {HTMLElement}
*/
RulemakingsCommenting.prototype.toggleCommenterFields = function(targetEl) {
  // /*console.log('toggleCommenterFields(targetEl): ', targetEl);
  let commenterBlock = targetEl.closest('.commenter');
  console.log('  commenterBlock: ', commenterBlock);
  console.log('  commenterBlock.children: ', commenterBlock.children);
  let commenterType = commenterBlock.querySelector('[id$=".commenterType"]').value;
};

/**
 * 
 */
RulemakingsCommenting.prototype.toggleElementsByVars = function() {
  console.log('toggleElementsByVars()');
  let elementsToToggle = this.formEl.querySelectorAll('[data-show-if-var][data-show-if-val]');
  elementsToToggle.forEach(elToToggle => {
    console.log('\n  forEach');
    let varName = elToToggle.dataset.showIfVar; // Which variable/input are we checking?
    let varValue = elToToggle.dataset.showIfVal; // What value is the display value?
    //
    // We want :checked elements tied to the same elements
    // let selectorString = `[name="${varName}"]:checked, [name="${varName}"]:not([type="checkbox"], [type="radio"])`;
    let selectorString = `[name="${varName}"]:checked`;
    // console.log('    selectorString: ', selectorString);

    let controllerInput = this.formEl.querySelector(selectorString);
    let shouldShow = false;
    if (controllerInput) {
      let matchedInputValue = controllerInput.value;
      shouldShow = matchedInputValue == varValue;
    }

    if (shouldShow) elToToggle.removeAttribute('aria-hidden');
    else elToToggle.setAttribute('aria-hidden', true);

    // Make child elements required or not, based on whether its parent is visible
    let innerInputs = elToToggle.querySelectorAll('input:not([type="checkbox"])');
    innerInputs.forEach(input => {
      input.required = shouldShow;
    });
  });
  // if we've toggled anything, we need to adjust the height again
  this.updateHeightForCurrentFrame();
};

/**
 * Updates the meter and links in the topnav
 */
RulemakingsCommenting.prototype.updateTopNav = function() {
  console.log('updateTopNav()');
  console.log('  this.currentFrameNum: ', this.currentFrameNum);

  if (this.currentFrameNum === 5) {
    this.topNav.classList.add('hidden');
    return;
  }

  let theMeter = this.topNav.querySelector('meter');

  if (!this.representedEntityType) return; // If we don't have a type, don't show self

  // Where are we now?
  theMeter.value = this.currentFrameNum + 1;
  let totalFrames = 5;//this.representedEntityType === 'self' ? 4 : 5;
  theMeter.setAttribute('max', totalFrames);
  theMeter.setAttribute('value', this.currentFrameNum + 1);

  let navLabels = this.topNav.querySelectorAll('li a');
  if (['self'].includes(this.representedEntityType)) {
    navLabels[0].textContent = 'Submitting on behalf of myself';
    navLabels[1].textContent = 'Your information';
    navLabels[2].closest('li').classList.add('hidden');

  } else if (['counsel'].includes(this.representedEntityType)) {
    navLabels[0].textContent = 'Submitting as counsel to another';
    navLabels[1].textContent = 'Counsel information';

  } else if (['rep'].includes(this.representedEntityType)) {
    navLabels[0].textContent = 'Submitting as an officer/representative/member';
    navLabels[1].textContent = 'Personal information';

  } else if (['other'].includes(this.representedEntityType)) {
    navLabels[0].textContent = 'Submitting on behalf of another';
    navLabels[1].textContent = 'Personal information';
  }
  navLabels[2].textContent = 'Commenter information';
  navLabels[3].textContent = 'Comments';
  navLabels[4].textContent = 'Review';

  if (this.submissionStatus === 'submitting')
    navLabels[5].textContent = 'Submitting information';

  else if (this.submissionStatus === 'error')
    navLabels[5].textContent = 'Error';

  else if (this.submissionStatus === 'success') {
    navLabels[5].textContent = 'Comments received';
    theMeter.classList.add('complete');
  }

  navLabels.forEach((label, i) => {
    label.closest('li').classList.toggle('current', i === this.currentFrameNum);
    if (i <= this.currentFrameNum) label.closest('li').classList.add('viewed');
  });
};

/**
 * Set the classes for the bottom nav buttons.
 * @param {('next'|'incomplete'|'submit')} frameState
 */
RulemakingsCommenting.prototype.updateBottomNav = function(state = 'incomplete') {
  console.log('updateBottonNav(state): ', state);

  console.log('  this.currentFrameNum: ', this.currentFrameNum);
  if (this.currentFrameNum === 5) {
    this.bottomNav.classList.add('hidden');
    return;
  }

  this.formEl.querySelector('[data-command="next"]').classList.toggle('is-inactive', state === 'incomplete');
  this.formEl.querySelector('[data-command="next"]').classList.toggle('hidden', state === 'submit');
  this.formEl.querySelector('[data-command="submit"]').classList.toggle('hidden', state != 'submit');

  let tipForNextButton = '';
  if (this.currentFrameNum === 0)
    tipForNextButton = 'Next step: Provide your personal information';
  else if (this.currentFrameNum === 1 && this.representedEntityType == 'self')
    tipForNextButton = 'Next step: Provide your comments';
  else if (this.currentFrameNum === 1)
    tipForNextButton = 'Next step: Provide commenter information';
  else if (this.currentFrameNum === 2)
    tipForNextButton = 'Next step: Provide comments';
  else if (this.currentFrameNum === 3)
    tipForNextButton = 'Next step: Review and submit information';

  this.bottomNav.querySelector('.t-note').innerHTML = tipForNextButton;

  // If we're on the submit page, let's activate the submit button, but only after a delay to prevent accidental clicks.
  // Otherwise, disable it
  if (state === 'submit') {
    grecaptcha.render('commenting-recaptcha-badge', {}, true);
    setTimeout(() => {
      this.formEl.querySelector('[data-command="submit"]').classList.remove('is-disabled');
    }, 2000);
  } else {
    this.formEl.querySelector('[data-command="submit"]').classList.add('is-disabled');
    // this.formEl.querySelector('.g-recaptcha').classList.add('hidden');
  }
};

/**
 * @param {Event} e
 */
RulemakingsCommenting.prototype.handleFormChange = function(e) {
  console.log('handleFormChange(e): ', e);
  // Maybe later: this.formEl.removeAttribute('data-has-been-active');

  // let formData = new FormData(this.formEl);

  // If it's a text-type element, first trim off any leading or trailing spaces
  if (['text', 'email'].includes(e.target.type))
    e.target.value = e.target.value.trim();

  if (e.target.type == 'file') {

    // Add/remove the has-file class to toggle the X button, which will let css show additional pickers
    e.target.classList.toggle('has-file', e.target.files);
    // let filesHolder = this.formEl.querySelectorAll('#files-holder fieldset');
  }

  // The first frame has an 'other' field to toggle
  if (e.target.name === 'representedEntityType' || e.target.name === 'representedEntityConnection') {
    // For the first frame, there's been activity so let's restrict leaving the page and losing data
    this.formEl.dataset.hasBeenActive = true;
    // formData.set(e.target.name, e.target.value);

    if (e.target.name === 'representedEntityType')
      this.representedEntityType = e.target.value;
      console.log('  this.representedEntityType: ', this.representedEntityType);

    // TODO: If the type is anything other than 'other', skip anything leftover in the relationship field
  }

  // If we've changed the country, we'll toggle whether state and ZIP are required (req for US/USA)
  if (e.target.name.indexOf('.mailingCountry') > 0) {
    let elementNameRoot = e.target.name.substring(0, e.target.name.lastIndexOf('.'));
    let zipAndStateFields = this.formEl.querySelectorAll(
      `[name="${elementNameRoot}.mailingState"], [name="${elementNameRoot}.mailingZip"]`
    );
    zipAndStateFields.forEach(field => {
      if (e.target.value === 'USA' || e.target.value == 'US')
        field.setAttribute('required', true);
      else
        field.removeAttribute('required');
    });
  }

  this.toggleElementsByVars();
  this.validateCurrentFrame();
};

/**
 *
 * @param {string} [validationType='soft'] - Optional. For a 'force' value:
 * - all required fields must have a value
 * - all fields must pass validation
 * - any field validation errors will be shown
 */
RulemakingsCommenting.prototype.validateCurrentFrame = function(validationType = 'soft') {
  console.log('validateCurrentFrame(validationType): ', validationType);
  // console.log('  this.formData: ', this.formData);
  let isValidated = true;
  // let frameErrorMessages = 'none';
  // none - initial state
  // errors - show error messages for invalid fields only (let the empties be empty)
  // all - show every error message, including empties
  let currentFrame = this.frames[this.currentFrameNum];
  let currentFrameInputs = currentFrame.querySelectorAll('input, select');

  currentFrameInputs.forEach(input => {
    // console.log('  input: ', input);
    // console.log('  input.checkValidity(): ', input.checkValidity());

    // If a field isn't valid,
    if (!input.checkValidity()) {
      // Note it for the .frame class
      isValidated = false;
    }

  });

  let bottomNavState = isValidated ? 'next' : 'incomplete';
  // TODO: remove this
  bottomNavState = 'next';

  if (this.currentFrameNum === 4) bottomNavState = 'submit';
  else if (this.currentFrameNum === 5) bottomNavState = 'confirmation';

  this.updateBottomNav(bottomNavState);

  this.updateTopNav();
};

/**
 * 
 * @param {PointerEvent} e
 */
RulemakingsCommenting.prototype.handleTooltipClick = function(e) {
  console.log('handleTooltipClick(e): ', e);
  this.toggleHelp(e.target);
};

/**
 * 
 * @param {PointerEvent} e
 */
RulemakingsCommenting.prototype.handleBottomNavClick = function(e) {
  console.log('handleBottomNavClick(e): ', e);

  e.preventDefault();

  if (e.target.dataset.command == 'next') {
    // If the user clicks next before the form is valid, let's light up the error messages
    if (e.target.classList.contains('is-inactive')) this.validateCurrentFrame(true);
    else this.goToFrame('next');
  } else if (e.target.dataset.command == 'back') {
    this.goToFrame('back');
  } else if (e.target.dataset.command == 'submit') {
    this.startSubmitting();
  }
};

/**
 * Handles updates and display of the tooltip help section
 * @param {HTMLElement} [targetEl] - A null value acts like a force close.
 */
RulemakingsCommenting.prototype.toggleHelp = function(targetEl) {
  if (!targetEl) {
    this.help.classList.add('hidden');
    this.help.classList.remove('show');

  } else {
    let titleEl = this.help.querySelector('.help_title');
    let contentEl = this.help.querySelector('.help_content');

    // If we're supposed to show different content, or
    // if the content isn't changing but it's currently hidden, show it
    if (titleEl.textContent != targetEl.dataset.tooltipTitle || this.help.classList.contains('hidden')) {
      titleEl.textContent = targetEl.dataset.tooltipTitle;
      contentEl.textContent = targetEl.dataset.tooltip;
      this.help.classList.add('show');
      this.help.classList.remove('hidden');

      let newPointerY = targetEl.getBoundingClientRect().top - this.help.getBoundingClientRect().top - 10;
      this.help.querySelector('.pointer').style = `top:${newPointerY}px`;

    } else { // Otherwise, hide it
      this.help.classList.add('hidden');
      this.help.classList.remove('show');
    }
  }
};

/**
 *
 */
RulemakingsCommenting.prototype.startSubmitting = function() {
  console.log('  startSubmitting()');

  // TODO: deactivate bottom nav
  // TODO: VALIDATE FORM DATA

  // if (this.validateEntireForm()) {
  //   console.log('  get(submissionStatus): ', this.submissionStatus);
    this.submissionStatus = 'submitting';
  //   console.log('    get(submissionStatus): ', this.submissionStatus);
    this.goToFrame('confirmation');
  // }
  // TODO: TEMP
  // setTimeout(this.handleSubmissionResponse.bind(this), 5000, { status: 200 });
  // TODO
  let formData = new FormData(this.formEl);
  formData = this.fakeTheData(formData);

  // Build the payloads for submission
  const dataPayload = {};
  const attachedFiles = [];
  // For each of the fields in the form,
  formData.entries().forEach(entry => {
    if (entry[0].indexOf('files_') === 0) {
      // If this field is a file, we only want its name for now,
      // and let's add 'name' to the end so files_0_ becomes files_0_name
      dataPayload[`${entry[0]}name`] = entry[1].name;
      if (entry[1].name) attachedFiles.push(entry); // Only add it if it has a file name (not if the field's empty)
    // If it's not a file, just use the field name as the key and the value as the value
    } else dataPayload[entry[0]] = entry[1];
  });

  let dataSubmission = fetch('/legal/api/submit-rulemaking-comments/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify(dataPayload)
    })
    .then(response => response.json())
    .then(
      // Then handle the successful data submission
      /**
       * @param {Object} dataSubResp - the response from the data submission
       * @param {string} dataSubResp.submission_id - hash used in the directory and file name structure
       * @param {string} dataSubResp.submitted_at - UTC datetime
       * @param {Object} [dataSubResp.presignedUrls] - key:value pairs where the key is the original file name
       * and the value is an object of properties for that file
       */
      dataSubResp => {
        // Save the response
        this.submissionResponse = dataSubResp;

        console.log('  dataSubResp: ', dataSubResp);
        const presignedURLs = dataSubResp.presigned_urls;
        console.log('attachedFiles: ', attachedFiles);
        // For each attached file, we need to upload it with the presigned URLs from dataSubResp
        attachedFiles.forEach(
          /**
           * @param {Array} attachedFile - [key, value] pair of field name and File
           * where [0] is the field name and [1] is the attached file
           */
          (attachedFile, i) => {
            // TODO: Pat, what d'you think about not referring to them by names but by index?
            // TODO: or by the field name?
            console.log('  attachedFile[1].name: ', attachedFile[1].name);
            let indexedName = `${i}-${attachedFile[1].name}`;
            console.log('  indexedName: ', indexedName);
            let presignedDataObj = presignedURLs[indexedName];
            console.log('  presignedDataObj: ', presignedDataObj);

            let fileUploadBody = new FormData();
            Object.entries(presignedDataObj.fields).forEach(([key, value]) => {
              fileUploadBody.append(key, value);
            });
            fileUploadBody.append('file', attachedFile[1]);

            // console.log('  attachedFile.files: ', attachedFile.files);
            console.log('  presignedDataObj.url: ', presignedDataObj.url);
            fetch(presignedDataObj.url, {
              method: 'POST',
              body: fileUploadBody
            })
            .then(fileSubResp => {
              console.log('  fileSubResp: ', fileSubResp);
            })
            .catch(err => {
              // TODO: handle file upload errors, including telling the user that 1-3 of their files were rejected
              console.log('file upload error: ', err);
            });
          }
        ); // end attachedFiles.forEach
        //     /**
        //      * @param {Object} fileUploadVars - key:value pairs
        //      * @param {string} fileUploadVars.url - 
        //      * @param {Object} fileUploadVars.fields - 
        //      * @param {string} fileUploadVars.fields.acl - 
        //      * @param {string} fileUploadVars.fields.key - 
        //      * @param {string} fileUploadVars.fields.policy - 
        //      * @param {string} fileUploadVars.fields.x-amz-algorithm
        //      * @param {string} fileUploadVars.fields.x-amz-credential
        //      * @param {string} fileUploadVars.fields.x-amz-date
        //      * @param {string} fileUploadVars.fields.x-amz-signature
        //      */
        console.log('YAY! all done');
        this.handleSubmissionResponse();
    })
    .catch(error => {
      // TODO: tell users about errors, especially if 1-3 of their files didn't upload
      console.log(' ERROR:', error);
    });
  console.log('  dataSubmission:', dataSubmission);

};

/**
 * 
 */
RulemakingsCommenting.prototype.handleSubmissionResponse = function (response) {
  console.log('handleSubmissionResponse(response): ', response);

  this.submissionStatus = this.submissionResponse.submitted_at ? 'success' : 'error';
  this.goToFrame('confirmation');
};

/**
 * If the form has values, offer a change to stay on this page and not lose the data
 * @param {Event} e
 */
RulemakingsCommenting.prototype.handleBeforeUnload = function(e) {
  // TODO: turn this back on
  // if (this.formEl.dataset.hasBeenActive) {
  //   e.preventDefault();
  // }
};

/**
 * @param {Event} e
 */
RulemakingsCommenting.prototype.handleInputChange = function(e) {
  console.log('change(e): ', e);
  // Rules for frame 0/type
  // TODO: do we need this?
};

/**
 * @param {InputEvent} e
 */
RulemakingsCommenting.prototype.handleInputInput = function(e) {
  console.log('input(e): ', e);
  // TODO: do we need this?
};

/**
 * Create an instance of RulemakingsCommenting()
 */
new RulemakingsCommenting();
