'use strict';

/**
 * How many election years should we include? In places like lists.
 */
const electionYearsCount = 42; // Display election years back this many years

/**
 * Simple list of election letter codes with their adjectives
 * TODO - set this through constants?
 */
let officeDefs = {
  P: 'presidential',
  S: 'Senate',
  H: 'House'
};

/**
 * If the constants value of DEFAULT_PRESIDENTIAL_YEAR is set, return that.
 * Otherwise return the next election year with the goal of not displaying data when there is none.
 * If next year is an election year, but today is before 15 April, returns the previous election year.
 * @returns {Number} Four-digit year
 * TODO - May need to expand this to default to midterms when we're away from a presidential year
 */
let defaultElectionYear = () => {
  // If the DEFAULT_PRESIDENTIAL_YEAR exists, we'll use that
  if (window.DEFAULT_PRESIDENTIAL_YEAR) return window.DEFAULT_PRESIDENTIAL_YEAR;
  else {
    let now = new Date();
    let thisYear = now.getFullYear();

    // If next year is a presidential election year
    // and today's after April 15
    // let's use next year
    if ((thisYear + 1) % 4 == 0 && now.getMonth() >= 3 && now.getDate() > 15) {
      return thisYear + 1;
    } else {
      // Otherwise, let's find the most recent presidential election
      return thisYear % 4 == 0 ? thisYear : thisYear + (4 - (thisYear % 4));
    }
  }
};

/**
 * Calculates the next presidential election year, including this year if applicable
 * @returns {Number} The four-digit year of the next presidential year
 */
function getNextPresidentialElectionYear() {
  let now = new Date();
  let thisYear = now.getFullYear();

  // The next presidential election year is this year if this year is neatly divisble by four
  // otherwise, it's this year plus the difference of four and its modulus
  return thisYear % 4 == 0 ? thisYear : thisYear + (4 - (thisYear % 4));
}

/**
 * Builds an Array of four-digit years, limited by {@see electionYearsCount}
 * @param {String} type - P Presidential {@default}, H for House, or S for Senate
 * @returns {Array} An array of four-digit years
 */
let electionYearsList = (type = 'P') => {
  let theLatestYear = getNextPresidentialElectionYear();
  let toReturn = [];

  // Starting with the next presidential election year,
  // and until we reach the limit we want to offer,
  // count back two years at a time,
  // and add each year to the list,
  // though only add it to Presidential lists if it's neatly divisible by four.
  for (let i = theLatestYear; i >= theLatestYear - electionYearsCount; i -= 2) {
    if (type == 'P' && i % 4 == 0) toReturn.push(i);
    else if (type != 'P') toReturn.push(i);
  }
  return toReturn;
};

/**
 * Builds a String of <option> elements for the given office and year, marking the given year as 'selected'.
 * Note: if a presidential list is requested with an invalid year, the next earlier presidential year will be selected if available. Otherwise, it will select the next presidential list.
 * For example, if someone requests a presidential list with 1998 selected, 1996 will be selected if it's part of the list, otherwise 2000 will be
 * @param {String} office - What kind of years? (P are every four years, H and S are two years) {@default: 'P'}
 * @param {String, Number} selectedValue - (optional) Which value should be `selected`?
 * @returns A list of <option> elements
 * TODO - Should we assign a default selectedValue of defaultElectionYear()?
 */
let electionYearsOptions = (office = 'P', selectedValue) => {
  let toReturn = '';
  let theList = electionYearsList(office);
  let adjustedValue = selectedValue; // internal selectedValue
  // If we're looking at the presidential list but our year isn't in the new list
  // Let's show the previous presidential election if we can,
  // Otherwise, we'll show the next presidential election
  if (office == 'P' && !theList.includes(adjustedValue)) {
    if (theList.includes(adjustedValue - 2)) adjustedValue -= 2;
    else if (theList.includes(adjustedValue + 2)) adjustedValue += 2;
  }
  // TODO - comment up and down
  theList.map(item => {
    toReturn +=
      '<option value="' +
      item +
      '"' +
      (item == adjustedValue ? ' selected' : '') +
      '>' +
      item +
      '</option>';
  });
  return toReturn;
};

// Make them available for import
module.exports = {
  defaultElectionYear,
  electionYearsList,
  electionYearsOptions,
  officeDefs
};
