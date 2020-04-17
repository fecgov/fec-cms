/* global $ */
/* global calcAdminFineJsPath, calcAdminFineCssPath */

// {# If the page has a link to the admin fines calculator in it, load its JS #}
if ($('.js-admin-fines-calc-modal').length > 0) {
  // TEMP
  // Add the modal to the page

  // console.log('CalculatorAdminFinesModal.addModalToPage()');
  let modalElementID = 'modal-gov-fec-calc-af';
  let newModal = document.createElement('div');
  newModal.setAttribute('id', modalElementID);
  newModal.setAttribute('class', 'js-modal modal');
  newModal.setAttribute('aria-hidden', 'true');
  newModal.innerHTML = `
    <div tabindex="-1" class="modal__overlay" data-a11y-dialog-hide="${modalElementID}"></div>
    <div role="dialog" class="modal__content" aria-labelledby="calc-af-modal-title">
      <div role="document">
        <button type="button" class="modal__close button--close--primary" data-a11y-dialog-hide="${modalElementID}" title="Close this dialog window"></button>
        <h2 id="calc-af-modal-title">Administrative Fine Calculator</h2>
        <div id="gov-fec-calc-af"></div>
      </div>
    </div>`;
  document.body.appendChild(newModal);

  // Add Vue to the page
  let vueScriptElem = document.createElement('script');
  vueScriptElem.async = false;
  vueScriptElem.src = 'https://cdn.jsdelivr.net/npm/vue/dist/vue.js';
//   vueScriptElem.src = 'https://cdn.jsdelivr.net/npm/vue@2.6.11';
//   import Vue from 'https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.esm.browser.js'
  document.head.appendChild(vueScriptElem);

  // Add the admin fines script to the page
  if (calcAdminFineJsPath) {
    let calcAFScriptElem = document.createElement('script');
    calcAFScriptElem.async = false;
    calcAFScriptElem.src = calcAdminFineJsPath;
    document.head.appendChild(calcAFScriptElem);
  }

  // Add the AF styles
  if (calcAdminFineCssPath != undefined) {
    // let calcAFCssElem = document.createElement('link');
    // calcAFCssElem.rel = 'stylesheet';
    // calcAFCssElem.type = 'text/css';
    // calcAFCssElem.href = calcAdminFineCssPath;
    // document.getElementsByTagName('head')[0].appendChild(calcAFCssElem);
  }

  // Set the link(s) to open the modal
  let theLinkElements = document.getElementsByClassName(
    'js-admin-fines-calc-modal'
  );
  for (let i = 0; i < theLinkElements.length; i++) {
    theLinkElements[i].setAttribute('aria-controls', 'modal-gov-fec-calc-af');
    theLinkElements[i].setAttribute(
      'data-a11y-dialog-show',
      'modal-gov-fec-calc-af'
    );
    theLinkElements[i].addEventListener('click', handleTempOpenLinkClick);
  }
  // Set the temp modal's close functionality
  newModal
    .getElementsByClassName('modal__close')[0]
    .addEventListener('click', handleTempCloseClick);
  newModal
    .getElementsByClassName('modal__overlay')[0]
    .addEventListener('click', handleTempCloseClick);

  // eslint-disable-next-line no-inner-declarations
  function handleTempOpenLinkClick(e) {
    e.preventDefault();
    let theModal = document.getElementById(
      this.getAttribute('data-a11y-dialog-show')
    );
    theModal.setAttribute('aria-hidden', false);
  }
  // eslint-disable-next-line no-inner-declarations
  function handleTempCloseClick(e) {
    e.preventDefault();
    let theModal = document.getElementById(
      this.getAttribute('data-a11y-dialog-hide')
    );
    theModal.setAttribute('aria-hidden', true);
  }
  // END TEMP

  /* let calcAFScriptElem = document.createElement('script');
  calcAFScriptElem.async = false;
  calcAFScriptElem.src = "{% asset_for_js 'calc-admin-fines.js' %}";
  document.head.appendChild(calcAFScriptElem); */
}
