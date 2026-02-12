/**
 * TODO: history/flow
 * TODO: confirmation page should adjust its size
 */
export default function RulemakingCommenting() {
  this.appElId = 'rulemaking-comments'; // How to find the button to launch this
  this.app = document.querySelector(`#${this.appElId}`);
  this.formEl = this.app.querySelector('form');
  this.framesHolder = document.querySelector('#frames-holder');
  this.frames = document.querySelectorAll('.frame');
  this.frame0 = document.querySelector('#frame-representedEntityType');
  this.frame1 = document.querySelector('#frame-submitterInfo');
  this.frame2 = document.querySelector('#frame-commentersInfo');
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
  this.submissionResponses = [];
  this.recapWidgetId;

  this.init();
}

const framesOrder = ['submitterType', 'submitterInfo', 'commenters', 'comments', 'summary', 'confirmation'];
const submissionStatusMessages = {
  success: `[$submitter] has submitted comments[$behalfCommenters] for [$rm] on
    <time datetime="[$datetime]">[$datetimeStr]</time>`,
  'error-data':
    `Unfortunately, we couldnʼt process your request. Please click the ◂ Back button to try again,
    or refresh the page to start over.`,
  'error-files':
    `Weʼve received your form data but couldnʼt process your attachments. Your submission ID is [$randomid].
    Please <a href="mailto:[$teamEmail]">contact us</a> and reference your submission ID to report any issues.`,
  '410': `Unfortunately, comments are not being accepted at this time.`,
  '500':
    `Unfortunately, we had trouble processing your request. Please click the ◂ Back button to try again,
    or refresh the page to start over.`
};
const usZoneCodes = ['US', 'AS', 'GU', 'MP', 'PR', 'UM', 'VI'];

/**
 * Get CSRF token from the DOM (works with HttpOnly cookies)
 * @returns {string|null}
 */
function getCSRFToken() {
  // Try to get from hidden input first (works with CSRF_COOKIE_HTTPONLY = True)
  const tokenInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
  if (tokenInput) {
    return tokenInput.value;
  }

  // Fallback to cookie (for local dev where HttpOnly might be false)
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));

  return value ? value.split('=')[1] : null;
}

async function uploadData(dataPayload) {
  try {
    const response = await fetch('/legal/rulemaking/save-comments/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify(dataPayload)
    });

    // If the response is not ok (e.g., 403 CSRF error), return error object
    if (!response.ok) {
      console.error('Upload failed:', response.status, response.statusText); // eslint-disable-line no-console
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        message: response.status === 403 ? 'CSRF validation failed' : 'Request failed'
      };
    }

    const result = await response.json();
    return result;

  } catch (err) {
    console.error('Upload error:', err); // eslint-disable-line no-console
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      message: err.message
    };
  }
}

/**
 *
 * @param {Object[]} uploadObjects - Objects to upload. The key is the url, the value is the File object (file)
 */
async function uploadFiles(data) {
    const responses = await Promise.all(
      data.map(async file => {
        return fetch(file.url, { // TODO: this is the real line (remove this comment)
          method: 'POST',
          body: file.fileUploadBody
        });
      })
    );
    return responses;
}

/**
 * Kick it off
 */
RulemakingCommenting.prototype.init = function() {
  this.frames = document.querySelectorAll('fieldset.frame');

  // Which block should we use as a template for every commenter?
  const commenter0block = this.formEl.querySelector('#contact-info-template');
  this.commenterTemplate = commenter0block.innerHTML;
  // Remove those elements that shouldn't be in [0]
  const unwantedNodes = commenter0block.querySelectorAll('[data-index-0="false"]');
  unwantedNodes.forEach(node => { node.remove(); });

  // Dupe the #commenters[0].mailingCountry country <select> to the lawfirm country <select>
  this.formEl.querySelector('select[name="commenters[0].representedEntity.mailingCountry"]').innerHTML =
    this.formEl.querySelector('select[name="commenters[0].mailingCountry"]').innerHTML;

  // Listen to form events
  this.formEl.addEventListener('change', this.handleFormChange.bind(this));
  // this.formEl.addEventListener('click', this.handleFormClick.bind(this));

  const fileInputCancelButtons = this.formEl.querySelectorAll('#files-holder fieldset .button--cancel');
  fileInputCancelButtons.forEach(button => {
    button.addEventListener('click', this.handleFileCancelClick.bind(this));
  });

  const phoneInput = this.formEl.querySelector('[name="commenters[0].phone"]');
  if (phoneInput) phoneInput.addEventListener('input', this.handlePhoneInput.bind(this));

  const tooltipTriggers = this.formEl.querySelectorAll('.tooltip__trigger');
  tooltipTriggers.forEach(button => {
    button.addEventListener('click', this.handleTooltipClick.bind(this));
  });

  const helpCloseButton = document.querySelector('.js-help button.filters__toggle');
  helpCloseButton.addEventListener('click', () => { this.toggleHelp(); });

  const topNavLinks = this.topNav.querySelectorAll('a');
  topNavLinks.forEach(a => {
    a.addEventListener('click', this.handleTopNavClick.bind(this));
  });

  const bottomNavButtons = this.bottomNav.querySelectorAll('button');
  bottomNavButtons.forEach(button => {
    button.addEventListener('click', this.handleBottomNavClick.bind(this));
  });

  const commentsTextarea = this.formEl.querySelector('textarea');
  commentsTextarea.addEventListener('resize', () => {
    // TODO: HANDLE RESIZE?
  });
  commentsTextarea.addEventListener('input', () => {
    const charsAvail = 4000 - commentsTextarea.value.length;
    const output = this.formEl.querySelector('#comments-length-remaining');
    output.textContent = charsAvail.toLocaleString('en-US');
    output.classList.toggle('near-limit', charsAvail < 100);
  });

  window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

  // Close tooltip when clicking outside of it
  document.addEventListener('click', (e) => {
    // If tooltip is open and click is outside both the tooltip and any trigger button
    if (!this.help.classList.contains('hidden')) {
      const clickedInsideHelp = this.help.contains(e.target);
      const clickedTrigger = e.target.classList.contains('tooltip__trigger');
      if (!clickedInsideHelp && !clickedTrigger) {
        this.toggleHelp();
      }
    }
  });

  this.goToFrame(0);

  // Clearing representedEntityType for a history.back(). If there's a checked representedEntityType, clear it
  setTimeout(() => {
    const checkedInput = document.querySelector('input[name="representedEntityType"]:checked');
    if (checkedInput) checkedInput.checked = false;
  }, 250);
};

/**
 * builds the reCAPTCHA if it doesn't exist, otherwise resets it
 * @param {boolean} showRecap - whether the reCAPTCHA should be shown/offered
 */
RulemakingCommenting.prototype.showRecap = function(showRecap) {
  const recapElId = 'commenting-recaptcha';
  const recapEl = document.querySelector(`#${recapElId}`);

  // Toggle the recaptcha visibility as needed
  recapEl.classList.toggle('hidden', !showRecap);

  if (showRecap && !recapEl.childElementCount === 0)
    grecaptcha.reset(recapElId);
  else if (showRecap && recapEl.childElementCount === 0) {
    this.recapWidgetId = grecaptcha.render(recapElId, {
      callback: this.handleRecapCheck.bind(this),
      'expired-callback': this.handleRecapExpiration.bind(this)
    }, true);
  }
};
RulemakingCommenting.prototype.handleRecapCheck = function() {
  if (this.isOnFrame('summary')) this.updateBottomNav('submit');
};
RulemakingCommenting.prototype.handleRecapExpiration = function() {
  if (this.isOnFrame('summary')) this.updateBottomNav('submit-wait');
};

/**
 * Compares currentFrameNum to type of frame
 * @param {('submitterType'|'submitterInfo'|'commenters'|'comments'|'summary'|'confirmation')} frameType
 * @returns {boolean}
 */
RulemakingCommenting.prototype.isOnFrame = function(frameType) {
  return framesOrder[this.currentFrameNum] === frameType;
};

/**
 * @param {number|string} frameNum
 */
RulemakingCommenting.prototype.goToFrame = function(frameNum) {
  // If we're already on the right frame, we're done
  if (this.currentFrameNum === frameNum) return;

  // Close tooltip when navigating to a new frame
  this.toggleHelp();

  if (this.currentFrameNum == undefined) this.currentFrameNum = 0;

  if (frameNum == 'next') {
    // For the 'self' type, we want to skip commenterInfo ([2])
    if (this.representedEntityType === 'self' && this.isOnFrame('submitterInfo')) {
      this.currentFrameNum = framesOrder.indexOf('comments');
    } else this.currentFrameNum++;

  } else if (frameNum == 'back') {
    // For the 'self' type, we want to skip commenterInfo ([2])
    if (this.representedEntityType === 'self' && this.isOnFrame('comments')) {
      this.currentFrameNum = framesOrder.indexOf('submitterInfo');

    // Otherwise, if we're past frame [0], back up
    } else if (this.currentFrameNum > 0) {
      this.currentFrameNum--;

    // But for frame [0], _if there's no data to lose_, go to the previous browser page
    } else if (this.isOnFrame('submitterType')) {
      // TODO: if there's no data to lose,
      history.back();
    }
  } else if (frameNum === 'confirmation') {
    this.currentFrameNum = framesOrder.indexOf('confirmation');
    this.updateBottomNav('confirmation');
  } else {
    this.currentFrameNum = frameNum;
  }

  this.buildTheFrame();

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
RulemakingCommenting.prototype.updateHeightForCurrentFrame = function() {
  const currFrame = this.formEl.querySelector('.frame.current');
  if (currFrame)
    this.framesHolder.style.height = `${currFrame.clientHeight}px`;
};

/**
 * Will build or update "next" frames as needed.
 * e.g. if moving from frame 0 to 1, will toggle fields for frame 1 based on values from frame 0
 */
RulemakingCommenting.prototype.buildTheFrame = function() {
  if (this.isOnFrame('submitterType')) {
    if (this.representedEntityType == 'self') {
      //
    }
  } else if (this.isOnFrame('commenters')) {
    const commentersHolder = this.formEl.querySelector('#commenters-holder');
    if (!commentersHolder.childElementCount) this.addCommenter();

  } else if (this.isOnFrame('summary')) {

    let entireFormIsValid = this.validateEntireForm();
    if (!entireFormIsValid) {
      // validEntireForm() will call goToFrame as needed
      return;
    }

    const formData = new FormData(this.formEl);
    const summaryTable = this.frame4.querySelector('table tbody');
    let newInnerHtml = '';

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
    newInnerHtml += `<tr><td>Name:</td><td>${formData.get('commenters[0].firstName')} ${formData.get('commenters[0].lastName')}</td></tr>`;
    newInnerHtml += `<tr><td>Address type:</td><td>${formData.get('commenters[0].addressType')}</td></tr>`;
    newInnerHtml += `<tr><td>City:</td><td>${formData.get('commenters[0].mailingCity')}</td></tr>`;

    // Include State only for the US
    let countryCode = formData.get('commenters[0].mailingCountry');
    let countryName = this.formEl.querySelector(
      `select[name*="mailingCountry"] option[value="${countryCode}"]`).innerText;

    if (usZoneCodes.includes(countryCode))
      newInnerHtml += `<tr><td>State:</td><td>${formData.get('commenters[0].mailingState')}</td></tr>`;

    newInnerHtml += `<tr><td>Country:</td><td>${countryCode} - ${countryName}</td></tr>`;
    newInnerHtml += `<tr><td>Email:</td><td>${formData.get('commenters[0].emailAddress')}</td></tr>`;

    if (formData.get('commenters[0].testify') === 'true') {
      newInnerHtml += `<tr><td colspan="2"><hr></td></tr>`;
      newInnerHtml += `<tr><td colspan="2">I request to testify should the Commission hold a hearing on this matter</td></tr>`;
      newInnerHtml += `<tr><td>Phone:</td><td>${formData.get('commenters[0].phone')}</td></tr>`;
    }

    if (this.representedEntityType != 'self') { // None of these are for 'self'

      if (this.representedEntityType === 'counsel' && formData.get('lawfirm')) {
        // Include information for the lawfirm, if checked
        newInnerHtml += `<tr><th colspan="2">Law firm</th></tr>`;
        newInnerHtml += `<tr><td>Organization:</td><td>${formData.get('commenters[0].representedEntity.orgName')}</td></tr>`;
        newInnerHtml += `<tr><td>Address type:</td><td>${formData.get('commenters[0].representedEntity.addressType')}</td></tr>`;
        newInnerHtml += `<tr><td>Street address:</td><td>${formData.get('commenters[0].representedEntity.mailingAddressStreet')}</td></tr>`;
        newInnerHtml += `<tr><td>City:</td><td>${formData.get('commenters[0].representedEntity.mailingCity')}</td></tr>`;

        // Only include state and ZIP for the US
        countryCode = formData.get('commenters[0].representedEntity.mailingCountry');
        countryName = this.formEl.querySelector(
          `select[name*="mailingCountry"] option[value="${countryCode}"]`).innerText;
        if (usZoneCodes.includes(countryCode)) {
          newInnerHtml += `<tr><td>State:</td><td>${formData.get('commenters[0].representedEntity.mailingState')}</td></tr>`;
          newInnerHtml += `<tr><td>ZIP code:</td><td>${formData.get('commenters[0].representedEntity.mailingZip')}</td></tr>`;
        }
        newInnerHtml += `<tr><td>Country:</td><td>${countryCode} - ${countryName}</td></tr>`;
        newInnerHtml += `<tr><td>Email:</td><td>${formData.get('commenters[0].representedEntity.emailAddress')}</td></tr>`;
      }

      // COMMENTER LOOP
      // /counsel for another person group or org
      for (let i = 1;
        formData.has(`commenters[${i}].firstName`) ||
        formData.has(`commenters[${i}].orgName`);
        i++) {

        newInnerHtml += `<tr><th colspan="2">Commenter #${i}</th></tr>`;

        newInnerHtml += '<tr><td>';
        if (formData.get(`commenters[${i}].commenterType`) === 'individual')
          newInnerHtml += 'Name:</td><td>'
            + formData.get(`commenters[${i}].firstName`) + ' '
            + formData.get(`commenters[${i}].lastName`);
        else
          newInnerHtml += 'Organization:</td><td>' + formData.get(`commenters[${i}].orgName`);

        newInnerHtml += '</td></tr>';

        const addrType = formData.get(`commenters[${i}].addressType`);
        const addrCity = formData.get(`commenters[${i}].mailingCity`);
        const addrState = formData.get(`commenters[${i}].mailingState`) || '';
        // Only include State for the US
        countryCode = formData.get(`commenters[${i}].mailingCountry`);
        countryName = this.formEl.querySelector(
          `select[name*="mailingCountry"] option[value="${countryCode}"]`).innerText;
        const addrCountry = `${countryCode} - ${countryName}`;
        const addrEmail = formData.get(`commenters[${i}].emailAddress`);

        newInnerHtml += `<tr><td>Address type:</td><td>${addrType}</td></tr>`;
        newInnerHtml += `<tr><td>City:</td><td>${addrCity}</td></tr>`;
        if (usZoneCodes.includes(countryCode)) // include State only for the US
          newInnerHtml += `<tr><td>State:</td><td>${addrState}</td></tr>`;
        newInnerHtml += `<tr><td>Country:</td><td>${addrCountry}</td></tr>`;
        newInnerHtml += `<tr><td>Email:</td><td>${addrEmail}</td></tr>`;
      }
    }

    newInnerHtml += `<tr><td colspan="2"><hr></td></tr>`;

    // For everyone
    if (formData.get('files[0]').name)
      newInnerHtml += `<tr><td>Attachment:</td><td>${formData.get('files[0]').name}</td></tr>`;
    if (formData.get('files[1]').name)
      newInnerHtml += `<tr><td>Attachment:</td><td>${formData.get('files[1]').name}</td></tr>`;
    if (formData.get('files[2]').name)
      newInnerHtml += `<tr><td>Attachment:</td><td>${formData.get('files[2]').name}</td></tr>`;

    newInnerHtml += `<tr><td colspan="2"><hr></td></tr>`;

    // Comments are saved as \n but those don't display here so we'll replace \n with <br> to display here only
    const commentsWithNewlines = formData.get('comments');
    const commentsWithBreaks = commentsWithNewlines.replaceAll('\n', '<br>'); //
    newInnerHtml += `<tr><td>Text comment:</td><td>${commentsWithBreaks}</td></tr>`;

    summaryTable.innerHTML = newInnerHtml;

  } else if (this.isOnFrame('confirmation')) {
    // If we have a success response, let's put those details into the page
    if (this.submissionStatus === 'success') {
      // First, vars to include on success screen
      const formData = new FormData(this.formEl);

      const now = new Date();
      const datetimeStamp = new Date(this.submissionResponses[0].submitted_at);// 'yyyy-mm-dd hh:mmT-4';
      const datetimeStr = now.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
      });

      const submitterStr = `${formData.get('commenters[0].lastName')}, ${formData.get('commenters[0].firstName')}`;

      let behalfStr = '';

      // Build the list of "on behalf of" names
      if (this.representedEntityType === 'self') {
        // nothing
      } else if (this.representedEntityType === 'counsel') {
        // counsel org name

        const commentersNames = [];
        for (let i = 1; formData.has(`commenters[${i}].commenterType`); i++) {
          commentersNames.push(
            formData.get(`commenters[${i}].commenterType`) === 'individual'
            ? formData.get(`commenters[${i}].firstName`) + ' ' + formData.get(`commenters[${i}].lastName`)
            : formData.get(`commenters[${i}].orgName`)
          );
        }

        // If there are commenters[1]+, we need the "on behalf of" part
        if (commentersNames.length > 0)
          behalfStr = ' on behalf of ';

        // If there's one commenter, add their name
        if (commentersNames.length === 1)
          behalfStr += commentersNames[0];
        // For two commenters, join them with an 'and'
        else if (commentersNames.length === 2)
          behalfStr += commentersNames.join(' and ');
        // For more than two, join with commas and a serial comma because we don't know what names could be
        else
          behalfStr += commentersNames.slice(0, -1).join(', ') + ', and ' + commentersNames.slice(-1);
      }

      const rmStr = `${formData.get('rm_no')} ${formData.get('rm_name')}`;

      let confirmationMessage = submissionStatusMessages['success'];
      confirmationMessage = confirmationMessage.replace('[$submitter]', submitterStr);
      confirmationMessage = confirmationMessage.replace('[$behalfCommenters]', behalfStr);
      confirmationMessage = confirmationMessage.replace('[$rm]', rmStr);
      confirmationMessage = confirmationMessage.replace('[$datetime]', datetimeStamp);
      confirmationMessage = confirmationMessage.replace('[$datetimeStr]', datetimeStr);

      this.frame5.querySelector('.message--success p').innerHTML = confirmationMessage;

    } else { // If not successful

      // If there were no responses for some reason
      if (!this.submissionResponses)
        this.frame5.querySelector('.message--alert p').innerHTML = submissionStatusMessages['500'];

      // If the commenting period has closed
      else if (this.submissionResponses[0].status == 410)
        this.frame5.querySelector('.message--alert p').innerHTML = submissionStatusMessages['410'];

      // else if we contacted the server but the data didn't go through correctly
      else if (!this.submissionResponses[0].ok)
        this.frame5.querySelector('.message--alert p').innerHTML = submissionStatusMessages['error-data'];

      // else, there was a problem with 1+ attachments
      else { // if (failures.includes('file'))
        let confirmationMessage = submissionStatusMessages['error-files'];
        confirmationMessage = confirmationMessage.replace('[$teamEmail]', window.WEBMANAGER_EMAIL);
        confirmationMessage = confirmationMessage.replace('[$randomid]', this.submissionResponses[0].submission_id);
        this.frame5.querySelector('.message--alert p').innerHTML = confirmationMessage;
      }
    }

    // Toggle HTMLElements based on submissionStats vs data-status=""
    const messageElements = [...this.frame5.children];
    messageElements.forEach(messageEl => {
      messageEl.classList.toggle('hidden', messageEl.dataset.status != this.submissionStatus);
    });
  }

  // Show reCAPTCHA if we're on the summary page
  this.showRecap(this.isOnFrame('summary'));

  this.slideToTop();
};

/**
 *
 */
RulemakingCommenting.prototype.slideToTop = function() {
  const prefersReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true
    || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (prefersReducedMotion) this.topNav.scrollIntoView({ behavior: 'instant' });

  else this.topNav.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Validates every field in this.formEl; fires goToFrame to any invalid fields
 * @returns {boolean}
 */
RulemakingCommenting.prototype.validateEntireForm = function() {
  let toReturn = true;
  const formData = new FormData(this.formEl);

  // Fields that are always required
  const requiredFieldNames = [
    'representedEntityType',
    'commenters[0].firstName',
    `commenters[0].lastName`,
    `commenters[0].addressType`,
    `commenters[0].mailingCity`,
    `commenters[0].mailingCountry`,
    `commenters[0].emailAddress`
  ];

  // State is required for US addresses
  let country = formData.get(`commenters[0].mailingCountry`);
  let requireState = usZoneCodes.includes(country);
  if (requireState) requiredFieldNames.push('commenters[0].mailingState');

  // For 'other' relationships, record how they label the relationship
  if (this.representedEntityType === 'other')
    requiredFieldNames.push('representedEntityConnection');

  // For those who'd like to testify
  if (formData.get('commenters[0].testify') === true)
    requiredFieldNames.push('commenters[0].phone');

  // Fields required only for counsel AND if they've chosen to include law firm information
  if (this.representedEntityType === 'counsel' && formData.get('lawfirm') === true) {
    requiredFieldNames.push(
      'commenters[0].representedEntity.orgName',
      'commenters[0].representedEntity.addressType',
      'commenters[0].representedEntity.mailingAddressStreet',
      'commenters[0].representedEntity.mailingCity',
      'commenters[0].representedEntity.mailingCountry'
    );

    if (usZoneCodes.includes(formData.get('commenters[0].representedEntity.mailingCountry')))
      requiredFieldNames.push(
        'commenters[0].representedEntity.mailingState',
        'commenters[0].representedEntity.mailingZip'
      );
  }

  // For non-self commenters, add every commenters[i] element that exists
  if (this.representedEntityType != 'self') {
    let i = 1;
    while (formData.has(`commenters[${i}].commenterType`)) {
      requiredFieldNames.push(`commenters[${i}].commenterType`);

      if (formData.get(`commenters[${i}].commenterType`) === 'organization')
        requiredFieldNames.push(`commenters[${i}].orgName`);
      else {
        requiredFieldNames.push(
          `commenters[${i}].firstName`,
          `commenters[${i}].lastName`,
          `commenters[${i}].emailAddress` // Email addresses are required for individuals (not organizations)
        );
      }

      requiredFieldNames.push(
        `commenters[${i}].addressType`,
        `commenters[${i}].mailingCity`,
        `commenters[${i}].mailingCountry`
      );

      // State is required for the US
      country = formData.get(`commenters[${i}].mailingCountry`);
      requireState = usZoneCodes.includes(country);
      if (requireState) requiredFieldNames.push(`commenters[${i}].mailingState`);

      i++;
    }
  }

  // Now, on to validating the fields
  requiredFieldNames.forEach(fieldName => {
    const valid = this.validateField(`[name="${fieldName}"]`);
    if (!valid) {
      const el = this.formEl.querySelector(`[name="${fieldName}"]`);
      const elFrame = el.closest('.frame');
      if (elFrame === this.frame0) this.goToFrame(0);
      else if (elFrame === this.frame1) this.goToFrame(1);
      else if (elFrame === this.frame2) this.goToFrame(2);
      else if (elFrame === this.frame3) this.goToFrame(3);
    }
  });

  // If we have no files attached, and no valid comments, go back to that frame
  if (!formData.get('files[0]').name && !formData.get('files[1]').name
    && !formData.get('files[2]').name && formData.get('comments').length < 2) {
      toReturn = false;
      this.goToFrame(3);
  }

  return toReturn;
};

/**
 * Validates a single field
 * @param {(string|HTMLElement)} elOrSelector - HTML element or a string to select it
 * @param {boolean} [requireValue=false]
 * @returns {boolean} whether the field is valid
 */
RulemakingCommenting.prototype.validateField = function(elOrSelector, requireValue = false) {
  const theField = typeof elOrSelector === 'string'
    ? this.formEl.querySelector(elOrSelector)
    : elOrSelector;

  const fieldName = theField.getAttribute('name');
  const formData = new FormData(this.formEl);
  let toReturn = true;

  // Testing a state <select>, it needs to be exactly two letters if for the USA. Otherwise optional.
  if (fieldName.indexOf('State') > 0) {
    const countryCode = formData.get(fieldName.replace('State', 'Country'));
    if (usZoneCodes.includes(countryCode) && formData.get(fieldName).length !== 2) {
      theField.classList.add('invalid');
      toReturn = false;
    }

  // ZIP Codes in the USA should be five numbers then optionally a dash and four numbers. Optional outside the US
  } else if (fieldName.indexOf('Zip') > 0) {
    const theCountry = formData.get(fieldName.replace('Zip', 'Country'));
    const zipRegex = /\d{5}(-\d{4}){0,1}$/;
    if (usZoneCodes.includes(theCountry) && !zipRegex.test(formData.get(fieldName))) {
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
 * Starts with this.commenterTemplate, removes appropriate fields, numbers it, then returns the new commenter element.
 * @returns {HTMLElement} Returns the new commenter/div created
 */
RulemakingCommenting.prototype.addCommenter = function() {
  const commentersHolder = this.formEl.querySelector('#commenters-holder');
  const newCommenter = document.createElement('div');
  newCommenter.setAttribute('class', 'commenter');
  // Set its innerHTML
  const newChildIndex = commentersHolder.childElementCount + 1;
  let newInnerHtml = this.commenterTemplate;
  newInnerHtml = newInnerHtml.replace('data-index-0="false"', '');
  newInnerHtml = newInnerHtml.replaceAll('0', newChildIndex);
  newCommenter.innerHTML = newInnerHtml;

  // Remove any of the representedEntity fields that should only exist for [0]
  const repEntEls = newCommenter.querySelectorAll(
    '[name*="representedEntity"]', '[for*="representedEntity"]'
  );
  repEntEls.forEach(el => {
    el.remove();
  });

  // Remove any of the possible "I'd like to testify" fields that should only be included for the submitter
  const testifyEls = newCommenter.querySelectorAll(
    'fieldset[data-show-if-var$=".testify"], fieldset:has(input[name$=".testify"])'
  );
  testifyEls.forEach(el => {
    el.remove();
  });

  // Add button listeners
  newCommenter.querySelectorAll('.commenter-controls button').forEach(button => {
    button.addEventListener('click', this.handleCommenterClick.bind(this));
  });

  commentersHolder.appendChild(newCommenter);

  // Lock the commenterType of this new commenter to match commenter[1]'s type, if already selected.
  // This enforces that all additional commenters must be the same type (all individual or all
  // organization), which is required to accurately derive representedEntityTypeID on submission.
  // We cannot mix commenter types.
  // commenter[1] (the first child of #commenters-holder) is always the primary — its type is
  // the one the user sets freely, and all subsequent commenters must follow it.
  const firstAdditionalCommenter = commentersHolder.firstElementChild;
  if (firstAdditionalCommenter && firstAdditionalCommenter !== newCommenter) {
    const firstTypeSelect = firstAdditionalCommenter.querySelector('[name$=".commenterType"]');
    if (firstTypeSelect && firstTypeSelect.value) {
      const lockedType = firstTypeSelect.value;
      const newTypeSelect = newCommenter.querySelector('[name$=".commenterType"]');
      if (newTypeSelect) {
        newTypeSelect.value = lockedType;
        // Disable the select so the user cannot change the type on commenter[2]+.
        // The type must stay consistent across all additional commenters.
        newTypeSelect.setAttribute('disabled', '');
        // Disabled form fields are excluded from FormData/submission, so we mirror the value
        // in a hidden input with the same name so the backend still receives it.
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = newTypeSelect.name;
        hiddenInput.value = lockedType;
        newTypeSelect.insertAdjacentElement('afterend', hiddenInput);
        // Fire change so the required-field toggling (first/last name vs org name, email) runs
        // for the pre-selected type, keeping validation state consistent.
        newTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  this.formEl.dispatchEvent(new Event('change')); // For the height resize

  return newCommenter;
};

/**
 * Removes the commenter (el) and re-numbers those remaining.
 * @param {HTMLElement} el
 */
RulemakingCommenting.prototype.removeCommenter = function(el) {
  const commentersHolder = this.formEl.querySelector('#commenters-holder');
  // If we won't be removing the only commenter, do it
  el.remove();

  // If we've removed the only commenter, add a new one
  if (commentersHolder.childElementCount < 1) this.addCommenter();

  // Re-number the remaining commenters
  const commenters = [...commentersHolder.children];
  commenters.forEach((commenter, i) => {
    const i1 = i + 1;
    const elementsToUpdate = commenter.querySelectorAll('input, select, label');
    elementsToUpdate.forEach(elToUpdate => {
      if (elToUpdate.name) elToUpdate.setAttribute('name', elToUpdate.name.replace(/(\[\d+\])/, `[${i1}]`));
      if (elToUpdate.id) elToUpdate.setAttribute('id', elToUpdate.id.replace(/(\[\d+\])/, `[${i1}]`));
      if (elToUpdate.for) elToUpdate.setAttribute('for', elToUpdate.for.replace(/(\[\d+\])/, `[${i1}]`));
    });
    const commenterNumberLabel = commenter.querySelector('label:first-of-type');
    commenterNumberLabel.innerHTML = `Commenter #${(i1)}`;
  });

  // If removing a commenter leaves only one remaining, that commenter becomes the new commenter[1]
  // (the primary). It should no longer be locked — the user must be free to change its type,
  // which would then propagate to any future joint commenters they add.
  // Remove the disabled attribute and delete the hidden input that was standing in for the
  // disabled select during form submission.
  if (commentersHolder.childElementCount === 1) {
    const onlyCommenter = commentersHolder.firstElementChild;
    const typeSelect = onlyCommenter.querySelector('[name$=".commenterType"]');
    if (typeSelect) {
      typeSelect.removeAttribute('disabled');
      const hiddenInput = onlyCommenter.querySelector('input[type="hidden"][name$=".commenterType"]');
      if (hiddenInput) hiddenInput.remove();
    }
  }

  this.formEl.dispatchEvent(new Event('change')); // For the height resize

};

/**
 * Called when anything is typed into the phone field, saves non-digits and displays them in a US phone format
 * @param {InputEvent} e
 */
RulemakingCommenting.prototype.handlePhoneInput = function(e) {
  const field = e.target;
  const digitsStr = field.value.replaceAll(/\D/g, '').substring(0,10);
  const area = digitsStr.substring(0,3);
  const prefix = digitsStr.substring(3,6);
  const line = digitsStr.substring(6,10);
  // I like these being >5 and >2 but then it's impossible to backspace from line to prefix or from prefix to area
  if (digitsStr.length > 6) field.value = `(${area}) ${prefix}-${line}`;
  else if (digitsStr.length > 3) field.value = `(${area}) ${prefix}`;
  else if (digitsStr.length > 0) field.value = `(${area}`;
};

/**
 * Handles all click events on a commenter, then calls addCommenter() or removeCommenter() as needed.
 * Both events are here to minimizes adding and removing listeners when adding & removing commenters.
 */
RulemakingCommenting.prototype.handleCommenterClick = function(e) {
  e.preventDefault();
  if (e.target.dataset.command == 'add-commenter') {
    this.addCommenter();
  } else if (e.target.dataset.command == 'remove-commenter') {
    this.removeCommenter(e.target.closest('.commenter'));
  }
};

/**
 * Called when someone clicks the ⓧ to remove an attached file, clears the file
 * then dispatches a change event to be handled by handleFormChange.
 * @param {PointerEvent} e
 */
RulemakingCommenting.prototype.handleFileCancelClick = function(e) {
  e.preventDefault();

  // Find the linked <input> element, clear its value and remove the has-file class
  const linkedInput = this.formEl.querySelector(`[id="${e.target.dataset.commandfor}"]`);
  linkedInput.value = '';
  linkedInput.classList.remove('has-file', 'invalid');
  linkedInput.setCustomValidity('');
  // Trigger the change event so the form will update its validation requirements
  linkedInput.dispatchEvent(new Event('change', { bubbles: true }));
};

/**
 * Adds or removes elements based on their [data-show-if-var] and [data-show-if-val] values
 * then calls updateHeightForCurrentFrame
 */
RulemakingCommenting.prototype.toggleElementsByVars = function() {
  const elementsToToggle = this.formEl.querySelectorAll('[data-show-if-var][data-show-if-val]');
  elementsToToggle.forEach(elToToggle => {
    const varName = elToToggle.dataset.showIfVar; // Which variable/input are we checking?
    const varValue = elToToggle.dataset.showIfVal; // What value is the display value?

    // We want :checked elements tied to the same elements
    const selectorString = `[name="${varName}"]:checked`;

    const controllerInput = this.formEl.querySelector(selectorString);
    let shouldShow = false;
    if (controllerInput) {
      const matchedInputValue = controllerInput.value;
      shouldShow = matchedInputValue == varValue;
    }

    if (shouldShow) elToToggle.removeAttribute('aria-hidden');
    else elToToggle.setAttribute('aria-hidden', true);

    // Make child elements required or not, based on whether its parent is visible
    const innerInputs = elToToggle.querySelectorAll('select, input:not([type="checkbox"])');

    innerInputs.forEach(input => {
      if (shouldShow) input.setAttribute('required', '');
      else input.removeAttribute('required');

      // Email address is only required for commenters[0]
      if (input.id.indexOf('.emailAddress') > 0) input.removeAttribute('required');
    });
  });
  // if we've toggled anything, we need to adjust the height again
  this.updateHeightForCurrentFrame();
};

/**
 * Updates the meter and links in the topnav
 */
RulemakingCommenting.prototype.updateTopNav = function() {
  const theMeter = this.topNav.querySelector('meter');

  if (!this.representedEntityType) return; // If we don't have a type, don't show self

  // Where are we now?
  theMeter.value = this.currentFrameNum + 1;
  const totalFrames = 5;
  theMeter.setAttribute('max', totalFrames);
  theMeter.setAttribute('value', this.currentFrameNum + 1);

  const navLabels = this.topNav.querySelectorAll('li a');

  // Hide [2] for 'self' but show it again if that changes
  navLabels[2].closest('li').classList.toggle('hidden', this.representedEntityType === 'self');

  if (this.representedEntityType === 'self') {
    navLabels[0].textContent = 'Submitting on behalf of myself';
    navLabels[1].textContent = 'Your information';

  } else if (this.representedEntityType === 'counsel') {
    navLabels[0].textContent = 'Submitting as counsel to another';
    navLabels[1].textContent = 'Counsel information';

  } else if (this.representedEntityType === 'rep') {
    navLabels[0].textContent = 'Submitting as an officer/representative/member';
    navLabels[1].textContent = 'Personal information';

  } else if (this.representedEntityType === 'other') {
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
    // Hide labels until currentFrameNum has hit that point.
    if (i <= this.currentFrameNum) label.closest('li').classList.add('viewed');
  });
};

/**
 * Set the classes for the bottom nav buttons.
 * @param {('next'|'incomplete'|'submit')} frameState
 */
RulemakingCommenting.prototype.updateBottomNav = function(state = 'incomplete') {
  // The confirmation frame has three possible states and special rules
  if (this.isOnFrame('confirmation')) {
    if (this.submissionStatus === 'success') {
      this.bottomNav.classList.add('hidden');
    } else if (this.submissionStatus === 'error') {
      this.formEl.querySelector('[data-command="next"]').classList.add('hidden');
      this.formEl.querySelector('[data-command="submit"]').classList.add('hidden');
    } else { // if (this.submissionStatus === 'submitting') {
      this.formEl.querySelector('[data-command="next"]').classList.add('hidden');
      this.formEl.querySelector('[data-command="back"]').classList.add('is-inactive');
      this.formEl.querySelector('[data-command="submit"]').classList.add('hidden');
    }
    return;
  }

  this.formEl.querySelector('[data-command="next"]').classList.toggle('is-inactive', state === 'incomplete');
  this.formEl.querySelector('[data-command="next"]').classList.toggle('hidden', state.indexOf('submit') >= 0);
  this.formEl.querySelector('[data-command="submit"]').classList.toggle('hidden', state.indexOf('submit') < 0);

  let tipForNextButton = '';
  if (this.isOnFrame('submitterType'))
    tipForNextButton = 'Next step: Provide your personal information';
  else if (this.isOnFrame('submitterInfo') && this.representedEntityType == 'self')
    tipForNextButton = 'Next step: Provide your comments';
  else if (this.isOnFrame('submitterInfo'))
    tipForNextButton = 'Next step: Provide commenter information';
  else if (this.isOnFrame('commenters'))
    tipForNextButton = 'Next step: Provide comments';
  else if (this.isOnFrame('comments'))
    tipForNextButton = 'Next step: Review and submit information';

  this.bottomNav.querySelector('.t-note').innerHTML = tipForNextButton;

  // If we're on the submit page, let's show the submit button, but keep it deactivated if reCAPTCHA isn't ready
  if (state === 'submit') {
    this.formEl.querySelector('[data-command="submit"]').classList.remove('is-disabled');
  } else {
    this.formEl.querySelector('[data-command="submit"]').classList.add('is-disabled');
  }
};

/**
 * On <form> changes, toggleElementsByVars(), clean up values, toggle required states, then validateCurrentFrame()
 * @param {Event} e
 */
RulemakingCommenting.prototype.handleFormChange = function(e) {
  // Maybe later: this.formEl.removeAttribute('data-has-been-active');
  this.toggleElementsByVars();

  // Trim text inputs
  // If it's a text-type element, first trim off any leading or trailing spaces
  if (['text', 'email', 'textarea'].includes(e.target.type))
    e.target.value = e.target.value.trim();

  // Handle the file inputs
  if (e.target.type == 'file') {
    // Add/remove the has-file class to toggle the X button, which will let css show additional pickers
    // It 'has-file' when a file's selected and it's <= 5 MB
    const hasFile = e.target.files.length > 0;
    const hasLegitFile = e.target.files.length > 0 && e.target.files[0].size <= 5000000;

    e.target.classList.toggle('has-file', hasFile);

    if (hasFile && !hasLegitFile) {
      e.target.classList.add('invalid');
      e.target.setCustomValidity('Files must be smaller than 5 MB each');
    } else if (!hasFile || hasLegitFile) {
      e.target.classList.remove('invalid');
      e.target.setCustomValidity('');
    }

    // Because attaching and removing files can change the height
    this.updateHeightForCurrentFrame();
  }

  // If we have files attached or comments, the other isn't required
  const fileInputs = this.formEl.querySelectorAll('input[type="file"]');
  const commentsField = this.formEl.querySelector('textarea[name="comments"]');
  let commentsAreRequired = true;
  fileInputs.forEach(input => {
    if (input.files.length > 0) commentsAreRequired = false;
  });
  if (commentsAreRequired) commentsField.setAttribute('required', '');
  else commentsField.removeAttribute('required');

  // The first frame has an 'other' field to toggle
  if (e.target.name === 'representedEntityType' || e.target.name === 'representedEntityConnection') {
    // For the first frame, there's been activity so let's restrict leaving the page and losing data
    this.formEl.dataset.hasBeenActive = true;

    if (e.target.name === 'representedEntityType')
      this.representedEntityType = e.target.value;
  }

  // If we've changed the country, we'll toggle whether state and ZIP are required (req for US/USA)
  if (e.target.name.indexOf('.mailingCountry') > 0) {
    const elementNameRoot = e.target.name.substring(0, e.target.name.lastIndexOf('.'));
    const zipAndStateFields = this.formEl.querySelectorAll(
      `[name="${elementNameRoot}.mailingState"], [name="${elementNameRoot}.mailingZip"]`
    );
    zipAndStateFields.forEach(field => {
      const isZip = field.name.indexOf('Zip') > 0;

      if (usZoneCodes.includes(e.target.value)) {
        field.setAttribute('required', '');
        field.removeAttribute('disabled');

        if (isZip) {
          // For the ZIP fields, enforce the ZIP Code pattern and change the label
          field.setAttribute('pattern', `^[0-9]{5}(-[0-9]{4}){0,1}$`);
          this.formEl.querySelector(`[for="${field.id}"]:not(.error)`).innerText = 'ZIP';
        }
      } else {
        field.removeAttribute('required');
        field.setAttribute('disabled', '');
        field.value = '';

        if (isZip) { // "ZIP" only applies to USPS addresses
          field.removeAttribute('pattern');
          this.formEl.querySelector(`[for="${field.id}"]:not(.error)`).innerText = 'Postal code';
        }
      }
    });
  }

  // If we've changed the commenter type, let's toggle the required name <input>s (i.e. [first, last] or [org] name)
  if (e.target.name.indexOf('.commenterType') > 0) {
    // The type of commenter
    const commType = e.target.value;
    const parentEl = e.target.closest('.commenter');
    // required fields are inputs inside the matching data-toggle
    // non-required are inputs inside elements with data-toggle but the data-toggle that doesn't match
    const requiredEls = parentEl.querySelectorAll(`[data-toggle="${commType}"] input`);
    const nonReqEls = parentEl.querySelectorAll(`[data-toggle]:not([data-toggle="${commType}"]) input`);
    requiredEls.forEach(el => { el.setAttribute('required', ''); });
    nonReqEls.forEach(el => { el.removeAttribute('required'); });

    // email address is available for both types, but only required for individuals
    const emailField = parentEl.querySelector('[name*="emailAddress"]');
    if (commType === 'individual') emailField.setAttribute('required', '');
    else emailField.removeAttribute('required');

    // When commenter[1]'s type changes, push the new type to all subsequent commenters (commenter[2]+)
    // and lock their selects. This handles the case where commenter[2]+ were added before
    // commenter[1] had a type — addCommenter() only locks on creation if a type is already set,
    // so this change handler covers the retroactive lock.
    const commentersHolder = this.formEl.querySelector('#commenters-holder');
    if (commentersHolder && parentEl === commentersHolder.firstElementChild) {
      const subsequentCommenters = [...commentersHolder.children].slice(1);
      subsequentCommenters.forEach(commenter => {
        const typeSelect = commenter.querySelector('[name$=".commenterType"]');
        if (typeSelect) {
          typeSelect.value = commType;
          typeSelect.setAttribute('disabled', '');
          // Create a hidden input if one doesn't already exist (e.g. commenter was added before
          // commenter[1] had a type, so addCommenter() didn't create one at that time).
          let hiddenInput = commenter.querySelector('input[type="hidden"][name$=".commenterType"]');
          if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = typeSelect.name;
            typeSelect.insertAdjacentElement('afterend', hiddenInput);
          }
          hiddenInput.value = commType;
          // Fire change so required-field toggling stays in sync with the updated type.
          typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

  }

  this.validateCurrentFrame();
};

/**
 * Validates the current frame's fields and sets validationType as into the .frame as ['data-validation']
 * frame['data-validation'] {
 *   0 (default) - no hints, no errors, still waiting for any input, no attempts to move on
 *   1 - a soft validation, user has started entering values—show warnings on blur, clear warnings on input
 *   2 - attempted to move to the next frame. Show alerts for all required/erring fields
 * }
 * @param {number} [validationType=1] - Optional. For a 'force' value:
 */
RulemakingCommenting.prototype.validateCurrentFrame = function(validationType = 0) {
  let isValidated = true;
  const currentFrame = this.frames[this.currentFrameNum];

  // Put the larger of the current or new validation type
  // (because we don't want to force all of the errors on and then fixing one relaxes them all)
  currentFrame.dataset.validation = Math.max(validationType, parseInt(currentFrame.dataset.validation));

  const invalidFrameInputs = currentFrame.querySelectorAll('input:invalid, select:invalid, textarea:invalid');
  isValidated = invalidFrameInputs.length === 0;

  let bottomNavState = isValidated === true ? 'next' : 'incomplete';

  if (this.isOnFrame('summary')) {
    bottomNavState = 'submit';
    if (!grecaptcha.getResponse(this.recapWidgetId)) bottomNavState += '-wait';
  } else if (this.isOnFrame('confirmation')) bottomNavState = 'confirmation';

  this.updateBottomNav(bottomNavState);

  this.updateTopNav();
};

/**
 * Calls this.toggleHelp();
 * @param {PointerEvent} e
 */
RulemakingCommenting.prototype.handleTooltipClick = function(e) {
  this.toggleHelp(e.target);
};

/**
 * @param {PointerEvent} e
 */
RulemakingCommenting.prototype.handleTopNavClick = function(e) {
  e.preventDefault();
  // We need a frame name. We don't want the links to do anything if we're on the 'success' confirmation page
  if (e.target.dataset.frame && this.submissionStatus !== 'success')
    this.goToFrame(framesOrder.indexOf(e.target.dataset.frame));
};

/**
 * Handler for clicking the back, next, and submit buttons, then calls goToFrame() or startSubmitting()
 * @param {PointerEvent} e
 */
RulemakingCommenting.prototype.handleBottomNavClick = function(e) {
  e.preventDefault();

  if (e.target.dataset.command == 'next') {
    // If the user clicks next before the form is valid, let's light up the error messages
    if (e.target.classList.contains('is-inactive')) this.validateCurrentFrame(2);
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
RulemakingCommenting.prototype.toggleHelp = function(targetEl) {
  if (!targetEl) {
    this.help.classList.add('hidden');
    this.help.classList.remove('show');

  } else {
    const titleEl = this.help.querySelector('.help_title');
    const contentEl = this.help.querySelector('.help_content');

    // If we're supposed to show different content, or
    // if the content isn't changing but it's currently hidden, show it
    if (titleEl.textContent != targetEl.dataset.tooltipTitle || this.help.classList.contains('hidden')) {
      titleEl.textContent = targetEl.dataset.tooltipTitle;
      contentEl.textContent = targetEl.dataset.tooltip;
      this.help.classList.add('show');
      this.help.classList.remove('hidden');

      const newPointerY = targetEl.getBoundingClientRect().top - this.help.getBoundingClientRect().top - 10;
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
RulemakingCommenting.prototype.startSubmitting = async function() {
  // Disable submit button immediately after submitting
  const submitButton = this.formEl.querySelector('[data-command="submit"]');
  submitButton.classList.add('is-disabled');
  submitButton.disabled = true;

  if (this.validateEntireForm()) {
    this.submissionResponses = [];
    this.submissionStatus = 'submitting';
  } else {
    // validEntireForm() will call goToFrame as needed
    // Re-enable submit button if validation fails
    submitButton.classList.remove('is-disabled');
    submitButton.disabled = false;
    return;
  }

  const formData = new FormData(this.formEl);

  // Build the payloads for submission
  const dataPayload = {};
  const attachedFiles = [];
  // For each of the fields in the form,
  formData.entries().forEach(entry => {
    // If the field name starts with `files[…`
    if (entry[0].indexOf('files[') === 0) {
      // If this field is a file, we only want its name and size for now,
      // and let's add '.name' to the end so files[0] becomes files[0].name
      dataPayload[`${entry[0]}.name`] = entry[1].name;
      dataPayload[`${entry[0]}.size`] = entry[1].size;
      if (entry[1].name) attachedFiles.push(entry); // Only add it if it has a file name (not if the field's empty)
    // If it's not a file, just use the field name as the key and the value as the value
    } else dataPayload[entry[0]] = entry[1];
  });

  this.submissionResponses = [];

  // Set up and run the fetch calls
  const filesToUpload = [];

  let dataSubmission = await uploadData(dataPayload)
    .then(response => {
      // Only process presigned URLs if the response was successful
      if (response.ok && response.presigned_urls) {
        const presignedURLs = response.presigned_urls;

        attachedFiles.forEach(
          /**
           * @param {Array} attachedFile - [key, value] pair of field name and File
           * where [0] is the field name and [1] is the attached file
          */
          (attachedFile, i) => {
            const indexedName = `${i}-${attachedFile[1].name}`;
            const presignedDataObj = presignedURLs[indexedName];

            const fileUploadBody = new FormData();
            Object.entries(presignedDataObj.fields).forEach(([key, value]) => {
              fileUploadBody.append(key, value);
            });
            fileUploadBody.append('file', attachedFile[1]);

            filesToUpload.push({
              url: presignedDataObj.url,
              fileUploadBody: fileUploadBody
            });
        });
      }
      return response;
    });

  this.submissionResponses.push(dataSubmission);

  if (filesToUpload.length > 0) {
    let filesResponses = await uploadFiles(filesToUpload);
    this.submissionResponses.push(...filesResponses);
  }

  let passed = true;
  this.submissionResponses.forEach(response => {
    // Check for success status codes
    const isSuccess = response.ok === true || (response.status && response.status >= 200 && response.status < 300);
    if (!isSuccess) {
      console.error('Submission failed:', response.status, response.statusText); // eslint-disable-line no-console
      passed = false;
    }
  });

  this.submissionStatus = passed ? 'success' : 'error';

  this.updateBottomNav();

  this.goToFrame('confirmation');
};

/**
 * If the form has values, offer a change to stay on this page and not lose the data
 * @param {Event} e
 */
RulemakingCommenting.prototype.handleBeforeUnload = function() {
  // TODO: turn this back on
  // if (this.formEl.dataset.hasBeenActive) {
  //   e.preventDefault();
  // }
};

/**
 * @param {Event} e
 */
RulemakingCommenting.prototype.handleInputChange = function() {
  // Rules for frame 0/type
  // TODO: do we need this?
};

/**
 * @param {InputEvent} e
 */
RulemakingCommenting.prototype.handleInputInput = function() {
  // TODO: do we need this?
};

/**
 * Create an instance of RulemakingCommenting()
 */
new RulemakingCommenting();
