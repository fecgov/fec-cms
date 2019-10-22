'use strict';

const states_dropdown_template = `
<div class="filter">
<select id="states" name="states">
  <option selected="selected" value="states">All states</option>
    <option value="AL">Alabama</option>
    <option value="AK">Alaska</option>
    <option value="AZ">Arizona</option>
    <option value="AR">Arkansas</option>
    <option value="AS">American Samoa</option>
    <option value="CA">California</option>
    <option value="CO">Colorado</option>
    <option value="CT">Connecticut</option>
    <option value="DE">Delaware</option>
    <option value="DC">District Of Columbia</option>
    <option value="FL">Florida</option>
    <option value="GA">Georgia</option>
    <option value="GU">Guam</option>
    <option value="HI">Hawaii</option>
    <option value="ID">Idaho</option>
    <option value="IL">Illinois</option>
    <option value="IN">Indiana</option>
    <option value="IA">Iowa</option>
    <option value="KS">Kansas</option>
    <option value="KY">Kentucky</option>
    <option value="LA">Louisiana</option>
    <option value="ME">Maine</option>
    <option value="MD">Maryland</option>
    <option value="MA">Massachusetts</option>
    <option value="MI">Michigan</option>
    <option value="MN">Minnesota</option>
    <option value="MS">Mississippi</option>
    <option value="MO">Missouri</option>
    <option value="MP">Northern Mariana Islands</option>
    <option value="MT">Montana</option>
    <option value="NE">Nebraska</option>
    <option value="NV">Nevada</option>
    <option value="NH">New Hampshire</option>
    <option value="NJ">New Jersey</option>
    <option value="NM">New Mexico</option>
    <option value="NY">New York</option>
    <option value="NC">North Carolina</option>
    <option value="ND">North Dakota</option>
    <option value="OH">Ohio</option>
    <option value="OK">Oklahoma</option>
    <option value="OR">Oregon</option>
    <option value="PA">Pennsylvania</option>
    <option value="PR">Puerto Rico</option>
    <option value="RI">Rhode Island</option>
    <option value="SC">South Carolina</option>
    <option value="SD">South Dakota</option>
    <option value="TN">Tennessee</option>
    <option value="TX">Texas</option>
    <option value="UT">Utah</option>
    <option value="VT">Vermont</option>
    <option value="VA">Virginia</option>
    <option value="VI">Virgin Islands</option>
    <option value="WA">Washington</option>
    <option value="WV">West Virginia</option>
    <option value="WI">Wisconsin</option>
    <option value="WY">Wyoming</option>
</select>
</div>`;

const header_notes_modal_partial = `<div tabindex="-1" class="modal__overlay" data-a11y-dialog-hide></div>
  <div role="dialog" class="modal__content" aria-labelledby="">
    <div role="document">
      <button type="button" class="modal__close button--close--primary" data-a11y-dialog-hide title="Close this dialog window"></button>
      <p></p>
    </div>
  </div>
</div>`;

function ReportingDates() {
  //Declare globals (scoped to this function)to get past linter error/tests. For header_notes and footnotes objects declared in CMS field, CSS.escape, Set()
  /* global header_notes, footnotes, CSS, Set */
  this.dates_table = document.getElementsByClassName(
    'election-dates-table'
  )[0]
  //get all acnhor links in TDs)
  this.anchors = this.dates_table.querySelectorAll("td a[href^='#']");

  //disable default jump behavior for anchor links(#) but keep links for accessibility
  for (const anchor of this.anchors) {
    anchor.addEventListener('click', e => {
      e.preventDefault();
    });
  }

  this.buildStaticElements();

  this.addFootnotes();

  this.stripeByState();

  //Define media query
  const mql = window.matchMedia('screen and (max-width: 650px)');

  // call listener function explicitly at run time
  this.mediaQueryResponse(mql);

  // attach listener function to listen in on state changes
  mql.addListener(this.mediaQueryResponse);

  //show footnotes on click of a link that wraps the superscripts in cells
  for (const anchor of this.anchors) {
    anchor.addEventListener('click', this.showFootnotes.bind(this));
  }

  //handle changes on states dropdown
  this.states = document.getElementById('states');
  this.states.addEventListener('change', this.handleStateChange.bind(this));

  //Define nexUntil() function for use in ShowFootnotes()
  this.nextUntil = function(elem, selector, filter) {
    // Setup siblings array
    const siblings = [];

    // Get the next sibling element
    elem = elem.nextElementSibling;

    // As long as a sibling exists
    while (elem) {
      // If we've reached our match, bail
      if (elem.matches(selector)) break;

      // If filtering by a selector, check if the sibling matches
      if (filter && !elem.matches(filter)) {
        elem = elem.nextElementSibling;
        continue;
      }

      // Otherwise, push it to the siblings array
      siblings.push(elem);

      // Get the next sibling element
      elem = elem.nextElementSibling;
    }

    return siblings;
  };

}

//create and insert states-dropdown, static footnote/header-notes-list , and dialog
ReportingDates.prototype.buildStaticElements = function() {
  //Add states dropdown template to page
  const dropdown_wrapper = document.createElement('div');
  dropdown_wrapper.innerHTML = states_dropdown_template;

  const table_parent = this.dates_table.parentNode;

  table_parent.insertBefore(dropdown_wrapper, this.dates_table);

  //Create static footnote/header note list

  //build static list from header notes object
  let hdr_str = `<h4>Header notes</h4>
                 <p><ul><p><ul>`;
  for (const key in header_notes) {
    hdr_str += `<li>
                <a name="hdr${key}" id="hdr${key}"></a>
                <b>${key}</b>&nbsp;&nbsp;${header_notes[key]}
              </l1>`;
  }

  hdr_str += `</ul></p>`;

  //build static list from footnotes object
  let ftnt_str = `<h4>Footnotes</h4><p><ul>`;
  for (const key in footnotes) {
    ftnt_str += `<li>
                 <a name="footnote_${key}" id="footnote_${key}"></a>
                 <b>${key}</b>.&nbsp;${footnotes[key]}
               </l1>`;
  }
  ftnt_str += `</ul></p>`;

  //create div for all notes
  const static_notes = document.createElement('div');
  static_notes.id = 'static_notes';

  //add combibed header_notes, footnotes list to collapsible div
  static_notes.innerHTML = `
                      <h2 class="t-inline-block u-margin--bottom--small">All footnotes</h2>
                     ${hdr_str}${ftnt_str}`;

  //insert it after table
  table_parent.insertBefore(static_notes, this.dates_table.nextSibling);

  //Create A11Y modal dialog for header_notes popup and add innerHTML
  const dialog = document.createElement('div');
  //Must add these three classes separately for IE :-(
  dialog.classList.add('js-modal');
  dialog.classList.add('modal');
  dialog.classList.add('modal__content');
  dialog.setAttribute('aria-hidden', 'true');
  dialog.id = 'header_notes_modal';
  document.body.appendChild(dialog);
  dialog.innerHTML = header_notes_modal_partial;
  //Populate dialog with all header notes
  const dialog_p = document.querySelector('.modal p');
  dialog_p.innerHTML = `${hdr_str}`;

  const header_sups = document.querySelectorAll(
    'tr:first-child th a[href^="#"]'
  );

  //add data attribute to the header sups to open AY11 dialog
  for (const header_sup of header_sups) {
    header_sup.setAttribute('data-a11y-dialog-show', 'header_notes_modal');
    header_sup.addEventListener('click', e => {
      e.preventDefault();
    });
  }
};

//Show chosen state rows, hide others
ReportingDates.prototype.handleStateChange = function() {
  const state = this.states.value.toLowerCase();

  const tr = document.querySelectorAll('tr');
  const ftnt = document.querySelectorAll('tr.footnote_row');

  if (state != 'states') {
    const ones = document.querySelectorAll(
      `table tr.${state}:not(.footnote_row), tr:first-child`
    );
    const not_ones = document.querySelectorAll(`table tr:not(.${state})`);

    for (const not_one of not_ones) {
      not_one.style.display = 'none';
      //use class to handle Safari's lack of support for visibiity:visible/collapse
      not_one.classList.remove('row_display');
    }

    for (const one of ones) {
      one.style.display = 'table-row';
      //use class to handle Safari's lack of support for visibiity:visible/collapse
      one.classList.add('row_display');
    }
  } else {
    for (const t of tr) {
      t.style.display = 'table-row';
      t.classList.add('row_display');
    }

    for (const f of ftnt) {
      f.style.display = 'none';
      f.classList.remove('row_display');
    }
  }
};

// Add footnote rows based on existence of superscript number on page load
ReportingDates.prototype.addFootnotes = function() {
  const date_sups = document.querySelectorAll('td sup');

  Array.from(date_sups)
    .reverse()
    .forEach(node => {
      const indx = node.innerText; //should this be textContent?
      const state_class = node.closest('tr').className;
      const ftnt_colspan = node.closest('tr').cells.length - 1;

      const ftnt_row = `<tr class='${state_class} footnote_row footnote_${indx}'>
                          <td></td>
                          <td colspan=${ftnt_colspan}>
                            <b>${indx}.</b>&nbsp;${footnotes[indx]}</td>
                        </tr>`;
      node.closest('tr').insertAdjacentHTML('afterend', ftnt_row);
    });

  //hide footnotes rows initially
  const footnote_rows = document.querySelectorAll('.footnote_row');
  for (const footnote_row of footnote_rows) {
    footnote_row.style.display = 'none';
  }
};

//Prepend header to cells in mobile ONLY, also add/remove them on resize between mobile/desktop
ReportingDates.prototype.mediaQueryResponse = function(mql) {
  //get all non-footnote row cells for mobile
  const all_tds = document.querySelectorAll('tr:not(.footnote_row) td');
  //get all table header cells
  const all_th = document.querySelectorAll('th');

  //If mobile
  if (mql.matches) {
    //Iterate over non-foonote-row cells
    Array.from(all_tds).forEach(cell => {
      //get the header html for each cell index
      const th_append = Array.from(all_th)[cell.cellIndex].outerHTML;

      //prepend it to the cell in a span
      cell.insertAdjacentHTML(
        'afterbegin',
        `<span class='th_append'>${th_append}</span>`
      );

      //get all the appended header anchor links
      const appended_anchors = cell.querySelectorAll('.th_append a[href^="#"]');
      //get the modal and modal-close
      const jsmodal = document.getElementsByClassName('js-modal');
      const jsmodalClose = document.querySelectorAll('.modal__close');

      //Re-stablish A11Y data-attributes to the appended header's anchor if it was removed and re-added
      for (const anchor of appended_anchors) {
        anchor.setAttribute('data-a11y-dialog-show', 'header_notes_modal');
        anchor.addEventListener('click', e => {
          jsmodal[0].setAttribute('aria-hidden', 'false');
          e.preventDefault();
        });
      }

      for (const close of jsmodalClose) {
        close.addEventListener('click', () => {
          jsmodal[0].setAttribute('aria-hidden', 'true');
          close.focus();
        });
      }
    });
  }
  //If not mobile
  else {
    //Iterate over non-foonote-row cells
    Array.from(all_tds).forEach(cell => {
      //get prepended header --if it exists-- and remove it
      cell.getElementsByTagName('span');
      const th_appended = cell.getElementsByTagName('span'); //cell.getElementsByClassname('th_append');
      if (th_appended.length) {
        th_appended[0].remove();
      }
    });
  }
};

//Show chosen footnote or append it in Mobile view
ReportingDates.prototype.showFootnotes = function(e) {
  //escape symbols and invalid CSS selectors in indx (ie: '*', '**', etc.)
  const indx = CSS.escape(e.target.textContent);
  //get the string representaton of indx to use elsewhere
  const clean_indx = e.target.textContent;

  const el = e.target;
  const notftnt = 'tr:not(.footnote_row)';
  const ftnt = `.footnote_${indx}`;
  const ntlvftnt = `tr:not(.footnote_${indx})`;
  const current_row = el.closest('tr');
  const el_td = el.closest('td');

  //get background color of parent row so footnotes can match parent without zebra striping
  const style = window.getComputedStyle(current_row, '');
  const bgColor = style.getPropertyValue('background-color');
  //create new no-transparency color based on background color of current row to change(hide) the btm border on selected cell
  const newColor =
    bgColor == 'rgba(0, 0, 0, 0)'
      ? 'rgba(255,255,255,1)'
      : 'rgba(248,248,248,1)';

  //get footnote row corresponding to the one clicked
  const live_note = this.nextUntil(current_row, notftnt, ftnt);
  //get all other footnote rows
  const not_live_note = this.nextUntil(current_row, notftnt, ntlvftnt);

  //Change border under clicked footnote in Desktop view

  const tds = current_row.cells;

  //First set borderBottom on all TDs on parent row, then below we change
  //border on only the one clicked
  //have to use 'Array.from' here for Safari, not sure why only in this for/of stmt and not others
  for (const td of Array.from(tds)) {
    td.style.borderBottom = '1px solid #ddd';
  }

  //Show/hide footnote and change border color under cell
  if (live_note[0].style.display == 'none') {
    //remove bottom border on first TD (state cell)
    current_row.cells[0].style.borderBottom = `1px solid ${newColor}`;
    //show chosen footnote
    live_note[0].style.display = 'table-row';
    //set bg color on footnote rows to match parent rows
    live_note[0].style.backgroundColor = bgColor;
    //hide bottom border under cell in which the footnote sup was clicked
    // or left border for first-column cells
    if (el_td.cellIndex == '0') {
      current_row.parentNode.rows[
        current_row.rowIndex + 1
      ].cells[0].setAttribute(
        'style',
        `border-right:1px solid ${newColor} !important`
      );
    } else {
      el_td.style.borderBottom = `1px solid ${newColor}`;
    }

    //hide all but the footnote clicked
    for (const not of not_live_note) {
      not.style.display = 'none';
    }
  } else {
    live_note[0].style.display = 'none';
    el_td.style.borderBottom = '1px solid #ddd';
  }

  //Dynamically add footnotes in Mobile view (under each cell, per click)

  //Add footnote innerHTML in span under clicked cell(display:block) in mobile

  //get innerHTML from chosen footnote using the results of the nextUntil function (i.e live_note const)
  const live_note_text = live_note[0].cells[1].innerHTML;

  //define any existing responsive_footnote for just the current row(i.e. current_row const)
  const resp_exists = current_row.querySelector(`.append${indx}`);

  //For toggling on/off the same one using superscript
  if (!resp_exists) {
    //if it does not already exist, add it with a class of the clicked index
    el_td.insertAdjacentHTML(
      'beforeend',
      `<span class="ftnt_append append${clean_indx}">${live_note_text}</span>`
    );
  }
  //else remove it
  else {
    resp_exists.remove();
  }

  //get all '.ftnt_append' classes per row
  const resp_ftnts = current_row.getElementsByClassName('ftnt_append');

  //For going from one footnote to another within each row
  //Iterate over them and remove the ones that are not the clicked index number
  Array.from(resp_ftnts).forEach(nt => {
    if (nt.classList.contains(`append${clean_indx}`)) {
      nt.style.display = 'block';
    } else {
      nt.remove();
    }
  });

  //Extra close('x') button for mobile footnotes
  if (resp_ftnts[0]) {
    const close_btn = document.createElement('button');
    close_btn.classList.add('ftnt-close');
    close_btn.classList.add('button--close--primary');
    close_btn.textContent = 'x';
    resp_ftnts[0].appendChild(close_btn);
    //get ftnt-close for just this row and activate it
    const closer = current_row.querySelectorAll('.ftnt-close');
    closer[0].addEventListener('click', ex => {
      const x = ex.target;
      const this_span = x.closest('span');
      this_span.remove();
    });
  }
};

ReportingDates.prototype.stripeByState = function() {
  const bg = 'rgba(241,241,241,.5)';
  const state_rows = this.dates_table.getElementsByTagName('tr');
  let state_class = [];
  for (const tr of state_rows) {
    state_class.push(tr.classList.item(0));
  }
  let unique = [...new Set(state_class)];
  for (let x = 0; x < unique.length; x += 2) {
    const unique_row = this.dates_table.getElementsByClassName(unique[x]);
    for (const un of unique_row) {
      un.style.backgroundColor = bg;
    }
  }
};

new ReportingDates();
