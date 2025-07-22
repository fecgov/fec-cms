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
    // this.details.open = finalOpenAttribute;
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
//
/* const startOpened = ['#a19741015', '#a19750414', '#a19750602'];
for (let i = 0; i < startOpened.length; i++) {
  const toOpen = document.querySelector(startOpened[i]);
  toOpen.open = true;
}*/
//
summaryElements.forEach(el => {
  new ExpandingDetail(el);
});
