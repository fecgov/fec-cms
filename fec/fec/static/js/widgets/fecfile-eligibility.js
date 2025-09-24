/**
 * Component to direct filers to FECfile+ or other filing applications.
 * Expects a button/link in the page ( @see launcherButtonSelector ), activates it,
 * and may start itself in an open state if the window.location.href sets dialog=open
 */
import { createApp } from 'vue/dist/vue.esm-bundler.js';

// Quick-edits
// (The full data is the last and largest section of this file)
const goalHref = 'https://fecfile.fec.gov/login';

export default function FecFileEligibility() {
  this.launcherButtonSelector = '.js-launch-fecfile-eligibility'; // How to find the button to launch this
  this.appElSelector = 'gov-fec-fecfile-eligibility'; // How to name the main Vue elements, also used in the css
  this.modalDialog; // The <dialog id=`modal-${this.appElSelector}`>
  this.app; // The <div id=`${buildInnerComponents}`> converted into this app
  this.frames; // The frames of content
  this.init();
}

/**
 * Kick it off. Finds the launcher button, adds the listener, activates it, then opens the <dialog> if needed
 */
FecFileEligibility.prototype.init = function() {
  let launcherButton = document.querySelector(this.launcherButtonSelector);

  if (launcherButton) {
    this.buildModalDialog();
    launcherButton.classList.remove('is-disabled');
    launcherButton.addEventListener('click', this.handleOpenDialogClick.bind(this));
  }

  // Should we start in the open state?
  let searchParams = new URLSearchParams(window.location.search);
  if (searchParams && searchParams.get('dialog') === 'open') this.handleOpenDialogClick();
};

/**
 * Creates this <dialog> in document.body and listens for the close button's click event
 */
FecFileEligibility.prototype.buildModalDialog = function() {
  this.modalDialog = document.createElement('dialog');
  this.modalDialog.setAttribute('id', `modal-${this.appElSelector}`);
  this.modalDialog.setAttribute('closedby', 'any');
  this.modalDialog.innerHTML = `
    <div class="modal__content" aria-labelledby="eligibility-modal-title">
      <div role="document">
        <button type="button" class="modal__close button--close--primary"
        data-a11y-dialog-hide="modal-${this.appElSelector}"
        title="Close this dialog window"></button>
        <h2 id="eligibility-modal-title">Is FECfile+ right for my committee?</h2>
        <div id="${this.appElSelector}">
        <div></div>
      </div>
    </div>`;
  document.body.appendChild(this.modalDialog);
  this.modalDialog.querySelector('.modal__close').addEventListener('click', this.handleCloseDialogClick.bind(this));
};

/**
 * Builds the Vue app (if needed), then opens the <dialog> with showModal();
 */
FecFileEligibility.prototype.handleOpenDialogClick = function() {
  // If we haven't built the app yet, do that now
  if (!this.app) this.initMainComponent();

  this.modalDialog.showModal();
};

/**
 * Calls .close() on the <dialog>
 */
FecFileEligibility.prototype.handleCloseDialogClick = function() {
  this.modalDialog.close();
};

/**
 * Builds the TopNav, BottomNav, Help, and Frames components and adds them to this.app ( @see initMainComponent() )
 */
FecFileEligibility.prototype.buildInnerComponents = function() {
  /**
   * The <TopNav> Vue component
   */
  this.app.component('TopNav', {
    props: {
      currentFrameNum: {
        type: Number,
        required: true
      },
      frames: {
        type: Array,
        required: true
      }
    },
    template: `
    <nav class="topnav">
      <meter
        v-bind:value="this.currentFrameNum"
        v-bind:max="frames.length - 1"
        v-bind:class="{'complete': this.currentFrameNum == frames.length - 1}"
        v-if="this.currentFrameNum > 0"
        min="0"></meter>
      <i class="i i-check"></i>
      <ul
        class="breadcrumbs"
        v-if="this.currentFrameNum > 0"
        >
        <li
          v-for="(frame, index) in frames"
          v-bind:class="['breadcrumbs__item', topNavClass(index)]"
          v-bind:key="index"
          >
          <a
            class="breadcrumbs__link"
            v-on:click="handleClick(index)"
            >{{ frame.navLabel }}</a>
        </li>
      </ul>
    </nav>`,
    methods: {
      handleClick: function(i) {
        this.$emit('handle-click', i);
      },
      topNavClass: function(navIndex) {
        return [
          {
            viewed: this.frames[navIndex].viewed || navIndex == 0,
            current: navIndex == this.currentFrameNum,
            hidden: navIndex == 0 || navIndex == this.frames.length - 1,
            'hide-after':
              navIndex < 1 ||
              navIndex >= this.frames.length - 2 ||
              (navIndex == this.currentFrameNum &&
                !this.frames[navIndex + 1].viewed === true)
          }
          // hide-after should be included for nav elements that
          // - aren't the first (intro frame)
          // - aren't the last (outro/total frame)
          // - don't have a value BUT only when the next frame hasn't been viewed
        ];
      }
    }
  });

  /**
   * The <BottomNav> Vue component
   */
  this.app.component('BottomNav', {
    props: {
      currentFrameNum: {
        type: Number,
        required: true
      },
      frames: {
        type: Array,
        required: true
      }
    },
    template: `
    <nav class="bottomnav" v-show="this.currentFrameNum > 0">
      <span class="break"></span>
      <button v-bind:class="bottomNavClass('prev')" v-on:click="handleClick('back', $event)">Back</button>
      <button v-bind:class="bottomNavClass('next')" v-on:click="handleClick('next', $event)">Next</button>
      <button v-bind:class="bottomNavClass('close')" v-on:click="handleClick('close', $event)">Close</button>
      <button v-bind:class="bottomNavClass('go')" v-on:click="handleClick('go', $event)">Create a FECfile+ account and sign in with Login.gov</button>
      <button v-bind:class="bottomNavClass('restart')" v-on:click="handleClick('restart', $event)">Start over</button>
    </nav>`,
    methods: {
      bottomNavClass: function(buttonID) {
        let isFirstFrame = this.currentFrameNum == 0;
        let isLastFrame = this.currentFrameNum >= this.frames.length - 1;
        let isNotLastFrame = !isLastFrame;
        let currentFrameNeedsAnswer = !this.frames[this.currentFrameNum].viewed;

        return {
          // style classes:
          'button--back': buttonID == 'prev',
          'button--alt': buttonID == 'prev' || buttonID == 'restart',
          'button--go': buttonID == 'next' || buttonID == 'restart',
          'button--cta': buttonID == 'next' || buttonID == 'close' || buttonID == 'go',
          // behavior classes:
          'is-disabled':
            (isFirstFrame && buttonID == 'prev') ||
            (currentFrameNeedsAnswer && buttonID == 'next'),
          hidden:
            (isLastFrame && (buttonID == 'next' || buttonID == 'close')) ||
            (isNotLastFrame && (buttonID == 'close' || buttonID == 'restart' || buttonID == 'go')),
          login: buttonID == 'go'
        };
      },
      handleClick: function(id, e) {
        this.$emit('handle-click', id, e);
      }
    }
  });

  /**
   * The <Help> Vue component
   */
  this.app.component('Help', {
    props: {
      frames: {
        type: Array,
        required: true
      },
      helpClass: {
        type: String,
        required: false
      },
      helpContent: {
        type: String,
        required: false
      },
      helpTitle: {
        type: String,
        required: false
      },
      helpPointerY: {
        type: Number,
        required: false
      }
    },
    template: `
    <div
      v-bind:class="helpClass"
      id="help"
      >
      <svg
        v-bind:style="'top:' + helpPointerY + 'px'"
        class="pointer"
        height="40"
        width="20"
        viewBox="-20 -40 20 40">
        <path d="M 0 -40 l -20 20 l 20 20" stroke="#112e51" fill="white"></path>
      </svg>
      <h3 v-show="helpTitle">{{ helpTitle }}</h3>
      <button
        class="filters__toggle"
        v-on:click="handleCloseClick">
      </button>
      <div class="help_scroller">
        <div class="ps-scrollbar-y-rail"><div class="ps-scrollbar-y"></div></div>
        <div class="help_content" v-html="helpContent"></div>
      </div>
    </div>`,
    methods: {
      handleCloseClick: function() {
        this.$emit('close-click');
      }
    }
  });

  /**
   * The <Frames> Vue component
   */
  this.app.component('Frames', {
    props: {
      currentFrameNum: {
        type: Number,
        required: true
      },
      frames: {
        type: Array,
        required: true
      },
      isAuthorizedCommittee: {
        type: String,
        required: false
      },
      isPacOrParty: {
        type: String,
        required: false
      },
      isRegistered: {
        type: String,
        required: false
      },
      hasFiled: {
        type: String,
        required: false
      },
      plansToAllocate: {
        type: String,
        required: false
      }
    },
    template: `
      <form class="frames">
        <template v-for="(frame, frame_index) in frames">
          <div
            v-bind:class="frameClass(frame_index, frame.class)"
            >
            <h4 v-if="frame.title">{{ frame.title }}
              <button
                v-if="frame.help"
                v-on:click="handleHelpClick(frame.helpTitle, frame.help, $event)"
                class="tooltip__trigger"
                type="button"
                tabindex="0">
                <span class="u-visually-hidden">Learn more</span>
              </button>
            </h4>
            <p class="t-note" v-if="frame.title_example">{{ frame.title_example }}</p>
            <template
              v-if="frame.questions"
              v-for="(q, question_index) in frame.questions"
                >
              <span
                v-if="q.type == 'clear'"
                v-show="evalFieldShowRule(q)"
                class="clear"></span>
              <button
                v-if="q.help && q.type"
                v-show="evalFieldShowRule(q)"
                v-on:click="handleHelpClick(q.helpTitle, q.help, $event)"
                class="tooltip__trigger"
                type="button"
                tabindex="0">
                <span class="u-visually-hidden">Learn more</span>
              </button>
              <h4
                v-if="q.fieldH"
                v-show="evalFieldShowRule(q)"
                v-bind:class="q.class"
                ><strong>{{ q.fieldH }}</strong>
              </h4>
              <p
                v-if="q.fieldP"
                v-show="evalFieldShowRule(q)"
                v-bind:class="q.class"
                >{{ q.fieldP }}</p>
              <input
                v-if="q.type == 'radio'"
                v-on:change="handleQuestionInput(frame_index, question_index, q, $event)"
                v-bind:id="'elem_' + q.vModel + '_' + q.value"
                v-bind:name="'elem_' + q.vModel"
                v-bind:class="q.class"
                type="radio"
                ></input>
              <label
                v-if="q.type == 'radio'"
                v-bind:for="'elem_' + q.vModel + '_' + q.value"
                v-bind:class="q.class"
                >{{ q.label }}</label>
              <div
                v-if="q.roadblockContent"
                v-bind:for="'elem_' + q.vModel + '_' + q.value"
                v-html="q.roadblockContent"
                class="is_roadblock"
              >
              </div>
            </template>
            <template
              v-if="frame.content"
              >
              <div v-for="(item, index) in frame.content">
                <p
                  v-if="item.type == 'p' && item.html"
                  v-bind:class="item.class"
                  v-html="item.html"
                  v-show="evalFieldShowRule(item)"
                  ></p>
                <p
                  v-else-if="item.type == 'p' && !item.html"
                  v-bind:class="item.class"
                  v-show="evalFieldShowRule(item)"
                  >{{ item.content }}</p>
                <button 
                  v-if="item.type == 'button'"
                  v-bind:class="item.class"
                  v-on:click="handleButtonClick(item.actionId, $event)"
                  >
                  {{ item.label }}
                </button>
              </div>
            </template>
          </div>
        </template>
      </form>`,
    methods: {
      /**
       * @param {Proxy(Object)} q
       * @returns {boolean}
       */
      evalFieldShowRule: function(q) {
        // If there's no rule, default to showing the field
        if (!q || !q.showIfVar || !q.showIfVarExpectedValue) return true;

        return this[q.showIfVar] === q.showIfVarExpectedValue;
      },
      /**
       * Returns a string of class names for a given frame based on currentFrameNum
       * @param {number} frameIndex - Frame #/index
       * @param {string} additionalClasses - Optional additional class names to include
       * @returns {string}
       */
      frameClass: function(frameIndex, additionalClasses) {
        return [
          'frame',
          {
            previous: frameIndex < this.currentFrameNum,
            current: frameIndex == this.currentFrameNum,
            'next off-screen': frameIndex > this.currentFrameNum
          },
          additionalClasses
          // {
          //   viewed: this.frames[navIndex].viewed || navIndex == 0,
          //   current: navIndex == this.currentFrameNum,
          //   hidden: navIndex == 0 || navIndex == this.frames.length - 1,
          //   'hide-before': navIndex < 2 || navIndex >= this.frames.length - 1
          // }
        ];
      },
      getVarVal: function(valName) {
        return this[valName];
      },
      /**
       * Local click event handler that's broadcast upward
       * @param {string} id - The type of button e.g. 'back', 'go', 'start'
       * @param {PointerEvent} e
       */
      handleButtonClick: function(id, e) {
        this.$emit('button-click', id, e);
      },
      handleQuestionInput: function(
        frame_index,
        question_index,
        question,
        $event
      ) {
        this.$emit(
          'question-input',
          frame_index,
          question_index,
          question,
          $event
        );
      },
      handleHelpClick: function(title, questionHelp, e) {
        this.$emit('help-i-click', title, questionHelp, e);
      }
    }
  });
};

/**
 * Builds the main Vue component, builds the inner components ( @see buildInnerComponents ), then mounts the app
 */
FecFileEligibility.prototype.initMainComponent = function() {
  let appConfig = {
    data() {
      return fullData;
    },
    template: `<div>
      <TopNav
        :current-frame-num="currentFrameNum"
        :frames="frames"
        @handle-click="handleTopNavClick"
      ></TopNav>
      <Frames
        :frames="frames"
        :current-frame-num="currentFrameNum"
        :is-authorized-committee="isAuthorizedCommittee"
        :is-pac-or-party="isPacOrParty"
        :is-registered="isRegistered"
        :has-filed="hasFiled"
        :plans-to-allocate="plansToAllocate"
        @button-click="handleButtonClick"
        @question-input="handleQuestionInput"
        @help-i-click="toggleHelp"
      ></Frames>
      <Help
        :frames="frames"
        :help-class="helpClass"
        :help-pointer-y="helpPointerY"
        :help-content="helpContent"
        :help-title="helpTitle"
        @close-click="toggleHelp"
      ></Help>
      <BottomNav
        :frames="frames"
        :current-frame-num="currentFrameNum"
        @handle-click="handleButtonClick"
      ></BottomNav>
    </div>`,
    mounted: function() {
      // Add the transition listeners so frames disappear while out of sight
      this.startWatchingTransitions();

      // Set initial focus on the first frame's button, but the browser needs to render everything first
      requestAnimationFrame(() => {
        document.querySelector('.autofocus').focus();
      });
    },
    computed: {
      helpClass: function() {
        return this.showHelp == false ? 'hidden' : 'show';
      }
    },
    methods: {
      handleButtonClick: function(buttonType, e) {
        e.preventDefault();
        if (buttonType == 'start') this.handleTopNavClick(1);
        else if (buttonType == 'next')
          this.handleTopNavClick(this.currentFrameNum + 1);
        else if (buttonType == 'back') this.currentFrameNum--;
        else if (buttonType == 'go') {
          window.open(goalHref);
        }
        else if (buttonType == 'restart') this.restart();
        else if (buttonType == 'close') {
          document.dispatchEvent(new CustomEvent('CLOSE_MODAL'), {
            detail: {
              'data-a11y-dialog-hide': 'gov-fec-calc-af'
            }
          });
        }
        this.toggleHelp(); // toggling help with no content will hide it
      },
      handleTopNavClick: function(navIndex) {
        // this.frames[navIndex].viewed = true;
        this.currentFrameNum = navIndex;
      },
      handleQuestionInput: function(frameNum, qNum, q, e) {
        let affectedVmodel = q.vModel;
        let newValue = q.value ? q.value : e.target.value;
        let passedTests = false;
        //
        // Set the value
        this[affectedVmodel] = newValue;

        passedTests = q.roadblockContent === '';

        this.frames[this.currentFrameNum].viewed = passedTests;
        this.setBreadCrumbText(frameNum, qNum, q);
      },
      restart: function() {
        // reset vars
        this.currentFrameNum = 0;
        this.isAuthorizedCommittee = undefined;
        this.isPacOrParty = undefined;
        this.isRegistered = undefined;
        this.hasFiled = undefined;
        this.plansToAllocate = undefined;
        this.showHelp = false;
        // Set all the frames to not viewed (for breadcrumbs and Next button)
        this.frames.forEach(frame => {frame.viewed.false;});
        // for (let i = 0; i < this.frames.length; i++) {
          // this.frames[i].viewed = false;
        // }
        //
        // clear breadcrumbs
        this.setBreadCrumbText('reset');
        //
        // TODO - a better way to reset all the form values?
        let theForm = document.querySelector('form.frames');
        theForm.reset();
      },
      setBreadCrumbText: function(frameNum, qNum, q) {
        // If we're setting a blank frameNum, we're trying to reset
        if (frameNum == 'reset') {
          for (let i = 0; i < this.frames.length; i++) {
            this.frames[i].navLabel = '';
          }
          return;
        } else if (q == '') {
          // If we're setting a q of '', we're trying to clear the text for the current nav (like on frame error)
          this.frames[frameNum].navLabel = ' ';
          return;
        }

        let theBreadCrumbText = String(q.breadCrumbText);

        if (frameNum > 0 && q && q.breadCrumbText)
          this.frames[frameNum].navLabel = theBreadCrumbText;
      },
      startWatchingTransitions: function() {
        const frames = document.querySelectorAll('.frame');

        // Add off-screen to all non-intro frames
        for (let i = 0; i < frames.length; i++) {
          //
          if (!frames[i].classList.contains('intro'))
            frames[i].classList.add('off-screen');

          frames[i].addEventListener('transitionstart', function(e) {
            if (e.target.classList.contains('frame'))
              e.target.classList.remove('off-screen');
          });

          frames[i].addEventListener('transitionend', function(e) {
            if (
              e.target.classList.contains('frame') &&
              !e.target.classList.contains('current')
            )
              e.target.classList.add('off-screen');
          });
        }
      },
      toggleHelp: function(title, html, e) {
        if (e) e.preventDefault();
        if ((this.showHelp && html == this.helpContent) || (!title && !html))
          this.showHelp = false;
        else {
          this.showHelp = true;
          this.helpContent = html;
          this.helpTitle = title;
          // set the help pointer to
          // (the top of the circled i icon), minus
          // (the top of the help section), minus
          // (half of the difference between the heights of the circled i and the help pointer itself)
          this.helpPointerY =
            e.target.getBoundingClientRect().top -
            this.$el.querySelector('#help').getBoundingClientRect().top -
            10;
        }
      }
    }
  };

  this.app = createApp(appConfig);
  this.buildInnerComponents();
  this.app.mount(`#${this.appElSelector}`);
};

/**
 * The full data for the app. All content changes should be made below
 */
const fullData = {
  currentFrameNum: 0, // int
  isAuthorizedCommittee: undefined, // bool
  isPacOrParty: undefined, // string
  isRegistered: undefined, // bool
  hasFiled: undefined, // bool
  plansToAllocate: undefined, // bool
  helpTitle: '',
  helpContent: '',
  helpPointerY: 0,
  showHelp: false,
  frames: [
    {
      navLabel: '',
      title: '',
      class: 'intro',
      content: [
        {
          type: 'p',
          class: '',
          content:
            'This tool is to help committees and their teams determine whether using FECfile+ is the right \
            step, or whether other electronic filing tools would be better to comply with reporting requirements \
            at\u00A0this\u00A0time.' // \u00A0 is a nonbreaking space
        },
        {
          type: 'button',
          class: 'button button--cta button--go autofocus', // 'autofocus' is for the <dialog>
          label: 'Get started',
          actionId: 'start'
        }
      ],
      viewed: true
    },
    {
      navLabel: '',
      title: 'Is your committee authorized by a federal\u00A0candidate?',
      questions: [
        { type: 'clear' },
        {
          label: 'Yes, this committee is authorized',
          type: 'radio',
          vModel: 'isAuthorizedCommittee',
          value: 'true',
          breadCrumbText: 'Authorized committee',
          class: 'is_roadblock',
          helpTitle: 'What is an authorized committee?',
          help: `<p><strong>An authorized committee</strong> is a political committee that has been authorized by a 
          candidate to accept contributions or make expenditures on his or her behalf, or one that accepts
          contributions or makes expenditures on behalf of a candidate and has not been disavowed by
          the&nbsp;candidate.</p><em>Example: Friends of John McCain&nbsp;Inc</em>`,
          roadblockContent: `
            <div class="indented">
              <p>Authorized committees are not currently supported by FECfile+ and we recommend using the original
              FECFile desktop platform, or a third-party service to meet reporting&nbsp;obligations.</p>
              <div class="buttons-lockup">
                <a class="button--cta"
                  href="https://www.fec.gov/help-candidates-and-committees/filing-reports/fecfile-software/">
                  Get FECFile desktop</a>
                <a class="button--alt"
                  href="https://efilingapps.fec.gov/registration/softwarelogs.htm">List of other filing software</a>
              </div>
            </div>
          `
        },
        { type: 'clear' },
        {
          label: 'No, this committee is not\u00A0authorized',
          type: 'radio',
          vModel: 'isAuthorizedCommittee',
          value: 'false',
          breadCrumbText: 'Not authorized',
          helpTitle: 'What is a committee not authorized by a candidate?',
          help: `<p><strong>A committee that is not authorized</strong> is a political committee that has not been
          authorized by a candidate to accept contributions or make expenditures on his or her behalf, or one that
          does not accept contributions or makes expenditures on behalf of a candidate or has been disavowed by
          the&nbsp;candidate.</p><em>Example: American Jobs&nbsp;PAC</em>`,
          roadblockContent: ''
        }
      ],
      viewed: false
    },
    {
      navLabel: '',
      title: 'Is your committee a political action committee (PAC) or political party\u00A0committee?',
      questions: [
        { type: 'clear' },
        {
          label: 'Yes, my committee is a PAC',
          type: 'radio',
          vModel: 'isPacOrParty',
          value: 'PAC',
          breadCrumbText: 'Political action committee (PAC)',
          helpTitle: 'What is a political action committee, or PAC?',
          help: `<p><strong>A popular term for a political committee</strong> that is neither a party committee nor an
          authorized committee of a candidate. PACs directly or indirectly established, administered or financially
          supported by a corporation or labor organization are called separate segregated funds (SSFs). PACs without
          such a corporate or labor sponsor are called nonconnected&nbsp;PACs.</p><em>Example: Friends of John
          McCain&nbsp;Inc</em>`,
          roadblockContent: ''
        },
        { type: 'clear' },
        {
          label: 'Yes, my committee is a political party\u00A0committee',
          type: 'radio',
          vModel: 'isPacOrParty',
          value: 'party',
          breadCrumbText: 'Political party committee',
          helpTitle: 'What is a party committee?',
          help: `<p><strong>A political committee</strong> that represents a political party and is part of the
          official party structure at the national, state or local&nbsp;level.</p>`,
          roadblockContent: ''
        },
        { type: 'clear' },
        {
          label: 'No, my committee is neither of\u00A0those',
          type: 'radio',
          vModel: 'isPacOrParty',
          value: 'false',
          breadCrumbText: 'Not a PAC or party committee',
          class: 'is_roadblock',
          helpTitle: 'What is an authorized committee?',
          help: `<p><strong>A political committee</strong> that represents a political party and is part of the
          official party structure at the national, state or local&nbsp;level.</p>`,
          roadblockContent: `
            <div class="indented">
              <p>Only PACs and political party committees are currently supported by FECfile+ and we recommend using
              the original FECFile desktop platform, or a third-party service to meet reporting&nbsp;obligations.</p>
              <div class="buttons-lockup">
                <a class="button--cta"
                  href="https://www.fec.gov/help-candidates-and-committees/filing-reports/fecfile-software/">
                  Get FECFile desktop</a>
                <a class="button--alt"
                href="https://efilingapps.fec.gov/registration/softwarelogs.htm">List of other filing software</a>
              </div>
            </div>
          `
        }
      ],
      viewed: false
    },
    {
      navLabel: '',
      title: 'Has your committee already registered with the FEC by filing a Form 1 Statement of Organization AND \
      received a committee\u00A0ID?',
      questions: [
        { type: 'clear' },
        {
          label: 'Yes, my committee is registered and has a committee ID',
          type: 'radio',
          vModel: 'isRegistered',
          value: 'true',
          breadCrumbText: 'Registered with ID',
          helpTitle: '',
          help: '',
          roadblockContent: ''
        },
        { type: 'clear' },
        {
          label: 'No, my committee is not registered',
          type: 'radio',
          vModel: 'isRegistered',
          value: 'false',
          breadCrumbText: 'Hasn’t registered',
          class: 'is_roadblock',
          helpTitle: '',
          help: '',
          roadblockContent: `
            <div class="indented">
              <p><strong>Only registered PACs and political party committees with a committee ID are currently
              supported by FECfile+</strong> and we recommend using the original FECFile desktop platform or a
              third-party service to meet reporting&nbsp;obligations.</p>
              <a class="button--cta" href="https://www.fec.gov/help-candidates-and-committees/forms/">Register your
              committee</a>
            </div>
          `
        }
      ],
      viewed: false
    },
    {
      navLabel: '',
      title: 'Has your committee ever filed campaign finance reports that contained financial\u00A0activity?',
      title_example: 'Example: Form 3X for reporting receipts and disbursements',
      helpTitle: '',
      help: '',
      questions: [
        { type: 'clear' },
        {
          label: 'Yes, my committee has filed a financial report',
          type: 'radio',
          vModel: 'hasFiled',
          value: 'true',
          breadCrumbText: 'Has filed a financial report',
          class: 'is_roadblock',
          helpTitle: '',
          help: '',
          roadblockContent: `
            <div class="indented">
              <p><strong>At this time, FECfile+ does not include the ability to import transactions or other past
              activity and it cannot amend reports previously filed using different campaign finance software,</strong>
              so we recommend using the original FECFile desktop platform or a third-party service to meet
              reporting&nbsp;obligations.</strong></p>
              <div class="buttons-lockup">
                <a class="button--cta"
                  href="https://www.fec.gov/help-candidates-and-committees/filing-reports/fecfile-software/">
                  Get FECFile desktop</a>
                <a class="button--alt"
                  href="https://efilingapps.fec.gov/registration/softwarelogs.htm">List of other filing software</a>
              </div>
            </div>`
        },
        { type: 'clear' },
        {
          label: 'No, my committee has not filed a financial report',
          type: 'radio',
          vModel: 'hasFiled',
          value: 'false',
          breadCrumbText: 'Has not filed financial reports',
          helpTitle: '',
          help: '',
          roadblockContent: ''
        }
      ],
      viewed: false
    },
    {
      navLabel: '',
      title: 'Does your committee anticipate allocating financial activity between federal and nonfederal accounts and/or anticipate receiving bundled contributions from lobbyists and lobbyist/registrant\u00A0PACs?',
      title_example: '',
      helpTitle: 'What does it mean to allocate between federal and non-federal accounts?',
      help: 'A separate federal account into which funds from either a committee’s federal and nonfederal accounts, \
      or (for party committees) from its federal and Levin accounts, are deposited solely to pay expenses that must \
      be allocated. (A party committee must have separate allocation accounts for its federal/nonfederal allocation \
      and for its federal/Levin&nbsp;allocation.)',
      questions: [
        { type: 'clear' },
        {
          label: 'Yes, my committee plans to allocate financial activity between federal and nonfederal accounts',
          type: 'radio',
          vModel: 'plansToAllocate',
          value: 'true',
          breadCrumbText: 'Plans to allocate',
          class: 'is_roadblock',
          helpTitle: '',
          help: '',
          roadblockContent: `
            <div class="indented">
              <p><strong>At this time, FECfile+ does not include functionality to allow for reporting of allocated \
              activity</strong>, so we recommend using the original FECFile desktop platform or a third-party service \
              to meet reporting&nbsp;obligations.</p>
              <div class="buttons-lockup">
                <a class="button--cta"
                  href="https://www.fec.gov/help-candidates-and-committees/filing-reports/fecfile-software/">
                  Get FECFile desktop</a>
                <a class="button--alt"
                  href="https://efilingapps.fec.gov/registration/softwarelogs.htm">List of other filing software</a>
              </div>
            </div>`
        },
        { type: 'clear' },
        {
          label: 'No, my committee does not plan to allocate financial activity.',
          type: 'radio',
          vModel: 'plansToAllocate',
          value: 'false',
          breadCrumbText: 'No plans to allocate',
          helpTitle: '',
          help: '',
          roadblockContent: ''
        }
      ],
      viewed: false
    },
    {
      navLabel: '',
      title: '',
      class: 'outro',
      content: [
        {
          type: 'p',
          class: '',
          html: '<strong>Welcome to FECfile+!</strong>'
        },
        {
          type: 'p',
          class: '',
          showIfVar: 'isPacOrParty',
          showIfVarExpectedValue: 'PAC',
          content:
            'As a registered PAC with a committee ID, that has not yet filed any financial reports and has no plans \
            to allocate activity, your committee is currently supported and can submit reports to meet your reporting \
            obligations using FECfile+.'
        },
        {
          type: 'p',
          class: '',
          showIfVar: 'isPacOrParty',
          showIfVarExpectedValue: 'party',
          content:
            `As a registered political party committee with a committee ID, that has not yet filed any financial \
            reports and has no plans to allocate activity, your committee is currently supported and can submit \
            reports to meet your reporting obligations using FECfile+.`
        },
        {
          type: 'p',
          class: '',
          html: '<strong>Other caveats to consider:</strong>'
        },
        {
          type: 'p',
          class: '',
          html:
            '<strong>No ability to preview reports over 20MB.</strong> Reports this size tend to run around 25,000+ \
            pages and 80,000+ transactions.'
        },
        {
          type: 'p',
          class: '',
          html:
            '<strong>Mobile devices are not recommended at this time.</strong> For the best experience, we recommend \
            using a computer or tablet.'
        }
      ],
      viewed: false
    }
  ]
};

/**
 * Create an instance of FecFileEligibility()
 */
new FecFileEligibility();
