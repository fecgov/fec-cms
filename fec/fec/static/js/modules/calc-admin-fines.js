/* global CustomEvent */

/**
 */
import Vue from 'vue/dist/vue.min.js';
window.Vue = Vue;

import { availableDates, getTotalAdminFine } from './calc-admin-fines-logic';

// For each of the availableDates from the logic file,
// take the availableDates[i] object and add the parameters we need for our Vue layout
const penaltyAssessedDates = availableDates.map(el =>
  Object.assign({}, el, {
    type: 'radio',
    vModel: 'penaltyAssessedDate',
    breadCrumbText: el.summary
  })
);

/**
 * The <topnav> Vue component
 */
Vue.component('topnav', {
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
 * The <bottomnav> Vue component
 */
Vue.component('bottomnav', {
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
  <div v-show="this.currentFrameNum > 0">
    <button v-bind:class="bottomNavClass('prev')" v-on:click="handleClick('back', $event)">Back</button>
    <button v-bind:class="bottomNavClass('next')" v-on:click="handleClick('next', $event)">Next</button>
    <button v-bind:class="bottomNavClass('close')" v-on:click="handleClick('close', $event)">Close</button>
    <button v-bind:class="bottomNavClass('restart')" v-on:click="handleClick('restart', $event)">Start over</button>
  </div>`,
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
        'button--cta': buttonID == 'next' || buttonID == 'close',
        // behavior classes:
        'is-disabled':
          (isFirstFrame && buttonID == 'prev') ||
          (currentFrameNeedsAnswer && buttonID == 'next'),
        hidden:
          (isLastFrame && buttonID == 'next') ||
          (isNotLastFrame && (buttonID == 'close' || buttonID == 'restart'))
      };
    },
    handleClick: function(id, e) {
      this.$emit('handle-click', id, e);
    }
  }
});

/**
 * The <help> Vue component
 */
Vue.component('help', {
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
 * The <frames> Vue component
 */
Vue.component('frames', {
  props: {
    currentFrameNum: {
      type: Number,
      required: true
    },
    frames: {
      type: Array,
      required: true
    },
    lateOrNonFiler: {
      type: String,
      required: false
    },
    sensitiveReport: {
      type: String,
      required: false
    },
    totalReceiptsAndDisbursementsString: {
      type: String,
      required: true
    },
    totalFineString: {
      type: String,
      required: true
    }
  },
  template: `
    <form class="frames">
      <template v-for="(frame, frame_index) in frames">
        <div
          v-bind:class="frameClass(frame_index, frame.class)"
          >
          <h4 v-if="frame.title">{{ frame.title }}</h4>
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
                v-show="evalFieldShowRule(q)"
                v-on:input="handleQuestionInput(frame_index, question_index, q, frame.validationRule, $event)"
                v-bind:id="'elem_' + q.vModel + '_' + q.value"
                v-bind:name="'elem_' + q.vModel"
                v-bind:class="q.class"
                type="radio"
                ></input>
              <label
                v-if="q.type == 'radio'"
                v-show="evalFieldShowRule(q)"
                v-bind:for="'elem_' + q.vModel + '_' + q.value"
                v-bind:class="q.class"
                >{{ q.label }}</label>
              <label
                v-if="(q.type == 'integer' || q.type == 'currency') && q.class == 'label-headline'"
                v-show="evalFieldShowRule(q)"
                v-bind:for="'elem_' + q.vModel"
                v-bind:class="q.class"
                >{{ q.label }}</label>
              <input
                v-if="q.type == 'integer' || q.type == 'currency'"
                v-show="evalFieldShowRule(q)"
                v-on:input="handleQuestionInput(frame_index, question_index, q, frame.validationRule, $event)"
                v-bind:class="q.class"
                v-bind:id="'elem_' + q.vModel"
                v-bind:max="q.max"
                v-bind:min="q.min"
                v-bind:name="'elem_' + q.vModel"
                type="number"
                v-bind:data-onkeypress="q.type == 'integer' ? 'return event.charCode >= 48 && event.charCode <= 57' : false"
                v-bind:onchange="q.type == 'currency' ? 'event.target.value = Number(event.target.value).toFixed(2)' : false"
                v-bind:placeholder="q.placeholder"
                v-bind:size="v.size"
                ></input>
              <label
                v-if="(q.type == 'integer' || q.type == 'currency') && q.class != 'label-headline'"
                v-show="evalFieldShowRule(q)"
                v-bind:for="'elem_' + q.vModel"
                v-bind:class="q.class"
                >{{ q.label }}</label>
              <span
                v-if="q.example"
                class="t-note t-sans search__example">{{ q.example }}</span>
              <div
                v-if="q.type == 'html'"
                v-show="evalFieldShowRule(q)"
                v-html="q.html"
                v-bind:class="q.class"
              ></div>
          </template>
          <template
            v-if="frame.content"
            >
            <div v-for="(item, index) in frame.content">
              <p
                v-if="item.type == 'p'"
                v-bind:class="item.class">{{ item.content }}</p>
              <button 
                v-if="item.type == 'button'"
                v-bind:class="item.class"
                v-on:click="handleButtonClick(item.actionId, $event)"
                >
                {{ item.label }}
              </button>
            </div>
          </template>
          <template
            v-if="frame.feedback">
            <div
              v-for="(item, index) in frame.feedback">
              <p
                v-if="item.type == 'value'"
                v-bind:class="item.class"
              >{{ item.label }} <span>{{ getVarVal(item.vModel) }}</span></p>
              <p v-if="item.type == 'p'">{{ item.content }}</p>
            </div>
          </template>
        </div>
      </template>
    </form>`,
  methods: {
    evalFieldShowRule: function(q) {
      // If there's no rule 1, default to showing the field
      if (!q || !q.showIfVar1 || !q.showIfVar1ExpectedValue) return true;
      // else if we have a match for var 1 AND var 2, eval them both
      // comparing as string, just in case
      else if (
        q.showIfVar2 &&
        q.showIfVar2ExpectedValue &&
        this[q.showIfVar1] &&
        this[q.showIfVar2]
      ) {
        return (
          this[q.showIfVar1] === q.showIfVar1ExpectedValue &&
          this[q.showIfVar2] === q.showIfVar2ExpectedValue
        );
      } else if (this[q.showIfVar1]) {
        // Otherwise, just compare var 1
        return this[q.showIfVar1] === q.showIfVar1ExpectedValue;
      }
    },
    frameClass: function(frameIndex, addtionalClasses) {
      return [
        'frame',
        {
          previous: frameIndex < this.currentFrameNum,
          current: frameIndex == this.currentFrameNum,
          'next off-screen': frameIndex > this.currentFrameNum
        },
        addtionalClasses
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
    handleButtonClick: function(id, e) {
      this.$emit('button-click', id, e);
    },
    handleQuestionInput: function(
      frame_index,
      question_index,
      question,
      validationRule,
      $event
    ) {
      this.$emit(
        'question-input',
        frame_index,
        question_index,
        question,
        validationRule,
        $event
      );
    },
    handleHelpClick: function(title, questionHelp, e) {
      this.$emit('help-i-click', title, questionHelp, e);
    }
  }
});

/**
 * The main data for the admin fines calculator
 * \xa0 is the JavaScript escape for &nbsp;
 */
new Vue({
  el: '#gov-fec-calc-af div',
  template: `
    <div>
      <topnav
        :current-frame-num="currentFrameNum"
        :frames="frames"
        @handle-click="handleTopNavClick"
      ></topnav>
      <frames
        :frames="frames"
        :current-frame-num="currentFrameNum"
        :get-total-string="getTotalString"
        :late-or-non-filer="lateOrNonFiler"
        :sensitive-report="sensitiveReport"
        :total-receipts="totalReceipts"
        :total-disbursements="totalDisbursements"
        :total-receipts-and-disbursements-string="totalReceiptsAndDisbursementsString"
        :total-fine-string="totalFineString"
        @button-click="handleButtonClick"
        @question-input="handleQuestionInput"
        @help-i-click="toggleHelp"
      ></frames>
      <help
        :frames="frames"
        :help-class="helpClass"
        :help-pointer-y="helpPointerY"
        :help-content="helpContent"
        :help-title="helpTitle"
        @close-click="toggleHelp"
      ></help>
      <bottomnav
        :frames="frames"
        :current-frame-num="currentFrameNum"
        @handle-click="handleButtonClick"
      ></bottomnav>
    </div>
  `,
  data: {
    currentFrameNum: 0, //int
    penaltyAssessedDate: undefined, // string (a year or 'latest')
    sensitiveReport: undefined, // bool
    lateOrNonFiler: undefined, // string
    numberOfDaysLate: undefined, // int
    numberOfPrevViolations: undefined, // int
    totalReceipts: undefined, // number
    totalDisbursements: undefined, // number,
    totalFine: 0, // number
    helpTitle: '',
    helpContent: '',
    helpPointerY: 0,
    showHelp: false,
    frames: [
      {
        navLabel: '',
        title: '',
        class: 'intro',
        autoAdvance: false,
        content: [
          {
            type: 'p',
            class: '',
            content:
              'This calculator is for estimating an adminstrative fine for late or not filed reports. If you have not yet filed your report, submit it as soon as\xa0possible.'
          },
          {
            type: 'p',
            class: '',
            content:
              'Information on filing requirements and due dates of reports can be found at the <a href="https://www.fec.gov/help-candidates-and-committees/dates-and-deadlines/">Dates and deadlines</a> page. More information on administrative fines can be found at the <a href="https://www.fec.gov/legal-resources/enforcement/administrative-fines/">Administrative Fine Program</a>\xa0page.'
          },
          {
            type: 'button',
            class: 'button button--cta button--go',
            label: 'Start calculating',
            actionId: 'start'
          }
        ],
        viewed: true
      },
      {
        navLabel: '',
        title: 'When was the committee’s adminstrative fine\xa0assessed?',
        autoAdvance: true,
        questions: penaltyAssessedDates,
        viewed: false
      },
      {
        navLabel: '',
        title: 'What type of report was filed late, or not\xa0filed?',
        autoAdvance: true,
        validationRule: 'not-not_sure',
        questions: [
          { type: 'clear' },
          {
            label: 'Election sensitive report',
            type: 'radio',
            vModel: 'sensitiveReport',
            value: 'true',
            breadCrumbText: 'Election sensitive',
            helpTitle: 'What is an election sensitive report?',
            help: `<p><b>Pre-election report</b> for a primary, general or special election.<br><em>Examples: 2019 Pre-special general; 2020 Pre-primary report; 2020 Pre-general report</em></p>
            <p><b>October Quarterly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October quarterly</em></p>
            <p><b>October Monthly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October monthly</em></p>
            <p>All other reports are not election sensitive.</p>`
          },
          { type: 'clear' },
          {
            label: 'Not election sensitive report',
            type: 'radio',
            vModel: 'sensitiveReport',
            value: 'false',
            breadCrumbText: 'Not election sensitive',
            helpTitle: 'What is not an election sensitive report?',
            help: `<p><b>All reports other than:</b></p>
            <p><b>Pre-election report</b> for a primary, general or special election.<br><em>Examples: 2019 Pre-special general; 2020 Pre-primary report; 2020 Pre-general report</em></p>
            <p><b>October Quarterly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October quarterly</em></p>
            <p><b>October Monthly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October monthly</em></p>`
          },
          { type: 'clear' },
          {
            label: 'Not sure',
            type: 'radio',
            vModel: 'sensitiveReport',
            value: 'not_sure',
            breadCrumbText: 'Not sure'
          },
          {
            label: '',
            type: 'html',
            class: 'question-type-block indented',
            showIfVar1: 'sensitiveReport',
            showIfVar1ExpectedValue: 'not_sure',
            html: `
              <div class="contact-item contact-item--phone">
                  <div class="contact-item__content">
                      <div class="rich-text">
                          <p><strong>For general questions</strong><br><span class="nonbreaking">1-800-424-9530</span>, menu option 6, or <span class="nonbreaking">202-694-1100<span></p>
                      </div>
                  </div>
              </div>`
          },
          {
            label: '',
            type: 'html',
            class: 'question-type-block indented',
            showIfVar1: 'sensitiveReport',
            showIfVar1ExpectedValue: 'not_sure',
            html: `
              <div class="contact-item contact-item--phone">
                  <div class="contact-item__content">
                      <div class="rich-text">
                          <p><strong>For registered committees, speak to an analyst</strong><br><span class="nonbreaking">1-800-424-9530</span>, menu option 5, or <span class="nonbreaking">202-694-1130</span></p>
                      </div>
                  </div>
              </div>`
          }
        ],
        viewed: false
      },
      {
        navLabel: '',
        title: 'Is the committee a late filer or non-filer?',
        autoAdvance: true,
        validationRule: 'lateDaysNot',
        questions: [
          { type: 'clear' },
          {
            label: 'Late filer',
            type: 'radio',
            vModel: 'lateOrNonFiler',
            value: 'late',
            breadCrumbText: 'Late filer',
            helpTitle: 'Who is a late filer?',
            help: `<p>For election-sensitive reports, a committee is a late filer if it files the report after the due date, but more than four days before the date of the applicable election.</p>
            <p>A committee is a non-filer if it files after this point or does not file at all.</p>
            <p>For non-election sensitive reports, a committee will be considered a late filer if it files its report within 30 days after the due date.</p>
            <p>A committee is a non-filer if it files its report later than that or not at all.</p>`
          },
          {
            type: 'clear',
            showIfVar1: 'lateOrNonFiler',
            showIfVar1ExpectedValue: 'late'
          },
          {
            type: 'h4',
            class: 'indented t-sans search__example',
            showIfVar1: 'lateOrNonFiler',
            showIfVar1ExpectedValue: 'late',
            fieldH: 'How many calendar days late was the\xa0report?',
            helpTitle: 'Number of days late',
            help: `<p>The number of days past the filing deadline that the report was filed.</p>
            <p>If the report is more than thirty days late then it would be considered not filed rather than late.</p>
            <p>In the case of an election sensitive report not filed by four days before the applicable election is considered not filed rather than late. If either of these situations applies then change your selection above to Non-Filer.</p>`
          },
          {
            type: 'p',
            class: 'indented t-note t-sans search__example',
            showIfVar1: 'lateOrNonFiler',
            showIfVar1ExpectedValue: 'late',
            showIfVar2: 'sensitiveReport',
            showIfVar2ExpectedValue: 'true',
            fieldP:
              'Election sensitive reports are considered late if they are filed after their due dates but prior to four days before the applicable election.'
          },
          {
            type: 'p',
            class: 'indented t-note t-sans search__example',
            showIfVar1: 'lateOrNonFiler',
            showIfVar1ExpectedValue: 'late',
            showIfVar2: 'sensitiveReport',
            showIfVar2ExpectedValue: 'false',
            fieldP:
              'Non-election sensitive reports are considered late if they are filed within 30 days of their due dates.'
          },
          {
            type: 'clear',
            showIfVar1: 'lateOrNonFiler',
            showIfVar1ExpectedValue: 'late'
          },
          {
            label: 'days late',
            type: 'integer',
            min: 0,
            max: 365,
            vModel: 'numberOfDaysLate',
            class: 'indented t-sans search__example',
            showIfVar1: 'lateOrNonFiler',
            showIfVar1ExpectedValue: 'late',
            example: 'Example: 1-30',
            breadCrumbText: 'Late filer: ${} day(s)'
          },
          { type: 'clear' },
          {
            label: 'Non-filer',
            type: 'radio',
            vModel: 'lateOrNonFiler',
            value: 'non',
            breadCrumbText: 'Non-filer',
            helpTitle: 'Who is a non-filer?',
            help: `<p>For election sensitive reports, a committee is a non-filer if it files after this point or doesn't file at all.</p>
            <p>A committee is a late filer if it files the report after the due date, but more than four days before the date of the applicable election.</p>
            <p>For non-election sensitive reports, a committee is a non-filer if it files its report later than that or not at all.</p>
            <p>A committee will be considerered a late filer if it files its report within 30 days after the due date.</p>`
          }
        ],
        viewed: false
      },
      {
        navLabel: '',
        title: '',
        autoAdvance: false,
        validationRule: '0-99',
        questions: [
          {
            type: 'h4',
            class: '',
            fieldH: 'How many previous\xa0violations?',
            helpTitle: 'Number of previous violations',
            help: `<p>The number of previous adminstrative fines assessed at final determination during the current and most recently completed two-year election cycle.</p>
            <p>Enter "0" if none were assessed.</p>`
          },
          { type: 'clear' },
          {
            label: '',
            type: 'integer',
            min: 0,
            max: 99,
            vModel: 'numberOfPrevViolations',
            example: 'Example: 0-99',
            placeholder: '0',
            breadCrumbText: '${} prior violation(s)'
          }
        ],
        viewed: false
      },
      {
        navLabel: '',
        title:
          'How much in total receipts and disbursements in this\xa0report?',
        autoAdvance: false,
        questions: [
          {
            label: 'Total receipts',
            type: 'currency',
            min: 0,
            vModel: 'totalReceipts',
            class: 'label-headline',
            example: 'Example: 9000.99',
            size: 13,
            breadCrumbVar: 'totalReceiptsAndDisbursements',
            breadCrumbText: '${} total receipts and disbursements',
            helpTitle: 'Total receipts',
            help: `<p>A candidate committee enters the total receipts from</p>
            <ul><li>Line 16 on the Detailed Summary Page of Form 3,</li><li>Line 22 on the Detailed Summary Page of Form 3P</li></ul>
            <p>An unauthorized committee that allocates its expenses between its federal and nonfederal accounts calculates total receipts this way:</p>
            <ul><li>Line 19 on the Detailed Summary Page of Form 3X minus the total transfers from Line 18(a) on the Detailed Summary Page of Form 3X.</li></ul>
            <p>An unauthorized committee that does not allocate its expenses between its federal and nonfederal accounts enters the receipts from Line 19 of the Detailed Summary Page of Form 3X.</p>`
          },
          { type: 'clear' },
          {
            label: 'Total disbursements',
            type: 'currency',
            min: 0,
            vModel: 'totalDisbursements',
            class: 'label-headline',
            example: 'Example: 9000.99',
            size: 13,
            breadCrumbVar: 'totalReceiptsAndDisbursements',
            breadCrumbText: '${} total receipts and disbursements',
            helpTitle: 'Total disbursements',
            help: `<p>A candidate committee enters the total disbursements from Line 22 on the Detailed Summary Page of Form 3 or from Line 30 on the Detailed Summary Page of Form 3P.</p>
            <p>An unauthorized committee that allocates its expenses between its federal and nonfederal accounts calculates total disbursements this way: total disbursements from Line 31 on the Detailed Summary Page of Form 3X minus the total nonfederal share of allocated activity from Line 21(a)(ii) on the Detailed Summary Page of Form 3X. Enter the balance in the calculator.</p>
            <p>An unauthorized committee that does not allocate its expenses between its federal and nonfederal accounts enters the total disbursements from Line 31 on the Detailed Summary Page of Form 3X.</p>`
          }
        ],
        viewed: false
      },
      {
        navLabel: '',
        title: '',
        class: 'outro',
        autoAdvance: false,
        feedback: [
          {
            type: 'value',
            label: 'Total Receipts and Disbursements',
            class: 'summary',
            vModel: 'totalReceiptsAndDisbursementsString',
            content: ``
          },
          {
            type: 'value',
            label: 'Total Estimated Fine',
            class: 'summary total-fine',
            vModel: 'totalFineString',
            content: ``
          },
          {
            type: 'p',
            content:
              'This is an estimated administrative fine based on the information you provided and may not refelect the actual fine amount assessed by the Commission. Your committee will be notified if the Commission assesses a fine for a late or non-filed\xa0report.'
          }
        ],
        viewed: false
      }
    ]
  },
  mounted: function() {
    // this.id = this.$el.getAttribute('data-id');
    // Add the transition listeners so frames disappear while out of sight
    this.startWatchingTransitions();
    // Listen for the modal to tell us that we've been closed and should reset
    document.addEventListener('MODAL_CLOSED', this.restart);
  },
  computed: {
    helpClass: function() {
      return this.showHelp == false ? 'hidden' : 'show';
    },
    totalReceiptsAndDisbursements: function() {
      let toReturn = 0;
      if (this.totalReceipts) toReturn += Number(this.totalReceipts);
      if (this.totalDisbursements) toReturn += Number(this.totalDisbursements);
      return toReturn;
    },
    totalReceiptsAndDisbursementsString: function() {
      let toReturn = this.convertToCurrency(this.totalReceiptsAndDisbursements);
      return toReturn;
    },
    totalFineString: function() {
      let toReturn = this.totalFine;

      // If the totalFine isn't a number (like 'ERROR'), just change it to a question mark
      if (isNaN(this.totalFine)) toReturn = '?';
      else toReturn = this.convertToCurrency(toReturn);

      return toReturn;
    }
  },
  methods: {
    convertToCurrency: function(val) {
      let theVal = Number(val) ? Number(val) : 0;
      return '$' + theVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    getTotalString: function(varName) {
      let theVar = this[varName];
      return theVar ? this.convertToCurrency(this[varName]) : '';
    },
    handleButtonClick: function(buttonType, e) {
      e.preventDefault();
      if (buttonType == 'start') this.handleTopNavClick(1);
      else if (buttonType == 'next')
        this.handleTopNavClick(this.currentFrameNum + 1);
      else if (buttonType == 'back') this.currentFrameNum--;
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
    handleQuestionInput: function(frameNum, qNum, q, validationRule, e) {
      let affectedVmodel = q.vModel;
      let newValue = q.value ? q.value : e.target.value;
      let frameShouldAutoAdvance = qNum.autoAdvance;
      let passedTests = false;
      //
      // Set the value
      this[affectedVmodel] = newValue;

      // If this question has a special validationRule, let's check it
      if (!validationRule) passedTests = true;
      else if (validationRule == 'not-not_sure') {
        // Don't advance if user isn't sure about whether it's a sensitive report
        if (this.sensitiveReport == 'true' || this.sensitiveReport == 'false')
          passedTests = true;
      } else if (validationRule == 'lateDaysNot') {
        // If a late filer, require a number of days
        if (this.lateOrNonFiler == 'late' && this.numberOfDaysLate > 0) {
          passedTests = true;
        } else if (this.lateOrNonFiler == 'non') {
          passedTests = true;
          // otherwise non-filer is fine but let's also reset the days late
          // and reset the text displayed in the field
          this.numberOfDaysLate = undefined;
          document.querySelector('#elem_numberOfDaysLate').value = '';
        }
      } else if (validationRule == '0-99') {
        // Keep previous violations between 0 and 99
        if (isNaN(this.numberOfPrevViolations)) {
          // If it's not a number for some reason, just leave passedTests as false
        } else {
          if (this.numberOfPrevViolations < 0) this.numberOfPrevViolations = 0;
          if (this.numberOfPrevViolations > 99)
            this.numberOfPrevViolations = 99;
          // Put a corrected value into the field
          document.querySelector(
            '#elem_numberOfPrevViolations'
          ).value = this.numberOfPrevViolations;
          // and move on
          passedTests = true;
        }
      }

      // If a test failed, don't let the frame advance.
      // The "=== false" bit is redundancy for when a user changes an answer,
      //   say from correct to incorrect (e.g., 'non' to 'not_sure').
      // If the tests passed, cool, do the other things.
      if (passedTests === false) {
        this.frames[this.currentFrameNum].viewed = false;
        this.setBreadCrumbText(frameNum, qNum, '');
      } else if (passedTests === true) {
        // If the value is undefined, this is the first time it's being set so let's advance
        let autoStep = this[affectedVmodel] == undefined ? true : false;
        // …unless we specifially shouldn't autoadvance
        autoStep = frameShouldAutoAdvance;
        //
        this.setBreadCrumbText(frameNum, qNum, q);
        // Set the frame as viewed
        this.frames[this.currentFrameNum].viewed = true;
        //
        if (autoStep) this.handleTopNavClick(this.currentFrameNum + 1);
        //
        this.updateTotalFine();
      }
    },
    restart: function() {
      // reset vars
      this.currentFrameNum = 0;
      this.penaltyAssessedDate = undefined;
      this.sensitiveReport = undefined;
      this.lateOrNonFiler = undefined;
      this.numberOfDaysLate = undefined;
      this.numberOfPrevViolations = undefined;
      this.totalReceipts = undefined;
      this.totalDisbursements = undefined;
      this.totalFine = 0;
      this.showHelp = false;
      // Set all the frames to not viewed (for breadcrumbs and Next button)
      for (let i = 0; i < this.frames.length; i++) {
        this.frames[i].viewed = false;
      }
      // TODO - clear autoAdvance?
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
        this.frames[frameNum].navLabel = '';
        return;
      }

      let theBreadCrumbText = String(q.breadCrumbText);
      if (
        (q.type == 'integer' || q.type == 'currency') &&
        theBreadCrumbText.indexOf('${}') >= 0 &&
        typeof Number(this[q.vModel]) === 'number'
      ) {
        // Grab the value
        let theVal = Number(this[q.vModel]);
        // If there's a breadCrumbVar, use that
        if (q.breadCrumbVar) theVal = Number(this[q.breadCrumbVar]);

        // Format the value for US dollars
        if (q.type == 'currency') {
          theVal = this.convertToCurrency(theVal);
        }
        // Put the currency in the text, replacing the '${}'
        theBreadCrumbText = theBreadCrumbText.replace('${}', theVal);
        // Handle singular and plural
        // If we're dealing with a singular value, remove the '(s)' from the string
        // Otherwise, if we're dealing with a non-singular value, change the '(s)' to 's'
        if (theBreadCrumbText.indexOf('(s)') > 0) {
          theBreadCrumbText = theBreadCrumbText.replace(
            '(s)',
            theVal == 1 ? '' : 's'
          );
        }
      }
      if (frameNum > 0 && q && q.breadCrumbText)
        this.frames[frameNum].navLabel = theBreadCrumbText;
    },
    startWatchingTransitions: function() {
      const frames = document.querySelectorAll('.frame');

      // Add off-screen to all non-intro frames
      for (let i = 0; i < frames.length; i++) {
        //
        if (!frames[i].classList.contains('intro')) {
          frames[i].classList.add('off-screen');
        }

        frames[i].addEventListener('transitionstart', function(e) {
          if (e.target.classList.contains('frame')) {
            e.target.classList.remove('off-screen');
          }
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
    },
    updateTotalFine: function() {
      if (
        (this.lateOrNonFiler == 'non' ||
          (this.lateOrNonFiler == 'late' && this.numberOfDaysLate >= 0)) &&
        this.numberOfPrevViolations &&
        this.penaltyAssessedDate &&
        this.sensitiveReport != undefined &&
        this.totalReceiptsAndDisbursements
      ) {
        this.totalFine = getTotalAdminFine({
          lateOrNonFiler: this.lateOrNonFiler,
          numberOfDaysLate: this.numberOfDaysLate,
          numberOfPrevViolations: this.numberOfPrevViolations,
          penaltyAssessedDate: this.penaltyAssessedDate,
          sensitiveReport: this.sensitiveReport,
          totalReceiptsAndDisbursements: this.totalReceiptsAndDisbursements
        });
      } else this.totalFine = 0.01;
    }
  }
});
