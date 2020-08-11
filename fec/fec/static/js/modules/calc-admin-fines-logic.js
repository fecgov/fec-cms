/**
 * CalcAdminFineLogic
 */

/**
 * The dates that will be available inside the admin fines calculator
 * 'latest' should be the first ([0]) item. The 'latest' set of values will be copied from the [1] value of this list
 * @param {String} value The ID used in admin fines calculator (pulled from here), but also used by {@see CalcAdminFineLogic.values }
 * @param {String} label The option shown as the list option in the calculator
 * @param {String} summary To summarize the selected item (like in the calculator's breadcrumb nav)
 */
const availableDates = [
  {
    value: 'latest',
    label: 'I haven’t been assessed a fine',
    summary: 'I haven’t been assessed: using latest fine amounts'
  },
  {
    value: '2020',
    label: 'On or after August 7, 2020',
    summary: 'Assessed on or after August 7, 2020'
  },
  {
    value: '2019',
    label: 'January 1, 2019 to August 6, 2020',
    summary: 'Assessed from January 1, 2019 to August 6, 2020'
  },
  {
    value: '2018',
    label: 'December 28, 2017 to December 31, 2018',
    summary: 'Assessed from December 28, 2017 to December 31, 2018'
  }
];

/**
 *
 */
function CalcAdminFineLogic() {
  // empty
}

/**
 * Calculates the fines based on the values its given.
 * Relies on @see availableDates @see values
 * @param {Object} d Data object
 * @param {String} d.lateOrNonFiler
 * @param {Number} d.numberOfDaysLate
 * @param {Number} d.numberOfPrevViolations
 * @param {String} d.penaltyAssessedDate The id of the date/year of the fine e.g. '2019', '2018', '2017', 'latest'
 * @param {Boolean} d.sensitiveReport
 * @param {Number} d.totalReceiptsAndDisbursements
 * @returns {Number, String}
 */
CalcAdminFineLogic.prototype.getTotalAdminFine = function(d) {
  // If the total receipts and disbursements is $0, we're done
  if (d.totalReceiptsAndDisbursements === 0) return 0;

  // If we need a 'latest' and it doesn't exist, create it from the second values item
  if (d.penaltyAssessedDate == 'latest' && !CalcAdminFineLogic.values['latest'])
    CalcAdminFineLogic.values['latest'] = [
      ...CalcAdminFineLogic.values[availableDates[1].value]
    ];

  let toReturn = '—';

  // Which set of values will we use? (which year)
  let steps = CalcAdminFineLogic.values[d.penaltyAssessedDate];

  // If we can't find the right set of values, abort
  if (!steps) return 'ERROR';

  // Go through the array until we find our maxRD
  for (let i = 0; i < steps.length; i++) {
    if (d.totalReceiptsAndDisbursements < steps[i].maxRD) {
      // When we find the right value step,
      // (i.e. this request's total receipts & disbursements < this step's maxRD value)
      if (
        d.lateOrNonFiler == 'late' &&
        (d.sensitiveReport == true || d.sensitiveReport == 'true')
      ) {
        // if it's late and IS sensitive
        toReturn =
          steps[i].lateSens_val +
          steps[i].lateSens_multi * parseInt(d.numberOfDaysLate);
      } else if (d.lateOrNonFiler == 'late') {
        // else if it's late (and NOT sensitive)
        toReturn =
          steps[i].late_val +
          steps[i].late_multi * parseInt(d.numberOfDaysLate);
      } else if (
        // else if it wasn't filed and IS sensitive
        d.lateOrNonFiler == 'non' &&
        (d.sensitiveReport == true || d.sensitiveReport == 'true')
      ) {
        toReturn = steps[i].nonfilerSens_val;
      } else if (d.lateOrNonFiler == 'non') {
        // else if it wasn't filed (and is NOT sensitive)
        toReturn = steps[i].nonfiler_val;
      }

      // If we're in the first activity tier,
      // for a late filer (not a non-filer)
      // and there are no previous violations,
      // limit fines to the total receipts and disbursements
      if (
        i == 0 &&
        (d.numberOfPrevViolations === 0 || d.numberOfPrevViolations == '0')
      )
        toReturn = Math.min(toReturn, d.totalReceiptsAndDisbursements);

      // When we find the value step we need, no reason to loop again
      break;
    }
  }

  // If we have a fine (and not error message), apply the previous violations
  if (typeof toReturn == 'number')
    toReturn *= 1 + 0.25 * d.numberOfPrevViolations;

  // If we're returning a number, we'll round it down
  if (typeof toReturn == 'number') toReturn = Math.floor(toReturn);

  // If toReturn isn't a number for some reason, let's go ahead and return 'ERROR'
  if (isNaN(toReturn)) return 'ERROR';

  return toReturn;
};

/**
 * These are the values that will be used when calculating fines for various years.
 * Should be in the format of:
 * @example
 * {
 * 'yearnumber1': [{
 *   maxRD: 5000, (total cash flow / receipts + disbursements. Actually the min value for the next step—this test should be < maxRD)
 *   late_val: 35, (base value for filed late but NOT sensitive)
 *   late_multi: 6, (multiplier for filed late but NOT sensitive)
 *   lateSens_val: 68, (base value for filed late and SENSITIVE)
 *   lateSens_multi: 13, (multiplier for filed late and SENSITIVE)
 *   nonfiler_val: 341, (base value for not filed but NOT sensitive)
 *   nonfilerSens_val: 684 (base value for not filed and SENSITIVE)
 * },
 * {
 * 'yearnumber2': [{ … }]
 * }
 * @description
 * maxRD is really the min value for the next step. calc should be `< maxRD`, not `<=`
 * The yearnumber values here should reflect those in {@see availableDates }
 */
CalcAdminFineLogic.values = {
  '2020': [
    {
      maxRD: 5000,
      late_val: 36,
      late_multi: 6,
      lateSens_val: 69,
      lateSens_multi: 13,
      nonfiler_val: 347,
      nonfilerSens_val: 696
    },
    {
      maxRD: 10000,
      late_val: 69,
      late_multi: 6,
      lateSens_val: 139,
      lateSens_multi: 13,
      nonfiler_val: 417,
      nonfilerSens_val: 834
    },
    {
      maxRD: 25000,
      late_val: 149,
      late_multi: 6,
      lateSens_val: 209,
      lateSens_multi: 13,
      nonfiler_val: 696,
      nonfilerSens_val: 1252
    },
    {
      maxRD: 50000,
      late_val: 295,
      late_multi: 28,
      lateSens_val: 445,
      lateSens_multi: 36,
      nonfiler_val: 1252,
      nonfilerSens_val: 1947
    },
    {
      maxRD: 75000,
      late_val: 445,
      late_multi: 112,
      lateSens_val: 666,
      lateSens_multi: 112,
      nonfiler_val: 3994,
      nonfilerSens_val: 4437
    },
    {
      maxRD: 100000,
      late_val: 591,
      late_multi: 149,
      lateSens_val: 886,
      lateSens_multi: 149,
      nonfiler_val: 5176,
      nonfilerSens_val: 5916
    },
    {
      maxRD: 150000,
      late_val: 886,
      late_multi: 185,
      lateSens_val: 1331,
      lateSens_multi: 185,
      nonfiler_val: 6656,
      nonfilerSens_val: 7395
    },
    {
      maxRD: 200000,
      late_val: 1185,
      late_multi: 221,
      lateSens_val: 1775,
      lateSens_multi: 221,
      nonfiler_val: 8135,
      nonfilerSens_val: 8873
    },
    {
      maxRD: 250000,
      late_val: 1479,
      late_multi: 258,
      lateSens_val: 2219,
      lateSens_multi: 258,
      nonfiler_val: 9613,
      nonfilerSens_val: 11093
    },
    {
      maxRD: 350000,
      late_val: 2219,
      late_multi: 295,
      lateSens_val: 3328,
      lateSens_multi: 295,
      nonfiler_val: 11832,
      nonfilerSens_val: 13311
    },
    {
      maxRD: 450000,
      late_val: 2959,
      late_multi: 295,
      lateSens_val: 4437,
      lateSens_multi: 295,
      nonfiler_val: 13311,
      nonfilerSens_val: 14791
    },
    {
      maxRD: 550000,
      late_val: 3697,
      late_multi: 295,
      lateSens_val: 5546,
      lateSens_multi: 295,
      nonfiler_val: 14050,
      nonfilerSens_val: 16269
    },
    {
      maxRD: 650000,
      late_val: 4437,
      late_multi: 295,
      lateSens_val: 6656,
      lateSens_multi: 295,
      nonfiler_val: 14791,
      nonfilerSens_val: 17748
    },
    {
      maxRD: 750000,
      late_val: 5176,
      late_multi: 295,
      lateSens_val: 7765,
      lateSens_multi: 295,
      nonfiler_val: 15529,
      nonfilerSens_val: 19228
    },
    {
      maxRD: 850000,
      late_val: 5916,
      late_multi: 295,
      lateSens_val: 8873,
      lateSens_multi: 295,
      nonfiler_val: 16269,
      nonfilerSens_val: 20706
    },
    {
      maxRD: 950000,
      late_val: 6656,
      late_multi: 295,
      lateSens_val: 9983,
      lateSens_multi: 295,
      nonfiler_val: 17008,
      nonfilerSens_val: 22184
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER,
      late_val: 7395,
      late_multi: 295,
      lateSens_val: 11093,
      lateSens_multi: 295,
      nonfiler_val: 17748,
      nonfilerSens_val: 23664
    }
  ],
  '2019': [
    {
      maxRD: 5000,
      late_val: 35,
      late_multi: 6,
      lateSens_val: 68,
      lateSens_multi: 13,
      nonfiler_val: 341,
      nonfilerSens_val: 684
    },
    {
      maxRD: 10000,
      late_val: 68,
      late_multi: 6,
      lateSens_val: 137,
      lateSens_multi: 13,
      nonfiler_val: 410,
      nonfilerSens_val: 820
    },
    {
      maxRD: 25000,
      late_val: 146,
      late_multi: 6,
      lateSens_val: 205,
      lateSens_multi: 13,
      nonfiler_val: 684,
      nonfilerSens_val: 1230
    },
    {
      maxRD: 50000,
      late_val: 290,
      late_multi: 28,
      lateSens_val: 437,
      lateSens_multi: 35,
      nonfiler_val: 1230,
      nonfilerSens_val: 1913
    },
    {
      maxRD: 75000,
      late_val: 437,
      late_multi: 110,
      lateSens_val: 654,
      lateSens_multi: 110,
      nonfiler_val: 3925,
      nonfilerSens_val: 4360
    },
    {
      maxRD: 100000,
      late_val: 581,
      late_multi: 146,
      lateSens_val: 871,
      lateSens_multi: 146,
      nonfiler_val: 5086,
      nonfilerSens_val: 5813
    },
    {
      maxRD: 150000,
      late_val: 871,
      late_multi: 182,
      lateSens_val: 1308,
      lateSens_multi: 182,
      nonfiler_val: 6541,
      nonfilerSens_val: 7267
    },
    {
      maxRD: 200000,
      late_val: 1164,
      late_multi: 217,
      lateSens_val: 1744,
      lateSens_multi: 217,
      nonfiler_val: 7994,
      nonfilerSens_val: 8719
    },
    {
      maxRD: 250000,
      late_val: 1453,
      late_multi: 254,
      lateSens_val: 2181,
      lateSens_multi: 254,
      nonfiler_val: 9446,
      nonfilerSens_val: 10901
    },
    {
      maxRD: 350000,
      late_val: 2181,
      late_multi: 290,
      lateSens_val: 3270,
      lateSens_multi: 290,
      nonfiler_val: 11627,
      nonfilerSens_val: 13080
    },
    {
      maxRD: 450000,
      late_val: 2908,
      late_multi: 290,
      lateSens_val: 4360,
      lateSens_multi: 290,
      nonfiler_val: 13080,
      nonfilerSens_val: 14535
    },
    {
      maxRD: 550000,
      late_val: 3633,
      late_multi: 290,
      lateSens_val: 5450,
      lateSens_multi: 290,
      nonfiler_val: 13806,
      nonfilerSens_val: 15987
    },
    {
      maxRD: 650000,
      late_val: 4360,
      late_multi: 290,
      lateSens_val: 6541,
      lateSens_multi: 290,
      nonfiler_val: 14535,
      nonfilerSens_val: 17440
    },
    {
      maxRD: 750000,
      late_val: 5086,
      late_multi: 290,
      lateSens_val: 7630,
      lateSens_multi: 290,
      nonfiler_val: 15260,
      nonfilerSens_val: 18895
    },
    {
      maxRD: 850000,
      late_val: 5813,
      late_multi: 290,
      lateSens_val: 8719,
      lateSens_multi: 290,
      nonfiler_val: 15987,
      nonfilerSens_val: 20347
    },
    {
      maxRD: 950000,
      late_val: 6541,
      late_multi: 290,
      lateSens_val: 9810,
      lateSens_multi: 290,
      nonfiler_val: 16713,
      nonfilerSens_val: 21799
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER,
      late_val: 7267,
      late_multi: 290,
      lateSens_val: 10901,
      lateSens_multi: 290,
      nonfiler_val: 17440,
      nonfilerSens_val: 23254
    }
  ],
  '2018': [
    {
      maxRD: 5000,
      late_val: 34,
      late_multi: 6,
      lateSens_val: 66,
      lateSens_multi: 13,
      nonfiler_val: 333,
      nonfilerSens_val: 667
    },
    {
      maxRD: 10000,
      late_val: 66,
      late_multi: 6,
      lateSens_val: 134,
      lateSens_multi: 13,
      nonfiler_val: 400,
      nonfilerSens_val: 800
    },
    {
      maxRD: 25000,
      late_val: 142,
      late_multi: 6,
      lateSens_val: 200,
      lateSens_multi: 13,
      nonfiler_val: 667,
      nonfilerSens_val: 1200
    },
    {
      maxRD: 50000,
      late_val: 283,
      late_multi: 27,
      lateSens_val: 426,
      lateSens_multi: 34,
      nonfiler_val: 1200,
      nonfilerSens_val: 1866
    },
    {
      maxRD: 75000,
      late_val: 426,
      late_multi: 107,
      lateSens_val: 638,
      lateSens_multi: 107,
      nonfiler_val: 3828,
      nonfilerSens_val: 4253
    },
    {
      maxRD: 100000,
      late_val: 567,
      late_multi: 142,
      lateSens_val: 850,
      lateSens_multi: 142,
      nonfiler_val: 4961,
      nonfilerSens_val: 5670
    },
    {
      maxRD: 150000,
      late_val: 850,
      late_multi: 178,
      lateSens_val: 1276,
      lateSens_multi: 178,
      nonfiler_val: 6380,
      nonfilerSens_val: 7088
    },
    {
      maxRD: 200000,
      late_val: 1135,
      late_multi: 212,
      lateSens_val: 1701,
      lateSens_multi: 212,
      nonfiler_val: 7797,
      nonfilerSens_val: 8505
    },
    {
      maxRD: 250000,
      late_val: 1417,
      late_multi: 248,
      lateSens_val: 2127,
      lateSens_multi: 248,
      nonfiler_val: 9214,
      nonfilerSens_val: 10633
    },
    {
      maxRD: 350000,
      late_val: 2127,
      late_multi: 283,
      lateSens_val: 3190,
      lateSens_multi: 283,
      nonfiler_val: 11341,
      nonfilerSens_val: 12758
    },
    {
      maxRD: 450000,
      late_val: 2836,
      late_multi: 283,
      lateSens_val: 4253,
      lateSens_multi: 283,
      nonfiler_val: 12758,
      nonfilerSens_val: 14177
    },
    {
      maxRD: 550000,
      late_val: 3544,
      late_multi: 283,
      lateSens_val: 5316,
      lateSens_multi: 283,
      nonfiler_val: 13466,
      nonfilerSens_val: 15594
    },
    {
      maxRD: 650000,
      late_val: 4253,
      late_multi: 283,
      lateSens_val: 6380,
      lateSens_multi: 283,
      nonfiler_val: 14177,
      nonfilerSens_val: 17011
    },
    {
      maxRD: 750000,
      late_val: 4961,
      late_multi: 283,
      lateSens_val: 7442,
      lateSens_multi: 283,
      nonfiler_val: 14885,
      nonfilerSens_val: 18430
    },
    {
      maxRD: 850000,
      late_val: 5670,
      late_multi: 283,
      lateSens_val: 8505,
      lateSens_multi: 283,
      nonfiler_val: 15594,
      nonfilerSens_val: 19846
    },
    {
      maxRD: 950000,
      late_val: 6380,
      late_multi: 283,
      lateSens_val: 9569,
      lateSens_multi: 283,
      nonfiler_val: 16302,
      nonfilerSens_val: 21263
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER,
      late_val: 7088,
      late_multi: 283,
      lateSens_val: 10633,
      lateSens_multi: 283,
      nonfiler_val: 17011,
      nonfilerSens_val: 22682
    }
  ],
  '2017': [
    {
      maxRD: 5000,
      late_val: 33,
      late_multi: 6,
      lateSens_val: 65,
      lateSens_multi: 13,
      nonfiler_val: 326,
      nonfilerSens_val: 654
    },
    {
      maxRD: 10000,
      late_val: 65,
      late_multi: 6,
      lateSens_val: 131,
      lateSens_multi: 13,
      nonfiler_val: 392,
      nonfilerSens_val: 784
    },
    {
      maxRD: 25000,
      late_val: 139,
      late_multi: 6,
      lateSens_val: 196,
      lateSens_multi: 13,
      nonfiler_val: 654,
      nonfilerSens_val: 1176
    },
    {
      maxRD: 50000,
      late_val: 277,
      late_multi: 26,
      lateSens_val: 417,
      lateSens_multi: 33,
      nonfiler_val: 1176,
      nonfilerSens_val: 1829
    },
    {
      maxRD: 75000,
      late_val: 417,
      late_multi: 105,
      lateSens_val: 625,
      lateSens_multi: 105,
      nonfiler_val: 3751,
      nonfilerSens_val: 4168
    },
    {
      maxRD: 100000,
      late_val: 556,
      late_multi: 139,
      lateSens_val: 833,
      lateSens_multi: 139,
      nonfiler_val: 4862,
      nonfilerSens_val: 5557
    },
    {
      maxRD: 150000,
      late_val: 833,
      late_multi: 174,
      lateSens_val: 1250,
      lateSens_multi: 174,
      nonfiler_val: 6252,
      nonfilerSens_val: 6946
    },
    {
      maxRD: 200000,
      late_val: 1112,
      late_multi: 208,
      lateSens_val: 1667,
      lateSens_multi: 208,
      nonfiler_val: 7641,
      nonfilerSens_val: 8335
    },
    {
      maxRD: 250000,
      late_val: 1389,
      late_multi: 243,
      lateSens_val: 2084,
      lateSens_multi: 243,
      nonfiler_val: 9030,
      nonfilerSens_val: 10420
    },
    {
      maxRD: 350000,
      late_val: 2084,
      late_multi: 277,
      lateSens_val: 3126,
      lateSens_multi: 277,
      nonfiler_val: 11114,
      nonfilerSens_val: 12503
    },
    {
      maxRD: 450000,
      late_val: 2779,
      late_multi: 277,
      lateSens_val: 4168,
      lateSens_multi: 277,
      nonfiler_val: 12503,
      nonfilerSens_val: 13893
    },
    {
      maxRD: 550000,
      late_val: 3473,
      late_multi: 277,
      lateSens_val: 5210,
      lateSens_multi: 277,
      nonfiler_val: 13197,
      nonfilerSens_val: 15282
    },
    {
      maxRD: 650000,
      late_val: 4168,
      late_multi: 277,
      lateSens_val: 6252,
      lateSens_multi: 277,
      nonfiler_val: 13893,
      nonfilerSens_val: 16671
    },
    {
      maxRD: 750000,
      late_val: 4862,
      late_multi: 277,
      lateSens_val: 7293,
      lateSens_multi: 277,
      nonfiler_val: 14587,
      nonfilerSens_val: 18061
    },
    {
      maxRD: 850000,
      late_val: 5557,
      late_multi: 277,
      lateSens_val: 8335,
      lateSens_multi: 277,
      nonfiler_val: 15282,
      nonfilerSens_val: 19449
    },
    {
      maxRD: 950000,
      late_val: 6252,
      late_multi: 277,
      lateSens_val: 9378,
      lateSens_multi: 277,
      nonfiler_val: 15976,
      nonfilerSens_val: 20838
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER,
      late_val: 6946,
      late_multi: 277,
      lateSens_val: 10420,
      lateSens_multi: 277,
      nonfiler_val: 16671,
      nonfilerSens_val: 22228
    }
  ]
};

module.exports = {
  getTotalAdminFine: CalcAdminFineLogic.prototype.getTotalAdminFine,
  availableDates: availableDates
};
