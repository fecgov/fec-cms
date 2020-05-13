/* global $ calcAdminFineJsPath CustomEvent */

// {# If the page has a link to the admin fines calculator in it, load its JS #}
if ($('.js-admin-fines-calc-modal').length > 0) {
  // TEMP
  // Add the modal to the page

  let calcElementID = 'gov-fec-calc-af';
  let newModal = document.createElement('div');
  newModal.setAttribute('id', `modal-${calcElementID}`);
  newModal.setAttribute('class', 'js-modal modal');
  newModal.setAttribute('aria-hidden', 'true');
  newModal.innerHTML = `
    <div tabindex="-1" class="modal__overlay" data-a11y-dialog-hide="modal-${calcElementID}"></div>
    <div role="dialog" class="modal__content" aria-labelledby="calc-af-modal-title">
      <div role="document">
        <button type="button" class="modal__close button--close--primary" data-a11y-dialog-hide="modal-${calcElementID}" title="Close this dialog window"></button>
        <h2 id="calc-af-modal-title">Administrative fine calculator</h2>
        <div id="${calcElementID}"><div></div></div>
      </div>
    </div>`;
  document.body.appendChild(newModal);

  // Add the admin fines script to the page
  if (calcAdminFineJsPath) {
    let calcAFScriptElem = document.createElement('script');
    calcAFScriptElem.async = false;
    calcAFScriptElem.src = calcAdminFineJsPath;
    document.head.appendChild(calcAFScriptElem);
  }

  // Set the link(s) to open the modal
  let theLinkElements = document.getElementsByClassName(
    'js-admin-fines-calc-modal'
  );
  for (let i = 0; i < theLinkElements.length; i++) {
    theLinkElements[i].setAttribute('aria-controls', `modal-${calcElementID}`);
    theLinkElements[i].setAttribute(
      'data-a11y-dialog-show',
      `modal-${calcElementID}`
    );
    theLinkElements[i].addEventListener('click', handleFinesCalcOpenClick);
  }
  // Set the temp modal's close functionality
  newModal
    .getElementsByClassName('modal__close')[0]
    .addEventListener('click', handleFinesCalcCloseClick);
  newModal
    .getElementsByClassName('modal__overlay')[0]
    .addEventListener('click', handleFinesCalcCloseClick);

  document.addEventListener('CLOSE_MODAL', handleFinesCalcCloseClick);

  // eslint-disable-next-line no-inner-declarations
  function handleFinesCalcOpenClick(e) {
    e.preventDefault();
    let theModal = document.getElementById(
      this.getAttribute('data-a11y-dialog-show')
    );
    theModal.setAttribute('aria-hidden', false);
    // Keep the page from scrolling under the modal
    document.querySelector('body').classList.add('scroll-locked-for-modal');
  }
  // eslint-disable-next-line no-inner-declarations
  function handleFinesCalcCloseClick(e) {
    e.preventDefault();
    // If it's a custom event (inside the modal content), use the modal div id from e.detail.
    // othewise, use the attribute from the html element that was clicked
    let theModal;
    if (e.type == 'CLOSE_MODAL')
      theModal = document.querySelector('.js-modal:not([aria-hidden="true"])');
    else if (this.getAttribute('data-a11y-dialog-hide'))
      theModal = document.getElementById(
        this.getAttribute('data-a11y-dialog-hide')
      );

    // Let Vue reset before hiding it
    document.dispatchEvent(new CustomEvent('MODAL_CLOSED'));

    theModal.setAttribute('aria-hidden', true);
    // Release the page to scroll now that the modal is gone
    document.querySelector('body').classList.remove('scroll-locked-for-modal');
  }
  // END TEMP

  /* let calcAFScriptElem = document.createElement('script');
  calcAFScriptElem.async = false;
  calcAFScriptElem.src = "{% asset_for_js 'calc-admin-fines.js' %}";
  document.head.appendChild(calcAFScriptElem); */
}
