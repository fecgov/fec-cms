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
    value: '2023',
    label: 'On or after December 22, 2022',
    summary: 'Assessed on or after December 22, 2022'
  },
  {
    value: '2022',
    label: 'December 28, 2021 to December 21, 2022',
    summary: 'Assessed on or after January 11, 2021 to December 27, 2021'
  },
  {
    value: '2021',
    label: 'January 11, 2021 to December 27, 2021',
    summary: 'Assessed on or after January 11, 2021 to December 27, 2021'
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
 * @param {String} d.penaltyAssessedDate The id of the date/year of the fine e.g. '2022', '2021', '2020', 'latest'
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
  '2023': [
    { maxRD: 5000, late_val: 41, late_multi: 6, lateSens_val: 80, lateSens_multi: 15, nonfiler_val: 402, nonfilerSens_val: 806 },
    { maxRD: 10000, late_val: 80, late_multi: 6, lateSens_val: 162, lateSens_multi: 15, nonfiler_val: 483, nonfilerSens_val: 966 },
    { maxRD: 25000, late_val: 172, late_multi: 6, lateSens_val: 241, lateSens_multi: 15, nonfiler_val: 806, nonfilerSens_val: 1450 },
    { maxRD: 50000, late_val: 342, late_multi: 32, lateSens_val: 515, lateSens_multi: 41, nonfiler_val: 1450, nonfilerSens_val: 2255 },
    { maxRD: 75000, late_val: 515, late_multi: 129, lateSens_val: 771, lateSens_multi: 129, nonfiler_val: 4624, nonfilerSens_val: 5137 },
    { maxRD: 100000, late_val: 684, late_multi: 172, lateSens_val: 1026, lateSens_multi: 172, nonfiler_val: 5994, nonfilerSens_val: 6850 },
    { maxRD: 150000, late_val: 1026, late_multi: 214, lateSens_val: 1542, lateSens_multi: 214, nonfiler_val: 7708, nonfilerSens_val: 8564 },
    { maxRD: 200000, late_val: 1373, late_multi: 256, lateSens_val: 2056, lateSens_multi: 256, nonfiler_val: 9420, nonfilerSens_val: 10276 },
    { maxRD: 250000, late_val: 1712, late_multi: 298, lateSens_val: 2570, lateSens_multi: 298, nonfiler_val: 11132, nonfilerSens_val: 12845 },
    { maxRD: 350000, late_val: 2570, late_multi: 342, lateSens_val: 3853, lateSens_multi: 342, nonfiler_val: 13702, nonfilerSens_val: 15414 },
    { maxRD: 450000, late_val: 3426, late_multi: 342, lateSens_val: 5137, lateSens_multi: 342, nonfiler_val: 15414, nonfilerSens_val: 17128 },
    { maxRD: 550000, late_val: 4282, late_multi: 342, lateSens_val: 6423, lateSens_multi: 342, nonfiler_val: 16271, nonfilerSens_val: 18839 },
    { maxRD: 650000, late_val: 5137, late_multi: 342, lateSens_val: 7708, lateSens_multi: 342, nonfiler_val: 17128, nonfilerSens_val: 20552 },
    { maxRD: 750000, late_val: 5994, late_multi: 342, lateSens_val: 8992, lateSens_multi: 342, nonfiler_val: 17984, nonfilerSens_val: 22266 },
    { maxRD: 850000, late_val: 6850, late_multi: 342, lateSens_val: 10276, lateSens_multi: 342, nonfiler_val: 18839, nonfilerSens_val: 23979 },
    { maxRD: 950000, late_val: 7708, late_multi: 342, lateSens_val: 11560, lateSens_multi: 342, nonfiler_val: 19686, nonfilerSens_val: 25690 },
    { maxRD: Number.MAX_SAFE_INTEGER, late_val: 8564, late_multi: 342, lateSens_val: 12845, lateSens_multi: 342, nonfiler_val: 20552, nonfilerSens_val: 27404 }
  ],
  '2022': [
    {
      maxRD: 5000,
      late_val: 38,
      late_multi: 6,
      lateSens_val: 74,
      lateSens_multi: 14,
      nonfiler_val: 373,
      nonfilerSens_val: 748
    },
    {
      maxRD: 10000,
      late_val: 74,
      late_multi: 6,
      lateSens_val: 150,
      lateSens_multi: 14,
      nonfiler_val: 448,
      nonfilerSens_val: 897
    },
    {
      maxRD: 25000,
      late_val: 160,
      late_multi: 6,
      lateSens_val: 224,
      lateSens_multi: 14,
      nonfiler_val: 748,
      nonfilerSens_val: 1346
    },
    {
      maxRD: 50000,
      late_val: 317,
      late_multi: 30,
      lateSens_val: 478,
      lateSens_multi: 38,
      nonfiler_val: 1346,
      nonfilerSens_val: 2093
    },
    {
      maxRD: 75000,
      late_val: 478,
      late_multi: 120,
      lateSens_val: 716,
      lateSens_multi: 120,
      nonfiler_val: 4292,
      nonfilerSens_val: 4768
    },
    {
      maxRD: 100000,
      late_val: 635,
      late_multi: 160,
      lateSens_val: 952,
      lateSens_multi: 160,
      nonfiler_val: 5563,
      nonfilerSens_val: 6358
    },
    {
      maxRD: 150000,
      late_val: 952,
      late_multi: 199,
      lateSens_val: 1431,
      lateSens_multi: 199,
      nonfiler_val: 7154,
      nonfilerSens_val: 7948
    },
    {
      maxRD: 200000,
      late_val: 1274,
      late_multi: 238,
      lateSens_val: 1908,
      lateSens_multi: 238,
      nonfiler_val: 8743,
      nonfilerSens_val: 9537
    },
    {
      maxRD: 250000,
      late_val: 1589,
      late_multi: 277,
      lateSens_val: 2385,
      lateSens_multi: 277,
      nonfiler_val: 10332,
      nonfilerSens_val: 11922
    },
    {
      maxRD: 350000,
      late_val: 2385,
      late_multi: 317,
      lateSens_val: 3576,
      lateSens_multi: 317,
      nonfiler_val: 12717,
      nonfilerSens_val: 14306
    },
    {
      maxRD: 450000,
      late_val: 3180,
      late_multi: 317,
      lateSens_val: 4768,
      lateSens_multi: 317,
      nonfiler_val: 14306,
      nonfilerSens_val: 15897
    },
    {
      maxRD: 550000,
      late_val: 3974,
      late_multi: 317,
      lateSens_val: 5961,
      lateSens_multi: 317,
      nonfiler_val: 15101,
      nonfilerSens_val: 17485
    },
    {
      maxRD: 650000,
      late_val: 4768,
      late_multi: 317,
      lateSens_val: 7154,
      lateSens_multi: 317,
      nonfiler_val: 15897,
      nonfilerSens_val: 19075
    },
    {
      maxRD: 750000,
      late_val: 5563,
      late_multi: 317,
      lateSens_val: 8346,
      lateSens_multi: 317,
      nonfiler_val: 16691,
      nonfilerSens_val: 20665
    },
    {
      maxRD: 850000,
      late_val: 6358,
      late_multi: 317,
      lateSens_val: 9537,
      lateSens_multi: 317,
      nonfiler_val: 17485,
      nonfilerSens_val: 22255
    },
    {
      maxRD: 950000,
      late_val: 7154,
      late_multi: 317,
      lateSens_val: 10729,
      lateSens_multi: 317,
      nonfiler_val: 18280,
      nonfilerSens_val: 23843
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER,
      late_val: 7948,
      late_multi: 317,
      lateSens_val: 11922,
      lateSens_multi: 317,
      nonfiler_val: 19075,
      nonfilerSens_val: 25434
    }
  ],
  '2021': [
    {
      maxRD: 5000,
      late_val: 36,
      late_multi: 6,
      lateSens_val: 70,
      lateSens_multi: 13,
      nonfiler_val: 351,
      nonfilerSens_val: 704
    },
    {
      maxRD: 10000,
      late_val: 70,
      late_multi: 6,
      lateSens_val: 141,
      lateSens_multi: 13,
      nonfiler_val: 422,
      nonfilerSens_val: 844
    },
    {
      maxRD: 25000,
      late_val: 151,
      late_multi: 6,
      lateSens_val: 211,
      lateSens_multi: 13,
      nonfiler_val: 704,
      nonfilerSens_val: 1267
    },
    {
      maxRD: 50000,
      late_val: 298,
      late_multi: 28,
      lateSens_val: 450,
      lateSens_multi: 36,
      nonfiler_val: 1267,
      nonfilerSens_val: 1970
    },
    {
      maxRD: 75000,
      late_val: 450,
      late_multi: 113,
      lateSens_val: 674,
      lateSens_multi: 113,
      nonfiler_val: 4041,
      nonfilerSens_val: 4489
    },
    {
      maxRD: 100000,
      late_val: 598,
      late_multi: 151,
      lateSens_val: 896,
      lateSens_multi: 151,
      nonfiler_val: 5237,
      nonfilerSens_val: 5986
    },
    {
      maxRD: 150000,
      late_val: 896,
      late_multi: 187,
      lateSens_val: 1347,
      lateSens_multi: 187,
      nonfiler_val: 6735,
      nonfilerSens_val: 7482
    },
    {
      maxRD: 200000,
      late_val: 1199,
      late_multi: 224,
      lateSens_val: 1796,
      lateSens_multi: 224,
      nonfiler_val: 8231,
      nonfilerSens_val: 8978
    },
    {
      maxRD: 250000,
      late_val: 1496,
      late_multi: 261,
      lateSens_val: 2245,
      lateSens_multi: 261,
      nonfiler_val: 9727,
      nonfilerSens_val: 11224
    },
    {
      maxRD: 350000,
      late_val: 2245,
      late_multi: 298,
      lateSens_val: 3367,
      lateSens_multi: 298,
      nonfiler_val: 11972,
      nonfilerSens_val: 13468
    },
    {
      maxRD: 450000,
      late_val: 2994,
      late_multi: 298,
      lateSens_val: 4489,
      lateSens_multi: 298,
      nonfiler_val: 13468,
      nonfilerSens_val: 14966
    },
    {
      maxRD: 550000,
      late_val: 3741,
      late_multi: 298,
      lateSens_val: 5612,
      lateSens_multi: 298,
      nonfiler_val: 14216,
      nonfilerSens_val: 16461
    },
    {
      maxRD: 650000,
      late_val: 4489,
      late_multi: 298,
      lateSens_val: 6735,
      lateSens_multi: 298,
      nonfiler_val: 14966,
      nonfilerSens_val: 17958
    },
    {
      maxRD: 750000,
      late_val: 5237,
      late_multi: 298,
      lateSens_val: 7857,
      lateSens_multi: 298,
      nonfiler_val: 15713,
      nonfilerSens_val: 19455
    },
    {
      maxRD: 850000,
      late_val: 5986,
      late_multi: 298,
      lateSens_val: 8978,
      lateSens_multi: 298,
      nonfiler_val: 16461,
      nonfilerSens_val: 20951
    },
    {
      maxRD: 950000,
      late_val: 6735,
      late_multi: 298,
      lateSens_val: 10101,
      lateSens_multi: 298,
      nonfiler_val: 17209,
      nonfilerSens_val: 22446
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER,
      late_val: 7482,
      late_multi: 298,
      lateSens_val: 11224,
      lateSens_multi: 298,
      nonfiler_val: 17958,
      nonfilerSens_val: 23944
    }
  ],
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
    // (keeping previous years' values inside the code)
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
    // (keeping previous years' values inside the code)
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
