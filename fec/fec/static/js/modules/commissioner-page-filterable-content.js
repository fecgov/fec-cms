/* global $ */

let optsType = {
  adr: 'ADRs',
  ao: 'Advisory opinion statements',
  cs: 'Congressional statements',
  mur: 'MURs',
  op: 'Op-eds and speeches',
  report: 'Reports'
};

let optsSubj = {
  'ballot-measures': 'Ballot Measures',
  'best-efforts': '"Best Efforts"',
  'contention-language': 'Contention Language',
  'family-member-contributions': 'Family Member Contributions',
  coordination: 'Coordination',
  'contract-dispute': 'Contract Dispute',
  'corporate-spending': 'Corporate Spending',
  'dark-money-501c4-groups': 'Dark Money/501(c)(4) groups',
  disclaimers: 'Disclaimers',
  'electioneering-communications': 'Electioneering Communications',
  'express-advocacy': 'Express Advocacy',
  'failing-to-disclose-independent-expenditure':
    'Failing to Disclose Independent Expenditure',
  'foreign-spending': 'Foreign Spending',
  'hloga-air-travel': 'HLOGA/Air Travel',
  'hosting-debates': 'Hosting Debates',
  'increased-activity': 'Increased Activity',
  'lobbyist-activity': 'Lobbyist Activity',
  'membership-communications-exception': 'Membership Communications Exception',
  'mischaracterization-of-party-in-court-filing':
    'Mischaracterization of Party in Court Filing',
  'payroll-deduction': 'Payroll Deduction',
  'personal-use': 'Personal Use',
  'press-exemption': 'Press Exemption',
  'soft-money-use-of-non-federal-money-on-federal-expenses':
    'Soft Money/Use of Non-Federal Money on Federal Expenses',
  'sale-use': 'Sale & Use',
  'straw-donors-conduit-contributions': 'Straw Donors/Conduit Contributions',
  'super-pac-not-disclosing-till-after-election':
    'Super PAC not disclosing till after election',
  'testing-the-waters-candidate-status': 'Testing the Waters/Candidate Status',
  unions: 'Unions',
  'use-of-opponents-name-without-permission':
    'Use of Opponent’s Name Without Permission',
  'volunteer-exemption': 'Volunteer Exemption',
  'volunteer-mailers-exemption': 'Volunteer Mailers Exemption'
};

let optsFocus = {
  'super-pacs': 'Super PACs',
  'leadership-pac': 'Leadership PAC',
  'hybrid-pacs': 'Hybrid PACs',
  corporations: 'Corporations',
  'dark-money-groups-501c4': 'Dark Money Groups/501(c)(4)',
  'state-political-party': 'State Political Party',
  'membership-organization-pacs': 'Membership Organization PACs',
  'employee-coercion-threats-of-reprisal':
    'Employee Coercion/Threats of Reprisal',
  'in-kind-contributions': 'In-Kind Contributions',
  'extending-credit': 'Extending Credit',
  'preparing-mailers': 'Preparing Mailers',
  'business-associations': 'Business Associations',
  'lobbyists-delivering-funds-on-behalf-of-corporation':
    'Lobbyists Delivering Funds on Behalf of Corporation',
  'nonprofit-corporation': 'Nonprofit Corporation',
  'salary-payments': 'Salary Payments',
  'improper-refund': 'Improper Refund',
  'express-advocacy': 'Express Advocacy',
  'political-committee-status': 'Political Committee Status',
  'failing-to-disclose-independent-expenditure':
    'Failing to Disclose Independent Expenditure',
  brochure: 'Brochure',
  'printed-box-requirement': 'Printed Box Requirement',
  internet: 'Internet',
  newspaper: 'Newspaper',
  mailer: 'Mailer',
  robocall: 'Robocall',
  radio: 'Radio',
  signs: 'Signs',
  television: 'Television'
};

if ($) {
  // (Must have jQuery)
  // Build the document types list based on optsType
  $('#filter-type').append($('<option>', { value: '', text: 'All' }));
  for (let elem in optsType) {
    $('#filter-type').append(
      $('<option>', {
        value: elem,
        text: optsType[elem]
      })
    );
  }
  // Build the subjects list based on optsSubj
  $('#filter-subject').append($('<option>', { value: '', text: 'All' }));
  for (let elem in optsSubj) {
    $('#filter-subject').append(
      $('<option>', {
        value: elem,
        text: optsSubj[elem]
      })
    );
  }
  // Build the foci list based on optsFocus
  $('#filter-focus').append($('<option>', { value: '', text: 'All' }));
  for (let elem in optsFocus) {
    $('#filter-focus').append(
      $('<option>', {
        value: elem,
        text: optsFocus[elem]
      })
    );
  }
  // Build the years list by scraping all options
  let years = [];
  let itemsWithYears = $('.block-filterable_content li[data-year]');
  itemsWithYears.each(function() {
    let thisItemsYear = $(this).attr('data-year');
    if (thisItemsYear != '' && !years.includes(thisItemsYear))
      years.push(thisItemsYear);
  });
  years = years.sort((a, b) => {
    return b > a;
  });
  $('#filter-year').append($('<option>', { value: '', text: 'All' }));
  for (let year in years) {
    $('#filter-year').append(
      $('<option>', {
        value: years[year],
        text: years[year]
      })
    );
  }

  //
  let applyFilters = function() {
    // Remove all current filtered-out class
    let filteredType = $('#filter-type').val();
    let filteredSubj = $('#filter-subject').val();
    let filteredFocu = $('#filter-focus').val();
    let filteredYear = $('#filter-year').val();
    let filterRule = '';
    if (filteredType) filterRule += '[data-type="' + filteredType + '"]';
    if (filteredSubj) filterRule += '[data-subject="' + filteredSubj + '"]';
    if (filteredFocu) filterRule += '[data-focus="' + filteredFocu + '"]';
    if (filteredYear) filterRule += '[data-year="' + filteredYear + '"]';

    let filterableContentBlocks = $('.block-filterable_content');
    // remove any previous filtered states
    filterableContentBlocks.removeClass('filtered');
    filterableContentBlocks.find('.matched').removeClass('matched');
    filterableContentBlocks.find('li.filtered-empty-notice').remove();
    // Filter if we need to

    if (filterRule != '') {
      // Apply 'matched' to matching items
      $('.block-filterable_content ' + filterRule).addClass('matched');
      // Apply 'filtered' to all of the filterable blocks
      filterableContentBlocks.addClass('filtered');
      // We can't reliably find cousin headlines, so
      // for any lists that have been completely filtered away, let's add a 'no results' item
      // for (let block in filterableContentBlocks) {
      // if there are no children with the 'matched' class, add
      // TODO documentation
      $('.block-filterable_content ul').each(function() {
        if ($(this).find('li.matched').length === 0) {
          $(this).append('<li class="filtered-empty-notice">(no results)</li>');
        }
      });
    }
  };

  let handleTextFilterChange = function(e) {
    // console.log('handleTextFilterChange(e): ', e);
    let filterableContent = $('.block-filterable_content li');
    let field = $(e.target);
    let prevVal = field.data('prev');
    let newVal = field.val();

    // What will we use to mark off our content?
    let spanOpener =
      '<span class="filtered-highlight" style="background-color: yellow">';
    let spanCloser = '</span>';
    let newMarkup = '';
    if (newVal && !prevVal) {
      // first search (newVal but no prevVal)
      newMarkup = spanOpener + newVal + spanCloser;
    } else if (newVal && prevVal) {
      // next search (newval and prevVal)
      newMarkup = spanOpener + newVal + spanCloser;
    } else if (!newVal && prevVal) {
      // reset search (prevVal but no newVal)
      newMarkup = newVal;
    }
    $(filterableContent)
      .find('span.filtered-highlight')
      .replaceWith(prevVal);

    $(filterableContent)
      .find(':contains("' + newVal + '")')
      .html(function() {
        return $(this)
          .text()
          .replace(newVal, newMarkup);
      });

    $(e.target).data('prev', newVal);
    applyFilters();
  };

  $('#filter-text').bind('keyup', handleTextFilterChange);
  $('#filter-type, #filter-subj, #filter-focu, #filter-year').bind(
    'change',
    applyFilters
  );
}
