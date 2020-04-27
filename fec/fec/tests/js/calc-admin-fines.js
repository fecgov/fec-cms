'use strict';

var chai = require('chai');
var expect = chai.expect;

// import getTotalAdminFine from '../../static/js/modules/calc-admin-fine-logic';
var CalcLogic = require('../../static/js/modules/calc-admin-fine-logic');
var getTotalAdminFine = CalcLogic.getTotalAdminFine;

describe('admin fines calc', function() {
  it('Non-sensitive | 2018 | $154,404 | Not filed | 4 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 5,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: false,
      totalReceiptsAndDisbursements: 154404
    };
    expect(getTotalAdminFine(query)).to.equal(15594);
  });
  it('Non-sensitive | 2018 | $65,356 | 23 days late | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 23,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: false,
      totalReceiptsAndDisbursements: 65356
    };
    expect(getTotalAdminFine(query)).to.equal(2887);
  });
  it('Non-sensitive | 2018 | $4,692 | 12 days late | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 12,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: false,
      totalReceiptsAndDisbursements: 4692
    };
    expect(getTotalAdminFine(query)).to.equal(106);
  });
  it('Non-sensitive | 2018 | $119,588 | Not filed | 3 violations', function() {
    let query = {
      lateOrNonFiler: 'non',
      numberOfDaysLate: 0,
      numberOfPrevViolations: 3,
      penaltyAssessedDate: '2018',
      sensitiveReport: false,
      totalReceiptsAndDisbursements: 119588
    };
    expect(getTotalAdminFine(query)).to.equal(11165);
  });
  it('Sensitive | 2018 | $9,993 | Not filed | 1 violations', function() {
    let query = {
      lateOrNonFiler: 'non',
      numberOfDaysLate: 0,
      numberOfPrevViolations: 1,
      penaltyAssessedDate: '2018',
      sensitiveReport: true,
      totalReceiptsAndDisbursements: 9993
    };
    expect(getTotalAdminFine(query)).to.equal(1000);
  });
  it('Sensitive | 2018 | $12,825 | 7 days late | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 7,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: true,
      totalReceiptsAndDisbursements: 12825
    };
    expect(getTotalAdminFine(query)).to.equal(291);
  });
  it('Sensitive | 2018 | $37,358 | 6 days late | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 6,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: true,
      totalReceiptsAndDisbursements: 37358
    };
    expect(getTotalAdminFine(query)).to.equal(630);
  });
  it('Sensitive | 2018 | $9,061 | Not filed | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'non',
      numberOfDaysLate: 0,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: true,
      totalReceiptsAndDisbursements: 9061
    };
    expect(getTotalAdminFine(query)).to.equal(800);
  });
  it('Sensitive | 2018 | $5,001 | Not filed | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'non',
      numberOfDaysLate: 0,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: true,
      totalReceiptsAndDisbursements: 5001
    };
    expect(getTotalAdminFine(query)).to.equal(820);
  });
  it('Non-sensitive | 2018 | $10,921 | 6 days late | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 6,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: false,
      totalReceiptsAndDisbursements: 10921
    };
    expect(getTotalAdminFine(query)).to.equal(182);
  });
  it('Non-sensitive | 2018 | $119,609 | 57 days late | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 57,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: false,
      totalReceiptsAndDisbursements: 119609
    };
    expect(getTotalAdminFine(query)).to.equal(6541);
  });
  it('Non-sensitive | 2018 | $3,423 | 11 days late | 0 violations', function() {
    let query = {
      lateOrNonFiler: 'late',
      numberOfDaysLate: 11,
      numberOfPrevViolations: 0,
      penaltyAssessedDate: '2018',
      sensitiveReport: false,
      totalReceiptsAndDisbursements: 3423
    };
    expect(getTotalAdminFine(query)).to.equal(101);
  });
});
