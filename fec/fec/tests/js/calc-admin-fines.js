'use strict';

var chai = require('chai');
var expect = chai.expect;

// import getTotalAdminFine from '../../static/js/modules/calc-admin-fine-logic';
var CalcLogic = require('../../static/js/modules/calc-admin-fines-logic');
var getTotalAdminFine = CalcLogic.getTotalAdminFine;

/**
 * The parameters for tests are abbreviated so 'var tests = […]' is easier to read
 * @param {Number,String='latest'} y - Year the fine was assessed (penaltyAssessedDate)
 * @param {Boolean} s - Whether it's an election-sensitive report (sensitiveReport)
 * @param {Number} c - Cash / total receipts + disbursements (totalReceiptsAndDisbursements)
 * @param {String='late','non'} l - Whether the report was filed late or not filed (lateOrNonFiler)
 * @param {Number} t - Number of days late (numberOfDaysLate)
 * @param {Number} v - Number of previous violations (numberOfPrevViolations)
 * @param {Number} e - Expected fine for these values
 */
describe('Admin fines calc', function() {
  // Define the tests (see var reference above)
  // (the 't' value is irrelevant for 'non')
  var tests = [
    { y: 'latest', s: true, c: 0, l: 'late', t: 6, v: 10, e: 0 },
    { y: '2023', s: false, c: 1, l: 'non', t: 3, v: 10, e: 1407 },
    { y: '2024', s: false, c: 4999.99, l: 'late', t: 1, v: 1, e: 60 },
    { y: '2023', s: true, c: 5000, l: 'non', t: 3, v: 2, e: 1449 },
    { y: '2023', s: false, c: 9000, l: 'non', t: 1, v: 0, e: 483 },
    { y: '2022', s: false, c: 24000, l: 'late', t: 5, v: 3, e: 332 },
    { y: 'latest', s: true, c: 49000, l: 'late', t: 30, v: 10, e: 6272 },
    { y: '2024', s: false, c: 74000, l: 'late', t: 4, v: 4, e: 2128 },
    { y: '2022', s: true, c: 99000, l: 'non', t: 50, v: 5, e: 14305 },
    { y: 'latest', s: true, c: 149000, l: 'late', t: 20, v: 1, e: 7515 },
    { y: '2023', s: true, c: 199000, l: 'late', t: 50, v: 2, e: 22284 },
    { y: '2024', s: true, c: 249000, l: 'late', t: 20, v: 5, e: 19829 },
    { y: '2024', s: false, c: 349000, l: 'non', t: 2, v: 0, e: 14146 },
    { y: '2024', s: false, c: 440000, l: 'non', t: 15, v: 0, e: 15914 },
    { y: 'latest', s: false, c: 549000, l: 'late', t: 10, v: 3, e: 13914 },
    { y: '2022', s: true, c: 649000, l: 'non', t: 5, v: 5, e: 42918 },
    { y: '2022', s: true, c: 749000, l: 'non', t: 6, v: 2, e: 30997 },
    { y: 'latest', s: true, c: 849000, l: 'late', t: 2, v: 3, e: 19801 },
    { y: '2024', s: true, c: 949000, l: 'non', t: 15, v: 1, e: 33153 },
    { y: '2023', s: false, c: 1000000, l: 'late', t: 2, v: 4, e: 18496 },
    { y: '2022', s: false, c: 2000000, l: 'late', t: 10, v: 4, e: 22236 },
    // Errors:
    {
      y: 2022,
      s: false,
      c: 65356,
      l: 'late',
      t: undefined,
      v: 0,
      e: 'ERROR'
    }, // late but with no days late
    {
      y: 2022,
      s: false,
      c: 65356,
      l: 'TEST',
      t: 100,
      v: 0,
      e: 'ERROR'
    }, // invalid late/notfiled
    { y: 1776, s: false, c: 3423, l: 'late', t: 11, v: 0, e: 'ERROR' }, // invalid year
    {
      // no vars
      y: undefined,
      s: undefined,
      c: undefined,
      l: undefined,
      t: undefined,
      v: undefined,
      e: 'ERROR'
    }
  ];
  // For each test we want to run,
  tests.forEach(function(test, i) {
    // Name it ('test0', 'test1', etc)
    it('test ' + i, function() {
      // Create the data object for the getTotalAdminFine function
      let query = {
        lateOrNonFiler: test.l,
        numberOfDaysLate: test.t,
        numberOfPrevViolations: test.v,
        penaltyAssessedDate: test.y,
        sensitiveReport: test.s,
        totalReceiptsAndDisbursements: test.c
      };
      // Set expectations and evaluate results
      expect(getTotalAdminFine(query).toString()).to.equal(test.e.toString());
    });
  });
});
