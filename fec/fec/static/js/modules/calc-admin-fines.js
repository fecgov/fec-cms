/* global Vue */
/*
DURING TESTING AND EXPERIMENTAL DEVELOPMENT, MOVE THIS "TEMP-" FILES INTO fec/dist/fec/static
*/
Vue.config.devtools = true;

Vue.component('topnav', {
  props: {
    frames: {
      type: Array,
      required: true
    }
  },
  // data() {
  //   return '';
  // },
  template: `
  <nav class="topnav">
    <ul class="breadcrumbs">
      <li
        v-for="(frame, index) in frames"
        v-bind:class="['breadcrumbs__item', topNavClass(index)]"
        v-bind:key="index"
        >
        <a
          class="breadcrumbs__link"
          v-on:click="handleTopNavClick(index)"
          >{{frame.navLabel}}</a>
      </li>
    </ul>
  </nav>`,
  methods: {
    topNavClass: function(navIndex) {
      return [
        {
          viewed: this.frames[navIndex].viewed || navIndex == 0,
          current: navIndex == this.currentFrameNum,
          hidden: navIndex == 0,
          'hide-before': navIndex < 2
        }
      ];
    }
  }
});

Vue.component('bottomnav', {
  props: {
    handleButtonClick: {
      type: Function,
      required: true
    },
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
    <button v-bind:class="bottomNavClass('prev')" v-on:click="handleButtonClick('back', $event)">Back</button>
    <button v-bind:class="bottomNavClass('next')" v-on:click="handleButtonClick('next', $event)">Next</button>
    <button v-bind:class="bottomNavClass('close')" v-on:click="handleButtonClick('close', $event)">Close</button>
    <button v-bind:class="bottomNavClass('restart')" v-on:click="handleButtonClick('restart', $event)">Start over</button>
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
    }
  }
});

Vue.component('help', {
  props: {
    frames: {
      type: Array,
      required: true
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
      type: String,
      required: false
    },
    showHelp: {
      type: Boolean,
      required: true
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
      <path d="M 0 -40 l -20 20 l 20 20" stroke="navy" fill="white"></path>
    </svg>
    <h3>{{ helpTitle }}</h3>
    <div v-html="helpContent"></div>
  </div>`,
  methods: {
    helpClass: function() {
      return this.showHelp == false ? 'hidden' : 'show';
    }
  }
});

Vue.component('frames', {
  props: {
    frames: {
      type: Array,
      required: true
    },
    currentFrameNum: {
      type: Number,
      required: true
    },
    handleButtonClick: {
      type: Function,
      required: true
    },
    handleQuestionInput: {
      type: Function,
      required: true
    },
    showHelp: {
      type: Boolean,
      required: true
    },
    handleHelpClick: {
      type: Function,
      required: true
    }
  },
  template: `
    <form class="frames">
      <template v-for="(frame, frame_index) in frames">
        <div
          xxx-key="frame_index"
          v-bind:class="[
            'frame',
            {
              previous: frame_index < currentFrameNum,
              current: frame_index == currentFrameNum,
              next: frame_index > currentFrameNum
            }
          ]"
          >
          <h4>{{ frame.title }}</h4>
          <template
            v-if="frame.questions"
            v-for="(question, question_index) in frame.questions"
              >
              <span class="clear"></span>
              <button
                v-if="question.help && question.type"
                v-show="evalFieldShowRule(question)"
                v-on:click="handleHelpClick('', question.help, $event)"
                class="tooltip__trigger"
                type="button"
                tabindex="0">
                <span class="u-visually-hidden">Learn more</span>
              </button>
              <p
                v-if="question.fieldH"
                v-show="evalFieldShowRule(question)"
                v-bind:class="question.class"
                ><strong>{{ question.fieldH }}</strong>
              </h6>
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
                v-if="question.type == 'integer' || question.type == 'currency'"
                v-show="evalFieldShowRule(question)"
                v-bind:for="'elem_' + question.vModel"
                v-bind:class="question.class"
                >{{ question.label }}</label>
              <span
                v-if="question.example"
                class="t-note t-sans search__example">{{question.example}}</span>
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
                v-bind:class="item.class">
                {{item.content}}
              </p>
              <button 
                v-if="item.type == 'button'"
                v-bind:class="item.class"
                v-on:click="handleButtonClick(item.actionId, $event)"
                >
                {{item.label}}
              </button>
            </div>
          </template>
          <template
            v-if="frame.feedback"
            >
            <div
              v-for="(item, index) in frame.feedback"
              >
              <div
                v-if="item.type == 'value'"
              >
                <h4 v-if="item.label">{{ item.label }}</h4>
                <p v-if="item.vModel">{{ getTotal(item.vModel) }}</p>
              </div>
              <p v-if="item.type == 'p'">{{ item.content }}</p>
            </div>
          </template>
        </div>
        <help :frames="frames" :show-help="showHelp"></help>
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
    getTotal: function(valName) {
      return this[valName];
    }
  }
});

var app = new Vue({
  el: '#gov-fec-calc-af',
  template: `
    <div>
      <topnav
        :frames="frames"
      ></topnav>
      <frames
        :frames="frames"
        :current-frame-num="currentFrameNum"
        :show-help="showHelp"
        :handle-button-click="handleButtonClick"
        :handle-question-input="handleQuestionInput"
        :handle-help-click="toggleHelp"
      ></frames>
      <bottomnav
        :frames="frames"
        :current-frame-num="currentFrameNum"
        :handle-button-click="handleButtonClick"
      ></bottomnav>
    </div>
  `,
  data: {
    currentFrameNum: 0, //int
    penaltyAssessedDate: undefined, // int
    sensitiveReport: undefined, // bool
    lateOrNonFiler: undefined, // string
    numberOfDaysLate: undefined, // int
    numberOfPrevViolations: undefined, // int
    totalReceipts: undefined, // int
    totalDisbursements: undefined, // int,
    helpTitle: '',
    helpContent: '',
    helpPointerY: 0,
    showHelp: false,
    frames: [
      {
        navLabel: '',
        title: '',
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
        questions: [
          {
            label: 'I haven’t been assessed a fine',
            type: 'radio',
            vModel: 'penaltyAssessedDate',
            value: 'latest',
            breadCrumbText: 'No fine yet—using latest value'
          },
          {
            label: 'on or after January 1, 2019',
            type: 'radio',
            vModel: 'penaltyAssessedDate',
            value: '2019',
            breadCrumbText: 'Assessed on or after January 1, 2019'
          },
          {
            label: 'December 28, 2017 through December 31, 2018',
            type: 'radio',
            vModel: 'penaltyAssessedDate',
            value: '2018',
            breadCrumbText: 'Assessed between Dec 28 2017 and Dec 31 2018'
          },
          {
            label: 'February 3, 2017 through December 17, 2017',
            type: 'radio',
            vModel: 'penaltyAssessedDate',
            value: '2017',
            breadCrumbText: 'Assessed between Feb 3 2017 and Dec 17 2018'
          }
        ],
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
            help: 'This is the help text for election-sensitive reports'
          },
          {
            label: 'Not Election-Sensitive Report',
            type: 'radio',
            vModel: 'sensitiveReport',
            value: 'false',
            breadCrumbText: 'Not election-sensitive',
            help: 'This is the help text for non-election-sensitive reports'
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
            help: 'This is the help text for late-filer'
          },
          {
            label: 'Number of Days Late',
            type: 'integer',
            min: 0,
            vModel: 'numberOfDaysLate',
            class: 'indented',
            showIfVar: 'lateOrNonFiler',
            showIfVarExpectedValue: 'late',
            breadCrumbText: 'Late filer: ${} day(s)',
            fieldH: 'How many calendar days late was the report?',
            fieldP:
              'Election sensitive reports are considered late if they are filed after their due dates but prior to four days before the applicable election.',
            help: 'This is the help text for number of days late'
          },
          {
            label: 'Non-Filer',
            type: 'radio',
            vModel: 'lateOrNonFiler',
            value: 'non',
            breadCrumbText: 'Non-filer',
            help: 'This is the help text for non-filer'
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
            label: 'Number of Previous Violations',
            type: 'integer',
            min: 0,
            vModel: 'numberOfPrevViolations',
            example: 'Example: 0-99',
            breadCrumbText: '${} prior violation(s))',
            help: 'This is the help text for previous violations'
          }
        ],
        viewed: false
      },
      {
        navLabel: '',
        title:
          'How many much in total receipts and total disbursements in this report?',
        autoAdvance: false,
        questions: [
          {
            label: 'TOTAL RECEIPTS',
            type: 'currency',
            min: 0,
            vModel: 'totalReceipts',
            fieldH: 'TOTAL RECEIPTS',
            example: 'Example: 9000.99',
            breadCrumbText: '${} total receipts',
            help: 'This is the help text for total receipts'
          },
          {
            label: 'TOTAL DISBURSEMENTS',
            type: 'currency',
            min: 0,
            vModel: 'totalDisbursements',
            fieldH: 'TOTAL DISBURSEMENTS',
            example: 'Example: 9000.99',
            breadCrumbText: '${} total disbursements',
            help: 'This is the help for total disbursements'
          }
        ],
        viewed: false
      },
      {
        navLabel: '',
        title: 'Finish',
        autoAdvance: false,
        feedback: [
          {
            type: 'value',
            label: 'Total Receipts and Disbursements',
            vModel: 'totalReceiptsAndDisbursements'
          },
          {
            type: 'value',
            label: 'Total Estimated Fine',
            vModel: 'totalFine'
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
  computed: {
    totalReceiptsAndDisbursements: function() {
      return this.penaltyAssessedDate; // totalReceipts + totalDisbursements
    },
    totalFine: function() {
      return this.sensitiveReport; // undefined
    }
  },
  methods: {
    handleButtonClick: function(buttonType, e) {
      e.preventDefault();
      console.log('handleButtonClick() buttonType, e: ', buttonType, e);
      if (buttonType == 'start') this.handleTopNavClick(1);
      else if (buttonType == 'next')
        this.handleTopNavClick(this.currentFrameNum + 1);
      else if (buttonType == 'back') this.currentFrameNum--;
    },
    handleTopNavClick: function(navIndex) {
      // this.frames[navIndex].viewed = true;
      this.currentFrameNum = navIndex;
    },
    handleQuestionInput: function(frameNum, qNum, q, e) {
      console.log('handleQuestionInput(): ', qNum, q, e);
      console.log('     ', qNum, q, e);
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
    },
    showHelp_temp: function(e) {
      e.preventDefault();
      let theDataObj = e.target.attributes;
      console.log('showHelp_temp(): ', e);
      console.log('     theTarget: ', e.target);
      console.log('     theDataObj: ', theDataObj);
    },
    setBreadCrumbText: function(frameNum, qNum, q) {
      console.log('setBreadCrumbText() TEMP: ', frameNum, qNum, q);
      // console.log('     i: ', i);
      // console.log('     q: ', q);
      // console.log('     this.frames: ', this.frames);
      // console.log('     this.frames[frameNum]: ', this.frames[frameNum]);

      let theBreadCrumbText = String(q.breadCrumbText);

      // console.log('     q.type: ', q.type);
      // console.log(
      //   '     theBreadCrumbText.indexOf(${}): ',
      //   theBreadCrumbText.indexOf('${}')
      // );
      // console.log('     q.vModel: ', q.vModel);
      // console.log('     this[q.vModel]: ', this[q.vModel]);
      // console.log('     typeof: ', typeof this[q.vModel]);

      if (
        (q.type == 'integer' || q.type == 'currency') &&
        theBreadCrumbText.indexOf('${}') >= 0 &&
        typeof Number(this[q.vModel]) === 'number'
      ) {
        // Grab the value
        let theVal = Number(this[q.vModel]);
        // Format the value for US dollars
        if (q.type == 'currency') {
          theVal = '$' + theVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }
        // Put the currency in the text, replacing the '${}'
        theBreadCrumbText = theBreadCrumbText.replace('${}', theVal);
        // Handle singular and plural
        // If we're dealing with a singular value, remove the '(s)' from the string
        // Otherwise, if we're dealing with a non-singular value, change the '(s)' to 's'
        if (theVal == 1 && theBreadCrumbText.indexOf('(s)') > 0)
          theBreadCrumbText = theBreadCrumbText.replace('(s)', '');
        else if (theVal > 1 && theBreadCrumbText.indexOf('(s)') == 0)
          theBreadCrumbText = theBreadCrumbText.replace('(s)', 's');
      }
      if (frameNum > 0 && q && q.breadCrumbText)
        this.frames[frameNum].navLabel = theBreadCrumbText;
    },
    toggleHelp: function(title, html, e) {
      e.preventDefault();
      console.log('toggleHelp()', title, html, e);
      // this.helpPointerY = e.target.;
      this.helpContent = html;
      // if (helpClass)
    }
  }
});
