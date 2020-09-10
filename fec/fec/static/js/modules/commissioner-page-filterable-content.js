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
  // Let's extend jQuery's :contains so it's case-insensitive
  $.expr[':'].contains_ci = $.expr.createPseudo(function(arg) {
    return function(elem) {
      return (
        $(elem)
          .text()
          .toUpperCase()
          .indexOf(arg.toUpperCase()) >= 0
      );
    };
  });
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
    return b - a;
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
    if (filteredSubj) filterRule += '[data-subj="' + filteredSubj + '"]';
    if (filteredFocu) filterRule += '[data-focus="' + filteredFocu + '"]';
    if (filteredYear) filterRule += '[data-year="' + filteredYear + '"]';

    let filterableContentBlocks = $('.block-filterable_content');
    // remove any previous filtered states
    filterableContentBlocks.removeClass('filtered');
    filterableContentBlocks.find('.matched').removeClass('matched');
    filterableContentBlocks.children().removeClass('filtered-empty');
    // Filter if we need to

    if (filterRule != '') {
      // Apply 'matched' to matching items
      $('.block-filterable_content ' + filterRule).addClass('matched');
      // Apply 'filtered' to all of the filterable blocks
      filterableContentBlocks.addClass('filtered');
      // We can't reliably find cousin headlines, so
      //
      // if there are no children with the 'matched' class, add a filtered-empty class to the ul
      $('.block-filterable_content ul').each(function() {
        if ($(this).find('li.matched').length === 0) {
          $(this).addClass('filtered-empty');
        }
      });
    }
  };

  let handleTextFilterChange = function(e) {
    let filterableContent = $('.block-filterable_content li');
    let field = $(e.target);
    let prevVal = field.data('prev');
    let newVal = field.val();

    // What will we use to mark off our content?
    let spanOpener =
      '<span class="filtered-highlight" style="background-color: yellow">';
    let spanCloser = '</span>';
    let newMarkup = '';

    // Replace any highlight spans with their text content instead
    $(filterableContent)
      .find('span.filtered-highlight')
      .each((i, elem) => {
        $(elem).replaceWith($(elem).text());
      });

    $(filterableContent)
      // Do a case-insensitive search of content
      .find(':contains_ci(' + newVal + ')')
      // .children()
      // .filter(function() {
      //   console.log('filtering this.nodeType, this.text: ', this.nodeType, $(this).text())
      //   return this.nodeType === 3;
      // })
      .each((i, elem) => {
        // console.log('each() nodeType, textContent: ', elem.nodeType, elem.textContent);
        // console.log('elem.text(): ', $(elem).text());
        // if (elem.childNodes.length > 0) console.log('    has child nodes');
        // else console.log('    NO child nodes');
        // Compare lower strings to find where we've matched
        let termLocation = $(elem)
          .text()
          .toLowerCase()
          .indexOf(newVal.toLowerCase());
        // Remember the case of our matched term (if searching for 'the', we don't want to change matched 'The' to lowercase)
        let matchedTerm = $(elem)
          .text()
          .substr(termLocation, newVal.length);

        if (newVal && !prevVal) {
          // first search (newVal but no prevVal)
          newMarkup = spanOpener + matchedTerm + spanCloser;
        } else if (newVal && prevVal) {
          // next search (newval and prevVal)
          newMarkup = spanOpener + matchedTerm + spanCloser;
        } else if (!newVal && prevVal) {
          // reset search (prevVal but no newVal)
          newMarkup = matchedTerm;
        }
        // Do a search & replace for every match, changing from text to html
        $(elem).html(function() {
          return $(elem)
            .text()
            .replace(new RegExp(matchedTerm, 'g'), newMarkup);
        });
      });

    $(e.target).data('prev', newVal);
    applyFilters();
  };

  $('#filter-text').bind('keyup', handleTextFilterChange);
  $('#filter-type, #filter-subject, #filter-focus, #filter-year').bind(
    'change',
    applyFilters
  );
}
