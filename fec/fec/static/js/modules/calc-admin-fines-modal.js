/**
 * If the page has a link to the admin fines calculator in it, load the modal
 * @TODO add a fallback to handle this with a notice if !window.calcAdminFineJsPath
 */
const elementsWithAdminFinesCalcClass = document.querySelectorAll('.js-admin-fines-calc-modal');

if (elementsWithAdminFinesCalcClass.length > 0) {
  // Add the modal to the page

  const calcElementID = 'gov-fec-calc-af';
  const newModal = document.createElement('div');
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

  // If we can't find the calculator, deactivate the button as an indicator that something's wrong, and stop here
  if (!window.calcAdminFineJsPath || window.calcAdminFineJsPath.indexOf('[') >= 0) {
    elementsWithAdminFinesCalcClass.forEach(el => {
      el.classList.add('is-disabled');
      el.setAttribute('title', 'The administrative fines calculator is currently unavailable');
      el.removeAttribute('href');
    });
  } else {
    // Otherwise, add the admin fines script tag to the page and continue
    const calcAFScriptElem = document.createElement('script');
    calcAFScriptElem.async = false;
    calcAFScriptElem.src = window.calcAdminFineJsPath;
    document.head.appendChild(calcAFScriptElem);

    // Set the link(s) to open the modal
    const theLinkElements = document.getElementsByClassName(
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
  }

  // eslint-disable-next-line no-inner-declarations
  function handleFinesCalcOpenClick(e) {
    e.preventDefault();
    const theModal = document.getElementById(
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
    // otherwise, use the attribute from the html element that was clicked
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
}
