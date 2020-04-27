/*
// GLOBAL VARIABLES DECLARATIONS
// var totalFines = '0';
// var Calc = document.NetFine;
// var ReportTypeVar = '0';
// var FilerTypeVar = '0';

// STARTUP FUNCTIONS
function pageStart() {
  // document.getElementById('typeSensitiveRadio').checked = 0;
  // document.getElementById('typeNotSensitiveRadio').checked = 0;
  // //document.getElementById("typeFortyEightRadio").checked = 0;
  // document.getElementById('lateFilerRadio').checked = 0;
  // document.getElementById('nonFilerRadio').checked = 0;
  // clearInputValues();
  // ReportTypeVar = '';
  // FilerTypeVar = '';
}
// FUNCTIONS CORRESPONDING TO USER INPUT
function typeSensitive() {
  // ELECTION SENSITIVE REPORT
  // DisplayA();
  // clearOutputValues();
  // clearInputValues();
  // FilerTypeVar = 'na';
  // ReportTypeVar = 'sensitive';
  // helpHide();
}
function typeNotSensitive() {
  // NON ELECTION SENSITIVE
  // DisplayA();
  // clearOutputValues();
  // clearInputValues();
  // FilerTypeVar = 'na';
  // ReportTypeVar = 'regular';
  // helpHide();
}
function typeFortyEight() {
  // // 48-HOUR NOTICE
  // DisplayB();
  // FilerTypeVar = 'na';
  // clearOutputValues();
  // clearInputValues();
  // ReportTypeVar = 'notice';
  // helpHide();
}
function lateFiler() {
  // LATE FILER
  // DisplayC1();
  // FilerTypeVar = 'late';
  // clearOutputValues();
  // clearInputValues();
  // helpHide();
}
function nonFiler() {
  // NON FILER
  // DisplayC2();
  // FilerTypeVar = 'nonFiler';
  // clearOutputValues();
  // clearInputValues();
  // helpHide();
}
function dlateText() {
  // NUMBER OF DAYS LATE
  // checklate();
  // formCompletedTest();
  // clearOutputValues();
}
function nviolText() {
  // NUMBER OF PREVIOUS VIOLATIONS
  // checkviol();
  // formCompletedTest();
  // clearOutputValues();
}
function tr() {
  // TOTAL RECEIPTS
  // checktr();
  // formCompletedTest();
  // clearOutputValues();
}
function td(name) {
  // TOTAL DISBURSEMENTS
  // nameVar = name;
  // checktd();
  // formCompletedTest();
  // clearOutputValues();
}
function calcButton() {
  // CALCULATE FINE
  // calculateFines();
  // helpHide();
}
function trtdDisplayText() {
  // TOTAL ACTIVITY
  // clearOutputValues();
  // document.NetFine.calculateButton.focus();
}
function totfine() {
  // TOTAL FINE
  // clearOutputValues();
  // document.NetFine.calculateButton.focus();
}
function helpPick() {
  // SHOWS HELP TEXT FOR SELECTING TYPE OF REPORT
  // helpHide();
  // document.getElementById('helpPick_Q').style.display = 'none';
  // document.getElementById('helpPick_A').style.display = 'block';
}
function helpChoose() {
  // SHOWS HELP TEXT FOR SELECTING EITHER LATE-FILER OR NON-FILER
  // helpHide();
  // document.getElementById('helpChoose_Q').style.display = 'none';
  // if (ReportTypeVar == 'sensitive') {
  //   document.getElementById('helpChoose_A2').style.display = 'block';
  //   document.getElementById('helpChoose_A1').style.display = 'none';
  // } else {
  //   document.getElementById('helpChoose_A1').style.display = 'none';
  //   document.getElementById('helpChoose_A1').style.display = 'block';
  // }
}
function helpComplete() {
  // SHOWS HELP TEXT FOR COMPLETING THE FORM
  // helpHide();
  // document.getElementById('helpComplete_Q').style.display = 'none';
  // if (FilerTypeVar == 'late') {
  //   document.getElementById('helpComplete_A1').style.display = 'block';
  //   document.getElementById('helpComplete_A2').style.display = 'none';
  //   document.getElementById('helpComplete_A3').style.display = 'none';
  // }
  // if (FilerTypeVar == 'nonFiler') {
  //   document.getElementById('helpComplete_A1').style.display = 'none';
  //   document.getElementById('helpComplete_A2').style.display = 'block';
  //   document.getElementById('helpComplete_A3').style.display = 'none';
  // }
  // if (ReportTypeVar == 'notice') {
  //   document.getElementById('helpComplete_A1').style.display = 'none';
  //   document.getElementById('helpComplete_A2').style.display = 'none';
  //   document.getElementById('helpComplete_A3').style.display = 'block';
  // }
}
function helpHide() {
  // DISPLAY HELP LINK AND HIDES HELP
  // document.getElementById('helpPick_Q').style.display = 'block';
  // if (document.getElementById('span1').style.display != 'none') {
  //   // DETERMINES IF CHOOSE SPAN IS VISIBLE AND DISPLAYS HELPCHOOSE
  //   document.getElementById('helpChoose_Q').style.display = 'block';
  // }
  // if (document.getElementById('span2').style.display != 'none') {
  //   // DETERMINES IF COMPLETE SPAN IS VISIBLE AND DISPLAYS HELPCOMPLETE
  //   document.getElementById('helpComplete_Q').style.display = 'block';
  // }
  // document.getElementById('helpPick_A').style.display = 'none';
  // document.getElementById('helpChoose_A1').style.display = 'none';
  // document.getElementById('helpChoose_A2').style.display = 'none';
  // document.getElementById('helpComplete_A1').style.display = 'none';
  // document.getElementById('helpComplete_A2').style.display = 'none';
  // document.getElementById('helpComplete_A3').style.display = 'none';
}
// DISPLAY FUNCTIONS THAT CONTROL THE USER INTERFACE
function DisplayA() {
  // DISPLAY FOR ELECTION SENSITIVE AND NON ELECTION SENSITIVE REPORTS
  // document.getElementById('span1').style.display = 'block';
  // document.getElementById('span2').style.display = 'none';
  // document.getElementById('span3').style.display = 'none';
  // document.getElementById('span4').style.display = 'none';
  // document.getElementById('span4_A').style.display = 'inline';
  // document.getElementById('span4_B').style.display = 'none';
  // document.getElementById('span5').style.display = 'none';
  // document.getElementById('span6').style.display = 'none';
  // document.getElementById('span7').style.display = 'none';
  // document.getElementById('span8').style.display = 'none';
  // document.getElementById('lateFilerRadio').checked = 0;
  // document.getElementById('nonFilerRadio').checked = 0;
}
function DisplayB() {
  // DISPLAY FOR 48-HOUR NOTICE
  // document.getElementById('span1').style.display = 'none';
  // document.getElementById('span2').style.display = 'block';
  // document.getElementById('span3').style.display = 'none';
  // document.getElementById('span4').style.display = 'block';
  // document.getElementById('span4_A').style.display = 'none';
  // document.getElementById('span4_B').style.display = 'inline';
  // document.getElementById('span5').style.display = 'none';
  // document.getElementById('span6').style.display = 'none';
  // document.getElementById('span7').style.display = 'none';
  // document.getElementById('span8').style.display = 'none';
}
function DisplayC1() {
  // DISPLAY AFTER CHOOSING 'LATE FILER'
  // document.getElementById('span1').style.display = 'block';
  // document.getElementById('span2').style.display = 'block';
  // document.getElementById('span3').style.display = 'block';
  // document.getElementById('span4').style.display = 'block';
  // document.getElementById('span5').style.display = 'block';
  // document.getElementById('span6').style.display = 'none';
  // document.getElementById('span7').style.display = 'none';
  // document.getElementById('span8').style.display = 'none';
}
function DisplayC2() {
  // DISPLAY AFTER CHOOSING 'NON-FILER'
  // document.getElementById('span1').style.display = 'block';
  // document.getElementById('span2').style.display = 'block';
  // document.getElementById('span3').style.display = 'none';
  // document.getElementById('span4').style.display = 'block';
  // document.getElementById('span5').style.display = 'block';
  // document.getElementById('span6').style.display = 'none';
  // document.getElementById('span7').style.display = 'none';
  // document.getElementById('span8').style.display = 'none';
}
function DisplayD() {
  // DISPLAY FINAL CALCULATION FOR ELECTION SENSITIVE AND NON ELECTION SENSITIVE REPORT
  // document.getElementById('span6').style.display = 'block';
  // document.getElementById('span7').style.display = 'block';
  // document.getElementById('span8').style.display = 'block';
}
function DisplayE() {
  // DISPLAY FINAL CALCULATION FOR 48-HOUR NOTICE
  // document.getElementById('span6').style.display = 'block';
  // document.getElementById('span8').style.display = 'block';
}
function DisplayF() {
  // RESET DISPLAY
  // document.getElementById('span1').style.display = 'none';
  // document.getElementById('span2').style.display = 'none';
  // document.getElementById('span3').style.display = 'none';
  // document.getElementById('span4').style.display = 'none';
  // document.getElementById('span5').style.display = 'none';
  // document.getElementById('span6').style.display = 'none';
  // document.getElementById('span7').style.display = 'none';
  // document.getElementById('span8').style.display = 'none';
  // document.getElementById('lateFilerRadio').checked = 0;
  // document.getElementById('nonFilerRadio').checked = 0;
}
function DisplayG() {
  // HIDE FINAL CALCULATION
  // document.getElementById('span6').style.display = 'none';
  // document.getElementById('span7').style.display = 'none';
  // document.getElementById('span8').style.display = 'none';
}
function clearInputValues() {
  // CLEARS INPUT VALUES
  // document.NetFine.dlate.value = '';
  // document.NetFine.nviol.value = '';
  // document.NetFine.trText.value = '';
  // document.NetFine.tdText.value = '';
}
function clearOutputValues() {
  // CLEARS OUTPUT VALUES
  // document.NetFine.trtdDisplay.value = '';
  // document.NetFine.totfineText.value = '';
}
// FINE CALCULATIONS FOR THE FIVE SCENERIOS: (1) 48-HOUR NOTICES, (2) REGULAR LATE FILER, (3) ELECTION SENSITIVE LATE FILER, (4) REGULAR NON FILER, (5) ELECTION SENSITIVE NON FILER
function calculateFines() {
  // MAIN CALCULATION
  if (ReportTypeVar == 'notice') {
    calcNotice();
  } else {
    calcActivity();
    if ((FilerTypeVar == 'late') & (ReportTypeVar == 'regular')) {
      calcLateRegular();
    }
    if ((FilerTypeVar == 'late') & (ReportTypeVar == 'sensitive')) {
      calcLateSensitive();
    }
    if ((FilerTypeVar == 'nonFiler') & (ReportTypeVar == 'regular')) {
      calcNonFilerRegular();
    }
    if ((FilerTypeVar == 'nonFiler') & (ReportTypeVar == 'sensitive')) {
      calcNonFilerSensitive();
    }
  }
}
function calcActivity() {
  // ADDS UP TOTAL RECEIPTS AND DISBURSEMENTS
  var Calc = document.NetFine;
  var trnum = parseFloat(Calc.trText.value);
  var tdnum = parseFloat(Calc.tdText.value);
  Calc.trtdText.value = trnum + tdnum;
  Calc.trtdDisplay.value = '$' + fixdec(Calc.trtdText.value);
}
function calcNotice() {
  // 48 HOUR NOTICE FINE CALCULATION => ($110 + 10% OF TOTAL RECEIPTS) TIMES 100% + 25% FOR EVERY PREVIOUS VIOLATION
  var Calc = document.NetFine;
  titfinest =
    (110 + 0.1 * parseFloat(Calc.trText.value)) *
    (1 + parseFloat(Calc.nviol.value) * 0.25);
  totalFines = '' + parseFloat(titfinest);
  if (Calc.trText.value >= 1000) {
    fixfine(Calc.trText.value);
  } else {
    // NO FINE AS NO 48-HOUR NOTICE REQUIRED FOR CONTRIBUTIONS LESS THAN $1000
    Calc.totfineText.value = '$0.00';
  }
}
function calcLateRegular() {
  // REGULAR LATE FILER FINE CALCULATION
  var Calc = document.NetFine;
  if ((Calc.trtdText.value >= 0) & (Calc.trtdText.value < 5000)) {
    totalFines =
      '' +
      (35 + 6 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 5000) & (Calc.trtdText.value < 10000)) {
    totalFines =
      '' +
      (68 + 6 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 10000) & (Calc.trtdText.value < 25000)) {
    totalFines =
      '' +
      (146 + 6 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 25000) & (Calc.trtdText.value < 50000)) {
    totalFines =
      '' +
      (290 + 28 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 50000) & (Calc.trtdText.value < 75000)) {
    totalFines =
      '' +
      (437 + 110 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 75000) & (Calc.trtdText.value < 100000)) {
    totalFines =
      '' +
      (581 + 146 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 100000) & (Calc.trtdText.value < 150000)) {
    totalFines =
      '' +
      (871 + 182 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 150000) & (Calc.trtdText.value < 200000)) {
    totalFines =
      '' +
      (1164 + 217 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 200000) & (Calc.trtdText.value < 250000)) {
    totalFines =
      '' +
      (1453 + 254 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 250000) & (Calc.trtdText.value < 350000)) {
    totalFines =
      '' +
      (2181 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 350000) & (Calc.trtdText.value < 450000)) {
    totalFines =
      '' +
      (2908 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 450000) & (Calc.trtdText.value < 550000)) {
    totalFines =
      '' +
      (3633 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 550000) & (Calc.trtdText.value < 650000)) {
    totalFines =
      '' +
      (4360 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 650000) & (Calc.trtdText.value < 750000)) {
    totalFines =
      '' +
      (5086 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 750000) & (Calc.trtdText.value < 850000)) {
    totalFines =
      '' +
      (5813 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 850000) & (Calc.trtdText.value < 950000)) {
    totalFines =
      '' +
      (6541 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 950000) {
    totalFines =
      '' +
      (7267 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 0) {
    fixfine(Calc.trtdText.value);
  }
}
function calcLateSensitive() {
  // ELECTION SENSITIVE LATE FILER FINE CALCULATION
  var Calc = document.NetFine;
  if ((Calc.trtdText.value >= 0) & (Calc.trtdText.value < 5000)) {
    totalFines =
      '' +
      (68 + 13 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 5000) & (Calc.trtdText.value < 10000)) {
    totalFines =
      '' +
      (137 + 13 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 10000) & (Calc.trtdText.value < 25000)) {
    totalFines =
      '' +
      (205 + 13 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 25000) & (Calc.trtdText.value < 50000)) {
    totalFines =
      '' +
      (437 + 35 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 50000) & (Calc.trtdText.value < 75000)) {
    totalFines =
      '' +
      (654 + 110 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 75000) & (Calc.trtdText.value < 100000)) {
    totalFines =
      '' +
      (871 + 146 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 100000) & (Calc.trtdText.value < 150000)) {
    totalFines =
      '' +
      (1308 + 182 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 150000) & (Calc.trtdText.value < 200000)) {
    totalFines =
      '' +
      (1744 + 217 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 200000) & (Calc.trtdText.value < 250000)) {
    totalFines =
      '' +
      (2181 + 254 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 250000) & (Calc.trtdText.value < 350000)) {
    totalFines =
      '' +
      (3270 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 350000) & (Calc.trtdText.value < 450000)) {
    totalFines =
      '' +
      (4360 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 450000) & (Calc.trtdText.value < 550000)) {
    totalFines =
      '' +
      (5450 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 550000) & (Calc.trtdText.value < 650000)) {
    totalFines =
      '' +
      (6541 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 650000) & (Calc.trtdText.value < 750000)) {
    totalFines =
      '' +
      (7630 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 750000) & (Calc.trtdText.value < 850000)) {
    totalFines =
      '' +
      (8719 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 850000) & (Calc.trtdText.value < 950000)) {
    totalFines =
      '' +
      (9810 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 950000) {
    totalFines =
      '' +
      (10901 + 290 * parseFloat(Calc.dlate.value)) *
        (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 0) {
    fixfine(Calc.trtdText.value);
  }
}
function calcNonFilerRegular() {
  // REGULAR NON FILER FINE CALCULATION
  var Calc = document.NetFine;
  if ((Calc.trtdText.value >= 0) & (Calc.trtdText.value < 5000)) {
    totalFines = '' + 341 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 5000) & (Calc.trtdText.value < 10000)) {
    totalFines = '' + 410 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 10000) & (Calc.trtdText.value < 25000)) {
    totalFines = '' + 684 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 25000) & (Calc.trtdText.value < 50000)) {
    totalFines = '' + 1230 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 50000) & (Calc.trtdText.value < 75000)) {
    totalFines = '' + 3925 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 75000) & (Calc.trtdText.value < 100000)) {
    totalFines = '' + 5086 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 100000) & (Calc.trtdText.value < 150000)) {
    totalFines = '' + 6541 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 150000) & (Calc.trtdText.value < 200000)) {
    totalFines = '' + 7994 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 200000) & (Calc.trtdText.value < 250000)) {
    totalFines = '' + 9446 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 250000) & (Calc.trtdText.value < 350000)) {
    totalFines = '' + 11627 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 350000) & (Calc.trtdText.value < 450000)) {
    totalFines = '' + 13080 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 450000) & (Calc.trtdText.value < 550000)) {
    totalFines = '' + 13806 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 550000) & (Calc.trtdText.value < 650000)) {
    totalFines = '' + 14535 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 650000) & (Calc.trtdText.value < 750000)) {
    totalFines = '' + 15260 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 750000) & (Calc.trtdText.value < 850000)) {
    totalFines = '' + 15987 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 850000) & (Calc.trtdText.value < 950000)) {
    totalFines = '' + 16713 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 950000) {
    totalFines = '' + 17440 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 0) {
    fixfine(Calc.trtdText.value);
  }
}
function calcNonFilerSensitive() {
  // ELECTION SENSITIVE NON FILER FINE CALCULATION
  var Calc = document.NetFine;
  if ((Calc.trtdText.value >= 0) & (Calc.trtdText.value < 5000)) {
    totalFines = '' + 684 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 5000) & (Calc.trtdText.value < 10000)) {
    totalFines = '' + 820 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 10000) & (Calc.trtdText.value < 25000)) {
    totalFines = '' + 1230 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 25000) & (Calc.trtdText.value < 50000)) {
    totalFines = '' + 1913 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 50000) & (Calc.trtdText.value < 75000)) {
    totalFines = '' + 4360 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 75000) & (Calc.trtdText.value < 100000)) {
    totalFines = '' + 5813 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 100000) & (Calc.trtdText.value < 150000)) {
    totalFines = '' + 7267 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 150000) & (Calc.trtdText.value < 200000)) {
    totalFines = '' + 8719 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 200000) & (Calc.trtdText.value < 250000)) {
    totalFines = '' + 10901 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 250000) & (Calc.trtdText.value < 350000)) {
    totalFines = '' + 13080 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 350000) & (Calc.trtdText.value < 450000)) {
    totalFines = '' + 14535 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 450000) & (Calc.trtdText.value < 550000)) {
    totalFines = '' + 15987 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 550000) & (Calc.trtdText.value < 650000)) {
    totalFines = '' + 17440 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 650000) & (Calc.trtdText.value < 750000)) {
    totalFines = '' + 18895 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 750000) & (Calc.trtdText.value < 850000)) {
    totalFines = '' + 20347 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if ((Calc.trtdText.value >= 850000) & (Calc.trtdText.value < 950000)) {
    totalFines = '' + 21799 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 950000) {
    totalFines = '' + 23254 * (1 + 0.25 * parseFloat(Calc.nviol.value));
  }
  if (Calc.trtdText.value >= 0) {
    fixfine(Calc.trtdText.value);
  }
}
function fixfine(totalReceipts) {
  // THIS FUNCTION DISPLAYS CORRECT RESULT
  var Calc = document.NetFine;
  if ((totalFines > parseFloat(totalReceipts)) & (Calc.nviol.value < 1)) {
    totalFines = '' + parseFloat(totalReceipts);
  }
  if (totalFines < 1) {
    totalFines = '0.00';
  }
  dec = totalFines.indexOf('.');
  if (dec < 0) {
    totalFines = totalFines + '.00';
    dec = totalFines.indexOf('.');
  }
  if (
    (parseFloat(Calc.dlate.value) < 1) &
    (ReportTypeVar != 'notice') &
    (FilerTypeVar == 'late')
  ) {
    totalFines = 0 + '.00';
    dec = totalFines.indexOf('.');
  }
  if (totalFines.substring(dec + 3, dec + 4) >= 5) {
    // JWC - 48 HOUR REPORT: IF THIRD SIG DIG IS >=5, USE MATH.ROUND AND MULTIPLY AND DIVIDE BY 100 TO FIX THE TRUNCATED CENT.
    totalFines = '' + Math.round(parseFloat(totalFines) * 100) / 100;
  }
  if (
    Calc.trtdDisplay.value.indexOf('$0.') != -1 ||
    Calc.trtdDisplay.value.indexOf('$.') != -1
  ) {
    // RBL--4/29/2003-- TEST FOR LESS THAN $1 OF ACTIVITY BY LOOKING AT THE TEXT FIELD FOR TOTAL RECEIPTS AND DISBURSEMENTS. IF THERE IS LESS THAN $1 OF ACTIVITY THEN THE FINE IS ZERO.
    Calc.totfineText.value = '$0.00';
  } else {
    Calc.totfineText.value = '$' + Math.floor(fixdec(totalFines)) + '.00';
  }
}

// VALIDATION AND VERIFICATION FUNCTIONS
function checktr() {
  // VALIDATES NUMERIC INPUT OF TOTAL RECEIPTS
  var Calc = document.NetFine;
  if (isNaN(Calc.trText.value)) {
    alert(
      'For Total Receipts you must enter a number. Words, commas, and dollar signs are not allowed.'
    );
    Calc.trText.value = '';
  } else {
    Calc.trText.value = fixdec(Calc.trText.value);
  }
}
function checktd() {
  // VALIDATES NUMERIC INPUT OF TOTAL DISBURSEMENTS
  var Calc = document.NetFine;
  var trn;
  if (isNaN(Calc.tdText.value)) {
    alert(
      'For Total Disbursements you must enter a number. Words, commas, and dollar signs are not allowed.'
    );
    Calc.tdText.value = '';
  } else {
    Calc.tdText.value = fixdec(Calc.tdText.value);
  }
}
function checklate() {
  // VALIDATES NUMERIC INPUT OF NUMBER OF DAYS LATE
  var Calc = document.NetFine;
  var dlateNum = parseFloat(Calc.dlate.value);
  if (Calc.dlate.value != '') {
    if (
      isNaN(Calc.dlate.value) ||
      Math.floor(dlateNum) != dlateNum ||
      Math.abs(dlateNum) != dlateNum
    ) {
      alert(
        'You must enter a whole, non-negative number for Number of Days Late.'
      );
      Calc.dlate.value = '';
      dlateNum = 0;
      return;
    }
    if (
      isNaN(Calc.dlate.value) ||
      Math.floor(dlateNum) != dlateNum ||
      Math.abs(dlateNum) != dlateNum
    ) {
      alert(
        'You must enter a whole, non-negative number for Number of Days Late.'
      );
      Calc.dlate.value = '';
      dlateNum = 0;
      return;
    }
    if (ReportTypeVar == 'sensitive') {
      alert(
        'You are a "Late Filer" if you filed after the due date but prior to 4 days before the applicable election and a "Non Filer" if you filed later or not at all. 11 C.F.R. § 111.43(e)(2)'
      );
      return;
      // helpComplete();
    }
    if (dlateNum > 30) {
      alert(
        'Your number of days late is greater than 30. According to 11 CFR § 111.43(e)(1), you are a Non-Filer.'
      );
      Calc.dlate.value = '';
      dlateNum = 0;
    }
  }
}
function checkviol() {
  // VALIDATES NUMERIC INPUT OF NUMBER OF PREVIOUS VIOLATIONS
  var Calc = document.NetFine;
  var nviolNum = parseFloat(Calc.nviol.value);
  if (Calc.nviol.value != '') {
    if (
      isNaN(Calc.nviol.value) ||
      Math.floor(nviolNum) != nviolNum ||
      Math.abs(nviolNum) != nviolNum
    ) {
      alert(
        'You must enter a whole, non-negative number for Number of Previous Violations.'
      );
      Calc.nviol.value = '';
      nviolNum = 0;
      return;
    }
  }
}
function fixdec(dollaramt) {
  // CONVERTS ENTRY TO DOLLARS AND CENTS
  var Calc = document.NetFine;
  if (dollaramt == '') {
    return dollaramt;
  }
  dollaramt = '' + Math.round(parseFloat(dollaramt) * 100) / 100;
  dec = dollaramt.indexOf('.');
  if (dec < 0) {
    return dollaramt + '.00';
  }
  dollars = dollaramt.substring(0, dec);
  cents = dollaramt.substring(dec + 1, dec + 3);
  cents = cents.length < 2 ? cents + '0' : cents;
  cents = cents.length < 1 ? cents + '00' : cents;
  correctamt = dollars + '.' + cents;
  return correctamt;
}
function formCompletedTest() {
  var Calc = document.NetFine;
  if ((Calc.nviol.value != '') & (Calc.trText.value != '')) {
    if (ReportTypeVar == 'notice') {
      DisplayE(); // SHOW FINISH
    } else {
      if (Calc.tdText.value != '') {
        if (FilerTypeVar == 'nonFiler') {
          DisplayD(); // SHOW FINISH
        } else {
          if (Calc.dlate.value != '') {
            DisplayD(); // SHOW FINISH
          } else {
            DisplayG(); // HIDE FINISH
          }
        }
      } else {
        DisplayG(); // HIDE FINISH
      }
    }
  } else {
    DisplayG(); // HIDE FINISH
  }
}
*/

/**
 *
 */
const availableDates = [
  {
    value: 'latest',
    baseFine: 1,
    label: 'I haven’t been assessed a fine',
    summary: 'No fine yet—using latest value'
  },
  {
    value: '2019',
    baseFine: 1,
    label: 'on or after January 1, 2019',
    summary: 'Assessed on or after January 1, 2019'
  },
  {
    value: '2018',
    baseFine: 1,
    label: 'December 28, 2017 through December 31, 2018',
    summary: 'Assessed between Dec 28 2017 and Dec 31 2018'
  },
  {
    value: '2017',
    baseFine: 1,
    label: 'February 3, 2017 through December 17, 2017',
    summary: 'Assessed between Feb 3 2017 and Dec 17 2018'
  }
];

/**
 *
 */
function CalcAdminFineLogic() {
  // Add a 'latest' set of values and set it to its chosen year
  CalcAdminFineLogic.values['latest'] = CalcAdminFineLogic.values['2019'];
}

/**
 * @param {Object} d Data object
 * @param {String} d.lateOrNonFiler
 * @param {Number} d.numberOfDaysLate
 * @param {Number} d.numberOfPrevViolations
 * @param {String} d.penaltyAssessedDate The id of the date/year of the fine e.g. '2019', '2018', '2017', 'latest'
 * @param {Boolean} d.sensitiveReport
 * @param {Number} d.totalReceiptsAndDisbursements
 */
CalcAdminFineLogic.prototype.getTotalAdminFine = function(d) {
  console.log('getTotalAdminFine() d: ', d); // eslint-disable-line no-undef
  let toReturn = 98765432.1;

  console.log('toReturn: ', toReturn); // eslint-disable-line no-undef

  // TODO: handle 24 & 48-hour requests
  // original source
  // if (d.sensitiveReport == 'notice') {
  //   // TODO: can probably lose this:
  //   // CalcAdminFineLogic.calcNotice();
  // } else {
  if (d.lateOrNonFiler == 'late') {
    console.log('if()'); // eslint-disable-line no-undef
    if (d.sensitiveReport == true || d.sensitiveReport == 'true')
      toReturn = CalcAdminFineLogic.prototype.calcLateSensitive(d);
    else toReturn = CalcAdminFineLogic.prototype.calcLateRegular(d);
  } else if (d.lateOrNonFiler == 'non') {
    console.log('else if()'); // eslint-disable-line no-undef
    if (d.sensitiveReport == true || d.sensitiveReport == 'true')
      toReturn = CalcAdminFineLogic.prototype.calcNonFilerSensitive(d);
    else toReturn = CalcAdminFineLogic.prototype.calcNonFilerRegular(d);
  }

  console.log('toReturn: ', toReturn); // eslint-disable-line no-undef
  if (d.numberOfPrevViolations > 0)
    toReturn = CalcAdminFineLogic.prototype.applyViolations(toReturn, d);
  console.log('toReturn: ', toReturn); // eslint-disable-line no-undef
  // }

  return toReturn;
};

/**
 * @param {Number} d.totalReceiptsAndDisbursements
 */
CalcAdminFineLogic.prototype.calcLateRegular = function(d) {
  console.log('calcLateRegular()'); // eslint-disable-line no-undef
  let rdVal = d.totalReceiptsAndDisbursements;
  let daysLate = parseInt(d.numberOfDaysLate);
  let toReturn = 0;

  let steps = CalcAdminFineLogic.values[d.penaltyAssessedDate];
  // Go through the array until we find our maxRD
  for (let i = 0; i < steps.length; i++) {
    if (rdVal < steps[i].maxRD) {
      let baseVal = steps[i].late_val;
      let multiplier = steps[i].late_multi;
      toReturn = baseVal + multiplier * daysLate;
      break;
    }
  }
  // if (Calc.trtdText.value >= 0) {
  //   fixfine(Calc.trtdText.value);
  // }

  return toReturn;
};
CalcAdminFineLogic.prototype.calcLateSensitive = function(d) {
  console.log('calcLateSensitive()'); // eslint-disable-line no-undef
  let rdVal = d.totalReceiptsAndDisbursements;
  let daysLate = parseInt(d.numberOfDaysLate);
  let toReturn = 0;

  let steps = CalcAdminFineLogic.values[d.penaltyAssessedDate];
  // Go through the array until we find our maxRD
  for (let i = 0; i < steps.length; i++) {
    if (rdVal < steps[i].maxRD) {
      let baseVal = steps[i].lateSens_val;
      let multiplier = steps[i].lateSens_multi;
      toReturn = baseVal + multiplier * daysLate;
      break;
    }
  }
  // if (Calc.trtdText.value >= 0) {
  //   fixfine(Calc.trtdText.value);
  // }

  return toReturn;
};
CalcAdminFineLogic.prototype.calcNonFilerRegular = function(d) {
  console.log('calcNonFilerRegular()'); // eslint-disable-line no-undef
  let rdVal = d.totalReceiptsAndDisbursements;
  let toReturn = 0;

  let steps = CalcAdminFineLogic.values[d.penaltyAssessedDate];
  // Go through the array until we find our maxRD
  for (let i = 0; i < steps.length; i++) {
    if (rdVal < steps[i].maxRD) {
      toReturn = steps[i].nonfiler_val;
      break;
    }
  }
  // if (Calc.trtdText.value >= 0) {
  //   fixfine(Calc.trtdText.value);
  // }

  return toReturn;
};
CalcAdminFineLogic.prototype.calcNonFilerSensitive = function(d) {
  console.log('calcNonFilerSensitive()'); // eslint-disable-line no-undef
  let rdVal = d.totalReceiptsAndDisbursements;
  let toReturn = 0;

  let steps = CalcAdminFineLogic.values[d.penaltyAssessedDate];
  // Go through the array until we find our maxRD
  for (let i = 0; i < steps.length; i++) {
    console.log('for'); // eslint-disable-line no-undef
    if (rdVal < steps[i].maxRD) {
      console.log('if'); // eslint-disable-line no-undef
      toReturn = steps[i].nonfilerSens_val;
      break;
    }
  }
  // if (Calc.trtdText.value >= 0) {
  //   fixfine(Calc.trtdText.value);
  // }

  return toReturn;
};
// function fixdec(val) {
//   // TODO: get rid of this; we only need to return a number
//   return val;
// }

/**
 *
 */
CalcAdminFineLogic.prototype.applyViolations = function(fine, d) {
  console.log('applyViolations()', fine, d); // eslint-disable-line no-undef

  let toReturn = fine + 0.25 * d.numberOfPrevViolations;
  console.log('toReturn: ', toReturn); // eslint-disable-line no-undef

  return toReturn;
};

/**
 *
 */
// CalcAdminFineLogic.prototype.fixfine = function(totalReceipts) {
//   // THIS FUNCTION DISPLAYS CORRECT RESULT
//   var Calc = document.NetFine;
//   if ((totalFines > parseFloat(totalReceipts)) & (Calc.nviol.value < 1)) {
//     totalFines = '' + parseFloat(totalReceipts);
//   }
//   if (totalFines < 1) {
//     totalFines = '0.00';
//   }
//   dec = totalFines.indexOf('.');
//   if (dec < 0) {
//     totalFines = totalFines + '.00';
//     dec = totalFines.indexOf('.');
//   }
//   if (
//     (parseFloat(Calc.dlate.value) < 1) &
//     (ReportTypeVar != 'notice') &
//     (FilerTypeVar == 'late')
//   ) {
//     totalFines = 0 + '.00';
//     dec = totalFines.indexOf('.');
//   }
//   if (totalFines.substring(dec + 3, dec + 4) >= 5) {
//     // JWC - 48 HOUR REPORT: IF THIRD SIG DIG IS >=5, USE MATH.ROUND AND MULTIPLY AND DIVIDE BY 100 TO FIX THE TRUNCATED CENT.
//     totalFines = '' + Math.round(parseFloat(totalFines) * 100) / 100;
//   }
//   if (
//     Calc.trtdDisplay.value.indexOf('$0.') != -1 ||
//     Calc.trtdDisplay.value.indexOf('$.') != -1
//   ) {
//     // RBL--4/29/2003-- TEST FOR LESS THAN $1 OF ACTIVITY BY LOOKING AT THE TEXT FIELD FOR TOTAL RECEIPTS AND DISBURSEMENTS. IF THERE IS LESS THAN $1 OF ACTIVITY THEN THE FINE IS ZERO.
//     Calc.totfineText.value = '$0.00';
//   } else {
//     Calc.totfineText.value = '$' + Math.floor(fixdec(totalFines)) + '.00';
//   }
// }

/**
 *
 */
// CalcAdminFineLogic.prototype.fixdec = function(dollaramt) { // CONVERTS ENTRY TO DOLLARS AND CENTS
// 	var Calc = document.NetFine;
// 	if (dollaramt =="") {
// 		return dollaramt;
// 	}
// 	dollaramt="" + Math.round(parseFloat(dollaramt)*100)/100;
// 	dec = dollaramt.indexOf(".");
// 	if (dec < 0 ) {
// 		return dollaramt+".00";
// 	}
// 	dollars = dollaramt.substring(0,dec);
// 	cents = dollaramt.substring(dec+1,dec+3);
// 	cents = (cents.length < 2) ? cents + "0" : cents;
// 	cents = (cents.length < 1) ? cents + "00" : cents;
// 	correctamt = dollars + "." + cents;
// 	return correctamt;
// }

/**
 *
 * maxRD is really the min value for the next step. calc should be `< maxRD`, not `<=`
 */
CalcAdminFineLogic.values = {
  '2019': [
    {
      maxRD: 5000,
      late_val: 35,
      late_multi: 6,
      lateSen_val: 68,
      lateSen_multi: 13,
      nonfiler_val: 341,
      nonfilerSens_val: 684
    },
    {
      maxRD: 10000,
      late_val: 68,
      late_multi: 6,
      lateSen_val: 137,
      lateSen_multi: 13,
      nonfiler_val: 410,
      nonfilerSens_val: 820
    },
    {
      maxRD: 25000,
      late_val: 146,
      late_multi: 6,
      lateSen_val: 208,
      lateSen_multi: 13,
      nonfiler_val: 684,
      nonfilerSens_val: 1230
    },
    {
      maxRD: 50000,
      late_val: 290,
      late_multi: 28,
      lateSen_val: 437,
      lateSen_multi: 35,
      nonfiler_val: 1230,
      nonfilerSens_val: 1913
    },
    {
      maxRD: 75000,
      late_val: 437,
      late_multi: 110,
      lateSen_val: 654,
      lateSen_multi: 110,
      nonfiler_val: 3925,
      nonfilerSens_val: 4360
    },
    {
      maxRD: 100000,
      late_val: 581,
      late_multi: 146,
      lateSen_val: 871,
      lateSen_multi: 146,
      nonfiler_val: 5086,
      nonfilerSens_val: 5813
    },
    {
      maxRD: 150000,
      late_val: 871,
      late_multi: 182,
      lateSen_val: 1308,
      lateSen_multi: 182,
      nonfiler_val: 6541,
      nonfilerSens_val: 7267
    },
    {
      maxRD: 200000,
      late_val: 1164,
      late_multi: 217,
      lateSen_val: 1744,
      lateSen_multi: 217,
      nonfiler_val: 7994,
      nonfilerSens_val: 8719
    },
    {
      maxRD: 250000,
      late_val: 1453,
      late_multi: 254,
      lateSen_val: 2181,
      lateSen_multi: 254,
      nonfiler_val: 9446,
      nonfilerSens_val: 10901
    },

    {
      maxRD: 350000,
      late_val: 2181,
      late_multi: 290,
      lateSen_val: 3270,
      lateSen_multi: 290,
      nonfiler_val: 11627,
      nonfilerSens_val: 13080
    },
    {
      maxRD: 450000,
      late_val: 2908,
      late_multi: 290,
      lateSen_val: 4360,
      lateSen_multi: 290,
      nonfiler_val: 13080,
      nonfilerSens_val: 14535
    },
    {
      maxRD: 550000,
      late_val: 3633,
      late_multi: 290,
      lateSen_val: 5450,
      lateSen_multi: 290,
      nonfiler_val: 13806,
      nonfilerSens_val: 15987
    },
    {
      maxRD: 650000,
      late_val: 4360,
      late_multi: 290,
      lateSen_val: 6541,
      lateSen_multi: 290,
      nonfiler_val: 14535,
      nonfilerSens_val: 17440
    },
    {
      maxRD: 750000,
      late_val: 5086,
      late_multi: 290,
      lateSen_val: 7630,
      lateSen_multi: 290,
      nonfiler_val: 15260,
      nonfilerSens_val: 18895
    },
    {
      maxRD: 850000,
      late_val: 5813,
      late_multi: 290,
      lateSen_val: 8719,
      lateSen_multi: 290,
      nonfiler_val: 15987,
      nonfilerSens_val: 20347
    },
    {
      maxRD: 950000,
      late_val: 6541,
      late_multi: 290,
      lateSen_val: 9810,
      lateSen_multi: 290,
      nonfiler_val: 16713,
      nonfilerSens_val: 21799
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER, // (just over 9 quadrillion)
      late_val: 7267,
      late_multi: 290,
      lateSen_val: 10901,
      lateSen_multi: 290,
      nonfiler_val: 17440,
      nonfilerSens_val: 23254
    }
  ],
  '2018': [
    {
      maxRD: 5000,
      late_val: 34,
      late_multi: 6,
      lateSen_val: 66,
      lateSen_multi: 13,
      nonfiler_val: 333,
      nonfilerSens_val: 667
    },
    {
      maxRD: 10000,
      late_val: 66,
      late_multi: 6,
      lateSen_val: 134,
      lateSen_multi: 13,
      nonfiler_val: 400,
      nonfilerSens_val: 800
    },
    {
      maxRD: 25000,
      late_val: 142,
      late_multi: 6,
      lateSen_val: 200,
      lateSen_multi: 13,
      nonfiler_val: 667,
      nonfilerSens_val: 1200
    },
    {
      maxRD: 50000,
      late_val: 283,
      late_multi: 27,
      lateSen_val: 426,
      lateSen_multi: 34,
      nonfiler_val: 1200,
      nonfilerSens_val: 1866
    },
    {
      maxRD: 75000,
      late_val: 426,
      late_multi: 107,
      lateSen_val: 638,
      lateSen_multi: 107,
      nonfiler_val: 3828,
      nonfilerSens_val: 4253
    },
    {
      maxRD: 100000,
      late_val: 567,
      late_multi: 142,
      lateSen_val: 850,
      lateSen_multi: 142,
      nonfiler_val: 4961,
      nonfilerSens_val: 5670
    },
    {
      maxRD: 150000,
      late_val: 850,
      late_multi: 178,
      lateSen_val: 1276,
      lateSen_multi: 178,
      nonfiler_val: 6380,
      nonfilerSens_val: 7088
    },
    {
      maxRD: 200000,
      late_val: 1135,
      late_multi: 212,
      lateSen_val: 1701,
      lateSen_multi: 212,
      nonfiler_val: 7797,
      nonfilerSens_val: 8505
    },
    {
      maxRD: 250000,
      late_val: 1417,
      late_multi: 248,
      lateSen_val: 2127,
      lateSen_multi: 248,
      nonfiler_val: 9214,
      nonfilerSens_val: 10633
    },
    {
      maxRD: 350000,
      late_val: 2127,
      late_multi: 283,
      lateSen_val: 3190,
      lateSen_multi: 283,
      nonfiler_val: 11341,
      nonfilerSens_val: 12758
    },
    {
      maxRD: 450000,
      late_val: 2836,
      late_multi: 283,
      lateSen_val: 4253,
      lateSen_multi: 283,
      nonfiler_val: 12758,
      nonfilerSens_val: 14177
    },
    {
      maxRD: 550000,
      late_val: 3544,
      late_multi: 283,
      lateSen_val: 5316,
      lateSen_multi: 283,
      nonfiler_val: 13466,
      nonfilerSens_val: 15594
    },
    {
      maxRD: 650000,
      late_val: 4253,
      late_multi: 283,
      lateSen_val: 6380,
      lateSen_multi: 283,
      nonfiler_val: 14177,
      nonfilerSens_val: 17011
    },
    {
      maxRD: 750000,
      late_val: 4961,
      late_multi: 283,
      lateSen_val: 7442,
      lateSen_multi: 283,
      nonfiler_val: 14885,
      nonfilerSens_val: 18430
    },
    {
      maxRD: 850000,
      late_val: 5670,
      late_multi: 283,
      lateSen_val: 8505,
      lateSen_multi: 283,
      nonfiler_val: 15594,
      nonfilerSens_val: 19846
    },
    {
      maxRD: 950000,
      late_val: 6380,
      late_multi: 283,
      lateSen_val: 9569,
      lateSen_multi: 283,
      nonfiler_val: 16302,
      nonfilerSens_val: 21263
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER, // (just over 9 quadrillion)
      late_val: 7088,
      late_multi: 283,
      lateSen_val: 10633,
      lateSen_multi: 283,
      nonfiler_val: 17011,
      nonfilerSens_val: 22682
    }
  ],
  '2017': [
    {
      maxRD: 5000,
      late_val: 33,
      late_multi: 6,
      lateSen_val: 65,
      lateSen_multi: 13,
      nonfiler_val: 326,
      nonfilerSens_val: 654
    },
    {
      maxRD: 10000,
      late_val: 65,
      late_multi: 6,
      lateSen_val: 131,
      lateSen_multi: 13,
      nonfiler_val: 392,
      nonfilerSens_val: 784
    },
    {
      maxRD: 25000,
      late_val: 139,
      late_multi: 6,
      lateSen_val: 196,
      lateSen_multi: 13,
      nonfiler_val: 654,
      nonfilerSens_val: 1176
    },
    {
      maxRD: 50000,
      late_val: 277,
      late_multi: 26,
      lateSen_val: 417,
      lateSen_multi: 33,
      nonfiler_val: 1176,
      nonfilerSens_val: 1829
    },
    {
      maxRD: 75000,
      late_val: 417,
      late_multi: 105,
      lateSen_val: 625,
      lateSen_multi: 105,
      nonfiler_val: 3751,
      nonfilerSens_val: 4168
    },
    {
      maxRD: 100000,
      late_val: 556,
      late_multi: 139,
      lateSen_val: 833,
      lateSen_multi: 139,
      nonfiler_val: 4862,
      nonfilerSens_val: 5557
    },
    {
      maxRD: 150000,
      late_val: 833,
      late_multi: 174,
      lateSen_val: 1250,
      lateSen_multi: 174,
      nonfiler_val: 6252,
      nonfilerSens_val: 6946
    },
    {
      maxRD: 200000,
      late_val: 1112,
      late_multi: 208,
      lateSen_val: 1667,
      lateSen_multi: 208,
      nonfiler_val: 7641,
      nonfilerSens_val: 8335
    },
    {
      maxRD: 250000,
      late_val: 1389,
      late_multi: 243,
      lateSen_val: 2084,
      lateSen_multi: 243,
      nonfiler_val: 9030,
      nonfilerSens_val: 10420
    },
    {
      maxRD: 350000,
      late_val: 2084,
      late_multi: 277,
      lateSen_val: 3126,
      lateSen_multi: 277,
      nonfiler_val: 11114,
      nonfilerSens_val: 12503
    },
    {
      maxRD: 450000,
      late_val: 2779,
      late_multi: 277,
      lateSen_val: 4168,
      lateSen_multi: 277,
      nonfiler_val: 12503,
      nonfilerSens_val: 13893
    },
    {
      maxRD: 550000,
      late_val: 3473,
      late_multi: 277,
      lateSen_val: 5210,
      lateSen_multi: 277,
      nonfiler_val: 13197,
      nonfilerSens_val: 15282
    },
    {
      maxRD: 650000,
      late_val: 4168,
      late_multi: 277,
      lateSen_val: 6252,
      lateSen_multi: 277,
      nonfiler_val: 13893,
      nonfilerSens_val: 16671
    },
    {
      maxRD: 750000,
      late_val: 4862,
      late_multi: 277,
      lateSen_val: 7293,
      lateSen_multi: 277,
      nonfiler_val: 14587,
      nonfilerSens_val: 18061
    },
    {
      maxRD: 850000,
      late_val: 5557,
      late_multi: 277,
      lateSen_val: 8335,
      lateSen_multi: 277,
      nonfiler_val: 15282,
      nonfilerSens_val: 19449
    },
    {
      maxRD: 950000,
      late_val: 6252,
      late_multi: 277,
      lateSen_val: 9378,
      lateSen_multi: 277,
      nonfiler_val: 15976,
      nonfilerSens_val: 20838
    },
    {
      maxRD: Number.MAX_SAFE_INTEGER, // (just over 9 quadrillion)
      late_val: 6946,
      late_multi: 277,
      lateSen_val: 10420,
      lateSen_multi: 277,
      nonfiler_val: 16671,
      nonfilerSens_val: 22228
    }
  ]
};

module.exports = {
  getTotalAdminFine: CalcAdminFineLogic.prototype.getTotalAdminFine,
  availableDates: availableDates
};
