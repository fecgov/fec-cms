// Testing

import { buildUrl } from './helpers';
import Vue from 'vue/dist/vue.js';
import typeahead from './typeahead';
// import { now } from 'jquery';

Vue.component('election-cycle-selector', {
  props: {
    electionCycle: {
      type: Number,
      required: true
    },
    cycles: {
      type: Array,
      required: true
    }
  },
  template: `
  <fieldset class="select">
    <label for="election-year" class="breakdown__title label t-inline-block">Time period: </label>
    <select
      :value="electionCycle"
      @input="$emit('input', $event.target.value)"
      id="election-year" name="cycle" class="form-element--inline" aria-controls="top-table">
      <option
        v-for="item in cycles"
          :value="item.value"
          :selected="electionCycle == item.value ? 'selected' : false"
        >{{ item.label }}
      </option>
    </select>
</fieldset>
  `
});

Vue.component('typeahead', {
  props: {
    id: {
      type: Number,
      required: true
    },
    isDisabled: {
      type: Boolean,
      required: true
    }
  },
  template: `
    <div class="ta">
      <label class="label" v-bind:for="'pac-comparator-typeahead-' + id">Committee name or ID</label>
      <div class="combo combo--search--mini filter__typeahead">
        <ul class="dropdown__selected"></ul>
        <input
          :id="'pac-comparator-typeahead-' + id"
          :disabled="isDisabled ? 'disabled' : false"
          :aria-readonly="isDisabled"
          type="text" class="combo__input">
        <button
          :disabled="isDisabled ? 'disabled' : false"
          :aria-readonly="isDisabled"
          class="combo__button button--search button--standard" type="button">
          <span class="u-visually-hidden">Search</span>
        </button>
      </div>
    </div>`,
  computed: {
    //
  },
  mounted: function() {
    this.$nextTick(function() {
      // Initialize this typeahead
      this.el_typeahead = new typeahead.Typeahead(
        '#pac-comparator-typeahead-' + this.id,
        'committees'
      );
      // Remove the typeahead default action and assign ours
      this.el_typeahead.$input.off('typeahead:select');
      this.el_typeahead.$input.on(
        'typeahead:select',
        this.handleSelect.bind(this)
      );
    });
  },
  methods: {
    handleSelect: function(jQueryEvent, typeaheadResults) {
      this.$emit('typeahead-select', typeaheadResults, this);
    }
  }
});

Vue.component('pac-details', {
  props: {
    data: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  template: `<div class="committee-details">
    <h1 v-if="data.dataSummary.name">{{ data.dataSummary.name }} <span v-if="data.calc.pacType">({{ data.calc.pacType }})</span></h1>
    <h2 v-if="data.calc.totDisburseStr"><i :class="['icon-pac', 'pac-' + index]"></i>{{ data.calc.totDisburseStr }}</h2>
    <h3 v-if="data.calc.coverageDatesStatement">{{ data.calc.coverageDatesStatement }}</h3>
    <div v-if="data.errorMessage != ''" class="message__error">{{ data.errorMessage }}</div>
    <div v-else-if="data.isLoading == true">
      <div colspan="2" class="overlay__container">
        <div class="overlay is-loading">&nbsp;</div>
      </div>
    </div>
  </div>`,
  methods: {
    formatAsCurrency: function(passedValue) {
      // if it's not a number, return it
      if (passedValue === '' || passedValue === null || isNaN(passedValue))
        return passedValue;
      else return '$' + passedValue.toLocaleString(); // otherwise format it as money
    }
  } // /methods
});

Vue.component('slider', {
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  template: `
    <div
      class="slider"
    >
      <i
        :style="'left: ' + Math.min(data.v0, 100) + '%'"
        class="icon-pac pac-0">&nbsp;</i>
      <i
        :style="'left: ' + Math.min(data.v1, 100) + '%'"
        class="icon-pac pac-1">&nbsp;</i>
      &nbsp;
  </div>
  `
});

Vue.component('sliders', {
  props: {
    pacs: {
      type: Array,
      required: true
    },
    sliderWidth: {
      type: Number,
      required: true
    }
  },
  template: `
  <table class="sliders">
    <thead>
      <tr>
        <th>Expenditure type</th>
        <th>Percentage of total expenditures</th>
        <th colspan="2">Totals</th>
      </tr>
      <tr>
        <th>&nbsp;</th>
        <th>&nbsp;</th>
        <th class="t-right-aligned"><i class="icon-pac pac-0">&nbsp;</i></th>
        <th class="t-right-aligned"><i class="icon-pac pac-1">&nbsp;</i></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="root in ['operExpend', 'contribs', 'indExpend', 'otherSpending']">
        <th>{{ pacs[0].calc[root + 'Label'] }}</th>
        <td class="meters" role="graphics-dataline">
          <slider
            :data="{'v0': pacs[0].calc[root + 'Pct'] * 100, 'v1': pacs[1].calc[root + 'Pct'] * 100, 'width': sliderWidth}"
          ></slider>
        </td>
        <td class="t-right-aligned t-mono">
          <span>{{ pacs[0].calc[root + 'PctStr'] }}</span>
          <span>{{ pacs[0].calc[root + 'Str'] }}</span>
        </td>
        <td class="t-right-aligned t-mono">
          <span>{{ pacs[1].calc[root + 'PctStr'] }}</span>
          <span>{{ pacs[1].calc[root + 'Str'] }}</span>
        </td>
      </tr>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th>&nbsp;</th>
        <th class="ticks">
          <span class="rule" role="display-only">&nbsp;</span>
          <span class="tick" role="graphics-tick">0%</span>
          <span class="tick" role="graphics-tick">25%</span>
          <span class="tick" role="graphics-tick">50%</span>
          <span class="tick" role="graphics-tick">75%</span>
          <span class="tick" role="graphics-tick">100%</span>
        </th>
        <th>&nbsp;</th>
        <th>&nbsp;</th>
      </tr>
    </tfoot>
  </table>
  `
});

Vue.component('sliderBar', {
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  template: `
    <div
      class="slider bars"
    >
      <i
        :style="'width: ' + Math.min(data.v0, 100) + '%'"
        class="icon-pac icon-bar pac-0">&nbsp;</i>
      <i
        :style="'width: ' + Math.min(data.v1, 100) + '%'"
        class="icon-pac icon-bar pac-1 ">&nbsp;</i>
      &nbsp;
  </div>
  `
});

Vue.component('barsH', {
  props: {
    pacs: {
      type: Array,
      required: true
    },
    sliderWidth: {
      type: Number,
      required: true
    }
  },
  template: `
  <table class="sliders">
    <thead>
      <tr>
        <th>Expenditure type</th>
        <th>Percentage of total expenditures</th>
        <th colspan="2">Totals</th>
      </tr>
      <tr>
        <th>&nbsp;</th>
        <th>&nbsp;</th>
        <th class="t-right-aligned"><i class="icon-pac pac-0">&nbsp;</i></th>
        <th class="t-right-aligned"><i class="icon-pac pac-1">&nbsp;</i></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="root in ['operExpend', 'contribs', 'indExpend', 'otherSpending']">
        <th>{{ pacs[0].calc[root + 'Label'] }}</th>
        <td class="meters" role="graphics-dataline">
          <sliderBar
            :data="{'v0': pacs[0].calc[root + 'Pct'] * 100, 'v1': pacs[1].calc[root + 'Pct'] * 100, 'width': sliderWidth}"
          ></sliderBar>
        </td>
        <td class="t-right-aligned t-mono">
          <span>{{ pacs[0].calc[root + 'PctStr'] }}</span>
          <span>{{ pacs[0].calc[root + 'Str'] }}</span>
        </td>
        <td class="t-right-aligned t-mono">
          <span>{{ pacs[1].calc[root + 'PctStr'] }}</span>
          <span>{{ pacs[1].calc[root + 'Str'] }}</span>
        </td>
      </tr>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th>&nbsp;</th>
        <th class="ticks">
          <span class="rule" role="display-only">&nbsp;</span>
          <span class="tick" role="graphics-tick">0%</span>
          <span class="tick" role="graphics-tick">25%</span>
          <span class="tick" role="graphics-tick">50%</span>
          <span class="tick" role="graphics-tick">75%</span>
          <span class="tick" role="graphics-tick">100%</span>
        </th>
        <th>&nbsp;</th>
        <th>&nbsp;</th>
      </tr>
    </tfoot>
  </table>
  `
});

Vue.component('barV', {
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data: function() {
    return {
      labelPos: { top: '0px;' }
    };
  },
  template: `
  <i
    :style="'height: ' + Math.min(data.pct * 100, 100) + '%'"
    :class="data.barClasses"
    >
    <label :class="{above: data.pct < 0.5}"><span>{{ data.pctStr }}</span><span>{{ data.vStr }}</span></label>
  </i>
  `
});

Vue.component('barsV', {
  props: {
    pacs: {
      type: Array,
      required: true
    }
  },
  template: `
  <div class="barsV">
    <figure
      v-for="root in ['operExpend', 'contribs', 'indExpend', 'otherSpending']">
      <div class="bar-v-group">
        <barV
          :data="{
            'pct': pacs[0].calc[root + 'Pct'],
            'pctStr': pacs[0].calc[root + 'PctStr'],
            'vStr': pacs[0].calc[root + 'Str'],
            'barClasses': 'icon-pac icon-bar-v pac-0'
          }"
        ></barV>
        <barV
          :data="{
            'pct': pacs[1].calc[root + 'Pct'],
            'pctStr': pacs[1].calc[root + 'PctStr'],
            'vStr': pacs[1].calc[root + 'Str'],
            'barClasses': 'icon-pac icon-bar-v pac-1'
          }"
        ></barV>
      </div>
      <figcaption>{{ pacs[0].calc[root + 'Label'] }}</figcaption>
    </figure>
  </div>
  `
});

new Vue({
  el: '#pac-comparator',
  data: {
    election_cycle: 2020, // Used for queries
    electionCycles: [], // Values for the <select>
    sliderWidth: 100,
    typeaheads: [{ key: 'taSlot0' }, { key: 'taSlot1' }],
    pacs: [
      {
        key: 'pacSlot0',
        calc: { contribs: 0, indExpend: 0, operExpend: 0, otherSpending: 0 }, // Calculated values (derived from dataDetails when they're loaded)
        cmteDetails: {}, // Details about the committee org
        dataDetails: {}, // Committee's financial query results
        dataSummary: { id: '', name: '' }, // Typeahead results
        errorMessage: '', // Triggers error messages
        isLoading: false // Controls visual indicator and deactivates typeahead
      },
      {
        key: 'pacSlot1',
        calc: { contribs: 0, indExpend: 0, operExpend: 0, otherSpending: 0 },
        cmteDetails: {},
        dataDetails: {},
        dataSummary: { id: '', name: '' },
        errorMessage: '',
        isLoading: false
      }
    ]
  },
  template: `<div id="pac-comparator">
    <h3>Compare nonconnected political action committee spending</h3>
    <div class="controls-holder">
      <div class="top-left">
        <election-cycle-selector
          :cycles="electionCycles"
          :election-cycle="election_cycle"
          @input="handleElectionYearChange"
        ></election-cycle-selector>
      </div>
      <div class="top-right">
        <div class="typeaheads-holder">
          <typeahead
            v-for="(item, index) in typeaheads"
            :id="index"
            :is-disabled="pacs[index].isLoading"
            :key="item.key"
            @typeahead-select=handleTypeaheadSelect
          ></typeahead>
        </div>
        <div class="committees-holder">
          <pac-details
            v-for="(item, index) in pacs"
            :data="item"
            :index="index"
            :key="item.key"
          ></pac-details>
        </div>
      </div>
    </div>
    <div class="charts-holder">
      <sliders
        :pacs="pacs"
        :slider-width="sliderWidth">
      </sliders>
      <barsH
        :pacs="pacs"
        :slider-width="sliderWidth">
      </barsH>
      <barsV
        :pacs="pacs">
      </barsV>
    </div>
  </div>`,
  beforeMount: function() {
    // Build the list of election cycles
    for (let i = 2020; i >= 1980; i -= 2) {
      this.electionCycles.push({ value: i, label: `${i - 1}-${i}` });
    }

    // Init (reset) pac values
    this.calcPacValues(null, { reset: true });

    // Listen to window resize to determine internet component sizes
    window.addEventListener('resize', this.handleWindowResize);
    // And grab the width now
    this.sliderWidth = this.$el.offsetWidth * 0.45;
  },
  methods: {
    handleElectionYearChange: function(newValue) {
      this.election_cycle = parseInt(newValue);
      // Check the pacs that are currently loaded and load either that need it
      for (let i = 0; i < this.pacs.length; i++) {
        if (this.pacs[i].dataSummary.id != '')
          this.startLoadingCommitteeData(i);
      }
    },
    handleTypeaheadSelect: function(typeaheadResults, vueComponent) {
      this.pacs[vueComponent.id].dataSummary = typeaheadResults;
      this.pacs[vueComponent.id].cmteDetails = {}; // reset committee details
      this.pacs[vueComponent.id].dataDetails = {}; // reset committee data
      this.calcPacValues(vueComponent.id, { reset: true }); // reset calculated fields
      this.startLoadingCommitteeData(vueComponent.id);
    },
    handleCommitteeHeaderClick: function(
      buttonActionID,
      clickedCommitteeSlotID
    ) {
      for (let i = 0; i < this.committeeSlots.length; i++) {
        if (this.committeeSlots[i].slotID == clickedCommitteeSlotID) {
          if (buttonActionID == 'clear') {
            this.resetCommitteeSlot(this.committeeSlots[i]);
          } else {
            if (buttonActionID == 'left') {
              this.committeeSlots[i - 1].displayOrder++;
              this.committeeSlots[i].displayOrder--;
            } else if (buttonActionID == 'right') {
              this.committeeSlots[i].displayOrder++;
              this.committeeSlots[i + 1].displayOrder--;
            }
            this.committeeSlots.sort(function(a, b) {
              return a.displayOrder - b.displayOrder;
            });
            break;
          }
        }
      }
    },
    startLoadingCommitteeData: function(typeaheadsArrayPos) {
      // this.typeaheads[typeaheadsArrayPos].isDisabled = true;
      console.log('startLoadingCommitteeData(): ', typeaheadsArrayPos);

      let instance = this;
      // instance.isLoading = true;
      this.pacs[typeaheadsArrayPos].errorMessage = '';
      this.pacs[typeaheadsArrayPos].isLoading = true;
      window
        .fetch(
          buildUrl(
            [
              'committee',
              this.pacs[typeaheadsArrayPos].dataSummary.id,
              'totals'
            ],
            {
              cycle: this.election_cycle,
              per_page: 100,
              sort_null_only: false,
              sort_hide_null: false,
              sort_nulls_last: false,
              page: 1
            },
            {
              cache: 'no-cache',
              mode: 'no-cors', // TODO: change this to 'cors'
              signal: null
            }
          )
        )
        .then(response => {
          console.log('data fetch.then response: ', response);
          if (response.status !== 200)
            throw new Error('ERROR:REJECTED_DATA_REQUEST', response); // (throw error, be done)
          // else if (response.type == 'cors') throw new Error('CORS error');
          // If the response has a message, (otherwise, it's a data response)
          if (response.message)
            instance.handleCommitteeRequestRejected(
              response,
              this.pacs[typeaheadsArrayPos].dataSummary.id,
              this.election_cycle
            );
          else {
            response.json().then(data => {
              instance.handleCommitteeDataLoaded(data);
            });
          }
        }) // / then
        .catch(error => {
          instance.handleCommitteeRequestRejected(
            error,
            this.pacs[typeaheadsArrayPos].dataSummary.id,
            this.election_cycle
          );
        });
    },
    handleCommitteeDataLoaded: function(data) {
      console.log('handleCommitteeDataLoaded(): ', data);

      // Figger out where to put these details — let's loop through the pacs list until we find a matching ID
      if (data.results && data.results[0].committee_id) {
        let idToFind = data.results[0].committee_id;
        for (let i = 0; i < this.pacs.length; i++) {
          if (this.pacs[i].dataSummary.id == idToFind) {
            // Save the data details
            this.pacs[i].dataDetails = data.results[0];
            // And handle the quick-access values
            this.calcPacValues(i);
            // Check to make sure it's a non-connected PAC
            let isNoncomm = this.isNonconnectedPac(i);
            if (isNoncomm === true) {
              // We don't need to load the committee details so let's skip it
              this.pacs[i].isLoading = false;
            } else if (this.isNonconnectedPac(i) === 'maybe') {
              this.startLoadingCommitteeDetails(i);
            } else {
              this.pacs[i].errorMessage =
                'You entered a committee that is not a nonconnected PAC. Please enter an active nonconnected PAC name or ID.';
              this.calcPacValues(i, { reset: true });
              this.pacs[i].isLoading = false;
            }
            break; // no reason to check another
          }
        }
      }
    },
    handleCommitteeRequestRejected: function(
      error,
      requestedPacID,
      requestedElectionCycle
    ) {
      // Since we had a request rejected, let's check to make sure it's still a legit request
      // (e.g., if we requested a pac-cycle combo but the user has changed the year since then, this rejection is outdated)
      if (
        requestedElectionCycle &&
        requestedElectionCycle == this.election_cycle
      ) {
        for (let i = 0; i < this.pacs.length; i++) {
          if (this.pacs[i].dataSummary.id == requestedPacID) {
            if (error.message == 'ERROR:REJECTED_DATA_REQUEST') {
              let yearSpanStr = requestedElectionCycle - 1;
              yearSpanStr += `-${requestedElectionCycle}`;

              let message = `You entered a committee that was not active during the ${yearSpanStr} period. \
                Please enter a nonconnected PAC name or ID active during ${yearSpanStr}.`;
              this.pacs[i].errorMessage = message;
            } else {
              this.pacs[i].errorMessage = 'HANDLE THIS';
              // TODO
            }
            this.pacs[i].isLoading = false;
            // re-enable the typeahead
            break; // no reason to check another
          }
        }
      } else {
        // if the election year has changed, meh, ignore this rejection
      }
    },
    startLoadingCommitteeDetails: function(typeaheadsArrayPos) {
      // this.typeaheads[typeaheadsArrayPos].isDisabled = true;
      console.log('startLoadingCommitteeDetails(): ', typeaheadsArrayPos);

      let instance = this;

      window
        .fetch(
          buildUrl(
            ['committee', this.pacs[typeaheadsArrayPos].dataSummary.id],
            {
              per_page: 100,
              sort_null_only: false,
              sort_hide_null: false,
              sort_nulls_last: false,
              page: 1
            },
            {
              cache: 'no-cache',
              mode: 'no-cors', // TODO: change this to 'cors'
              signal: null
            }
          )
        )
        .then(response => {
          console.log('details fetch.then response: ', response);
          if (response.status !== 200)
            throw new Error('ERROR:REJECTED_DETAILS_REQUEST', response); // (throw error, be done)
          // else if (response.type == 'cors') throw new Error('CORS error');
          // If the response has a message, (otherwise, it's a data response)
          // if (response.message)
          // instance.handleCommitteeRequestRejected(
          //   response,
          //   this.pacs[typeaheadsArrayPos].dataSummary.id
          // );
          if (!response.message) {
            response.json().then(data => {
              instance.handleCommitteeDetailsLoaded(data);
            });
          }
        }) // / then
        .catch(error => {
          instance.handleCommitteeRequestRejected(
            error,
            this.pacs[typeaheadsArrayPos].dataSummary.id,
            this.election_cycle
          );
        });
    },
    handleCommitteeDetailsLoaded: function(data) {
      console.log('handleCommitteeDetailsLoaded(): ', data);
      let idToFind = data.results[0].committee_id;

      for (let i = 0; i < this.pacs.length; i++) {
        // TODO pull this into its own thing so it's not a dupe
        if (this.pacs[i].dataSummary.id == idToFind) {
          // Save the data details
          this.pacs[i].cmteDetails = data.results[0];

          // Check to make sure it's a non-connected PAC
          if (this.isNonconnectedPac(i) == false)
            this.pacs[i].errorMessage =
              'You entered a committee that is not a nonconnected PAC. Please enter an active nonconnected PAC name or ID.';

          this.pacs[i].isLoading = false;
          break; // no reason to check another
        }
      }
    },
    handleWindowResize: function() {
      this.sliderWidth = this.$el.offsetWidth / 2;
    },
    /**
     * The rules are complicated for whether a committee is nonconnected so they're their own function
     * @returns {(Boolean|String)} Boolean if a committee IS or is NOT a nonconnected committee, 'maybe' if more data is needed (i.e., organization_type)
     * TODO: move this to calcPacValues when the API returns a is_nonconnected value
     */
    isNonconnectedPac: function(pacSlotPos) {
      /* Valid rules to find nonconnected committees:
        1. committee type in            [O, U, V, W]
        2. committee designation NOT in [A, J, P]
        OR
        1. committee type in            [N, Q]
        2. committee designation NOT in [A, J, P]
        3. org type NOT in              [C, L, M, T, W]
      */
      let cType = this.pacs[pacSlotPos].dataDetails.committee_type;
      let cDesig = this.pacs[pacSlotPos].dataDetails.committee_designation;
      let oType = false;
      if (
        this.pacs[pacSlotPos].cmteDetails &&
        this.pacs[pacSlotPos].cmteDetails.organization_type !== undefined
      )
        oType = String(this.pacs[pacSlotPos].cmteDetails.organization_type);

      let validCmteTypesWithOrgType = ['O', 'U', 'V', 'W'];
      let validCmteTypesWithoutOrgType = ['N', 'Q'];
      let invalidOrgTypes = ['C', 'L', 'M', 'T', 'W'];
      let invalidDesigs = ['A', 'J', 'P'];

      let toReturn = false;

      if (invalidDesigs.includes(cDesig)) {
        // If we have an invalid designation, it's not nonconnected
        // We'll let toReturn stay false
      } else if (validCmteTypesWithoutOrgType.includes(cType)) {
        // If the committee type doesn't need an org type, we're safe to return
        // Designation is valid (from the if)
        toReturn = true;
      } else if (oType === false) {
        // oType is false if we don't have committee details yet (which includes org type)
        toReturn = 'maybe';
      } else if (
        validCmteTypesWithOrgType.includes(cType) &&
        !invalidOrgTypes.includes(oType)
      ) {
        // We've made it to the committee types that need an org type so we need those details
        // If oType is false, we haven't loaded the committee details yet
        toReturn = true;
      }

      return toReturn;
    },
    /**
     *
     * @param {(number|null)} pacSlotPos Indicates which this.pacs to save. A null value will reset all of them regardless of options.reset
     * @param {Object} options Object
     * @param {Boolean} options.reset Used to reset an item in this.pacs
     */
    calcPacValues: function(pacSlotPos, options = { reset: false }) {
      let d = this.pacs[pacSlotPos] ? this.pacs[pacSlotPos].dataDetails : {};

      let toReturn = {
        // Default, universal
        contribsLabel: 'Contributions to federal candidates / committees',
        indExpendLabel: 'Independent expenditures',
        operExpendLabel: 'Operating expenditures',
        otherSpendingLabel: 'Other spending'
      };

      // If we need to reset, let's just do that and jump out
      if (options.reset === true) {
        toReturn = Object.assign(toReturn, {
          pacType: '',
          coverageDatesStatement: '',
          totDisburse: 0,
          totDisburseStr: '',
          contribs: 0,
          contribsStr: '',
          contribsPct: 0,
          contribsPctStr: '',
          indExpend: 0,
          indExpendStr: '',
          indExpendPct: 0,
          indExpendPctStr: '',
          operExpend: 0,
          operExpendStr: '',
          operExpendPct: 0,
          operExpendPctStr: '',
          otherSpending: 0,
          otherSpendingStr: '',
          otherSpendingPct: 0,
          otherSpendingPctStr: ''
        });

        if (options.reset === true && pacSlotPos === null) {
          // If there's no slot provided, let's hit them all
          for (let i = 0; i < this.pacs.length; i++) {
            this.pacs[i].calc = toReturn;
          }
        } else if (options.reset === true && this.pacs[pacSlotPos]) {
          this.pacs[pacSlotPos].calc = toReturn;
        }
        return;
      }
      // Total disbursements
      toReturn.totDisburse = d.disbursements;
      toReturn.totDisburseStr = this.formatAsCurrency(d.disbursements);

      // PAC type
      toReturn.pacType = d.committee_type;

      // Coverage dates string
      toReturn.coverageDatesStatement = '';
      if (d.coverage_start_date && d.coverage_end_date) {
        let dateFormatOptions = {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          timeZone: 'GMT'
        };
        let startDate = new Date(d.coverage_start_date).toLocaleDateString(
          'us-EN',
          dateFormatOptions
        );
        let endDate = new Date(d.coverage_end_date).toLocaleDateString(
          'us-EN',
          dateFormatOptions
        );
        toReturn.coverageDatesStatement = `total expenditures from ${startDate}-${endDate}`;
      }

      // Operating expenditures
      toReturn.operExpend = 0;
      toReturn.operExpendStr = '';
      toReturn.operExpendPct = 0;
      toReturn.operExpendPctStr = '';
      if (
        d.other_fed_operating_expenditures ||
        d.other_fed_operating_expenditures === 0
      ) {
        toReturn.operExpend = d.other_fed_operating_expenditures;
        toReturn.operExpendStr = this.formatAsCurrency(
          d.other_fed_operating_expenditures,
          true
        );
        toReturn.operExpendPct = toReturn.operExpend / toReturn.totDisburse;
        toReturn.operExpendPctStr = this.percentString(toReturn.operExpendPct);
      }

      // Contributions to federal candidates / committees
      toReturn.contribs = 0;
      toReturn.contribsStr = '';
      toReturn.contribsPct = 0;
      toReturn.contribsPctStr = '';
      if (
        d.fed_candidate_committee_contributions ||
        d.fed_candidate_committee_contributions === 0
      ) {
        toReturn.contribs = d.fed_candidate_committee_contributions;
        toReturn.contribsStr = this.formatAsCurrency(toReturn.contribs, true);
        toReturn.contribsPct = toReturn.contribs / toReturn.totDisburse;
        toReturn.contribsPctStr = this.percentString(toReturn.contribsPct);
      }

      // Independent expenditures
      toReturn.indExpend = 0;
      toReturn.indExpendStr = '';
      toReturn.indExpendPct = 0;
      toReturn.indExpendPctStr = '';
      if (d.independent_expenditures || d.independent_expenditures === 0) {
        toReturn.indExpend = d.independent_expenditures;
        toReturn.indExpendStr = this.formatAsCurrency(toReturn.indExpend, true);
        toReturn.indExpendPct = toReturn.indExpend / toReturn.totDisburse;
        toReturn.indExpendPctStr = this.percentString(toReturn.indExpendPct);
      }

      // Other spending
      toReturn.otherSpending = 0;
      toReturn.otherSpendingStr = '';
      toReturn.otherSpendingPct = 0;
      toReturn.otherSpendingPctStr = '';
      // To make the code shorter, here's a list of var names included with otherSpending
      let otherSpend = [
        'contribution_refunds',
        'coordinated_expenditures_by_party_committee',
        'fed_election_activity',
        'loan_repayments',
        'loans_made',
        'other_disbursements',
        'transfers_to_affiliated_committee'
      ];
      otherSpend.forEach(value => {
        if (d[value]) toReturn.otherSpending += d[value];
      });
      toReturn.otherSpendingStr = this.formatAsCurrency(toReturn.otherSpending);
      toReturn.otherSpendingPct = toReturn.otherSpending / toReturn.totDisburse;
      toReturn.otherSpendingPctStr = this.percentString(
        toReturn.otherSpendingPct
      );

      // Put the values onto this.pacs
      this.pacs[pacSlotPos].calc = toReturn;
    },
    formatAsCurrency: function(passedValue, roundToWhole) {
      // If it's invalid, just send it back
      if (passedValue === '' || passedValue === null || isNaN(passedValue))
        return passedValue;

      // Round if we should
      let toReturn = roundToWhole ? Math.round(passedValue) : passedValue;
      return '$' + toReturn.toLocaleString(); // otherwise format it as money
    },
    percentString: function(val) {
      let v = val * 100;
      if (val === 0) return '0%';
      else return v < 1 ? '<1%' : `${Math.round(v)}%`;
    }
  }
});
