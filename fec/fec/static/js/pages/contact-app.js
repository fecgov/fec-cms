/**
 *
 * Note: k${'e'}y is because the Git commit security tools don't like when we use words like k-e-y,
 * even if we're using it to sort things and (because we're in a Vue template string),
 * we can't exempt the whole line
 */

import Vue from 'vue/dist/vue.esm.js';

Vue.config.devtools = true;

/**
 * The <Recaptcha> Vue component
 */
Vue.component('Recaptcha', {
  props: {
    TESTSHOULDFAIL: {
      type: Boolean,
      required: true
    },
    recaptchaShow: {
      type: Boolean,
      required: true
    },
    recaptchaApproved: {
      type: Boolean,
      required: true
    }
  },
  emits: ['testing-change'],
  mounted: function() {
    window.addEventListener('load', this.handleWindowLoad);
    this.$emit('recaptcha-event', 'windowloaded');
    this.$emit('recaptcha-event', 'mounted');
  },
  data: function() {
    return {
      theRecaptcha: null
    };
  },
  methods: {
    handleTestingChange(e) {
      this.$emit('testing-change', e.target.value == 'true');
    }
    // handleWindowLoad: function(e) {
    //   console.log('  grecaptcha: ', grecaptcha);
    //   this.theRecaptcha = grecaptcha.render('gov-fec-contact-recaptcha', {
    //     sitek_e_y: '', // (Google's universal generic loc
    //     callback: this.handleRecapSuccess,
    //     'expired-callback': this.handleRecapExpired,
    //     'error-callback': this.handleRecapError
    //   });
    //   console.log('  this.theRecaptcha: ', this.theRecaptcha);
    // },
    // handleRecapSuccess: function(x, y, z) {
    //   console.log('handleRecapSuccess(x,y,z): ', x, y, z);
    //   console.log('  getResponse: ', grecaptcha.getResponse(this.theRecaptcha));
    // },
    // handleRecapExpired: function(x, y, z) {
    //   console.log('handleRecapExpired(x,y,z): ', x, y, z);
    // },
    // handleRecapError: function(x, y, z) {
    //   console.log('handleRecapError(x,y,z): ', x, y, z);
    // }
  },
  template: `
    <div class="recaptcha-holder">
      <fieldset
        v-show="recaptchaShow">
        <input
          @input="handleTestingChange"
          v-model="TESTSHOULDFAIL"
          id="TESTSHOULDFAIL_true"
          type="radio"
          :value="true" />
        <label for="TESTSHOULDFAIL_true">TESTING: Submission should fail</label>
        <br>
        <input
          @change="handleTestingChange"
          v-model="TESTSHOULDFAIL"
          id="TESTSHOULDFAIL_false"
          type="radio"
          :value="false" />
        <label for="TESTSHOULDFAIL_false">TESTING: Submission should pass</label>
      </fieldset>
      
      <div
        data-TEST-id="gov-fec-contact-recaptcha"
        data-TEST-v-show="recaptchaShow"
        data-TEST-class="TESTINGg-recaptcha-a"
        ></div>
    </div>`

      // <!-- <iframe style="height: 78px; width: 304px; background: #aeb0b5 !important"></iframe> -->
});

/**
 * The <BottomNav> Vue component
 */
Vue.component('BottomNav', {
  props: {
    canNavBack: {
      type: Number,
      required: true
    },
    canNavNext: {
      type: Number,
      required: true
    },
    canNavRestart: {
      type: Number,
      required: true
    },
    canNavSubmit: {
      type: Number,
      required: true
    },
    isSubmitting: {
      type: Boolean,
      required: true
    }
  },
  template: `
    <div v-show="canNavBack > 0">
      <button :class="bottomNavClass('Back')" @click="handleClick('Back', $event)" type="button">Back</button>
      <button :class="bottomNavClass('Next')" @click="handleClick('Next', $event)" type="button">Next</button>
      <button :class="bottomNavClass('Submit')" @click="handleClick('Submit', $event)" type="submit">Submit</button>
      <button :class="bottomNavClass('Restart')" @click="handleClick('Restart', $event)" type="button">Start over</button>
      <div v-if="isSubmitting" class="loading-animation"><i class="icon"></i><i class="icon"></i><i class="icon"></i><i class="icon"></i></div>
    </div>
  `,
  methods: {
    bottomNavClass: function(buttonID) {
      return {
        // style classes:
        'button--back': buttonID == 'Back',
        'button--alt': buttonID == 'Back',
        'button--cta': buttonID == 'Next' || buttonID == 'Submit',
        'button--go': buttonID == 'Next' || buttonID == 'Submit',
        'button--standard': buttonID == 'Restart',
        // behavior classes: (set by looking at frames' canNavBack, canNavNext, canNavRestart, and canNavSubmit values)
        // full appearance and action are when canNavBack, canNavNext, etc === 2
        'is-disabled': this[`canNav${buttonID}`] === 1,
        hidden: this[`canNav${buttonID}`] === 0
      };
    },
    handleClick: function(id, e) {
      this.$emit('handle-click', id, e);
    }
  }
});

/**
 * The <FramesHolder> Vue component
 */
Vue.component('FramesHolder', {
  props: {
    currentFrameNum: {
      type: Number,
      required: true
    },
    frames: {
      type: Array,
      required: true
    },
    recaptchaValidated: {
      type: Boolean,
      required: true
    },
    teams: {
      type: Array,
      required: true
    },
    selectedTeam: {
      type: String,
      required: true
    },
    selectedTopic1: {
      type: String,
      required: true
    },
    selectedTopic2: {
      type: String,
      required: true
    },
    submissionMessages: {
      required: true
    },
    userCity: {
      type: String
    },
    userCommittee: {
      type: String
    },
    userEmail: {
      type: String
    },
    userPubs: {
      type: Array,
      default: []
    },
    userMessage: {
      type: String
    },
    userName: {
      type: String
    },
    userState: {
      type: String
    },
    userStreet1: {
      type: String
    },
    userStreet2: {
      type: String
    },
    userSubject: {
      type: String
    },
    userZip: {
      type: String
    }
  },
  watch: {
    currentFrameNum: function(newVal, oldVal) {
      if (newVal != oldVal) {
        this.updateNavOptions();
      }
    },
    selectedTopic1: function() {
      //console.log('changed selectedTopic1 from ', oldVal, ' to ', newVal);
      // TODO: do we need this?
    },
    selectedTopic2: function() {
      // console.log('changed selectedTopic2 from ', oldVal, ' to ', newVal);
      // TODO: do we need this?
    },
    submissionMessages: {
      handler() {
        // console.log('submissionMessages changed: ', val);
        // TODO: do we need this?
      },
      deep: true
    }
  },
  updated: function() {
    let newHeight = this.framesHeight;
    // If we're not on the teamFields page (where publications are selected)
    // just return the default heigth and be done
    // if (this.frames[this.currentFrameNum].frameId != 'userFields') return newHeight;
    // Otherwise, we have enough room for two publications, so count 38 more pixels for every row after that
    // else newHeight += (this.userPubs.length - Math.min(0, 2)) * 38;
    const currentFrameDiv = document.querySelector('.frame.current');
    newHeight = currentFrameDiv.scrollHeight + 20;
    newHeight = Math.max(300, newHeight);

    this.framesHeight = newHeight;
  },
  computed: {
    teamInfo: function() {
      return this.teams[this.selectedTeam];
    },
    userPubs_neverEmpty: function() {
      // return userPubs or a default array
      const emptyPubsArray = [{ label: '', qty: 0 }];
      return this.userPubs && this.userPubs.length > 0 ? this.userPubs : emptyPubsArray;
    }
  },
  template: `
    <form class="frames" :style="{'height': framesHeight + 'px'}" @submit.prevent>
      <div
        v-for="(frame, frame_index) in frames"
        :k${'e'}y="frame.frameId"
        :class="frameClass(frame_index, frame.class)">
        <template v-if="frame.frameId == 'intro'">
          <!-- intro frame -->
          <div class="grid grid--2-wide">
            <template
              v-if="frame && frame.content">
              <div
                v-for="(item, index) in frame.content"
                :k${'e'}y="index"
                class="grid__item">
                <div
                  @click="handleButtonClick(item.actionId, $event)"
                  class="card card--neutral">
                  <div class="card__image__container">
                    <span :class="'card__icon ' + item.icon">
                      <span class="u-visually-hidden">TODO</span>
                    </span>
                  </div>
                  <div class="card__content">
                    <h3 v-html="item.label"></h3>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
        <template v-else-if="frame.frameId == 'teamFields' && teamInfo">
          <!-- Frame with the team's information, whether summary, directions, or contact info fields -->
          <span class="clear"></span>
          
          <template v-if="teamInfo.summary">
            <p class="outdent">{{teamInfo.summary}}</p>
            <span class="clear"></span>
          </template>

          <template v-if="teamInfo.formPrompt">
            <p class="t-bold outdent">{{teamInfo.formPrompt}}</p>
            <span class="clear"></span>
          </template>

          <div
            v-if="teamInfo.phoneMenu || teamInfo.phoneExt"
            class="contact-item contact-item--phone">
            <div
              v-if="teamInfo.phoneMenu && teamInfo.phoneExt"
              class="contact-item__content">
              1-800-424-9530, menu option {{teamInfo.phoneMenu}}, or, 202-694-{{teamInfo.phoneExt}}</div>
            <div
              v-else-if="teamInfo.phoneMenu"
              class="contact-item__content">
              1-800-424-9530, menu option {{teamInfo.phoneMenu}}</div>
            <div
              v-else-if="teamInfo.phoneExt"
              class="contact-item__content">
              202-694-{{teamInfo.phoneExt}}</div>
          </div>

          <div
            v-if="teamInfo.ePrefix"
            class="contact-item contact-item--email">
            <div class="contact-item__content">
              <a href="mailto:{{teamInfo.ePrefix}}@fec.gov">{{teamInfo.ePrefix}}@fec.gov</a>
            </div>
          </div>

          <template
            v-if="teamInfo.externalLinks">
            <div
              v-for="(link, link_index) in teamInfo.externalLinks"
              :k${'e'}y="link_index"
              class="contact-item contact-item--question-bubble">
              <div class="contact-item__content">
                <a href="{{link.href}}">{{link.label}}</a>
              </div>
            </div>
          </template>
          
          <div
            v-if="teamInfo.fields != ''"
            class="contact-item contact-item--email">
            <div class="contact-item__content fields-wrapper">
              <div
                v-if="teamInfo.fields.email"
                class="field-wrapper col-9">
                <label for="u_email" class="t-bold t-caps">Your email address</label>
                <input
                  v-model="userEmail"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  id="u_email" name="u_email"
                  type="email" required />
                <label
                  for="u_email"
                  class="field__message--error"
                  >Please provide a valid email address</label>
              </div>

              <div
                v-if="teamInfo.fields.name"
                class="field-wrapper col-9">
                <label for="u_name" class="t-bold t-caps">Your name</label>
                <input
                  v-model="userName"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  id="u_name" name="u_name"
                  type="text" required />
                <label
                  for="u_name"
                  class="field__message--error"
                  >Please provide your name</label>
              </div>

              <div
                v-if="teamInfo.fields.committeeId"
                class="field-wrapper col-3">
                <label for="u_committee" class="t-bold t-caps">Committee ID</label>
                <input
                  v-model="userCommittee"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  id="u_committee"
                  data-uppercase="true"
                  pattern="^[c|C|p|P][0-9]{8}$|^[h|H|s|S][0-9]{1}[a-zA-Z]{2}[0-9]{5}$"
                  type="text" required />
                <label
                  for="u_committee"
                  class="field__message--error">Please provide a committee ID</label>
              </div>

              <div
                v-if="teamInfo.fields.subject"
                class="field-wrapper col-9">
                <label
                  for="u_subject"
                  class="t-bold t-caps">Subject</label>
                <select
                  v-model="userSubject"
                  @change="handleFieldChange($event)"
                  id="u_subject"
                  required>
                  <option value=""></option>
                  <template
                    v-for="(sub, sub_index) in teamInfo.fields.subject"
                    :k${'e'}y="sub_index">
                    <option :value="sub.value || sub.label">{{sub.label}}</option>
                  </template>
                </select>
                <label
                  for="u_subject"
                  class="field__message--error">Please select a subject</label>
              </div>

              <div
                v-if="userSubject == 'publications' && teamInfo.fields.subject_pubs"
                class="field-wrapper col-12">
                <label
                  for="u_pubs"
                  class="t-bold t-caps">Forms and publications</label>
                <table
                  id="u_pubs"
                  class="publications-order-form"
                  :aria-invalid="canAddAnotherPublication() == false ? true : false">
                  <colgroup>
                    <col>
                    <col>
                    <col>
                  </colgroup>
                  <thead>
                    <th class="t-normal">Which form or publication would you like?</th><th class="t-normal" colspan="2">How many copies?</th>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(userPub, userPub_index) in userPubs_neverEmpty"
                      :k${'e'}y="userPub_index"
                      >
                      <td>
                        <select
                          :data-index="userPub_index"
                          :id="'u_pub_label_' + userPub_index" required
                          v-model="userPub.label"
                          @change="handleFieldChange($event)"
                          @update:modelValue="newVal => userPub.label = newVal"
                          required>
                          <option value=""></option>
                          <template
                            v-for="(availablePub, availablePub_index) in teamInfo.fields.subject_pubs"
                            :k${'e'}y="availablePub_index">
                            <option
                              :value="availablePub.label"
                              :selected="availablePub.label == userPub.label"
                              :aria-disabled="pubOptionDisabledState(availablePub.label) == true ? 'disabled' : false"
                              :disabled="pubOptionDisabledState(availablePub.label) == true ? 'disabled' : false"
                              >{{availablePub.label}}</option>
                          </template>
                        </select>
                      </td>
                      <td>
                        <input
                          :data-index="userPub_index"
                          :id="'u_pub_qty_' + userPub_index"
                          :value="userPub.qty"
                          @change="handleFieldChange($event)"
                          type="number" min="0" max="99" required />
                      </td>
                      <td>
                        <button
                          :class="(userPub.label != '' && userPub.qty > 0) || userPub_index > 0 ? 'button--close--base' : 'button--close--base is-disabled'"
                          :data-index="userPub_index"
                          @click="handleButtonClick('pubs-remove', $event)"
                          type="button"
                          ></button>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3">
                        <button
                          :class="canAddAnotherPublication() ? 'button--cta button--plus' : 'button--cta button--plus is-disabled'"
                          @click="handleButtonClick('pubs-add', $event)"
                          type="button"
                          >Add another form or publication</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <label
                  for="u_pubs"
                  class="field__message--error-group">Select your requested publication and a quantity</label>
              </div>

              <div
                v-else-if="teamInfo.fields.message"
                class="field-wrapper col-12">
                <label
                  for="u_message"
                  class="t-bold t-caps"
                  >Message</label>
                <textarea
                  v-model="userMessage"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  id="u_message" name="u_message"
                  maxlength="9999"
                  required></textarea>
                <label
                  for="u_message"
                  class="field__message--error">Please provide a detailed message</label>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="frame.frameId == 'uspsFields' && teamInfo">
          <!-- The frame for the various mailing address fields to order publications -->
          <span class="clear"></span>
          
          <template v-if="teamInfo.summary">
            <p class="outdent">{{teamInfo.summary}}</p>
            <span class="clear"></span>
          </template>

          <div class="contact-item contact-item--mail">
            <div class="contact-item__content">
              <span class="t-bold t-caps">Your Address</span>
              <div class="fields-wrapper">
                <label class="col-l" for="u_street1">Street Address or P.O. Box</label>
                <input
                  v-model="userStreet1"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  id="u_street1" name="u_street1" type="text" class="col-l" required />

                <label class="col-r" for="u_street2">Apartment, suite, etc (optional)</label>
                <input
                  v-model="userStreet2"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  id="u_street2" name="u_street2" type="text" class="col-r" />

                <label class="col-l" for="u_city">City</label>
                <input
                  v-model="userCity"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  id="u_city" name="u_city" type="text" class="col-l" required />

                <label class="col-rl" for="u_state">State</label>
                <select
                  v-model="userState"
                  @change="handleFieldChange($event)"
                  id="u_state" name="u_state" class="col-rl" required>
                  <option
                    v-for="state in states"
                    :k${'e'}y="state.abbrev"
                    :value="state.abbrev">{{state.label}}</option>
                </select>

                <label class="col-rr" for="u_zip">ZIP code</label>
                <input
                  v-model="userZip"
                  @input="handleFieldInput($event)"
                  @change="handleFieldChange($event)"
                  pattern="^[0-9]{5}$|^[0-9]{9}$|^[0-9]{5}-[0-9]{4}$"
                  id="u_zip" name="u_zip" type="text" class="col-rr"
                  required />

                <label
                  class="field__message--error-group" style="order:20">A complete mailing address is required</label>

              </div>
            </div>
          </div>
        </template>
        <template v-else-if="frame.frameId == 'orderReview' && teamInfo">
          <!-- The frame after uspsFields, to review which publications will be sent to where -->
          <span class="clear"></span>
          
          <template v-if="teamInfo.summary">
            <p class="outdent">{{teamInfo.summary}}</p>
            <span class="clear"></span>
          </template>

          <div class="contact-item contact-item--check">
            <div class="contact-item__content">
              <div class="t-bold t-caps">To confirm, your request:</div>
              <div class="publications-order-summary">
                <template
                  v-for="(pub, pub_index) in userPubs"
                  :k${'e'}y="pub_index">
                  <div>{{pub.label}}</div>
                  <div>{{pub.qty == 1 ? '1 copy' : pub.qty + ' copies'}}</div>
                </template>
              </div>
              
              <div class="t-bold t-caps">Your address:</div>
              <address>
                {{userStreet1}}<br>
                <template v-if="userStreet2">{{userStreet2}}<br></template>
                {{userCity}} {{userState}}&nbsp;&nbsp;{{userZip}}<br>
              </address>
            </div>
          </div>
        </template>
        <template v-else-if="frame.frameId == 'acknowledgeSubmission'">
          <span class="clear"></span>
          <div
            :class="['message message--inverse-alt', submissionMessages && submissionMessages.success == true ? 'message--success' : 'message--error']">
            <h2 class="message__title" v-html="submissionMessages.headline"></h2>
            <p v-html="submissionMessages.message"></p>
            <div class="message--alert__bottom">
              <ul
                v-if="submissionMessages.emailLinks"
                class="list--buttons">
                <li v-for="(link, link_index) in submissionMessages.emailLinks">
                  <a class="button--standard" :href="link.href" target="_blank">{{link.label}}</a>
                </li>
              </ul>
              <p>Still need help?<br><br></p>
              <ul class="list--buttons">
                <li v-for="(moreObj, moreObj_index) in submissionMessages.successMore">
                  <a class="button--standard" :href="moreObj.href" target="_blank">{{moreObj.label}}</a>
                </li>
                <li>
                  <button class="button--standard" @click="handleButtonClick('Restart', $event)" type="button">Start over</button>
                </li>
              </ul>
            </div>
          </div>
        </template>
        <template v-else>
          <h4 v-if="frame.title" v-html="frame.title"></h4>

          <template
            v-if="frame.options">
            <template
              v-for="(opt, options_index) in frame.options"
              :k${'e'}y="options_index">
              <span
                v-if="opt.type == 'clear'"
                class="clear"></span>

              <h4
                v-if="opt.fieldH"
                :class="opt.class"
                ><strong>{{ opt.fieldH }}</strong>
              </h4>

              <p
                v-if="opt.fieldP"
                :class="opt.class"
                >{{ opt.fieldP }}</p>

              <template
                v-if="opt.type == 'radio'">
                <input
                  :class="opt.class"
                  :id="'elem_' + opt.vModel + '_' + options_index"
                  :name="'elem_' + opt.vModel"
                  :value="radioValue(opt)"
                  @change="handleRadioClick(opt, $event)"
                  type="radio"
                  />
                <label
                  :for="'elem_' + opt.vModel + '_' + options_index"
                  :class="opt.class"
                  >{{ getRadioLabel(opt) }}</label>
              </template>

              <template
                v-if="opt.type == 'integer' || opt.type == 'currency'">
                <label
                  v-if="opt.class == 'label-headline'"
                  :for="'elem_' + opt.vModel"
                  :class="opt.class"
                  >{{ opt.label }}</label>
                <label
                  v-else
                  :for="'elem_' + opt.vModel"
                  :class="opt.class"
                  >{{ opt.label }}</label>
              </template>

              <span
                v-if="opt.example"
                :class="[opt.class, 't-note t-sans search__example']"
                >{{ opt.example }}</span>

              <div
                v-if="opt.type == 'html'"
                v-html="opt.html"
                :class="opt.class"
              ></div>
            </template>
          </template>

          <template
            v-if="frame.content">
            <div
              v-for="(item, item_index) in frame.content"
              :k${'e'}y="item_index">
              <p
                v-if="item.type == 'p' && item.html"
                :class="item.class"
                v-html="item.html"></p>
              <p
                v-if="item.type == 'p' && !item.html"
                :class="item.class">{{ item.content }}</p>
            </div>
          </template>

          <template
            v-if="frame.fields">
            <template
              v-for="(field, field_index) in frame.fields"
              :k${'e'}y="field_index">
              <label
                :for="'input_' + field.label">{{ field.label }}</label>
              <input
                id="'input_' + field.label" />
              <label
                for="'input_' + field.label"
                class="field__message--error">ERROR</label>
            </template>
          </template>

        </template>
      </div>
    </form>
  `, //gitleaks:allow
  methods: {
    canAddAnotherPublication: function() {
      // If there are no userPubs so far, easy, can't add another <select> yet
      if (!this.userPubs[0]) return false;
      // If we're already showing a <select> for every possible publication, nope, can't add another
      if (this.userPubs.length == this.teamInfo.fields.subject_pubs.length) return false;

      for (let i = 0; i < this.userPubs.length; i++) {
        const pub = this.userPubs[i];
        const hasLabel = pub.label && pub.label != '';
        const hasQty = pub.qty && pub.qty >= 1;

        if (!hasLabel || !hasQty) return false;
      }
      return true;
    },
    canGoToNextFrame: function() {
      const currentFrame = this.frames[this.currentFrameNum];
      // 'intro' never shows the Next button
      let toReturn = false;

      // if we're on 'teams' but there's already a value for it
      if (currentFrame.frameId == 'teams' && this.selectedTeam) toReturn = true;

      // if we're on topics1 but it already has a value
      else if (currentFrame.frameId == 'topics1' && this.selectedTopic1) toReturn = true;

      // if we're on topics2 but it already has a value
      else if (currentFrame.frameId == 'topics2' && this.selectedTopic2) toReturn = true;

      // if we're on teamFields, we're only showing Next for publications
      else if (currentFrame.frameId == 'teamFields' && this.userSubject == 'publications' && this.userPubs.length >= 1)
        toReturn = true;

      return toReturn;
    },
    /**
     *  @property {object} d - the data object from frames.options
     */
    getRadioLabel: function(d) {
      let toReturn = '';
      if (d.label) toReturn = d.label;
      else if (d.vModel == 'selectedTeam') {
        const thisTeam = this.teams[d.value];
        toReturn = thisTeam.name;
        if (thisTeam.nameDisclaimer) toReturn += ` ${thisTeam.nameDisclaimer}`;
      }
      return toReturn;
    },
    frameClass: function(frameIndex, additionalClasses) {
      // this.validateCurrentFrame(); // THIS CAUSES AN INFINITE LOOP

      return [
        'frame',
        {
          previous: frameIndex < this.currentFrameNum,
          current: frameIndex == this.currentFrameNum,
          'next off-screen': frameIndex > this.currentFrameNum
        },
        additionalClasses
      ];
    },
    handleButtonClick: function(id, e) {
      this.$emit('button-click', id, e);
      this.updateNavOptions();
    },
    handleRadioClick: function(opt, e) {
      this.$emit('radio-click', opt, e);
      this.updateNavOptions();
    },
    handleFieldChange: function(e) {
      // Handles when selects change and inputs lose focus
      this.validateField(e.target);
      this.$emit('field-change', e);
      this.validateCurrentFrame();
    },
    handleFieldInput: function(e) {
      // Triggers when someone types into an input
      // If the field was previously invalid, do a validation now
      if (e.target.getAttribute('aria-invalid') == 'true') this.validateField(e.target);
    },
    radioValue: function(opt) {
      // if (opt.teamSubject) return opt.teamSubject;
      if (opt.value) return opt.value;
      else if (opt.label) return opt.label;
      return 'ERROR';
    },
    updateNavOptions: function(obj) {
      const currentFrame = this.frames[this.currentFrameNum];

      let newCanNext = 1;
      // Set the default to showing the button, but not active
      // If there's no next frame, don't show 'Next' ever
      if (!currentFrame.nextFrame) newCanNext = 0;
      // If required fields don't have values, stay here
      else if (obj && obj.needValues === true) newCanNext = 1;
      // Otherwise, if the fields are all validated, cool, let's let them move forward
      else if (obj && obj.valid === true) newCanNext = 2;
      // Of if they've already been to the next frame, they can go forward to it
      else if (this.canGoToNextFrame()) newCanNext = 2;

      let newCanBack = 2;

      let newCanRestart = 0;

      let newCanSubmit = 0;

      // For the frames that can submit
      //
      // If we're on the Intro
      if (currentFrame.frameId == 'intro') {
        newCanBack = 0;
        newCanNext = 0;
        newCanRestart = 0;
        newCanSubmit = 0;
      // If we're currently showing the team info
      } else if (currentFrame.frameId == 'teamFields') {
        // If there are no other fields to show, we're done
        if (this.selectedTeam && this.teams[this.selectedTeam].fields && this.teams[this.selectedTeam].fields.length === 0) {
          newCanNext = 0;
          newCanRestart = 2;
          newCanSubmit = 0;
        // If they've chosen publications, they can't submit but maybe they can Next
        } else if (this.userSubject == 'publications') {
          newCanNext = this.canAddAnotherPublication() ? 2 : 1;
          newCanSubmit = 0;
          // TODO: handle when they can't add another because they've already added them all,
          // TODO: but they should be able proceed because there's a quantity for all of them
        // If they haven't chosen publications, they can't Next but they might submit
        } else {
          newCanNext = 0;
          newCanSubmit = obj && obj.valid && !obj.needValues ? 2 : 1;
        }
      } else if (currentFrame.frameId == 'uspsFields') {
        newCanNext = obj && obj.valid && !obj.needValues ? 2 : 1;
        newCanRestart = 0;
        newCanSubmit = 0;
      } else if (currentFrame.frameId == 'orderReview') {
        // console.log('orderReview! this.recaptchaValidated: ', this.recaptchaValidated);
        newCanNext = 0;
        newCanRestart = 0;
        newCanSubmit = this.recaptchaValidated ? 2 : 1;
      } else if (currentFrame.frameId == 'acknowledgeSubmission') {
        newCanBack = 0;
        newCanNext = 0;
        newCanRestart = 2;
        newCanSubmit = 0;
      }

      this.$parent.updateNavOptions(
        { Back: newCanBack, Next: newCanNext, Restart: newCanRestart, Submit: newCanSubmit }
      );

    },
    validateField: function(el) {
      el.setAttribute('aria-invalid', !el.checkValidity());
    },
    validateCurrentFrame: function() {
      const currentFrameEl = document.querySelector('.frame.current');
      let frameFormElements;

      if (!currentFrameEl) {
        console.log('NO CURRENT FRAME'); // eslint-disable-line no-console
        return;
      } else {
        frameFormElements = currentFrameEl.querySelectorAll('input, select, textarea');
        // console.log('  frameFormElements: ', frameFormElements); // eslint-disable-line no-console
      }

      if (frameFormElements) {
        // debugger;
        let allAreValid = true;
        let needValues = false;

        frameFormElements.forEach(el => {
          if ((!el.value || el.value == '') && el.required) needValues = true;

          if (el.id.indexOf('u_pub') === 0 && this.userPubs.length < 1) allAreValid = false;
          else if (!el.checkValidity()) {
            allAreValid = false;
          }
        });
        this.updateNavOptions({ valid: allAreValid, needValues: needValues });
      }
    },
    pubOptionDisabledState: function(requestedLabel) {

      let toReturn = false;
      this.userPubs.forEach(pub => {
        if (pub.label === requestedLabel) toReturn = true;
      });

      return toReturn;
    }
  },
  data: function() {
    return {
      framesHeight: 475,
      states: [
        { label: 'Alabama', abbrev: 'AL' }, { label: 'Alaska', abbrev: 'AK' },
        { label: 'American Samoa', abbrev: 'AS' }, { label: 'Arizona', abbrev: 'AZ' },
        { label: 'Arkansas', abbrev: 'AR' }, { label: 'California', abbrev: 'CA' },
        { label: 'Colorado', abbrev: 'CO' }, { label: 'Connecticut', abbrev: 'CT' },
        { label: 'Delaware', abbrev: 'DE' }, { label: 'District of Columbia', abbrev: 'DC' },
        { label: 'Florida', abbrev: 'FL' }, { label: 'Georgia', abbrev: 'GA' },
        { label: 'Guam', abbrev: 'GU' }, { label: 'Hawaii', abbrev: 'HI' },
        { label: 'Idaho', abbrev: 'ID' }, { label: 'Illinois', abbrev: 'IL' },
        { label: 'Indiana', abbrev: 'IN' }, { label: 'Iowa', abbrev: 'IA' },
        { label: 'Kansas', abbrev: 'KS' }, { label: 'Kentucky', abbrev: 'KY' },
        { label: 'Louisiana', abbrev: 'LA' }, { label: 'Maine', abbrev: 'ME' },
        { label: 'Maryland', abbrev: 'MD' }, { label: 'Massachusetts', abbrev: 'MA' },
        { label: 'Michigan', abbrev: 'MI' }, { label: 'Minnesota', abbrev: 'MN' },
        { label: 'Mississippi', abbrev: 'MS' }, { label: 'Missouri', abbrev: 'MO' },
        { label: 'Montana', abbrev: 'MT' }, { label: 'Nebraska', abbrev: 'NE' },
        { label: 'Nevada', abbrev: 'NV' }, { label: 'New Hampshire', abbrev: 'NH' },
        { label: 'New Jersey', abbrev: 'NJ' }, { label: 'New Mexico', abbrev: 'NM' },
        { label: 'New York', abbrev: 'NY' }, { label: 'North Carolina', abbrev: 'NC' },
        { label: 'North Dakota', abbrev: 'ND' }, { label: 'Northern Mariana Islands', abbrev: 'MP' },
        { label: 'Ohio', abbrev: 'OH' }, { label: 'Oklahoma', abbrev: 'OK' },
        { label: 'Oregon', abbrev: 'OR' }, { label: 'Pennsylvania', abbrev: 'PA' },
        { label: 'Puerto Rico', abbrev: 'PR' }, { label: 'Rhode Island', abbrev: 'RI' },
        { label: 'South Carolina', abbrev: 'SC' }, { label: 'South Dakota', abbrev: 'SD' },
        { label: 'Tennessee', abbrev: 'TN' }, { label: 'Texas', abbrev: 'TX' },
        { label: 'U.S. Virgin Islands', abbrev: 'VI' }, { label: 'Utah', abbrev: 'UT' },
        { label: 'Vermont', abbrev: 'VT' }, { label: 'Virginia', abbrev: 'VA' },
        { label: 'Washington', abbrev: 'WA' }, { label: 'West Virginia', abbrev: 'WV' },
        { label: 'Wisconsin', abbrev: 'WI' }, { label: 'Wyoming', abbrev: 'WY' }
      ]
    };
  }
});

/**
 * The main data for the contact app
 * \xa0 is the JavaScript escape for &nbsp;
 */
new Vue({
  el: '#gov-fec-contact-app',
  template: `
    <div id="gov-fec-contact-app" class="cq-container">
      <FramesHolder
        :current-frame-num="currentFrameNum"
        :frames="frames"
        :recaptcha-validated="recaptchaValidated"
        :selected-team="selectedTeam"
        :selected-topic1="selectedTopic1"
        :selected-topic2="selectedTopic2"
        :submission-messages="submissionMessages"
        :teams="teams"
        :userCity="u_city"
        :userCommittee="u_committee"
        :user-email="u_email"
        :user-pubs="u_pubs"
        :user-message="u_message"
        :user-name="u_name"
        :user-state="u_state"
        :user-street1="u_street1"
        :user-street2="u_street2"
        :user-subject="u_subject"
        :user-zip="u_zip"
        @button-click="handleButtonClick"
        @field-change="handleFieldChange"
        @radio-click="handleRadioClick"
      ></FramesHolder>
      <Recaptcha
        @testing-change="handleTestingChange"
        :TESTSHOULDFAIL="TESTSHOULDFAIL"
        :recaptcha-show="recaptchaShow"
        :recaptcha-validated="recaptchaValidated"
        @recaptcha-event="handleRecaptchaEvent"
      >
      </Recaptcha>
      <BottomNav
        :can-nav-back="canNavBack"
        :can-nav-next="canNavNext"
        :can-nav-restart="canNavRestart"
        :can-nav-submit="canNavSubmit"
        :is-submitting="isSubmitting"
        @handle-click="handleButtonClick"
      ></BottomNav>
    </div>
  `,
  data: function() {
    return {
      TESTSHOULDFAIL: false,
      canNavBack: 0,
      canNavNext: 0,
      canNavSubmit: 0,
      canNavRestart: 0,
      currentFrameNum: 0, //int
      isSubmitting: false,
      postUrl: '/contact-submission/',
      selectedTeam: '',
      selectedTopic1: '',
      selectedTopic2: '',
      submissionMessages: {},
      u_city: '',
      u_committee: '',
      u_email: '',
      u_pubs: [],
      u_message: '',
      u_name: '',
      u_state: '',
      u_street1: '',
      u_street2: '',
      u_subject: '',
      u_zip: '',
      teams: {
        congress: {
          name: 'Congressional Affairs',
          summary: 'Congressional Affairs responds to inquiries from other agencies and Congressional representatives',
          formPrompt: 'Contact Congressional Affairs via telephone.',
          phoneExt: '1006',
          ePrefix: 'congress',
          fields: ''
        },
        efo: {
          name: 'Electronic Filing Office',
          summary: `The Electronic Filing Office helps individuals, candidates, committees and other
          entities with FECFile passwords and other technical FECFile issues. EFO also provides limited
          support for third-party filing software.`,
          formPrompt: 'Contact the Electronic Filing Office via telephone or send a message.',
          phoneMenu: 4, // 1-800-424-9530, menu option #
          phoneExt: 1307, // 202-694-####
          success: 'The Electronic Filing Office will get back to you within 2-4 hours.',
          successMore: [
            {
              label: 'Get help with passwords >',
              href: 'https://www.fec.gov'
            }
          ],
          fields: {
            email: true,
            name: true,
            committeeId: true,
            subject: [
              { label: 'Get password help',
                ePrefix: 'eFiletechsupport' },
              { label: 'Answer a question about setting up FECFile',
                ePrefix: 'eFiletechsupport' },
              { label: 'Answer a question about 3rd-party filing software',
                ePrefix: 'eFiletechsupport' },
              { label: 'Help troubleshoot a problem with FECFile',
                ePrefix: 'eFiletechsupport' }
            ],
            message: true
          }
        },
        fec: {
          summary: `We're here to help! The Federal Election Commission is an independent regulatory agency
          that was created to protect the integrity of the campaign finance process.`,
          formPrompt: 'Contact us via telephone or send a message.',
          phoneMenu: 6,
          phoneExt: 1100,
          fields: {
            email: true,
            message: true
          }
        },
        info: {
          name: 'Information Division',
          summary: `The Information Division answers questions about campaign finance law, conducts training on the law,
          processes requests for public speakers and provides copies of FEC forms and publications.`,
          formPrompt: 'Contact the Information Division via telephone or send them a message.',
          phoneMenu: 6,
          phoneExt: 1100,
          success: 'The Information Division will get back to you within 5 business days.',
          fields: {
            email: true,
            subject: [
              { label: 'A question about campaign finance law',
                ePrefix: 'info' },
              { label: 'A question about an upcoming training',
                ePrefix: 'conferences' },
              { label: 'Help me sign up for an upcoming training',
                ePrefix: 'conferences' },
              { label: 'Send me a copy of an FEC form or guide',
                value: 'publications',
                email: 'info' },
              { label: 'Help me schedule a group speaker',
                ePrefix: 'speaker' },
              { label: 'Something else',
                ePrefix: 'info' }
            ],
            message: true,
            subject_pubs: [
              { label: 'Congressional candidates and their committees campaign guide', qty: 0 },
              { label: 'Political party committees campaign guide', qty: 0 },
              { label: 'Corporations and labor organizations campaign guide', qty: 0 },
              { label: 'Nonconnected committees campaign guide', qty: 0 },
              { label: 'Combined Federal/State Disclosure and Election Directory', qty: 0 },
              { label: 'Form 1: Statement of Organization', qty: 0 },
              { label: 'Form 2: Statement of Candidacy', qty: 0 },
              { label: 'Form 3: Report of Receipts and Disbursements (House and Senate candidates)', qty: 0 },
              { label: 'Form 3X: Report of Receipts and Disbursements (PACs and political party committees)', qty: 0 }
            ]
          }
        },
        oig: {
          name: 'Office of Inspector General',
          summary: `The Office of Inspector General handles reports of fraud, waste and abuse at the FEC
          and related inquiries.`,
          formPrompt: 'Contact the Office of Inspector General through their hotline portal to submit a complaint.',
          externalLinks: [
            {
              label: 'Submit a complaint',
              href: 'https://fecoig.ains.com/',
              icon: 'i-question-circle'
            }
          ],
          fields: ''
        },
        press: {
          name: 'Press Office',
          nameDisclaimer: '(reporters or journalists only)',
          summary: 'The Press Office responds to questions from the media.',
          formPrompt: 'Contact the Press Office via telephone, email, or send them a message.',
          phoneMenu: 1, // 1-800-424-9530, menu option #
          phoneExt: 1220, // 202-694-####
          ePrefix: 'press',
          success: 'The Press Office will get back to you within 24 hours.',
          fields: {
            email: true,
            subject: [
              { label: 'Assist with a media query',
                ePrefix: 'press' },
              { label: 'Answer a question about a Commission meeting',
                ePrefix: 'press' }
            ],
            message: true
          }
        },
        rad: {
          name: 'Reports Analysis Division',
          summary: `The Reports Analysis Division (RAD) helps registered committees and their representatives
          complete and file their campaign finance reports.`,
          formPrompt: `If you are a representative of a registered committee, contact RAD via telephone or use the Contact your Analyst form.`,
          phoneMenu: 5,
          phoneExt: 1130,
          externalLinks: [
            {
              type: 'a',
              label: 'Use the Contact your Analyst form',
              href: '/help-candidates-and-committees/question-rad/'
            }
          ],
          fields: ''
        },
        records: {
          name: 'Public Records',
          summary: `Public Records helps individuals research FEC data and other public documents.`,
          formPrompt: 'Contact Public Records via telephone or send a message.',
          phoneMenu: 2, // 1-800-424-9530, menu option #
          phoneExt: 1120, // 202-694-####
          success: 'The Office of Public Records will get back to you within 2 business days.',
          fields: {
            email: true,
            subject: [
              { label: 'Help research public documents',
                ePrefix: 'pubrec' },
              { label: 'Help research campaign finance data',
                ePrefix: 'pubrec' }
            ],
            message: true
          }
        }
      },
      frames: [
        {
          frameId: 'intro',
          title: '',
          class: 'intro',
          autoAdvance: false,
          nextFrame: true,
          content: [
            {
              type: 'card',
              class: '',
              icon: 'i-check-circle',
              label: `I know who I need to contact for help&nbsp;&rsaquo;`,
              actionId: 'start-know-who'
            },
            {
              type: 'card',
              class: '',
              icon: 'i-question-circle',
              label: `I need help, but I’m not sure who to contact&nbsp;&rsaquo;`,
              actionId: 'start-help-with-who'
            }
          ]
        },
        {
          frameId: 'teams',
          title: `I need help from the&hellip;`,
          autoAdvance: true,
          nextFrame: 'teamFields',
          options: [
            {
              type: 'radio',
              vModel: 'selectedTeam',
              value: 'info'
            },
            {
              type: 'radio',
              vModel: 'selectedTeam',
              value: 'rad'
            },
            {
              type: 'radio',
              vModel: 'selectedTeam',
              value: 'efo'
            },
            {
              type: 'radio',
              vModel: 'selectedTeam',
              value: 'records'
            },
            {
              type: 'radio',
              vModel: 'selectedTeam',
              value: 'press'
            },
            {
              type: 'radio',
              vModel: 'selectedTeam',
              value: 'congress'
            },
            {
              type: 'radio',
              vModel: 'selectedTeam',
              value: 'oig'
            }
          ]
        },
        {
          frameId: 'topics1',
          title: 'I need help with&hellip;',
          autoAdvance: true,
          nextFrame: 'teamFields',
          options: [
            {
              type: 'radio',
              vModel: 'selectedTopic1',
              label: 'Making a press inquiry (reporters or journalists only)',
              team: 'press',
              teamSubject: 'Assist with a media query'
            },
            {
              type: 'radio',
              vModel: 'selectedTopic1',
              label: 'Accessing campaign finance records and other public documents',
              team: 'records',
              teamSubject: ''
            },
            {
              type: 'radio',
              vModel: 'selectedTopic1',
              label: 'Getting a copy of an FEC form or publication',
              team: 'info',
              teamSubject: 'publications'
            },
            {
              type: 'radio',
              vModel: 'selectedTopic1',
              label: 'Technical issues with filing my electric report or password help',
              team: 'efo',
              teamSubject: ''
            },
            {
              type: 'radio',
              vModel: 'selectedTopic1',
              label: 'Filing reports, RFAIs, amendments or specific transactions',
              team: 'rad',
              teamSubject: ''
            },
            {
              type: 'radio',
              vModel: 'selectedTopic1',
              label: 'Questions about campaign finance law, including committee registration and reporting requirements, and contribution limits and prohibitions',
              team: 'info',
              teamSubject: 'A question about campaign finance law'
            },
            {
              type: 'radio',
              vModel: 'selectedTopic1',
              value: 'NEXT',
              label: 'None of these'
            }
          ]
        },
        {
          frameId: 'topics2',
          title: 'I need help with&hellip;',
          autoAdvance: true,
          nextFrame: 'teamFields',
          options: [
            {
              type: 'radio',
              vModel: 'selectedTopic2',
              label: 'An upcoming FEC training program',
              value: 'upcoming-training',
              team: 'info',
              teamSubject: 'A question about an upcoming training'
            },
            {
              type: 'radio',
              vModel: 'selectedTopic2',
              label: 'An upcoming Commission meeting',
              team: 'press',
              teamSubject: 'Answer a question about a Commission meeting'
            },
            {
              type: 'radio',
              vModel: 'selectedTopic2',
              label: 'A request for a speaker',
              team: 'info',
              teamSubject: 'Help me schedule a group speaker'
            },
            {
              type: 'radio',
              vModel: 'selectedTopic2',
              label: 'Congressional and intergovernmental communications',
              team: 'congress',
              teamSubject: ''
            },
            {
              type: 'radio',
              vModel: 'selectedTopic2',
              label: 'Reporting or inquiring about waste, fraud and abuse at the FEC',
              team: 'oig',
              teamSubject: ''
            },
            {
              type: 'radio',
              vModel: 'selectedTopic2',
              label: 'Something else',
              team: 'fec',
              teamSubject: ''
            }
          ]
        },
        {
          frameId: 'teamFields',
          title: 'Team Fields Frame',
          autoAdvance: false,
          nextFrame: ['submit', 'forms'],
          fields: {}
        },
        {
          frameId: 'uspsFields',
          title: 'USPS Fields Frame',
          autoAdvance: false,
          nextFrame: 'orderReview',
          fields: {}
        },
        {
          frameId: 'orderReview',
          title: '',
          class: '',
          autoAdvance: false,
          nextFrame: 'acknowledgeSubmission',
          fields: {}
        },
        {
          frameId: 'acknowledgeSubmission',
          title: 'Success! Your message has been submitted',
          class: '',
          autoAdvance: false,
          nextFrame: false,
          fields: {}
        }
      ]
    };
  },
  mounted: function() {
    // Add the transition listeners so frames disappear while out of sight
    this.startWatchingTransitions();
  },
  computed: {
    recaptchaShow: function() {
      // return false;
      let toReturn = false;

      if (this.frames[this.currentFrameNum].frameId == 'teamFields' && this.u_subject != 'publications')
        toReturn = true;
      else if (this.frames[this.currentFrameNum].frameId == 'orderReview')
        toReturn = true;

      return toReturn;
    },
    recaptchaValidated: function() {
      // return false;
      return true;
      // console.log('grecaptcha: ', grecaptcha);
      // console.log('window.grecaptcha: ', window.grecaptcha);
    }
  },
  methods: {
    handleTestingChange(val) {
      this.TESTSHOULDFAIL = val;
    },
    getFrameNumById: function(requestedID) {
      for (let i = 0; i < this.frames.length; i++) {
        if (this.frames[i].frameId == requestedID) return i;
      }
      return 0;
    },
    handleButtonClick: function(buttonType, e) {
      e.preventDefault();
      if (buttonType == 'start-know-who') this.goToFrame('teams');
      else if (buttonType == 'start-help-with-who') this.goToFrame('topics1');
      else if (buttonType == 'Next') this.goToFrame('next');
      else if (buttonType == 'Back') this.goToFrame('back');
      else if (buttonType == 'Restart') this.restart();
      else if (buttonType == 'Submit') this.startSubmission();
      else if (buttonType == 'pubs-remove') {
        const theIndex = parseInt(e.target.dataset.index);
        const newUPubs = [...this.u_pubs];
        newUPubs[theIndex] = { label: '', qty: 0 };

        newUPubs.splice(theIndex, 1);
        this.u_pubs = [...newUPubs];

      } else if (buttonType == 'pubs-add') {
        this.u_pubs.push({ label: '', qty: 0 });
      }
    },
    handleFieldChange: function(e) {
      e.preventDefault();

      // Which variable?
      const varToChange = e.target.id;

      // If a publication order label was changed,
      if (e.target.id.indexOf('u_pub_label') === 0) {
        const theIndex = parseInt(e.target.dataset.index);
        const newUPubs = [...this.u_pubs];

        if (newUPubs[theIndex])
          newUPubs[theIndex].label = e.target.value;
        else
          newUPubs[theIndex] = { label: e.target.value, qty: 0 };

        this.u_pubs = [...newUPubs];

      // If a publication order quantity was changed,
      } else if (e.target.id.indexOf('u_pub_qty') === 0) {
        const theIndex = parseInt(e.target.dataset.index);
        const newUPubs = [...this.u_pubs];

        if (newUPubs[theIndex])
          newUPubs[theIndex].qty = e.target.value;
        else
          newUPubs[theIndex] = { label: '', qty: e.target.value };

        this.u_pubs = [...newUPubs];

      // Else if the changed var exists
      // && we have a new value for it
      // && it's not already that value,
      } else if (e.target.value && this[varToChange] != e.target.value) {
        // If the field has data-uppercase="true", cap the value
        this[varToChange] = e.target.dataset.uppercase == 'true' ? e.target.value.toUpperCase() : e.target.value;
      } else {
        console.log('ELSE FOR SOME REASON'); // eslint-disable-line no-console
        console.log('  e.target.value: ', e.target.value); // eslint-disable-line no-console
        console.log('  this[varToChange]: ', this[varToChange]); // eslint-disable-line no-console
      }
    },
    handleRecaptchaEvent: function(e, f) {
      console.log('App.handleRecaptchaEvent(e): ', e, f); //eslint-disable-line no-console
    },
    goToFrame: function(frameId) {
      /*
      Forward flow:

      intro  →  teams    →      →     →  teamFields
      intro  →  topics1  →      →     →  teamFields
      intro  →  topics1  →  topics 2  →  teamFields
      …
      teamFields   →      →       →       →       →      →        →  acknowledgeSubmission
      teamFields   →  uspsFields  →  orderReview  →  confirmSend  →  acknowledgeSubmission

      */
      let nextFrameNum = 0;
      let currentFrameId = this.frames[this.currentFrameNum].frameId;

      if (frameId == 'next') {

        if (currentFrameId == 'intro') {
          if (this.selectedTopic2 != '') {
            nextFrameNum = this.getFrameNumById('topics2');

          } else if (this.selectedTopic1 != '') {
            nextFrameNum = this.getFrameNumById('topics1');

          } else if (this.selectedTeam != '') {
            nextFrameNum = this.getFrameNumById('teams');
          }
        } else if (currentFrameId == 'teams') {
          nextFrameNum = this.getFrameNumById('teamFields');

        } else if (currentFrameId == 'topics2') {
          nextFrameNum = this.getFrameNumById('teamFields');

        } else if (currentFrameId == 'topics1') {
          if (this.selectedTopic1 == 'NEXT')
            nextFrameNum = this.getFrameNumById('topics2');
          else
            nextFrameNum = this.getFrameNumById('teamFields');

        } else if (currentFrameId == 'teamFields') {
          if (this.u_subject == 'publications')
            nextFrameNum = this.getFrameNumById('uspsFields');

          else {
            // TODO: submit or do nothing?
          }
        } else if (currentFrameId == 'uspsFields') {
          nextFrameNum = this.getFrameNumById('orderReview');

        } else if (currentFrameId == 'orderReview') {
          // TODO: SUBMIT
        }
      } else if (frameId == 'back') {
        if (currentFrameId == 'acknowledgeSubmission') {
          // No going back—can only restart
        }

        if (currentFrameId == 'orderReview') {
          nextFrameNum = this.getFrameNumById('uspsFields');

        } else if (currentFrameId == 'uspsFields') {
          nextFrameNum = this.getFrameNumById('teamFields');

        } else if (currentFrameId == 'teamFields') {
          if (this.selectedTopic2)
            nextFrameNum = this.getFrameNumById('topics2');
          else if (this.selectedTopic1)
            nextFrameNum = this.getFrameNumById('topics1');
          else
            nextFrameNum = this.getFrameNumById('teams');

        } else if (currentFrameId == 'topics2') {
          nextFrameNum = this.getFrameNumById('topics1');

        } else if (currentFrameId == 'topic1') {
          nextFrameNum = this.getFrameNumById('intro');

        } else if (currentFrameId == 'teams') {
          nextFrameNum = this.getFrameNumById('intro');
        }

      } else if (typeof frameId == 'number') {
        // If we're jumping to a frame number, do it
        nextFrameNum = frameId;

      } else if (typeof frameId == 'string') {
        // if we're jumping to some other frame id, do it
        nextFrameNum = this.getFrameNumById(frameId);
      }

      // console.log('recaptcha response: ', grecaptcha.getResponse(0));

      this.currentFrameNum = nextFrameNum;
    },
    handleRadioClick: function(opt) {
      if (opt.vModel == 'selectedTeam') {
        this.selectedTeam = opt.value;
        this.goToFrame('teamFields');

      } else if (opt.vModel == 'selectedTopic1' || opt.vModel == 'selectedTopic2') {
        // Set the selected topic
        if (opt.vModel == 'selectedTopic1') {
          this.selectedTopic1 = opt.value || opt.label;
          this.selectedTopic2 = null;
          // For some reason, Vue doesn't want to uncheck the radios for selectedTopic2,
          // so we're going to have ES6 do it. Not ideal
          let theSelectedTopic2Inputs = document.querySelectorAll('#gov-fec-contact-app input[name="elem_selectedTopic2"]:checked');
          theSelectedTopic2Inputs.forEach(el => {
            el.checked = false;
          });

          this.userSubject = null;
          this.selectedTeam = opt.value == 'NEXT' ? null : opt.team;

        } else if (opt.vModel == 'selectedTopic2') {
          this.selectedTopic2 = opt.value || opt.label;
          this.userSubject = null;
          this.selectedTeam = opt.team;

        }

        // Should we also pre-select the subject?
        if (opt.teamSubject && opt.teamSubject != '' && this.selectedTeam) {
          try {
            const teamSubjects = this.teams[this.selectedTeam].fields.subject;
            let newSubject = '';
            for (let i = 0; i < teamSubjects.length; i++) {
              const testSub = teamSubjects[i];
              if (testSub.value == opt.teamSubject || testSub.label == opt.teamSubject) {
                newSubject = opt.teamSubject;
                break;
              }
            }
            if (newSubject != '') this.u_subject = newSubject;
          } catch(e) {
            console.log('HANDLERADIOCLICK catch! e: ', e); // eslint-disable-line no-console
          }
        } else {
          console.log('HANDLERADIOCLICK else'); // eslint-disable-line no-console
        }
        // Show the frame
        if (opt.vModel == 'selectedTopic1' && this.selectedTopic1 == 'NEXT') this.goToFrame('topics2');
        else this.goToFrame('teamFields');
      }
    },
    restart: function() {
      // reset vars
      this.currentFrameNum = 0;
      this.TESTSHOULDFAIL = false;
      this.u_pubs = [];
      ['submissionMessages', 'selectedTeam', 'selectedTopic1', 'selectedTopic2', 'u_city',
      'u_committee', 'u_email', 'u_message', 'u_name', 'u_state', 'u_street1', 'u_street2',
      'u_subject', 'u_zip'].forEach(varName => {
        this[varName] = '';
      });

      let theCheckedInputElements = document.querySelectorAll('#gov-fec-contact-app input:checked');
      theCheckedInputElements.forEach(el => {
        el.checked = false;
      });
      // TODO - a better way to reset all the form values?
      let theForm = document.querySelector('form.frames');
      theForm.reset();
    },
    finishSubmission: function(responseOrData, submissionBody) {
      console.log('finishSubmission(responseOrData, submissionBody): ', responseOrData, submissionBody); // eslint-disable-line no-console
      // If there's a responseOrData.status, it's an error
      const currentTeam = this.teams[this.selectedTeam];
      this.submissionMessages = '';

      if (!responseOrData.status) {
        this.submissionMessages = {
          success: true,
          headline: 'Success! Your message has been submitted.',
          message: currentTeam.success || 'We will get back to you as soon as possible.'
        };
        if (currentTeam.successMore) {
          this.submissionMessages.successMore = currentTeam.successMore;
        }
      } else {

        // this.selectedTeam;
        let recipient = currentTeam.ePrefix;

        for (let i = 0; i < currentTeam.fields.subject.length; i++) {
          const thisSubject = currentTeam.fields.subject[i];
          if (thisSubject.label == this.userSubject) {
            recipient = thisSubject.ePrefix;
            break;
          }
        }
        if (!recipient) recipient = 'info';
        recipient += '@fec.gov';

        let readableMessage = '';
        if (this.u_name) readableMessage += `<strong>NAME:</strong>\n${this.u_name}<br>`;
        readableMessage += `<strong>EMAIL ADDRESS:</strong>\n${this.u_email}<br>`;
        if (this.u_committee) readableMessage += `<strong>COMMITTEE ID:</strong>\n${this.u_committee}<br>`;
        if (this.u_subject == 'publications') {
          readableMessage += `<strong>MAILING ADDRESS:</strong><br>${this.u_street1}<br>`;
          if (this.u_street2) readableMessage += `${this.u_street2}<br>`;
          readableMessage += `${this.u_city} ${this.u_state}  ${this.u_zip}<br><br>`;
          readableMessage += '<strong>REQUESTED PUBLICATIONS:</strong><br>';
          for (let i = 0; i < this.u_pubs.length; i++) {
            readableMessage += this.u_pubs[i].qty;
            readableMessage += this.u_pubs[i].qty == 1 ? ' copy of ' : ' copies of ';
            readableMessage += `'${this.u_pubs[i].label}'<br>`;
          }
          // readableMessage += '<br>';
        }
        if (this.u_message) readableMessage += `<strong>MESSAGE:</strong><br>${this.u_message}`;

        const subject = `Request from fec.gov: ${submissionBody.u_category}`;
        const emailLinkSubject = `Assistance Request: ${submissionBody.u_category}`;
        const scrubbedMessage = readableMessage.replace(/<strong>|<\/strong>/g, '').replace(/<br>/g, '\n');
        const emailLinkBody = `I'd like help from the ${this.teams[this.selectedTeam].name} team.\n\n${scrubbedMessage}`;

        const linkEmail = `mailto://${recipient}&subject=${emailLinkSubject}&body=${emailLinkBody}`;
        const linkGmail = `https://mail.google.com/mail/?view=cm&fs=1&su=${emailLinkSubject}&body=${emailLinkBody}&to=${recipient}`;
        const linkYahoo = `http://compose.mail.yahoo.com/?subj=${emailLinkSubject}&body=${emailLinkBody}&to=${recipient}`;
        const linkLive = `https://outlook.live.com/default.aspx?rru=compose&subject=${emailLinkSubject}&body=${emailLinkBody}&to=${recipient}`;
        const linkAol = `http://mail.aol.com/mail/compose-message.aspx?subject=${emailLinkSubject}&body=${emailLinkBody}&to=${recipient}`;

        this.submissionMessages = {
          success: false,
          headline: 'Unable to send your message at this time.',
          message: `<strong>Submitting your message has failed.</strong> You’re welcome to try again, call the FEC offices,
            or use the content below to send your message through another platform.<br><br>
            <strong>To:</strong> ${recipient}<br><br>
            <strong>Subject:</strong> ${subject}<br><br>
            ${readableMessage}`,
          recipient: recipient,
          emailLinks: [
            {
              label: 'e',
              href: encodeURI(linkEmail)
            },
            {
              label: 'G',
              href: encodeURI(linkGmail)
            },
            {
              label: 'Y!',
              href: encodeURI(linkYahoo)
            },
            {
              label: 'H',
              href: encodeURI(linkLive)
            },
            {
              label: 'A',
              href: encodeURI(linkAol)
            }
          ]
        };
      }

      this.currentFrameNum = this.getFrameNumById('acknowledgeSubmission');
      // console.log('App.finishSubmission(var1): ', e, submissionBody);
      this.isSubmitting = false;
    },
    startSubmission: function() {
      this.isSubmitting = true;

      const submissionBody = {
        // selectedTeam: this.selectedTeam,
        // selectedTopic: this.selectedTopic,
        // u_pubs: this.u_pubs,
        committee_name: this.u_committee,
        u_contact_email: this.u_email,
        u_contact_first_name: this.u_name.split(' ')[0] || '',
        u_contact_last_name: this.u_name.substr(this.u_name.indexOf(' ')) || '',
        u_contact_title: '',
        u_committee: this.u_committee,
        u_category: this.u_subject,
        u_description: this.u_message,
        u_contact_city: this.u_city,
        u_contact_street1: this.u_street1,
        u_contact_street2: this.u_street2,
        u_contact_state: this.u_state,
        u_contact_zip: this.u_zip
      };

      // fetch(this.postUrl, {
      //   cache: 'no-cache',
      //   credentials: 'same-origin',
      //   method: 'POST',
      //   mode: 'cors',
      //   headers: { 'Content-Type': 'application/json' },
      //   redirect: 'follow',
      //   body: JSON.stringify(submissionBody)
      // })
      // .then(response => {
      //   console.log('response: ', response);
      //   if (response.status != 200) {
      //     this.finishSubmission(response, submissionBody);
      //     throw new Error(response);
      //   }
      //   return response.json();
      // })
      // .then(data => {
      //   console.log('  data: ', data);
      //   this.finishSubmission(data, submissionBody);
      // })
      // .catch(e => {
      //   console.log('  CATCH e: ', e);
      // });
      if (this.TESTSHOULDFAIL) {
        setTimeout(this.finishSubmission, 2000, { status: 999 }, submissionBody);
      } else {
        setTimeout(this.finishSubmission, 2000, { success: true });
      }
    },
    updateNavOptions: function(obj) {
      this.canNavBack = obj.Back;
      this.canNavNext = obj.Next;
      this.canNavRestart = obj.Restart;
      this.canNavSubmit = obj.Submit;
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
    }
  }
});
