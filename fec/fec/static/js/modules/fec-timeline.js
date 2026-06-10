const theTimeline = document.querySelector('#fec-timeline');
const summaryElements = theTimeline.querySelectorAll('details summary');
const yearElements = theTimeline.querySelectorAll('ol li > time');

class ExpandingDetail {
  static instances = [];

  constructor(summary) {
    // Keep a list of instances to be used while animating an entire year
    ExpandingDetail.instances.push(this);

    this.details = summary.parentElement;
    this.summary = this.details.querySelector('summary');
    this.content = this.details.querySelector('summary + div');
    summary.addEventListener('click', this._handleClick.bind(this));
  }
  static open(detailsElements) {
    ExpandingDetail.instances.forEach(instance => {
      detailsElements.forEach(el => {
        if (instance.details == el) {
          instance.startOpening();
        }
      });
    });
  }
  static close(detailsElements) {
    ExpandingDetail.instances.forEach(instance => {
      detailsElements.forEach(el => {
        if (instance.details == el) {
          instance.startClosing();
        }
      });
    });
  }
  static filter(category) {
    ExpandingDetail.instances.forEach(instance => {
      let hide = !category ? false : instance.details.dataset.categories.indexOf(category) < 0;
      instance.details.classList.toggle('filtered-out', hide);
    });
  }

  _handleClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.details.open) this.startClosing();
    else this.startOpening();
  }
  startOpening() {
    // Hide the overflow so we can animate it
    this.details.style.overflow = 'hidden';

    // Constrain the height so the animation can do its thing
    this.details.style.height = `${this.details.offsetHeight}px`;
    // Set the native 'open' attribute
    this.details.open = true;
    // Start the opening animation but only after the 'open' has taken effect
    window.requestAnimationFrame(() => this._startOpeningAnimation());
  }
  startClosing() {
    // Hide the overflow so we can animate it
    this.details.style.overflow = 'hidden';

    // Start the opening animation but only after the 'open' has taken effect
    window.requestAnimationFrame(() => this._startClosingAnimation());
  }
  _startOpeningAnimation() {
    // Animation from & to
    const startHeight = `${this.details.offsetHeight}px`;
    const goalHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;

    // Cancel any current animations
    if (this.animation) this.animation.cancel();

    // Start the opening animation
    this.animation = this.details.animate(
      { height: [startHeight, goalHeight] },
      { duration: 333, easing: 'ease-out' }
    );
    // Handle animation finish
    this.animation.onfinish = () => this._finishAnimations(true);
  }
  _startClosingAnimation() {
    // Animation from & to
    const startHeight = `${this.details.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight}px`;

    // Cancel any current animations
    if (this.animation) this.animation.cancel();

    // Start the closing animation
    this.animation = this.details.animate(
      { height: [startHeight, endHeight] },
      { duration: 400, easing: 'ease-out' }
    );

    // Handle animation finish and cancel
    this.animation.onfinish = () => this._finishAnimations(false);
  }
  _finishAnimations(finalOpenAttribute) {
    this.animation = null;
    this.details.removeAttribute('style');

    if (finalOpenAttribute == false) {
      // Set the native 'open' attribute
      this.details.open = false;
    }
  }
}

const handleYearClick = function(e) {
  const thisYearsLi = e.target.closest('li');
  const thisYearsDetailsItems_all = thisYearsLi.querySelectorAll('details');
  const thisYearsDetailsItems_open = thisYearsLi.querySelectorAll('details[open]');
  // Let's make the smaller group match the larger (e.g. if most are closed, close all)
  const newState = thisYearsDetailsItems_open.length >= thisYearsDetailsItems_all.length / 2 ? 'close' : 'open';
  if (newState == 'open') ExpandingDetail.open(thisYearsDetailsItems_all);
  else ExpandingDetail.close(thisYearsDetailsItems_all);
};

// Listen for every year's click event
yearElements.forEach(yearEl => {
  yearEl.addEventListener('click', handleYearClick);
});

// Activate all <details><summary>
summaryElements.forEach(el => {
  new ExpandingDetail(el);
});

// Handle the linked media (videos) to be launched in the modal
function handleLaunchMediaClick(e, urlOverride = false) {
  e.preventDefault();
  let clickUrl = urlOverride || e.target.dataset.media;
  if (!clickUrl) clickUrl = e.target.closest('[data-media]').dataset.media;
  let mediaID = '';
  let iframeUrl = 'https://www.youtube.com/embed/';

  if (clickUrl.indexOf('be.com/embed/') > 0) iframeUrl = clickUrl; // And leave mediaID as ''
  else if (clickUrl.indexOf('v=') > 0) mediaID = clickUrl.match(/v=([A-z\d]+)/gi)[0].substring(2);
  else if (clickUrl.indexOf('youtu.be/') >= 0) mediaID = clickUrl.match(/\.be\/([A-z\d]+)/gi)[0].substring(4);

  let mediaModal = document.querySelector('#media-modal');
  mediaModal.innerHTML = `<button type="button" class="modal__close button--close--primary"
    title="Close this dialog window"></button>
    <iframe id="ytplayer" type="text/html" width="640" height="360" src="${iframeUrl}${mediaID}" frameborder="0"
    allow="accelerometer; gyroscope; picture-in-picture; fullscreen"></iframe>`;
  document.querySelector('dialog .modal__close').addEventListener('click', closeModal);
  openModal();
}
function openModal() {
  let mediaModal = document.querySelector('#media-modal');
  mediaModal.showModal();
}
function closeModal() {
  let mediaModal = document.querySelector('#media-modal');
  mediaModal.close();
}

let linkedMedia = document.querySelectorAll('[data-media]');
linkedMedia.forEach(el => {
  el.addEventListener('click', handleLaunchMediaClick.bind(this));
  el.setAttribute('style', 'cursor:pointer');
});

document.querySelector('#media-modal').addEventListener('close', () => {
  let mediaModal = document.querySelector('#media-modal');
  mediaModal.innerHTML = '';
});

let handleFiltersChange = function(e) {
  ExpandingDetail.filter(e.target.value);
};
document.querySelector('#timeline-category').addEventListener('change', handleFiltersChange);
