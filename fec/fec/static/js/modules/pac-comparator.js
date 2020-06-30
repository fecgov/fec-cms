// Testing

import { buildUrl } from './helpers';
import Vue from 'vue/dist/vue.js';
import typeahead from './typeahead';

Vue.component('typeahead-control', {
  template: `
    <div class="combo combo--search--mini filter__typeahead">
      <ul class="dropdown__selected"></ul>
      <input id="pac-comparator-typeahead" type="text" class="combo__input">
      <button class="combo__button button--search button--standard" type="button">
        <span class="u-visually-hidden">Search</span>
      </button>
    </div>`
});

Vue.component('committee-data', {
  props: {
    slotID: {
      type: Number,
      required: true
    },
    committeeSummary: {
      type: Object,
      required: false
    },
    isEmpty: {
      type: Boolean,
      required: true
    }
  },
  data: function() {
    return {
      results_typeAhead_default: [
        {
          name: '',
          id: 'C00703975',
          is_active: true,
          type: 'committee'
        }
      ],
      results_default: [{}],
      results_typeAhead: {},
      results: [{}],
      isLoading: false,
      testingLoopCount: 0
    };
  },
  template: `<aside
    class="committee-details">
    <div class="controls">
      <button class="btn-lft" v-on:click="handleButtonClick('left', $event)">◀️</button>
      <button class="btn-cls" v-on:click="handleButtonClick('clear', $event)">❎</button>
      <button class="btn-rgt" v-on:click="handleButtonClick('right', $event)">▶️</button>
    </div>
    <h1>{{ this.committeeSummary.name }}</h1>
    <h4>({{ this.committeeSummary.id }})</h4>
    <table>
      <tbody>
        <tr v-if="this.isLoading == true">
          <td colspan="2" class="overlay__container">
            <div class="overlay is-loading">&nbsp;</div>
          </td>
        </tr>
        <tr v-for="(value, name) in this.results[0]">
          <td class="t-bold" style="overflow:hidden">{{name}}: </td><td class="t-mono">{{ formatAsCurrency(value) }}</td>
        </tr>
      </tbody>
    </table>
  </aside>`,
  beforeMount: function() {
    this.results = this.results_default;
    // this.updateCommittee(this.defaultCommitteeID, this.defaultCommitteeName);
  },
  beforeUpdate: function(e) {
    // TODO: this gets called again and again. TODO: make it only load more data if the committee id has changed
    console.log('component updated(): ', e);
    this.getUpdatedCommitteeDetails();
    // console.log('components updated.$nextTick');
    // this.$nextTick(function() {
    //   console.log('components updated.$nextTick');
    // })
  },
  methods: {
    handleButtonClick: function(buttonActionID, e) {
      this.$emit('committee-header-click', buttonActionID, this.slotID, e);
    },
    formatAsCurrency: function(passedValue) {
      if (!passedValue) return passedValue;
      // if null, just return and be done
      else if (isNaN(passedValue)) return passedValue;
      // if it's not a number, return it
      else if (
        passedValue.toString().indexOf('.') !=
        passedValue.toString().length - 3
      )
        return passedValue;
      // if there's no decimal + two characters, return it because it's probably not money
      else return '$' + passedValue.toLocaleString(); // otherwise format it as money
      // (
      // '$' +
      // (roundToWhole
      //   ? Math.round(passedValue).toLocaleString()
      // : passedValue.toLocaleString())
      // );
    },
    getUpdatedCommitteeDetails: function() {
      console.log('getUpdatedCommitteeDetails()');
      console.log('this.testingLoopCount: ', this.testingLoopCount);
      if (
        !this.isLoading &&
        this.committeeSummary.id != this.results_typeAhead_default.id &&
        this.testingLoopCount < 2
      ) {
        console.log('  if()');
        this.testingLoopCount++; // TODO remove this
        let instance = this;
        instance.isLoading = true;
        window
          .fetch(
            buildUrl(
              ['committee', this.committeeSummary.id, 'totals'],
              {
                election_year: '2020',
                per_page: 100,
                sort_null_only: false,
                sort_hide_null: false,
                sort_nulls_last: false,
                page: 1
              },
              {
                cache: 'no-cache',
                mode: 'cors',
                signal: null
              }
            )
          )
          .then(function(response) {
            console.log('fetch.then response: ', response);
            if (response.status !== 200)
              throw new Error(
                'The network rejected the candidate details request.'
              );
            // else if (response.type == 'cors') throw new Error('CORS error');
            response.json().then(data => {
              instance.claimUpdatedCommitteeDetails(data);
            });
          }); // /then
      } // /if
    }, // /getUpdatedDetails
    claimUpdatedCommitteeDetails: function(data) {
      console.log('claimUpdatedCommitteeDetails(): ', data);
      this.results = data.results;
      console.log('claimUpdatedCommitteeDetails(): ', data);
      this.isLoading = false;
    }
  } // /methods
});

new Vue({
  el: '#pac-comparator',
  data: {
    showingMaxCommittees: false,
    maxCommitteesToCompare: 2,
    committeeSlots: [
      {
        slotID: 0,
        cSummary: { name: 'Committee 0' },
        isEmpty: true,
        displayOrder: 0
      },
      {
        slotID: 1,
        cSummary: { name: 'Committee 1' },
        isEmpty: true,
        displayOrder: 1
      },
      {
        slotID: 2,
        cSummary: { name: 'Committee 2' },
        isEmpty: true,
        displayOrder: 2
      },
      {
        slotID: 3,
        cSummary: { name: 'Committee 3' },
        isEmpty: true,
        displayOrder: 3
      }
    ],
    el_typeahead: ''
  },
  template: `<div>
    <h3>PAC Comparator</h3>
    <typeahead-control
      :is-disabled="showingMaxCommittees"
    ></typeahead-control>
    <div class="committees-holder">
      <committee-data
        v-for="(committee, index) in committeeSlots"
        v-if="index < maxCommitteesToCompare"
        :cID="committee.cID"
        :committeeSummary="committee.cSummary"
        :isEmpty="committee.isEmpty"
        :slotID="committee.slotID"
        :key="committee.displayOrder"
        @committee-header-click="handleCommitteeHeaderClick"
      >
      </committee-data>
    </div>
  </div>`,
  methods: {
    handleTypeaheadSelect: function(jQueryEvent, e, typeaheadType) {
      this.setNewCommittee(e);
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
    setNewCommittee: function(typeaheadEvent) {
      let haveSetIt = false;
      for (
        let i = 0;
        i < this.committeeSlots.length && i < this.maxCommitteesToCompare;
        i++
      ) {
        if (this.committeeSlots[i].isEmpty == true && haveSetIt == false) {
          this.committeeSlots[i].cSummary = typeaheadEvent;
          this.committeeSlots[i].isEmpty = false;
          haveSetIt = true;
        }
      }
      this.typeahead_updateActiveState();
    },
    resetCommitteeSlot: function(committeeSlotToClear) {
      let toClear = committeeSlotToClear;
      toClear.isEmpty = true;
      toClear.cSummary = {
        name: '—',
        id: 'C00703975',
        is_active: true,
        type: 'committee'
      };
      this.typeahead_updateActiveState();
    },
    typeahead_updateActiveState: function() {
      let committeesShowing = 0;
      for (
        let i = 0;
        i < this.committeeSlots.length && i < this.maxCommitteesToCompare;
        i++
      ) {
        if (!this.committeeSlots[i].isEmpty) committeesShowing++;
      }
      if (committeesShowing >= this.maxCommitteesToCompare) {
        this.el_typeahead.$input[0].setAttribute('disabled', 'disabled');
        this.el_typeahead.$input[0].setAttribute('aria-readonly', 'true');
      } else {
        this.el_typeahead.$input[0].removeAttribute('disabled');
        this.el_typeahead.$input[0].setAttribute('aria-readonly', 'false');
      }
    }
  },
  mounted: function() {
    this.$nextTick(function() {
      // Initialize the typeahead
      this.el_typeahead = new typeahead.Typeahead(
        '#pac-comparator-typeahead',
        'committees'
      );
      // Remove the typeahead default action and assign ours
      this.el_typeahead.$input.off('typeahead:select');
      this.el_typeahead.$input.on(
        'typeahead:select',
        this.handleTypeaheadSelect.bind(this)
      );
    });
  }
});
