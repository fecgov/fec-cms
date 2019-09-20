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

//add states dropdown template to page
const dropdown_wrapper = document.createElement('div');
dropdown_wrapper.innerHTML = states_dropdown_template;
const dates_table = document.getElementsByClassName('election-dates-table')[0];
const table_parent = dates_table.parentNode;

table_parent.insertBefore(dropdown_wrapper, dates_table);

//Declare globals to get past linter error for header_notes and footnotes objects declared in CMS field
/* global header_notes, footnotes */

//create static list from header_notes object
let hdr_str = `<p><ul>`;
for (const key in header_notes) {
  hdr_str += `<li>
                <a name="hdr${key}" id="hdr${key}"></a>
                <b>${key}</b>&nbsp;&nbsp;${header_notes[key]}
              </l1>`;
}

hdr_str += `</ul></p>`;

//create static list from footnotes object
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

//insert static header_notes, footnotes lists
static_notes.innerHTML = `<details>
                     <summary>
                      <h2 class="t-inline-block u-margin--bottom--small">All footnotes</h2>
                     </summary><h4>Header notes</h4>${hdr_str}${ftnt_str}
                   </details>`;

// ` <div class="js-accordion accordion--neutral u-margin--bottom" data-content-prefix="footnotes">
//     <button type="button" class="js-accordion-trigger accordion__button">All footnotes
//     </button>
//     <div class="accordion__content aria-hidden="false">
//       ${hdr_str}${ftnt_str}
//     </div>
//   </div>`

//insert it after table
table_parent.insertBefore(static_notes, dates_table.nextSibling);

const det = document.querySelectorAll('#static_notes details')[0];
det.setAttribute('open', '');

//show only state rows of the chosen state class
const states = document.getElementById('states');
states.addEventListener('change', () => {
  const state = states.value.toLowerCase();

  const tr = document.querySelectorAll('tr');
  const ftnt = document.querySelectorAll('tr.footnote_row');

  if (state != 'states') {
    //hide static notes text when a state is chosen
    //det.removeAttribute('open');

    const ones = document.querySelectorAll(
      `table tr.${state}:not(.footnote_row), tr:first-child`
    );
    const not_ones = document.querySelectorAll(`table tr:not(.${state})`);

    for (const ntone of not_ones) {
      ntone.style.display = 'none';
      //use class to handle Safari's lack of support for visibiity:visible/collapse
      ntone.classList.remove('row_display');
    }
    for (const one of ones) {
      one.style.display = 'table-row';
      one.classList.add('row_display');
    }
  } else {
    //show static notes text when showing all rows
    //det.setAttribute('open', '');

    for (const t of tr) {
      t.style.display = 'table-row';
      t.classList.add('row_display');
    }
    for (const f of ftnt) {
      f.style.display = 'none';
      f.classList.remove('row_display');
    }
  }
});

//disable anchor links behavior because the links hrefs contain an '#',
//but keep #links for accessibility
//get all anchors in TDs
const anchors = document.querySelectorAll("td a[href^='#']");

//define nexUntil function for finding footnotes for just one row(move to outside click function ??)
const nextUntil = function(elem, selector, filter) {
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

//show footnotes on click of a link that wraps the sup
//const sup_links = document.querySelectorAll('tr td a');

//**should  I use "anchors" from const above instead of sup_links?? yes, doing it below**//
for (const sup_link of anchors) {
  sup_link.addEventListener('click', e => {
    e.preventDefault();
    const indx = e.target.textContent;

    const el = e.target;
    const notftnt = 'tr:not(.footnote_row)';
    const ftnt = `.footnote_${indx}`;
    const ntlvftnt = `tr:not(.footnote_${indx})`;
    const element = el.closest('tr');
    const el_td = el.closest('td');

    //get background color of parent row so footnotes can match parent without zebra striping
    const style = window.getComputedStyle(element, '');
    const bgColor = style.getPropertyValue('background-color');
    //create new no-transparency color based on background color of current row to hide the btm border on selected cell
    const newColor =
      bgColor == 'rgba(0, 0, 0, 0)'
        ? 'rgba(255,255,255,1)'
        : 'rgba(248,248,248,1)';

    //get footnote row corresponding to the one clicked
    const live_note = nextUntil(element, notftnt, ftnt);
    //get all other footnote rows
    const not_live_note = nextUntil(element, notftnt, ntlvftnt);

    //For footnotes in mobile view (under each cell, one at a time)
    //Add footnote html under applicable cell(display:block) in mobile

    //get text from chosen footnote using the results of the nextUntil function (i.e live_note const)
    const live_note_text = live_note[0].cells[1].innerHTML;

    //get any existing responsive_footnote for just the current row(i.e. element const)
    const resp_exists = element.querySelector(`.append${indx}`);

    //For toggling on/off the same one
    if (!resp_exists) {
      //if it does not already exist, add it with a class of the clicked index
      el_td.insertAdjacentHTML(
        'beforeend',
        `<span class="ftnt_append append${indx}">${live_note_text}</span>`
      );
    }
    //else remove it
    else {
      resp_exists.remove();
    }

    //get all .ftnt_append classes per row
    const resp_ftnts = element.getElementsByClassName('ftnt_append');

    //For going from one to another within each row
    //Iterate over them and remove the ones that are not the clicked index number
    Array.from(resp_ftnts).forEach(nt => {
      if (nt.classList.contains(`append${indx}`)) {
        nt.style.display = 'block';
      } else {
        nt.remove();
      }
    });

    //*********NEW****************
    if (resp_ftnts[0]) {
      const close_btn = document.createElement('button');
      close_btn.classList.add('ftnt-close');
      close_btn.textContent = 'x';
      resp_ftnts[0].appendChild(close_btn);
      //get ftnt-close for just this row
      const closer = element.querySelectorAll('.ftnt-close');
      closer[0].addEventListener('click', ex => {
        const x = ex.target;
        const this_span = x.closest('span');
        this_span.remove();
      });
    }

    //*********END NEW***********

    ////For footnotes in desktop view (under each row, one at a time)

    //First set borderBottom on all TDs on parent row, then below, change
    //border on only the one clicked
    const tds = element.cells;

    //have to use 'Array.from' here for Safari, not sure why only in this for/of stmt and not others
    for (const td of Array.from(tds)) {
      td.style.borderBottom = '1px solid #ddd';
    }

    if (live_note[0].style.display == 'none') {
      //remove bottom border on state cell
      element.cells[0].style.borderBottom = `1px solid ${newColor}`;
      //show chosen footnote
      live_note[0].style.display = 'table-row';
      //set bg color on footnote rows ro match parent rows
      live_note[0].style.backgroundColor = bgColor;
      //hide border under cell in which the sup footnote sup was clicked
      el_td.style.borderBottom = `1px solid ${newColor}`;
      //hide all but footnote clicked
      for (const not of not_live_note) {
        not.style.display = 'none';
      }
    } else {
      live_note[0].style.display = 'none';
      el_td.style.borderBottom = '1px solid #ddd';
    }
  });
}

// Add footnote rows based on existence of superscript number on page load
const date_sups = document.querySelectorAll('td sup');

Array.from(date_sups)
  .reverse()
  .forEach(node => {
    const indx = node.innerText;
    const state_class = node.closest('tr').className;

    const ftnt_row = `<tr class='${state_class} footnote_row footnote_${indx}'>
                        <td></td>
                        <td colspan='5'>
                          <b>${indx}.</b>&nbsp;${footnotes[indx]}</td>
                      </tr>`;
    node.closest('tr').insertAdjacentHTML('afterend', ftnt_row);
  });

//convert '**' to '*' in header notes for state (first td) cell
//and wrap them in a link
const state_cells = document.querySelectorAll('tr td:first-child');

Array.from(state_cells).forEach(node => {
  const node_inner = node.innerHTML;

  const fn = node_inner.indexOf('**') !== -1 ? true : false;

  if (fn) {
    node.innerHTML = node_inner
      //.toString()
      .replace(/\*\*/g, `<a href="#hdr_*"><sup>*</sup></a>`);
  } else {
    node.innerHTML = node_inner
      //.toString()
      .replace(/\*/g, `<a href="#hdr_*"><sup>*</sup></a>`);
  }
});

//add dialog to body
// const dialog = document.createElement('dialog');
// dialog.classList.add('modal__content');
// const closer = document.createElement('button');
// closer.classList.add('modal__close', 'button--close--primary');
// closer.id = 'close';
// closer.textContent = 'x';
// const msg = document.createElement('p');
// dialog.appendChild(closer);
// dialog.appendChild(msg);
// document.body.appendChild(dialog);
// const dialog_win = document.querySelectorAll('dialog');

//Create A11Y modal dialog for header_notes popup and add innerHTML
const dialog = document.createElement('div');
//Must add these three separately for IE :-(
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

//add header notes(and state row header note)to dialog and open it
const header_sups = document.querySelectorAll(
  'tr:first-child th a[href^="#"], tr td:first-of-type a[href^="#"]'
);

//Add data attribute to the header sups to open AY11 dialog
for (const header_sup of header_sups) {
  header_sup.setAttribute('data-a11y-dialog-show', 'header_notes_modal');
  header_sup.addEventListener('click', e => {
    e.preventDefault();
  });
}

//********************NEW,  WORKS!**********************

//console.log("BEFORE:"+getComputedStyle(document.querySelector('td'), ':before').getPropertyValue('content'));
//const all_rows = dates_table.rows// can only do 'cells' on rows naybe
const all_tds = document.querySelectorAll('tr:not(.footnote_row) td');

//for (const arraytd of all_tds){
Array.from(all_tds).forEach(cell => {
  //const  resp_header = getComputedStyle(dates_table.querySelectorAll('td'), ':before').getPropertyValue('content');
  //for (const header_sup of Array.from(header_sups)) {
  //console.log('header_sup:'+header_sups[1])
  //const hdr_nt_append = header_sups[cell.cellIndex].outerHTML
  //cell.insertAdjacentHTML('afterbegin',hdr_nt_append)

  //For global append of TH on all tables later
  const all_th = document.querySelectorAll('th');
  const th_append = Array.from(all_th)[cell.cellIndex].outerHTML;
  cell.insertAdjacentHTML(
    'afterbegin',
    `<span class=th_append>${th_append}</span>`
  );
});

///xxxxxxxxxxxNEW NEWxxxxxxxxxxxx
//Safari fix: disable default behavior the TH anchor links moved to cells(for mobile) because the links hrefs contain an '#',
//but keep #links for accessibility

const td_hdr_anchors = document.querySelectorAll(
  'tr:not(.footnote_row) td span a[href^="#"]'
);
//maybe add above to 'anchors' selector above and remove below four lines
for (const hdr_anchor of td_hdr_anchors) {
  hdr_anchor.addEventListener('click', ev => {
    ev.preventDefault();
  });
}

///xxxxxxxxxxxNEW NEWxxxxxxxxxxxxx

//*****************END NEW***************************

//disable anchor links default behavior because the links hrefs contain an '#',
//but keep #links for accessibility. Here ('anchors'(line 166) refers only to td anchors (footnotes))
for (const anchor of anchors) {
  anchor.addEventListener('click', e => {
    e.preventDefault();
  });
}

//hide footnotes rows initially
const footnote_rows = document.querySelectorAll('.footnote_row');
for (const footnote_row of footnote_rows) {
  //footnote_row.style.visibility = 'collapse';
  footnote_row.style.display = 'none';
}
