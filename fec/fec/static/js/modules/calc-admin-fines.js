/* global Vue */

/**
 */
import { availableDates, getTotalAdminFine } from './calc-admin-fine-logic';

// For each of the availableDates from the logic file,
// take the availableDates[i] object and add the parameters we need for our Vue layout
const penaltyAssessedDates = availableDates.map(el =>
  Object.assign({}, el, {
    type: 'radio',
    vModel: 'penaltyAssessedDate',
    breadCrumbText: el.summary
  })
);

getTotalAdminFine({ test: true, nope: false });

Vue.config.devtools = true; // TODO: remove this

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
      v-if="this.currentFrameNum > 0"
      min="0"></meter>
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
          'hide-before': navIndex < 2 || navIndex >= this.frames.length - 1
        }
      ];
    }
  }
});

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
          (currentFrameNeedsAnswer && buttonID == 'XXXnext'),
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
    <div class="help_content" v-html="helpContent"></div>
  </div>`
});

// Vue.component('debuglog', {
//   props: [
//     'currentFrameNum',
//     'penaltyAssessedDate',
//     'sensitiveReport',
//     'lateOrNonFiler',
//     'numberOfDaysLate',
//     'numberOfPrevViolations',
//     'totalReceipts',
//     'totalDisbursements',
//     'totalReceiptsAndDisbursements',
//     'totalReceiptsAndDisbursementsString',
//     'totalFine',
//     'totalFineString'
//   ],
//   template: `
//   <div class="debug-feedback">
//     Debugging:
//     <ul>
//       <li>currentFrameNum: {{ currentFrameNum }}</li>
//       <li>penaltyAssessedDate: {{ penaltyAssessedDate }}</li>
//       <li>sensitiveReport: {{ sensitiveReport }}</li>
//       <li>lateOrNonFiler: {{ lateOrNonFiler }}</li>
//       <li>numberOfDaysLate: {{ numberOfDaysLate }}</li>
//       <li>numberOfPrevViolations: {{ numberOfPrevViolations }}</li>
//       <li>totalReceipts: {{ totalReceipts }}</li>
//       <li>totalDisbursements: {{ totalDisbursements }}</li>
//       <li>totalReceiptsAndDisbursements: {{ totalReceiptsAndDisbursements }}</li>
//       <li>totalReceiptsAndDisbursementsString: {{ totalReceiptsAndDisbursementsString }}</li>
//       <li>totalFine: {{ totalFine }}</li>
//       <li>totalFineString: {{ totalFineString }}</li>
//       <li>this.$props.totalReceiptsAndDisbursementsString: {{ this.$props['totalReceiptsAndDisbursementsString'] }}</li>
//       <li>this.$props.totalFineString: {{ this.$props['totalFineString'] }}</li>
//     </ul>
//   </div>`
// });

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
          v-bind:class="[
            'frame',
            {
              previous: frame_index < currentFrameNum,
              current: frame_index == currentFrameNum,
              next: frame_index > currentFrameNum
            }, frame.class
          ]"
          >
          <h4 v-if="frame.title">{{ frame.title }}</h4>
          <template
            v-if="frame.questions"
            v-for="(question, question_index) in frame.questions"
              >
              <span class="clear"></span>
              <button
                v-if="question.help && question.type"
                v-show="evalFieldShowRule(question)"
                v-on:click="handleHelpClick(question.helpTitle, question.help, $event)"
                class="tooltip__trigger"
                type="button"
                tabindex="0">
                <span class="u-visually-hidden">Learn more</span>
              </button>
              <h4
                v-if="question.fieldH"
                v-show="evalFieldShowRule(question)"
                v-bind:class="question.class"
                ><strong>{{ question.fieldH }}</strong>
              </h4>
              <p
                v-if="question.fieldP"
                v-show="evalFieldShowRule(question)"
                v-bind:class="question.class"
                >{{ question.fieldP }}</p>
              <!-- radio form elements -->
              <input
                v-if="question.type == 'radio'"
                v-show="evalFieldShowRule(question)"
                v-on:input="handleQuestionInput(frame_index, question_index, question, $event)"
                v-bind:id="'elem_' + question.vModel + '_' + question.value"
                v-bind:name="'elem_' + question.vModel"
                v-bind:class="question.class"
                type="radio"
                ></input>
              <label
                v-if="question.type == 'radio'"
                v-show="evalFieldShowRule(question)"
                v-bind:for="'elem_' + question.vModel + '_' + question.value"
                v-bind:class="question.class"
                >{{ question.label }}</label>
              <!-- number form elements -->
              <!-- first label only appears if the label is a headline -->
              <label
                v-if="(question.type == 'integer' || question.type == 'currency') && question.class == 'label-headline'"
                v-show="evalFieldShowRule(question)"
                v-bind:for="'elem_' + question.vModel"
                v-bind:class="question.class"
                >{{ question.label }}</label>
              <input
                v-if="question.type == 'integer' || question.type == 'currency'"
                v-show="evalFieldShowRule(question)"
                v-on:input="handleQuestionInput(frame_index, question_index, question, $event)"
                v-bind:id="'elem_' + question.vModel"
                v-bind:max="question.max"
                v-bind:min="question.min"
                v-bind:name="'elem_' + question.vModel"
                v-bind:class="question.class"
                type="number"
                ></input>
              <label
                v-if="(question.type == 'integer' || question.type == 'currency') && question.class != 'label-headline'"
                v-show="evalFieldShowRule(question)"
                v-bind:for="'elem_' + question.vModel"
                v-bind:class="question.class"
                >{{ question.label }}</label>
              <span
                v-if="question.example"
                class="t-note t-sans search__example">{{ question.example }}</span>
              <!-- html elements -->
              <div
                v-if="question.type == 'html'"
                v-show="evalFieldShowRule(question)"
                v-html="question.html"
                v-bind:class="question.class"
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
      // If there's no rule, default to showing the field
      if (!q || !q.showIfVar || !q.showIfVarExpectedValue) return true;
      else {
        // expect the showIfVar to be on this level / root
        return this[q.showIfVar] == q.showIfVarExpectedValue;
      }
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
              'This calculator is for estimating an adminstrative fine for late or not filed reports. If you have not yet filed your report submit it as soon as possible.'
          },
          {
            type: 'p',
            class: '',
            content:
              'Information on filing requirements and due dates of reports can be found at the Reporting Dates page. More information on administrative fines can be found at the Administrative Fine Program page.'
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
        title: 'When was the committee’s adminstrative fine assessed?',
        autoAdvance: true,
        questions: penaltyAssessedDates,
        viewed: false
      },
      {
        navLabel: '',
        title: 'What type of report was filed late, or not filed?',
        autoAdvance: true,
        questions: [
          {
            label: 'Election-Sensitive Report',
            type: 'radio',
            vModel: 'sensitiveReport',
            value: 'true',
            breadCrumbText: 'Election-sensitive',
            helpTitle: 'What is an election sensitive report?',
            help: `<p><b>Pre-election report</b> for a primary, general or special election.<br><em>Examples: 2019 Pre-special general; 2020 Pre-primary report; 2020 Pre-general report</em></p>
            <p><b>October Quarterly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October quarterly</em></p>
            <p><b>October Monthly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October monthly</em></p>
            <p>All other reports are not election sensitive.</p>`
          },
          {
            label: 'Not Election-Sensitive Report',
            type: 'radio',
            vModel: 'sensitiveReport',
            value: 'false',
            breadCrumbText: 'Not election-sensitive',
            helpTitle: 'What is no an election sensitive report?',
            help: `<p><b>All reports other than:</b></p>
            <p><b>Pre-election report</b> for a primary, general or special election.<br><em>Examples: 2019 Pre-special general; 2020 Pre-primary report; 2020 Pre-general report</em></p>
            <p><b>October Quarterly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October quarterly</em></p>
            <p><b>October Monthly</b> report due in a year in which there is a regularly scheduled general election and is filed by an unauthorized committee or the committee for a candidate who is participating in the general election.<br><em>Example: 2020 October monthly</em></p>`
          },
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
            showIfVar: 'sensitiveReport',
            class: 'question-type-block indented',
            showIfVarExpectedValue: 'not_sure',
            html: `
              <div class="contact-item contact-item--phone">
                  <div class="contact-item__content">
                      <div class="rich-text">
                          <p><strong>For general questions</strong><br>1-800-424-9530, menu option 6, or 202-694-1100</p>
                          <p><strong>For registered committees, speak to an analyst</strong><br>1-800-424-9530, menu option 5, or 202-694-1130</p>
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
        questions: [
          {
            label: 'Late-Filer',
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
            label: 'days late',
            type: 'integer',
            min: 0,
            vModel: 'numberOfDaysLate',
            class: 'indented t-note t-sans search__example',
            showIfVar: 'lateOrNonFiler',
            showIfVarExpectedValue: 'late',
            breadCrumbText: 'Late filer: ${} day(s)',
            fieldH: 'How many calendar days late was the report?',
            fieldP:
              'Election sensitive reports are considered late if they are filed after their due dates but prior to four days before the applicable election.',
            helpTitle: 'Number of days late',
            help: `<p>The number of days past the filing deadline that the report was filed.</p>
            <p>If the report is more than thirty days late then it would be considered not filed rather than late.</p>
            <p>In the case of an election sensitive report not filed by four days before the applicable election is considered not filed rather than late. If either of these situations applies then change your selection above to Non-Filer.</p>`
          },
          {
            label: 'Non-Filer',
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
        title: 'How many previous violations?',
        autoAdvance: false,
        questions: [
          {
            label: '',
            type: 'integer',
            min: 0,
            vModel: 'numberOfPrevViolations',
            example: 'Example: 0-99',
            breadCrumbText: '${} prior violation(s)',
            helpTitle: 'Number of previous violations',
            help: `<p>The number of previous adminstrative fines assessed at final determination during the current and most recently completed two-year election cycle.</p>
            <p>Enter "0" if none were assessed.</p>`
          }
        ],
        viewed: false
      },
      {
        navLabel: '',
        title: 'How much in total receipts and disbursements in this report?',
        autoAdvance: false,
        questions: [
          {
            label: 'Total receipts',
            type: 'currency',
            min: 0,
            vModel: 'totalReceipts',
            class: 'label-headline',
            // fieldH: 'TOTAL RECEIPTS',
            example: 'Example: 9000.99',
            breadCrumbVar: 'totalReceiptsAndDisbursements',
            breadCrumbText: '${} total receipts and disbursements',
            helpTitle: 'Total receipts',
            help: `<p>A candidate committee enters the total receipts from</p>
            <ul><li>Line 16 on the Detailed Summary Page of Form 3,</li><li>Line 22 on the Detailed Summary Page of Form 3P</li></ul>
            <p>An unauthorized committee that allocates its expenses between its federal and nonfederal accounts calculates total receipts this way:</p>
            <ul><li>Line 19 on the Detailed Summary Page of Form 3X minus the total transfers from Line 18(a) on the Detailed Summary Page of Form 3X.</li></ul>
            <p>An unauthorized committee that does not allocate its expenses between its federal and nonfederal accounts enters the receipts from Line 19 of the Detailed Summary Page of Form 3X.</p>`
          },
          {
            label: 'Total disbursements',
            type: 'currency',
            min: 0,
            vModel: 'totalDisbursements',
            class: 'label-headline',
            // fieldH: 'TOTAL DISBURSEMENTS',
            example: 'Example: 9000.99',
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
              'This is an estimated administrative fine based on the information you provided and may not refelect the actual fine amount assessed by the Commission. Your committee will be notified if the Commission assesses a fine for a late or non-filed report.'
          }
        ],
        viewed: false
      }
    ]
  },
  mounted: function() {
    // this.id = this.$el.getAttribute('data-id');
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
      let toReturn = this.convertToCurrency(this.totalFine);
      return toReturn;
    }
  },
  methods: {
    convertToCurrency: function(val) {
      let theVal = Number(val);
      if (!theVal) theVal = 0;
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
      // TODO: else if (buttonType == 'restart')
      // TODO: handle close click
      this.toggleHelp(); // toggling help with no content will hide it
    },
    handleTopNavClick: function(navIndex) {
      // this.frames[navIndex].viewed = true;
      this.currentFrameNum = navIndex;
    },
    handleQuestionInput: function(frameNum, qNum, q, e) {
      let affectedVmodel = q.vModel;
      let newValue = q.value ? q.value : e.target.value;
      let frameShouldAutoAdvance = qNum.autoAdvance;
      // If the value is undefined, this is the first time it's being set so let's advance
      let autoStep = this[affectedVmodel] == undefined ? true : false;
      // …unless we specifially shoudn't autoadvance
      autoStep = frameShouldAutoAdvance;
      // Set the value
      this[affectedVmodel] = newValue;
      //
      this.setBreadCrumbText(frameNum, qNum, q);
      // Set the frame as viewed
      this.frames[this.currentFrameNum].viewed = true;
      //
      if (autoStep) this.handleTopNavClick(this.currentFrameNum + 1);
      //
      this.updateTotalFine();
    },
    setBreadCrumbText: function(frameNum, qNum, q) {
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
      // console.log('updateTotalFine()');
      // console.log('lateOrNonFiler: ', this.lateOrNonFiler);
      // console.log('numberOfDaysLate: ', this.numberOfDaysLate);
      // console.log('numberOfPrevViolations: ', this.numberOfPrevViolations);
      // console.log('penaltyAssessedDate: ', this.penaltyAssessedDate);
      // console.log('sensitiveReport: ', this.sensitiveReport);
      // console.log('totalDisbursements: ', this.totalDisbursements);
      // console.log('totalReceipts: ', this.totalReceipts);

      if (
        (this.lateOrNonFiler == 'non' ||
          (this.lateOrNonFiler == 'late' && this.numberOfDaysLate)) &&
        this.numberOfDaysLate &&
        this.numberOfPrevViolations &&
        this.penaltyAssessedDate &&
        this.sensitiveReport
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
    },
    tempDebugLogTemplate: function() {
      //just saving this here
      //  <debuglog
      //    :current-frame-num="currentFrameNum"
      //    :penalty-assessed-date="penaltyAssessedDate"
      //    :sensitive-report="sensitiveReport"
      //    :late-or-non-filer="lateOrNonFiler"
      //    :number-of-days-late="numberOfDaysLate"
      //    :number-of-prev-violations="numberOfPrevViolations"
      //    :total-receipts="totalReceipts"
      //    :total-disbursements="totalDisbursements"
      //    :total-receipts-and-disbursements="totalReceiptsAndDisbursements"
      //    :total-receipts-and-disbursements-string="totalReceiptsAndDisbursementsString"
      //    :total-fine="totalFine"
      //    :total-fine-string="totalFineString"
      //  ></debuglog>
    }
  }
});
