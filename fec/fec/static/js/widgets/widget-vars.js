'use strict';

let officeDefs = {
  P: 'Presidential',
  S: 'Senate',
  H: 'House'
};

let defaultElectionYear = () => {
  let now = new Date();
  let thisYear = now.getFullYear();

  // If next year is an election year
  // and it's after April 15
  // let's use next year
  if ((thisYear + 1) % 4 == 0 && now.getMonth() >= 3 && now.getDate() > 15) {
    return thisYear + 1;
  } else {
    // otherwise, let's find the most recent presidential election
    return thisYear % 4 == 0 ? thisYear : thisYear + (4 - (thisYear % 4));
  }
};

let electionYearsList = () => {
  let toReturn = [];
  let now = new Date();
  let theYear = now.getFullYear();

  if (theYear % 2 != 0) theYear++;

  toReturn.push(theYear);
  for (let i = 0; i < 12; i++) {
    toReturn.push((theYear -= 2));
  }
  return toReturn;
};

module.exports = {
  defaultElectionYear,
  electionYearsList,
  officeDefs
};
